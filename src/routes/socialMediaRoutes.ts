// ADR-0020 — Social Media Direct Publishing Router (echte Implementierung).
//
// Ersetzt src/routes/socialMediaRoutes.ts aus dem Google-AI-Studio-Handover vollstaendig.
// Kernunterschiede zum Handover-Prototyp:
//  1. Jeder Endpunkt verlangt eine verifizierte Nutzer-Identitaet (resolveVerifiedIdentity) -
//     der Prototyp hatte GAR KEINE Auth, Konten/Logs waren ein einziges globales In-Memory-
//     Array fuer alle Besucher der Anwendung gleichzeitig.
//  2. `/accounts/toggle` kann ein Konto nur noch TRENNEN, nicht mehr "verbinden" ohne echten
//     OAuth-Handshake - der Prototyp liess jeden Client per Request-Body ein Konto als
//     "connected" markieren, mit frei erfundenem accessTokenMasked-Wert.
//  3. `/auth/callback` verifiziert den `state`-Parameter gegen social_media_oauth_states und
//     tauscht den `code` echt gegen ein Access-Token (siehe oauthExchange.ts).
//  4. `/publish` ruft echte Plattform-APIs auf (platformPublishers.ts) statt Fake-URLs zu
//     konstruieren, und schreibt in social_media_publish_log statt in ein In-Memory-Array.
//
// ADR-0021 — zusaetzlich zur Auth-Pflicht (401 ohne gueltiges Token) verlangt jeder Endpunkt
// mit echter Funktionalitaet Owner-IAM-Rolle ODER den 'Founder'-Abo-Tarif (403 sonst) - siehe
// server/socialMedia/accessControl.ts.
//
// SEO-ROADMAP-0001 / N1 — POST /generate delivers text variants only (no media, no auto-publish).

import { Router, Request, Response } from 'express';
import { checkRateLimit, getClientIp } from '../platform/Security/rateLimiter';
import { createLogger } from '../../server/logger';
import { createAuthorizationRequest, completeOAuthCallback, isProviderConfigured } from '../../server/socialMedia/oauthExchange';
import { listAccountsForUser, disconnectAccount, getDecryptedAccount } from '../../server/socialMedia/tokenStore';
import { publishToPlatform } from '../../server/socialMedia/platformPublishers';
import { recordPublishLog, listPublishLogForUser } from '../../server/socialMedia/publishLog';
import { checkSocialMediaAccess, accessDeniedMessage } from '../../server/socialMedia/accessControl';
import { generateTextContent } from '../../server/socialMedia/textContentGeneration';
import type { SupportedAccountPlatform, PublishRequestPayload } from '../platform/SocialMediaEngine/types';

export const socialMediaRouter = Router();
const logger = createLogger('social-media:router');

const SUPPORTED_PLATFORMS: SupportedAccountPlatform[] = ['youtube', 'tiktok', 'instagram', 'x', 'facebook'];

function getRedirectUri(req: Request): string {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${protocol}://${host}/api/social-media/auth/callback`;
}

/** Auth (401) + Autorisierung (403, ADR-0021: nur Owner-IAM-Rolle oder Founder-Abo). */
async function requireAccess(req: Request, res: Response): Promise<{ userId: string; email: string | null } | null> {
  const access = await checkSocialMediaAccess(req);
  if (access.reason === 'unauthenticated') {
    res.status(401).json({ success: false, error: 'Anmeldung erforderlich - kein gueltiges Bearer-Token.' });
    return null;
  }
  if (!access.allowed) {
    res.status(403).json({ success: false, error: accessDeniedMessage(access.reason), reason: access.reason });
    return null;
  }
  return { userId: access.userId!, email: access.email ?? null };
}

// GET /api/social-media/access — liefert nur den Zugriffsstatus (immer 200), damit das
// Frontend eine klare "kein Zugriff"-Ansicht statt eines rohen 401/403 rendern kann.
socialMediaRouter.get('/access', async (req: Request, res: Response) => {
  const access = await checkSocialMediaAccess(req);
  res.json({ success: true, allowed: access.allowed, reason: access.reason });
});

// GET /api/social-media/accounts
socialMediaRouter.get('/accounts', async (req: Request, res: Response) => {
  const identity = await requireAccess(req, res);
  if (!identity) return;
  const accounts = await listAccountsForUser(identity.userId);
  res.json({ success: true, accounts, timestamp: new Date().toISOString() });
});

// POST /api/social-media/accounts/toggle — nur zum Trennen. Verbinden laeuft ausschliesslich
// ueber den echten OAuth-Handshake (/auth/url -> Provider -> /auth/callback).
socialMediaRouter.post('/accounts/toggle', async (req: Request, res: Response) => {
  const identity = await requireAccess(req, res);
  if (!identity) return;

  const { platform, connect } = req.body || {};
  if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
    return res.status(400).json({ success: false, error: 'Unbekannte oder fehlende Plattform.' });
  }
  if (connect) {
    return res.status(400).json({
      success: false,
      error: `Konten koennen nicht manuell verbunden werden. Bitte den OAuth-Flow ueber GET /auth/url?platform=${platform} starten.`,
    });
  }

  const ok = await disconnectAccount(identity.userId, platform);
  if (!ok) {
    return res.status(500).json({ success: false, error: 'Trennen fehlgeschlagen.' });
  }
  const accounts = await listAccountsForUser(identity.userId);
  res.json({ success: true, platform, accounts });
});

// GET /api/social-media/auth/url
socialMediaRouter.get('/auth/url', async (req: Request, res: Response) => {
  const identity = await requireAccess(req, res);
  if (!identity) return;

  if (!checkRateLimit(`social-media-oauth:${getClientIp(req)}`, 20, 60_000)) {
    return res.status(429).json({ success: false, error: 'Zu viele Verbindungsversuche - bitte kurz warten.' });
  }

  const platform = req.query.platform as SupportedAccountPlatform;
  if (!platform || !SUPPORTED_PLATFORMS.includes(platform)) {
    return res.status(400).json({ success: false, error: 'Unbekannte oder fehlende Plattform.' });
  }
  if (!isProviderConfigured(platform)) {
    return res.status(503).json({
      success: false,
      error: `${platform} ist serverseitig nicht konfiguriert (Client-ID/Secret fehlen). Siehe docs/runbooks/SOCIAL_MEDIA_OAUTH_SETUP.md.`,
    });
  }

  const redirectUri = getRedirectUri(req);
  const result = await createAuthorizationRequest(identity.userId, platform, redirectUri);
  if ('error' in result) {
    return res.status(500).json({ success: false, error: result.error });
  }
  res.json({ success: true, platform, url: result.url, redirectUri });
});

// GET /api/social-media/auth/callback — Browser-Redirect vom Provider, kein Bearer-Token
// verfuegbar. Die Nutzeridentitaet kommt ausschliesslich aus dem serverseitig persistierten
// state-Datensatz (social_media_oauth_states.user_id), NIE aus einem Client-Parameter.
socialMediaRouter.get(['/auth/callback', '/auth/callback/'], async (req: Request, res: Response) => {
  const { code, state, error: providerError } = req.query;

  if (providerError || typeof code !== 'string' || typeof state !== 'string') {
    return res.send(renderCallbackPage(null, false, typeof providerError === 'string' ? providerError : 'Fehlender code/state-Parameter.'));
  }

  const result = await completeOAuthCallback(code, state);
  if (result.success === true) {
    res.send(renderCallbackPage(result.platform, true));
    return;
  }

  logger.error('OAuth-Callback abgelehnt', { platform: result.platform, error: result.error });
  res.send(renderCallbackPage(result.platform === 'unknown' ? null : result.platform, false, result.error));
});

function renderCallbackPage(platform: string | null, success: boolean, errorMessage?: string): string {
  const safePlatform = (platform || 'social').replace(/[^a-z]/gi, '');
  const safeError = (errorMessage || '').replace(/</g, '<').replace(/>/g, '>');
  return `
    <!doctype html>
    <html>
      <head>
        <title>CAPITAL-AI Social ${success ? 'Authentication Success' : 'Authentication Failed'}</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .card { background: #141414; border: 1px solid #333; padding: 2rem; border-radius: 1rem; max-width: 420px; }
          .gold { color: #f5c453; font-weight: bold; }
          .red { color: #f87171; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          ${success
            ? `<h2 class="gold">Verbindung erfolgreich!</h2><p>Dein <strong style="text-transform: capitalize;">${safePlatform}</strong>-Account wurde verknuepft.</p>`
            : `<h2 class="red">Verbindung fehlgeschlagen</h2><p>${safeError || 'Unbekannter Fehler.'}</p>`}
          <p style="font-size: 12px; color: #888;">Dieses Fenster schliesst sich automatisch...</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: '${success ? 'OAUTH_AUTH_SUCCESS' : 'OAUTH_AUTH_FAILURE'}', platform: '${safePlatform}' }, window.location.origin);
            setTimeout(() => window.close(), ${success ? 1200 : 3000});
          } else {
            setTimeout(() => { window.location.href = '/'; }, 2500);
          }
        </script>
      </body>
    </html>
  `;
}

// POST /api/social-media/generate — N1 text variants (X / Facebook / community).
// Does not publish. Media formats remain fail-closed until N3.
socialMediaRouter.post('/generate', async (req: Request, res: Response) => {
  const identity = await requireAccess(req, res);
  if (!identity) return;

  if (!checkRateLimit(`social-media-generate:${identity.userId}`, 30, 60_000)) {
    return res.status(429).json({ success: false, error: 'Zu viele Generate-Anfragen - bitte kurz warten.' });
  }

  if (process.env.CONTENT_GENERATION_ENABLED === 'false') {
    return res.status(503).json({
      success: false,
      error: 'Content-Generierung ist per Feature-Flag deaktiviert (CONTENT_GENERATION_ENABLED=false).',
    });
  }

  try {
    const result = generateTextContent({
      topic: req.body?.topic,
      platforms: req.body?.platforms,
      locale: req.body?.locale,
      contextNote: req.body?.contextNote,
      format: req.body?.format,
    });
    logger.info('Content generated', {
      userId: identity.userId,
      topic: result.topic,
      variantCount: result.variants.length,
    });
    res.json({ success: true, package: result });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err?.message || 'Generierung fehlgeschlagen.',
    });
  }
});

// POST /api/social-media/publish
socialMediaRouter.post('/publish', async (req: Request, res: Response) => {
  const identity = await requireAccess(req, res);
  if (!identity) return;

  if (!checkRateLimit(`social-media-publish:${identity.userId}`, 10, 60_000)) {
    return res.status(429).json({ success: false, error: 'Zu viele Veroeffentlichungs-Anfragen - bitte kurz warten.' });
  }

  const payload: PublishRequestPayload = req.body;
  if (!payload?.targetPlatforms || payload.targetPlatforms.length === 0) {
    return res.status(400).json({ error: 'Mindestens eine Ziel-Plattform muss ausgewaehlt werden.' });
  }

  const isDraft = payload.publishType === 'draft';
  const isScheduled = payload.publishType === 'scheduled';
  const results = [];

  for (const platform of payload.targetPlatforms) {
    const account = await getDecryptedAccount(identity.userId, platform);
    const accountHandle = account?.row.handle || `@${platform}`;
    const caption = payload.customCaptions?.[platform] || payload.episodeTitle;

    if (!account) {
      const entry = await recordPublishLog({
        userId: identity.userId, episodeId: payload.episodeId, episodeTitle: payload.episodeTitle,
        platform, accountId: null, accountHandle, status: 'failed', publishType: payload.publishType,
        errorMessage: `${platform}: Kein verbundenes Konto. Bitte zuerst ueber /auth/url verbinden.`,
      });
      if (entry) results.push(entry);
      continue;
    }

    if (isDraft || isScheduled) {
      // Entwurf/Terminierung: kein sofortiger externer API-Call. Ein echter Scheduler
      // (Cron/Queue, der zur Zielzeit publishToPlatform() aufruft) ist Folgearbeit -
      // siehe ADR-0020 Abschnitt 5 Backlog. Der Log-Eintrag ist bereits real persistiert.
      const entry = await recordPublishLog({
        userId: identity.userId, episodeId: payload.episodeId, episodeTitle: payload.episodeTitle,
        platform, accountId: account.row.id, accountHandle,
        status: isScheduled ? 'scheduled' : 'draft', publishType: payload.publishType,
        scheduledAt: isScheduled ? payload.scheduledAt : undefined,
      });
      if (entry) results.push(entry);
      continue;
    }

    const publishResult = await publishToPlatform(platform, {
      accessToken: account.accessToken,
      externalAccountId: account.row.external_account_id,
      caption,
      hashtags: payload.hashtags || [],
      videoTitle: payload.videoTitle,
      mediaUrl: payload.mediaUrl,
    });

    const entry = await recordPublishLog({
      userId: identity.userId, episodeId: payload.episodeId, episodeTitle: payload.episodeTitle,
      platform, accountId: account.row.id, accountHandle,
      status: publishResult.success ? (publishResult.pending ? 'scheduled' : 'published') : 'failed',
      publishType: payload.publishType,
      publishedUrl: publishResult.publishedUrl,
      errorMessage: publishResult.errorMessage,
    });
    if (entry) results.push(entry);
  }

  const successCount = results.filter(r => r.status === 'published' || r.status === 'scheduled' || r.status === 'draft').length;
  res.json({
    success: successCount > 0,
    message: isDraft
      ? `Entwurf fuer ${results.length} Plattform(en) gespeichert.`
      : isScheduled
      ? `Veroeffentlichung fuer ${results.length} Plattform(en) fuer ${payload.scheduledAt} eingeplant.`
      : `${successCount} von ${results.length} Plattform(en) erfolgreich verarbeitet.`,
    results,
    totalCount: results.length,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/social-media/history
socialMediaRouter.get('/history', async (req: Request, res: Response) => {
  const identity = await requireAccess(req, res);
  if (!identity) return;
  const history = await listPublishLogForUser(identity.userId);
  res.json({ success: true, history, count: history.length });
});
