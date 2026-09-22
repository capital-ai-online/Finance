import { Router, type NextFunction, type Request, type Response } from 'express';
import { getSubscription } from '../db';
import { createLogger } from '../logger';
import { rateLimitMiddleware } from '../../src/platform/Security/safeIo';
import {
  clearBackendAuthCookies,
  createBackendOAuthClient,
  createOAuthState,
  normalizePostAuthPath,
  persistBackendAuthSession,
  resolveApplicationOrigin,
  resolveVerifiedBackendAuth,
  revokeBackendAuthSession,
  sessionFingerprint,
  verifyOAuthState,
} from '../auth/backendAuth';

const authLogger = createLogger('backend-auth');

const AUTH_RATE_LIMIT = rateLimitMiddleware({
  name: 'backend-auth',
  maxRequests: 30,
  windowMs: 60_000,
});

const TIERS = new Set(['Free', 'Starter', 'Pro', 'Enterprise']);

function normalizeTier(value: string): 'Free' | 'Starter' | 'Pro' | 'Enterprise' {
  return TIERS.has(value) ? (value as 'Free' | 'Starter' | 'Pro' | 'Enterprise') : 'Free';
}

function authErrorRedirect(origin: string, code: string): string {
  const url = new URL('/login', origin);
  url.searchParams.set('auth_error', code);
  return url.toString();
}

async function handleOAuthCallback(req: Request, res: Response): Promise<void> {
  let origin: string;
  try {
    origin = resolveApplicationOrigin(req);
  } catch (error) {
    authLogger.warn('OAuth callback rejected invalid host/origin', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    clearBackendAuthCookies(req, res);
    res.status(400).json({ error: 'Ungültiger Auth-Callback.' });
    return;
  }

  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = req.query.state;
  const next = normalizePostAuthPath(req.query.next);

  if (!code || !verifyOAuthState(req, state)) {
    authLogger.warn('OAuth callback state/code verification failed', {
      requestId: req.requestId,
      hasCode: Boolean(code),
      hasState: typeof state === 'string',
    });
    clearBackendAuthCookies(req, res);
    res.redirect(303, authErrorRedirect(origin, 'callback_verification_failed'));
    return;
  }

  try {
    const supabase = createBackendOAuthClient(req, res);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session || !data.user || data.user.is_anonymous) {
      authLogger.warn('OAuth code exchange failed', {
        requestId: req.requestId,
        error: error?.message || 'missing-session',
      });
      clearBackendAuthCookies(req, res);
      res.redirect(303, authErrorRedirect(origin, 'code_exchange_failed'));
      return;
    }

    persistBackendAuthSession(req, res, data.session);
    authLogger.info('Backend OAuth session established', {
      requestId: req.requestId,
      userId: data.user.id,
      sessionFingerprint: sessionFingerprint(data.session.access_token),
    });
    res.redirect(303, new URL(next, origin).toString());
  } catch (error) {
    authLogger.error('OAuth callback failed', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    clearBackendAuthCookies(req, res);
    res.redirect(303, authErrorRedirect(origin, 'callback_failed'));
  }
}

export const backendAuthRouter = Router();

backendAuthRouter.get('/login/google', AUTH_RATE_LIMIT, async (req, res) => {
  try {
    const origin = resolveApplicationOrigin(req);
    const next = normalizePostAuthPath(req.query.next);
    const state = createOAuthState(res);

    // Keep the provider allow-list stable: the existing root URL is already the productive OAuth
    // redirect target. Express intercepts only requests carrying auth_callback=1 + code and sends
    // every normal root request onward to the SPA.
    const redirectTarget = new URL('/', origin);
    redirectTarget.searchParams.set('auth_callback', '1');
    redirectTarget.searchParams.set('state', state);
    redirectTarget.searchParams.set('next', next);

    const supabase = createBackendOAuthClient(req, res);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTarget.toString(),
        queryParams: { prompt: 'select_account' },
      },
    });

    if (error || !data.url) {
      throw new Error(error?.message || 'Supabase did not return an OAuth redirect URL.');
    }

    res.setHeader('Cache-Control', 'no-store');
    res.redirect(302, data.url);
  } catch (error) {
    authLogger.error('Google OAuth start failed', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    clearBackendAuthCookies(req, res);
    res.status(503).json({ error: 'Google-Anmeldung konnte nicht gestartet werden.' });
  }
});

backendAuthRouter.get('/callback', AUTH_RATE_LIMIT, (req, res) => {
  void handleOAuthCallback(req, res);
});

backendAuthRouter.get('/session', AUTH_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  try {
    const verified = await resolveVerifiedBackendAuth(req, res);
    if (!verified) {
      clearBackendAuthCookies(req, res);
      res.status(200).json({ authenticated: false });
      return;
    }

    const user = verified.user;
    const tier = normalizeTier(await getSubscription(user.id));
    const metadata = user.user_metadata || {};
    const name =
      (typeof metadata.full_name === 'string' && metadata.full_name.trim()) ||
      (typeof metadata.name === 'string' && metadata.name.trim()) ||
      (user.email ? user.email.split('@')[0] : 'User');

    res.status(200).json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email ?? '',
        name,
        subscriptionTier: tier,
      },
    });
  } catch (error) {
    authLogger.error('Backend session projection failed', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    clearBackendAuthCookies(req, res);
    res.status(503).json({ error: 'Sitzung konnte nicht sicher geladen werden.' });
  }
});

backendAuthRouter.post('/logout', AUTH_RATE_LIMIT, async (req, res) => {
  const requestedScope = req.body?.scope === 'global' ? 'global' : 'local';

  try {
    await revokeBackendAuthSession(req, requestedScope);
  } catch (error) {
    authLogger.warn('Provider logout failed; local backend session will still be cleared', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  clearBackendAuthCookies(req, res);
  res.setHeader('Cache-Control', 'no-store');
  res.status(204).end();
});

/**
 * Compatibility callback on the existing OAuth allow-listed root URL.
 * Normal "/" requests fall through untouched to the public SPA.
 */
export function backendAuthRootCallback(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== 'GET' || req.path !== '/' || req.query.auth_callback !== '1') {
    next();
    return;
  }
  void handleOAuthCallback(req, res);
}
