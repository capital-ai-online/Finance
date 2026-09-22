import express, { Router, type NextFunction, type Request, type Response } from 'express';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getSubscription } from '../db';
import { createLogger } from '../logger';
import { rateLimitMiddleware } from '../../src/platform/Security/safeIo';
import { PasswordSecurityError } from '../../src/lib/passwordSecurity';
import {
  ServerPasswordSecurityError,
  assertServerPasswordSafe,
} from '../security/passwordSecurity';
import {
  clearBackendAuthCookies,
  createBackendEmailAuthClient,
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

const AUTH_CREDENTIAL_RATE_LIMIT = rateLimitMiddleware({
  name: 'backend-auth-credentials',
  maxRequests: 12,
  windowMs: 60_000,
});

const AUTH_MAIL_RATE_LIMIT = rateLimitMiddleware({
  name: 'backend-auth-mail',
  maxRequests: 5,
  windowMs: 10 * 60_000,
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 320;
const PASSWORD_MAX_LENGTH = 1_024;
const DISPLAY_NAME_MAX_LENGTH = 120;
const TOKEN_HASH_MAX_LENGTH = 1_024;
const CAPTCHA_TOKEN_MAX_LENGTH = 8_192;

const TIERS = new Set(['Free', 'Starter', 'Pro', 'Enterprise']);

function normalizeTier(value: string): 'Free' | 'Starter' | 'Pro' | 'Enterprise' {
  if (!TIERS.has(value)) {
    throw new Error(`[BackendAuth] Invalid authoritative subscription tier: ${value}`);
  }
  return value as 'Free' | 'Starter' | 'Pro' | 'Enterprise';
}

function authErrorRedirect(origin: string, code: string): string {
  const url = new URL('/login', origin);
  url.searchParams.set('auth_error', code);
  return url.toString();
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

function normalizePassword(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > PASSWORD_MAX_LENGTH) {
    return null;
  }
  return value;
}

function normalizeDisplayName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const clean = value.trim().replace(/\s+/g, ' ');
  if (!clean) return undefined;
  return clean.slice(0, DISPLAY_NAME_MAX_LENGTH);
}

function normalizeCaptchaToken(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const token = value.trim();
  if (!token || token.length > CAPTCHA_TOKEN_MAX_LENGTH) return null;
  return token;
}

function isCaptchaProviderError(error: unknown): boolean {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message.toLowerCase().includes('captcha');
}

function requireCaptchaToken(req: Request, res: Response): string | null {
  const captchaToken = normalizeCaptchaToken(req.body?.captchaToken);
  if (!captchaToken) {
    res.status(400).json({ error: 'Sicherheitsprüfung erforderlich. Bitte erneut versuchen.' });
    return null;
  }
  return captchaToken;
}

function providerStatus(error: unknown): number | null {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' && Number.isInteger(status) ? status : null;
}

function handlePasswordSecurityError(res: Response, error: unknown): boolean {
  if (error instanceof PasswordSecurityError) {
    res.status(422).json({ error: error.message });
    return true;
  }
  if (error instanceof ServerPasswordSecurityError) {
    res.status(error.statusCode).json({ error: error.message });
    return true;
  }
  return false;
}

function emailActionAccepted(res: Response, message: string): void {
  res.status(202).json({ accepted: true, message });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return replacements[character] || character;
  });
}

function isSupportedEmailOtpType(value: unknown): value is 'email' | 'recovery' {
  return value === 'email' || value === 'recovery';
}

function renderEmailConfirmationPage(tokenHash: string, type: 'email' | 'recovery', next: string): string {
  const title = type === 'recovery' ? 'Passwort zurücksetzen' : 'E-Mail-Adresse bestätigen';
  const action = type === 'recovery' ? 'Recovery-Link bestätigen' : 'Registrierung bestätigen';
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>${escapeHtml(title)} · CAPITAL-AI</title>
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <p>Bestätige die Aktion, um die sichere Supabase-Sitzung serverseitig aufzubauen.</p>
    <form method="post" action="/api/auth/email/confirm">
      <input type="hidden" name="token_hash" value="${escapeHtml(tokenHash)}">
      <input type="hidden" name="type" value="${escapeHtml(type)}">
      <input type="hidden" name="next" value="${escapeHtml(next)}">
      <button type="submit">${escapeHtml(action)}</button>
    </form>
  </main>
</body>
</html>`;
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

backendAuthRouter.post('/register', AUTH_CREDENTIAL_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const email = normalizeEmail(req.body?.email);
  const password = normalizePassword(req.body?.password);
  const fullName = normalizeDisplayName(req.body?.name);

  if (!email || !password) {
    res.status(400).json({ error: 'Bitte eine gültige E-Mail-Adresse und ein Passwort angeben.' });
    return;
  }

  const captchaToken = requireCaptchaToken(req, res);
  if (!captchaToken) return;

  try {
    await assertServerPasswordSafe(password);
  } catch (error) {
    if (handlePasswordSecurityError(res, error)) return;
    authLogger.error('Registration password validation failed unexpectedly', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Passwort konnte derzeit nicht sicher geprüft werden.' });
    return;
  }

  try {
    const origin = resolveApplicationOrigin(req);
    const supabase = createBackendEmailAuthClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: new URL('/', origin).toString(),
        data: fullName ? { full_name: fullName } : undefined,
        captchaToken,
      },
    });

    if (error) {
      const status = providerStatus(error);
      authLogger.warn('Email registration request was not accepted by Supabase Auth', {
        requestId: req.requestId,
        status,
        error: error.message,
      });
      if (isCaptchaProviderError(error)) {
        res.status(400).json({ error: 'Sicherheitsprüfung fehlgeschlagen. Bitte erneut versuchen.' });
        return;
      }
      if (status === 429) {
        res.status(429).json({ error: 'Zu viele Registrierungsversuche. Bitte später erneut versuchen.' });
        return;
      }
      if (status !== null && status >= 500) {
        res.status(503).json({ error: 'Registrierung ist derzeit nicht verfügbar.' });
        return;
      }

      // Do not reveal whether an account already exists.
      emailActionAccepted(
        res,
        'Wenn die Adresse registriert werden kann, wurde eine Bestätigungsmail angefordert.',
      );
      return;
    }

    if (data.session) {
      // Productive policy requires confirmation mail before first password login. A returned
      // session means provider-side email confirmation is disabled and therefore fails closed.
      authLogger.error('Supabase returned a signup session although confirmation is required', {
        requestId: req.requestId,
        userId: data.user?.id,
      });
      res.status(503).json({
        error: 'Die E-Mail-Bestätigung ist providerseitig nicht aktiviert. Registrierung wurde nicht als bestätigt übernommen.',
      });
      return;
    }

    emailActionAccepted(
      res,
      'Registrierung angenommen. Bitte den Link in der Bestätigungsmail öffnen.',
    );
  } catch (error) {
    authLogger.error('Email registration failed', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Registrierung ist derzeit nicht verfügbar.' });
  }
});

backendAuthRouter.post('/login/email', AUTH_CREDENTIAL_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const email = normalizeEmail(req.body?.email);
  const password = normalizePassword(req.body?.password);
  if (!email || !password) {
    res.status(400).json({ error: 'Bitte eine gültige E-Mail-Adresse und ein Passwort angeben.' });
    return;
  }

  const captchaToken = requireCaptchaToken(req, res);
  if (!captchaToken) return;

  try {
    const supabase = createBackendEmailAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });
    if (error || !data.session || !data.user || data.user.is_anonymous) {
      const status = providerStatus(error);
      authLogger.warn('Email/password login denied', {
        requestId: req.requestId,
        status,
        error: error?.message || 'missing-session',
      });
      if (isCaptchaProviderError(error)) {
        res.status(400).json({ error: 'Sicherheitsprüfung fehlgeschlagen. Bitte erneut versuchen.' });
        return;
      }
      if (status === 429) {
        res.status(429).json({ error: 'Zu viele Anmeldeversuche. Bitte später erneut versuchen.' });
        return;
      }
      if (status !== null && status >= 500) {
        res.status(503).json({ error: 'Anmeldung ist derzeit nicht verfügbar.' });
        return;
      }
      res.status(401).json({
        error: 'Anmeldung fehlgeschlagen. Zugangsdaten und E-Mail-Bestätigung prüfen.',
      });
      return;
    }

    persistBackendAuthSession(req, res, data.session);
    authLogger.info('Backend email/password session established', {
      requestId: req.requestId,
      userId: data.user.id,
      sessionFingerprint: sessionFingerprint(data.session.access_token),
    });
    res.status(200).json({ authenticated: true });
  } catch (error) {
    authLogger.error('Email/password login failed', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Anmeldung ist derzeit nicht verfügbar.' });
  }
});

backendAuthRouter.post('/confirmation/resend', AUTH_MAIL_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const email = normalizeEmail(req.body?.email);
  if (!email) {
    res.status(400).json({ error: 'Bitte eine gültige E-Mail-Adresse angeben.' });
    return;
  }

  const captchaToken = requireCaptchaToken(req, res);
  if (!captchaToken) return;

  try {
    const origin = resolveApplicationOrigin(req);
    const supabase = createBackendEmailAuthClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: new URL('/', origin).toString(),
        captchaToken,
      },
    });

    if (error) {
      const status = providerStatus(error);
      authLogger.warn('Signup confirmation resend was not accepted', {
        requestId: req.requestId,
        status,
        error: error.message,
      });
      if (isCaptchaProviderError(error)) {
        res.status(400).json({ error: 'Sicherheitsprüfung fehlgeschlagen. Bitte erneut versuchen.' });
        return;
      }
      if (status === 429) {
        res.status(429).json({ error: 'Zu viele Mail-Anfragen. Bitte später erneut versuchen.' });
        return;
      }
      if (status !== null && status >= 500) {
        res.status(503).json({ error: 'Bestätigungsmail konnte derzeit nicht angefordert werden.' });
        return;
      }
    }

    emailActionAccepted(
      res,
      'Wenn für diese Adresse eine unbestätigte Registrierung existiert, wurde eine Bestätigungsmail angefordert.',
    );
  } catch (error) {
    authLogger.error('Signup confirmation resend failed', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Bestätigungsmail konnte derzeit nicht angefordert werden.' });
  }
});

backendAuthRouter.post('/password/forgot', AUTH_MAIL_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const email = normalizeEmail(req.body?.email);
  if (!email) {
    res.status(400).json({ error: 'Bitte eine gültige E-Mail-Adresse angeben.' });
    return;
  }

  const captchaToken = requireCaptchaToken(req, res);
  if (!captchaToken) return;

  try {
    const origin = resolveApplicationOrigin(req);
    const supabase = createBackendEmailAuthClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: new URL('/account/update-password', origin).toString(),
      captchaToken,
    });

    if (error) {
      const status = providerStatus(error);
      authLogger.warn('Password recovery mail request was not accepted', {
        requestId: req.requestId,
        status,
        error: error.message,
      });
      if (isCaptchaProviderError(error)) {
        res.status(400).json({ error: 'Sicherheitsprüfung fehlgeschlagen. Bitte erneut versuchen.' });
        return;
      }
      if (status === 429) {
        res.status(429).json({ error: 'Zu viele Mail-Anfragen. Bitte später erneut versuchen.' });
        return;
      }
      if (status !== null && status >= 500) {
        res.status(503).json({ error: 'Passwort-Reset-Mail konnte derzeit nicht angefordert werden.' });
        return;
      }
    }

    emailActionAccepted(
      res,
      'Wenn ein Konto für diese Adresse existiert, wurde eine Passwort-Reset-Mail angefordert.',
    );
  } catch (error) {
    authLogger.error('Password recovery request failed', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Passwort-Reset-Mail konnte derzeit nicht angefordert werden.' });
  }
});

backendAuthRouter.get('/email/confirm', AUTH_MAIL_RATE_LIMIT, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const tokenHash = typeof req.query.token_hash === 'string' ? req.query.token_hash : '';
  const type = req.query.type;
  if (
    !tokenHash ||
    tokenHash.length > TOKEN_HASH_MAX_LENGTH ||
    !isSupportedEmailOtpType(type)
  ) {
    try {
      res.redirect(303, authErrorRedirect(resolveApplicationOrigin(req), 'email_confirmation_invalid'));
    } catch {
      res.status(400).json({ error: 'Ungültiger Bestätigungslink.' });
    }
    return;
  }

  const next =
    type === 'recovery'
      ? '/account/update-password'
      : normalizePostAuthPath(req.query.next);

  res.status(200).type('html').send(renderEmailConfirmationPage(tokenHash, type, next));
});

backendAuthRouter.post(
  '/email/confirm',
  AUTH_MAIL_RATE_LIMIT,
  express.urlencoded({ extended: false, limit: '8kb' }),
  async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    const tokenHash = typeof req.body?.token_hash === 'string' ? req.body.token_hash : '';
    const type = req.body?.type;
    if (
      !tokenHash ||
      tokenHash.length > TOKEN_HASH_MAX_LENGTH ||
      !isSupportedEmailOtpType(type)
    ) {
      try {
        res.redirect(303, authErrorRedirect(resolveApplicationOrigin(req), 'email_confirmation_invalid'));
      } catch {
        res.status(400).json({ error: 'Ungültiger Bestätigungslink.' });
      }
      return;
    }

    try {
      const origin = resolveApplicationOrigin(req);
      const supabase = createBackendEmailAuthClient();
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType,
      });

      if (error || !data.session || !data.user || data.user.is_anonymous) {
        authLogger.warn('Email token-hash verification failed', {
          requestId: req.requestId,
          type,
          error: error?.message || 'missing-session',
        });
        clearBackendAuthCookies(req, res);
        res.redirect(303, authErrorRedirect(origin, 'email_confirmation_failed'));
        return;
      }

      persistBackendAuthSession(req, res, data.session);
      const next =
        type === 'recovery'
          ? '/account/update-password'
          : normalizePostAuthPath(req.body?.next);
      res.redirect(303, new URL(next, origin).toString());
    } catch (error) {
      authLogger.error('Email confirmation failed', {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      try {
        clearBackendAuthCookies(req, res);
        res.redirect(303, authErrorRedirect(resolveApplicationOrigin(req), 'email_confirmation_failed'));
      } catch {
        res.status(503).json({ error: 'Bestätigungslink konnte nicht sicher verarbeitet werden.' });
      }
    }
  },
);

backendAuthRouter.post('/password/update', AUTH_CREDENTIAL_RATE_LIMIT, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const password = normalizePassword(req.body?.password);
  if (!password) {
    res.status(400).json({ error: 'Bitte ein gültiges neues Passwort angeben.' });
    return;
  }

  try {
    await assertServerPasswordSafe(password);
  } catch (error) {
    if (handlePasswordSecurityError(res, error)) return;
    authLogger.error('Password update validation failed unexpectedly', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Passwort konnte derzeit nicht sicher geprüft werden.' });
    return;
  }

  try {
    const verified = await resolveVerifiedBackendAuth(req, res);
    if (!verified) {
      clearBackendAuthCookies(req, res);
      res.status(401).json({ error: 'Eine verifizierte Sitzung ist zum Setzen des Passworts erforderlich.' });
      return;
    }

    const supabase = createBackendEmailAuthClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: verified.accessToken,
      refresh_token: verified.refreshToken,
    });
    if (sessionError || !sessionData.session) {
      clearBackendAuthCookies(req, res);
      res.status(401).json({ error: 'Die Sitzung konnte nicht für die Passwortänderung bestätigt werden.' });
      return;
    }

    persistBackendAuthSession(req, res, sessionData.session);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      const status = providerStatus(error);
      authLogger.warn('Supabase password update rejected', {
        requestId: req.requestId,
        userId: verified.user.id,
        status,
        error: error.message,
      });
      if (status === 429) {
        res.status(429).json({ error: 'Zu viele Passwortänderungen. Bitte später erneut versuchen.' });
        return;
      }
      if (status !== null && status >= 500) {
        res.status(503).json({ error: 'Passwort konnte derzeit nicht geändert werden.' });
        return;
      }
      res.status(422).json({ error: 'Passwort konnte nicht übernommen werden.' });
      return;
    }

    authLogger.info('Password updated through verified backend session', {
      requestId: req.requestId,
      userId: verified.user.id,
    });
    res.status(204).end();
  } catch (error) {
    authLogger.error('Password update failed', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({ error: 'Passwort konnte derzeit nicht geändert werden.' });
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
