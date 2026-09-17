// ADR-0020 — Social Media Direct Publishing Router (echte Implementierung).
//
// SEO-ROADMAP-0001 / N1+N2 — POST /generate delivers text variants + script templates.
// SEO-ROADMAP-0001 / N4 — Owner approval gate before instant publish.
// No media rendering (N3). No auto-publish.

import { Router, Request, Response } from 'express';
import { checkRateLimit, getClientIp } from '../platform/Security/rateLimiter';
import { createLogger } from '../../server/logger';
import { createAuthorizationRequest, completeOAuthCallback, isProviderConfigured } from '../../server/socialMedia/oauthExchange';
import { listAccountsForUser, disconnectAccount, getDecryptedAccount } from '../../server/socialMedia/tokenStore';
import { publishToPlatform } from '../../server/socialMedia/platformPublishers';
import { recordPublishLog, listPublishLogForUser } from '../../server/socialMedia/publishLog';
import { checkSocialMediaAccess, accessDeniedMessage } from '../../server/socialMedia/accessControl';
import { generateTextContent } from '../../server/socialMedia/textContentGeneration';
import { buildScriptPackage } from '../../server/socialMedia/scriptTemplates';
import {
  contentApprovalStore,
  isApprovalGateEnabled,
} from '../../server/socialMedia/contentApproval';
import { validateMediaAssetUrl } from '../../server/socialMedia/mediaAssetValidation';
import type { SupportedAccountPlatform, PublishRequestPayload } from '../platform/SocialMediaEngine/types';

export const socialMediaRouter = Router();
const logger = createLogger('social-media:router');

const SUPPORTED_PLATFORMS: SupportedAccountPlatform[] = ['youtube', 'tiktok', 'instagram', 'x', 'facebook'];

function getRedirectUri(req: Request): string {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${protocol}://${host}/api/social-media/auth/callback`;
}

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

socialMediaRouter.get('/access', async (req: Request, res: Response) => {
  const access = await checkSocialMediaAccess(req);
  res.json({
    success: true,
    allowed: access.allowed,
    reason: access.reason,
    approvalGateEnabled: isApprovalGateEnabled(),
  });
});

socialMediaRouter.get('/accounts', async (req: Request, res: Response) => {
  const identity = await requireAccess(req, res);
  if (!identity) return;
  const accounts = await listAccountsForUser(identity.userId);
  res.json({ success: true, accounts, timestamp: new Date().toISOString() });
});

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
  const safeError = (errorMessage || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

// POST /api/social-media/generate — N1 text + optional N2 script package.
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
    const mode = (req.body?.mode as string) || 'full';
    const topic = req.body?.topic;
    const locale = req.body?.locale;
    const contextNote = req.body?.contextNote;

    const textPackage = generateTextContent({
      topic,
      platforms: req.body?.platforms,
      locale,
      contextNote,
      format: req.body?.format,
    });

    let scripts = undefined;
    if (mode === 'full' || mode === 'scripts') {
      scripts = buildScriptPackage({
        topic,
        locale,
        contextNote,
        ctaText: req.body?.ctaText,
        hostAName: req.body?.hostAName,
        hostBName: req.body?.hostBName,
      });
    }

    logger.info('Content generated', {
      userId: identity.userId,
      topic: textPackage.topic,
      mode,
      variantCount: textPackage.variants.length,
      hasScripts: !!scripts,
    });

    res.json({
      success: true,
      package: textPackage,
      scripts: scripts || null,
      approvalGateEnabled: isApprovalGateEnabled(),
      nextStep: isApprovalGateEnabled()
        ? 'POST /api/social-media/approvals then approve before instant publish'
        : null,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err?.message || 'Generierung fehlgeschlagen.',
    });
  }
});

// --- N4 Content approvals ---

socialMediaRouter.post('/approvals', async (req: Request, res: Response) => {
  const identity = await requireAccess(req, res);
  if (!identity) return;

  if (!checkRateLimit(`social-media-approvals:${identity.userId}`, 30, 60_000)) {
    return res.status(429).json({ success: false, error: 'Zu viele Freigabe-Anfragen - bitte kurz warten.' });
  }

  try {
    // WP-N4: the approval is bound to exactly this content and platform set.
    // The same fields are recomputed from the publish payload before the
    // approval can be consumed (ESS-0024 §10, ADR-0080 invariant 5).
    const platforms = req.body?.platforms || req.body?.targetPlatforms;
    const row = contentApprovalStore.create({
      userId: identity.userId,
      title: req.body?.title || req.body?.episodeTitle || 'Untitled content',
      topic: req.body?.topic,
      platforms,
      payloadSummary: req.body?.payloadSummary || req.body?.summary,
      scheduledAt: req.body?.scheduledAt,
      content: {
        episodeTitle: req.body?.episodeTitle ?? req.body?.title,
        targetPlatforms: platforms,
        customCaptions: req.body?.customCaptions,
        hashtags: req.body?.hashtags,
        videoTitle: req.body?.videoTitle,
        mediaUrl: req.body?.mediaUrl,
        mediaType: req.body?.mediaType,
      },
    });
    logger.info('Content approval created', { userId: identity.userId, id: row.id });
    res.status(201).json({ success: true, approval: row });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'Freigabeantrag fehlgeschlagen.' });
  }
});

socialMediaRouter.get('/approvals', async (req: Request, res: Response) => {
  const identity = await requireAccess(req, res);
  if (!identity) return;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const allowed = ['pending', 'approved', 'rejected', 'consumed'] as const;
  const filter = status && (allowed as readonly string[]).includes(status)
    ? (status as (typeof allowed)[number])
    : undefined;
  const approvals = contentApprovalStore.listForUser(identity.userId, filter);
  res.json({
    success: true,
    approvals,
    count: approvals.length,
    approvalGateEnabled: isApprovalGateEnabled(),
  });
});

socialMediaRouter.post('/approvals/:id/approve', async (req: Request, res: Response) => {
  const identity = await requireAccess(req, res);
  if (!identity) return;

  const id = String(req.params.id || '');
  const existing = contentApprovalStore.get(id);
  if (!existing || existing.userId !== identity.userId) {
    return res.status(404).json({ success: false, error: 'Freigabe nicht gefunden.' });
  }

  try {
    const row = contentApprovalStore.approve(
      id,
      identity.email || identity.userId,
      typeof req.body?.note === 'string' ? req.body.note : undefined,
    );
    logger.info('Content approval approved', { userId: identity.userId, id });
    res.json({ success: true, approval: row });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'Freigabe fehlgeschlagen.' });
  }
});

socialMediaRouter.post('/approvals/:id/reject', async (req: Request, res: Response) => {
  const identity = await requireAccess(req, res);
  if (!identity) return;

  const id = String(req.params.id || '');
  const existing = contentApprovalStore.get(id);
  if (!existing || existing.userId !== identity.userId) {
    return res.status(404).json({ success: false, error: 'Freigabe nicht gefunden.' });
  }

  try {
    const row = contentApprovalStore.reject(
      id,
      identity.email || identity.userId,
      typeof req.body?.note === 'string' ? req.body.note : undefined,
    );
    logger.info('Content approval rejected', { userId: identity.userId, id });
    res.json({ success: true, approval: row });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err?.message || 'Ablehnung fehlgeschlagen.' });
  }
});

socialMediaRouter.post('/publish', async (req: Request, res: Response) => {
  const identity = await requireAccess(req, res);
  if (!identity) return;

  if (!checkRateLimit(`social-media-publish:${identity.userId}`, 10, 60_000)) {
    return res.status(429).json({ success: false, error: 'Zu viele Veroeffentlichungs-Anfragen - bitte kurz warten.' });
  }

  const payload: PublishRequestPayload & { approvalId?: string } = req.body;
  if (!payload?.targetPlatforms || payload.targetPlatforms.length === 0) {
    return res.status(400).json({ error: 'Mindestens eine Ziel-Plattform muss ausgewaehlt werden.' });
  }

  const isDraft = payload.publishType === 'draft';
  const isScheduled = payload.publishType === 'scheduled';
  const isInstant = !isDraft && !isScheduled;

  // WP-N3 asset validation (ESS-0024 §8 plane 7, §13 "invalid/private media URL
  // -> DENY"). Runs before the approval is consumed: a single-use approval must
  // not be burnt by a payload that never had a chance to publish.
  if (payload.mediaUrl) {
    const asset = await validateMediaAssetUrl(payload.mediaUrl);
    if (!asset.ok) {
      logger.warn('Publish denied: media asset rejected', {
        userId: identity.userId,
        code: asset.code,
      });
      return res.status(400).json({
        success: false,
        error: asset.reason || 'mediaUrl ist nicht zulaessig.',
        code: asset.code,
      });
    }
  }

  // N4: instant publish requires a consumed-once approved approvalId when gate is on.
  if (isInstant && isApprovalGateEnabled()) {
    const approvalId = typeof payload.approvalId === 'string' ? payload.approvalId.trim() : '';
    if (!approvalId) {
      return res.status(428).json({
        success: false,
        error: 'Owner-Freigabe erforderlich: approvalId fehlt. Zuerst POST /approvals und approve.',
        code: 'approval_required',
        approvalGateEnabled: true,
      });
    }
    try {
      // The hash is recomputed from the outgoing payload, not taken from the
      // request: a client-supplied hash would let the caller assert its own
      // approval and defeat the gate.
      contentApprovalStore.consumeForPublish(approvalId, identity.userId, {
        episodeTitle: payload.episodeTitle,
        targetPlatforms: payload.targetPlatforms,
        customCaptions: payload.customCaptions,
        hashtags: payload.hashtags,
        videoTitle: payload.videoTitle,
        mediaUrl: payload.mediaUrl,
        mediaType: payload.mediaType,
      });
    } catch (err: any) {
      const message = err?.message || 'Freigabe ungueltig.';
      const mismatch = message.includes('does not match the approved version');
      return res.status(403).json({
        success: false,
        error: message,
        code: mismatch ? 'approval_content_mismatch' : 'approval_invalid',
      });
    }
  }

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

socialMediaRouter.get('/history', async (req: Request, res: Response) => {
  const identity = await requireAccess(req, res);
  if (!identity) return;
  const history = await listPublishLogForUser(identity.userId);
  res.json({ success: true, history, count: history.length });
});
