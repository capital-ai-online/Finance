import express from 'express';
import { getServerSupabase, isSupabaseConfigured } from './db';
import { resolveVerifiedIdentity } from '../src/platform/Security/authMiddleware';
import { checkRateLimit } from '../src/platform/Security/rateLimiter';
import {
  CONTROLLER,
  PRIVACY_NOTICE_VERSION,
  PRIVACY_REQUEST_TYPES,
  type PrivacyRequestType,
} from '../src/privacy/privacyPolicy';

export const privacyRouter = express.Router();

type VerifiedIdentity = { userId: string; email: string | null };

type ExportSection = {
  available: boolean;
  rows: unknown[];
  note?: string;
};

function requirePrivacyAuth(
  handler: (
    req: express.Request,
    res: express.Response,
    identity: VerifiedIdentity,
  ) => Promise<void | express.Response>,
) {
  return async (req: express.Request, res: express.Response) => {
    const identity = await resolveVerifiedIdentity(req);
    if (!identity) {
      return res.status(401).json({ error: 'Authentifizierung erforderlich.' });
    }

    try {
      await handler(req, res, identity);
    } catch (error: any) {
      // Privacy endpoints deliberately do not log request bodies, exports, email addresses,
      // tokens or other subject data. Only the error class/message is emitted.
      console.error('[PRIVACY][ERROR]', error?.message || String(error));
      if (!res.headersSent) {
        res.status(500).json({ error: 'Datenschutzanfrage konnte nicht verarbeitet werden.' });
      }
    }
  };
}

function isPrivacyRequestType(value: unknown): value is PrivacyRequestType {
  return typeof value === 'string' && (PRIVACY_REQUEST_TYPES as readonly string[]).includes(value);
}

async function readRows(
  supabase: any,
  table: string,
  select: string,
  filterColumn: string,
  filterValue: string,
): Promise<ExportSection> {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq(filterColumn, filterValue);

  if (error) {
    // A partial export is preferable to incorrectly claiming completeness if an optional
    // deployment table is not available yet. Do not expose database error details to users.
    return {
      available: false,
      rows: [],
      note: `Quelle ${table} konnte in diesem Exportlauf nicht gelesen werden.`,
    };
  }

  return { available: true, rows: data || [] };
}

privacyRouter.post('/requests', requirePrivacyAuth(async (req, res, identity) => {
  if (!checkRateLimit(`privacy-request:${identity.userId}`, 10, 60 * 60_000)) {
    return res.status(429).json({ error: 'Zu viele Datenschutzanfragen. Bitte später erneut versuchen.' });
  }
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Datenschutz-Workflow ist derzeit nicht verfügbar.' });
  }

  const { requestType, details } = req.body || {};
  if (!isPrivacyRequestType(requestType)) {
    return res.status(400).json({
      error: 'Ungültiger Anfragetyp.',
      allowed: PRIVACY_REQUEST_TYPES,
    });
  }

  const cleanDetails = typeof details === 'string' && details.trim()
    ? details.trim().slice(0, 2000)
    : null;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('privacy_requests')
    .insert({
      user_id: identity.userId,
      request_type: requestType,
      details: cleanDetails,
      status: 'received',
    })
    .select('id, request_type, status, due_at, created_at')
    .single();

  if (error) {
    console.error('[PRIVACY][ERROR] request insert failed:', error.message);
    return res.status(500).json({ error: 'Datenschutzanfrage konnte nicht gespeichert werden.' });
  }

  return res.status(201).json({
    request: data,
    noticeVersion: PRIVACY_NOTICE_VERSION,
    message: 'Anfrage wurde erfasst. Die Bearbeitung erfolgt nach Identitätsprüfung und den gesetzlichen Fristen.',
  });
}));

privacyRouter.get('/requests', requirePrivacyAuth(async (_req, res, identity) => {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Datenschutz-Workflow ist derzeit nicht verfügbar.' });
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('privacy_requests')
    .select('id, request_type, status, due_at, created_at, updated_at, completed_at')
    .eq('user_id', identity.userId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Anfragehistorie konnte nicht geladen werden.' });
  }

  return res.json({ requests: data || [] });
}));

privacyRouter.get('/export', requirePrivacyAuth(async (req, res, identity) => {
  if (!checkRateLimit(`privacy-export:${identity.userId}`, 6, 60 * 60_000)) {
    return res.status(429).json({ error: 'Zu viele Exportanfragen. Bitte später erneut versuchen.' });
  }
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Datenexport ist derzeit nicht verfügbar.' });
  }

  const supabase = getServerSupabase();
  const email = identity.email?.toLowerCase().trim() || '';

  const [
    profile,
    subscriptions,
    consents,
    socialAccounts,
    socialPublishing,
    securityEvents,
    privacyRequests,
    alerts,
    quota,
  ] = await Promise.all([
    readRows(
      supabase,
      'profiles',
      'id, full_name, role, iam_role, country, phone_number, phone_verified, onboarding_required, mfa_required_account',
      'id',
      identity.userId,
    ),
    readRows(
      supabase,
      'subscriptions',
      'user_id, email, tier, status, stripe_subscription_id, updated_at',
      'user_id',
      identity.userId,
    ),
    readRows(
      supabase,
      'user_consents',
      'consent_type, evidence_kind, document_version, granted, created_at',
      'user_id',
      identity.userId,
    ),
    readRows(
      supabase,
      'social_media_accounts',
      'platform, account_name, handle, avatar_url, status, scopes, followers_count, external_account_id, connected_at, created_at, updated_at',
      'user_id',
      identity.userId,
    ),
    readRows(
      supabase,
      'social_media_publish_log',
      'episode_id, episode_title, platform, account_handle, status, publish_type, published_url, scheduled_at, created_at',
      'user_id',
      identity.userId,
    ),
    readRows(
      supabase,
      'security_events',
      'created_at, event_type, ip_address, user_agent, device_vendor, device_type, endpoint, outcome, reason',
      'actor_user_id',
      identity.userId,
    ),
    readRows(
      supabase,
      'privacy_requests',
      'id, request_type, status, due_at, created_at, updated_at, completed_at',
      'user_id',
      identity.userId,
    ),
    email
      ? readRows(
          supabase,
          'alert_subscriptions',
          'symbol, asset_type, condition, threshold, confirmed, active, last_notified_at, created_at',
          'email',
          email,
        )
      : Promise.resolve({ available: true, rows: [], note: 'Keine verifizierte E-Mail in der Sitzung.' }),
    email
      ? readRows(
          supabase,
          'user_quota',
          'quota_kind, window_start, count, updated_at',
          'email',
          email,
        )
      : Promise.resolve({ available: true, rows: [], note: 'Keine verifizierte E-Mail in der Sitzung.' }),
  ]);

  const exportPayload = {
    exportVersion: 1,
    generatedAt: new Date().toISOString(),
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    controller: CONTROLLER,
    subject: {
      userId: identity.userId,
      email: identity.email,
    },
    scopeNotice:
      'Dieser Self-Service-Export umfasst die direkt dem Konto zuordenbaren Standarddatenquellen der Anwendung. Ein formelles Auskunftsersuchen nach Art. 15 DSGVO kann darüber hinaus Kontext, Empfängerinformationen und rechtlich zu prüfende interne Nachweise umfassen.',
    data: {
      profile,
      subscriptions,
      consentEvidence: consents,
      socialMediaAccounts: socialAccounts,
      socialMediaPublishing: socialPublishing,
      alertSubscriptions: alerts,
      usageQuota: quota,
      securityEvents,
      privacyRequests,
    },
  };

  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="capital-ai-datenauszug-${date}.json"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(JSON.stringify(exportPayload, null, 2));
}));
