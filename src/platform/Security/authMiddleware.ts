// ADR-0003.5 / ADR-0008 / ADR-0009-Nachbesserung (siehe Compliance-Review 3.2.1) —
// zentrale IAM-Autorisierung.
//
// Produktions-Migration (supabase/migrations/20260711000000_iam.sql) ist verifiziert
// live: profiles.iam_role, audit_logs_iam und iam_access_log existieren produktiv
// (verifiziert 2026-07-13). Der frühere Übergangs-Fallback auf eine hartcodierte
// LEGACY_ADMIN_EMAILS-Liste wurde daher entfernt: er prüfte serverseitig keinerlei
// Credential (nur req.query.email / req.body.email) und war damit ein unauthentifizierter
// Privilege-Escalation-Pfad auf alle an checkAdminAccess() hängenden Zonen, unabhängig
// vom tatsächlichen Migrationsstatus. Autorisierung läuft jetzt ausschließlich über
// verifizierte Supabase-Session-Tokens gegen profiles.iam_role.

import type { Request } from 'express';
import { getServerSupabase, isSupabaseConfigured } from '../../../server/db';
import type { Role } from './types';
import { ADMIN_ZONE_ROLES } from './types';
import { checkRateLimit, getClientIp } from './rateLimiter';
import { hashOpaqueToken } from './secretCrypto';
import { createLogger } from '../../../server/logger';
import { annotateReason, buildDebounceKey, createIamAuditDebounce } from './iamAuditDebounce';
import {
  AAL2_DIAGNOSTIC_SUPERSESSION_ID,
  AAL2_REACTIVATION_STAGE,
  isAal2EnabledFor,
} from './aal2DiagnosticSupersession';

const iamLogger = createLogger('iam');
const MAX_BEARER_TOKEN_LENGTH = 8_192;
const MAX_STEP_UP_TOKEN_LENGTH = 512;

/**
 * Strict RFC6750-style bearer extraction for every IAM path.
 * Rejects duplicate/comma-joined credentials, embedded whitespace/control characters and
 * unbounded headers before they reach Supabase Auth or hashing/audit code.
 */
export function extractBearerToken(req: Pick<Request, 'headers'>): string | null {
  const raw = req.headers.authorization;
  if (typeof raw !== 'string') return null;
  const match = raw.match(/^Bearer ([^\s,]+)$/i);
  if (!match) return null;
  const token = match[1];
  if (token.length > MAX_BEARER_TOKEN_LENGTH) return null;
  return token;
}

export interface AuthzResult {
  authorized: boolean;
  role: Role | null;
  reason:
    | 'iam-role'
    | 'insufficient-role'
    | 'no-valid-credentials'
    | 'supabase-not-configured'
    | 'rate-limited'
    | 'iam-schema-unavailable'
    | 'internal-error';
  userId?: string;
  /** Für Logging/Anzeige-Zwecke, NICHT für Autorisierungsentscheidungen verwenden. */
  actorLabel: string;
}

let iamSchemaHealthy: boolean | null = null;

export async function runIamSchemaHealthCheck(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    iamSchemaHealthy = false;
    console.error('[IAM][HEALTH-CHECK] Supabase nicht konfiguriert - Admin-Zonen bleiben fail-closed gesperrt.');
    return false;
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('information_schema.columns' as any)
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .eq('column_name', 'iam_role')
      .maybeSingle();

    if (error) {
      const { error: probeError } = await supabase.from('profiles').select('iam_role').limit(0);
      if (probeError) {
        iamSchemaHealthy = false;
        console.error(
          '[IAM][HEALTH-CHECK] KRITISCH: profiles.iam_role ist nicht erreichbar ' +
          `(${probeError.message}). Alle Admin-Zonen bleiben fail-closed gesperrt, bis das behoben ist.`
        );
        return false;
      }
    }
    void data;
    iamSchemaHealthy = true;
    console.log('[IAM][HEALTH-CHECK] OK: profiles.iam_role verfügbar.');
    return true;
  } catch (err: any) {
    iamSchemaHealthy = false;
    console.error(`[IAM][HEALTH-CHECK] KRITISCH: Unerwarteter Fehler beim Schema-Check: ${err?.message || err}`);
    return false;
  }
}

async function resolveRoleFromToken(token: string): Promise<{ role: Role | null; userId?: string }> {
  if (!isSupabaseConfigured()) return { role: null };
  try {
    const supabase = getServerSupabase();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return { role: null };

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('iam_role')
      .eq('id', userData.user.id)
      .single();

    if (profileErr || !profile) {
      return { role: null, userId: userData.user.id };
    }
    return { role: (profile.iam_role as Role) || 'user', userId: userData.user.id };
  } catch (err: any) {
    console.error(`[IAM][ERROR] resolveRoleFromToken fehlgeschlagen: ${err?.message || err}`);
    return { role: null };
  }
}

const deniedAuditDebounce = createIamAuditDebounce();

async function logAccess(
  role: string,
  zone: string,
  outcome: 'GRANTED' | 'DENIED',
  ctx: { tokenRef?: string; userId?: string; reason?: string; ip?: string; userAgent?: string } = {}
) {
  if (!isSupabaseConfigured()) return;

  let reason = ctx.reason || null;
  if (outcome === 'DENIED') {
    const decision = deniedAuditDebounce.decide(
      buildDebounceKey({ role, zone, reason: ctx.reason, ip: ctx.ip })
    );
    if (!decision.write) return;
    reason = annotateReason(reason, decision.suppressedSincePrevious);
  }

  try {
    const supabase = getServerSupabase();
    const tokenFingerprint = ctx.tokenRef
      ? `tok_sha256_${hashOpaqueToken(ctx.tokenRef).slice(0, 24)}`
      : 'no-token';
    await supabase.from('iam_access_log').insert({
      role,
      zone,
      outcome,
      token_id: tokenFingerprint,
      user_id: ctx.userId || null,
      reason,
      ip_address: ctx.ip || null,
      user_agent: ctx.userAgent || null,
    });
  } catch (err: any) {
    iamLogger.error('iam_access_log-Insert fehlgeschlagen', { zone, error: err?.message || String(err) });
  }
}

export async function resolveVerifiedIdentity(req: Request): Promise<{ userId: string; email: string | null } | null> {
  if (!isSupabaseConfigured()) return null;
  const token = extractBearerToken(req);
  if (!token) return null;
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return { userId: data.user.id, email: data.user.email ?? null };
  } catch (err: any) {
    iamLogger.error('resolveVerifiedIdentity fehlgeschlagen', { requestId: req.requestId, error: err?.message || String(err) });
    return null;
  }
}

export async function checkAdminAccess(
  req: Request,
  zone: string,
  allowedRoles: Role[] = ADMIN_ZONE_ROLES
): Promise<AuthzResult> {
  const clientIp = getClientIp(req);
  const userAgent = (req.headers['user-agent'] as string) || undefined;

  try {
    if (!isSupabaseConfigured()) {
      iamLogger.error('Zugriff verweigert - Supabase nicht konfiguriert (fail-closed)', { requestId: req.requestId, zone });
      await logAccess('unknown', zone, 'DENIED', { ip: clientIp, userAgent, reason: 'supabase-not-configured' });
      return { authorized: false, role: null, reason: 'supabase-not-configured', actorLabel: 'unknown' };
    }

    if (iamSchemaHealthy === null) {
      await runIamSchemaHealthCheck();
    }
    if (iamSchemaHealthy === false) {
      iamLogger.error('Zugriff verweigert - IAM-Schema nicht verfuegbar (fail-closed)', { requestId: req.requestId, zone });
      await logAccess('unknown', zone, 'DENIED', { ip: clientIp, userAgent, reason: 'iam-schema-unavailable' });
      return { authorized: false, role: null, reason: 'iam-schema-unavailable', actorLabel: 'unknown' };
    }

    if (!checkRateLimit(`admin:${clientIp}:${zone}`, 30, 60_000)) {
      await logAccess('unknown', zone, 'DENIED', { ip: clientIp, userAgent, reason: 'rate-limited (zone)' });
      return { authorized: false, role: null, reason: 'rate-limited', actorLabel: clientIp };
    }
    if (!checkRateLimit(`admin-global:${clientIp}`, 120, 60_000)) {
      await logAccess('unknown', zone, 'DENIED', { ip: clientIp, userAgent, reason: 'rate-limited (global)' });
      return { authorized: false, role: null, reason: 'rate-limited', actorLabel: clientIp };
    }

    const token = extractBearerToken(req);
    if (!token) {
      await logAccess('unknown', zone, 'DENIED', { ip: clientIp, userAgent, reason: 'no-or-malformed-bearer-token' });
      return { authorized: false, role: null, reason: 'no-valid-credentials', actorLabel: 'unknown' };
    }

    const { role, userId } = await resolveRoleFromToken(token);

    if (role && allowedRoles.includes(role)) {
      await logAccess(role, zone, 'GRANTED', { tokenRef: token, userId, ip: clientIp, userAgent });
      return { authorized: true, role, reason: 'iam-role', userId, actorLabel: userId || role };
    }
    if (role) {
      await logAccess(role, zone, 'DENIED', {
        tokenRef: token, userId, ip: clientIp, userAgent,
        reason: `insufficient-role (has: ${role}, needs one of: ${allowedRoles.join(',')})`,
      });
      return { authorized: false, role, reason: 'insufficient-role', actorLabel: userId || role };
    }

    await logAccess('unknown', zone, 'DENIED', { tokenRef: token, userId, ip: clientIp, userAgent, reason: 'token-did-not-resolve-to-role' });
    return { authorized: false, role: null, reason: 'no-valid-credentials', actorLabel: 'unknown' };
  } catch (err: any) {
    iamLogger.error('Unerwarteter Fehler in checkAdminAccess', { requestId: req.requestId, zone, error: err?.message || String(err) });
    try {
      await logAccess('unknown', zone, 'DENIED', { ip: clientIp, userAgent, reason: `internal-error: ${err?.message || 'unknown'}` });
    } catch (logErr: any) {
      iamLogger.error('logAccess fehlgeschlagen waehrend internal-error-Behandlung', { requestId: req.requestId, zone, error: logErr?.message || String(logErr) });
    }
    return { authorized: false, role: null, reason: 'internal-error', actorLabel: 'unknown' };
  }
}

export type Aal2DenyReason =
  | 'supabase-not-configured'
  | 'no-bearer-token'
  | 'invalid-token'
  | 'aal-lookup-failed'
  | 'insufficient-aal'
  | 'internal-error';

export interface Aal2Result {
  verified: boolean;
  userId?: string;
  currentLevel: string | null;
  reason: Aal2DenyReason | 'aal2-verified' | 'aal2-superseded';
}

export async function requireVerifiedAal2(req: Request): Promise<Aal2Result> {
  if (!isSupabaseConfigured()) {
    return { verified: false, currentLevel: null, reason: 'supabase-not-configured' };
  }

  const token = extractBearerToken(req);
  if (!token) {
    return { verified: false, currentLevel: null, reason: 'no-bearer-token' };
  }

  try {
    const supabase = getServerSupabase();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return { verified: false, currentLevel: null, reason: 'invalid-token' };
    }

    // The diagnostic supersession never bypasses primary identity verification. It only bypasses
    // the provider AAL2 requirement after the bearer token has resolved to a real Supabase user.
    // Every bypass is emitted to runtime logs and the IAM audit table so staged reactivation can
    // be correlated against the original login stall.
    if (!isAal2EnabledFor('privileged')) {
      iamLogger.warn('AAL2 diagnostic supersession bypass', {
        requestId: req.requestId,
        userId: userData.user.id,
        supersessionId: AAL2_DIAGNOSTIC_SUPERSESSION_ID,
        reactivationStage: AAL2_REACTIVATION_STAGE,
        surface: 'privileged',
      });
      await logIamEvent(
        userData.user.id,
        userData.user.id,
        'aal2.diagnostic_supersession_bypass',
        null,
        {
          supersessionId: AAL2_DIAGNOSTIC_SUPERSESSION_ID,
          reactivationStage: AAL2_REACTIVATION_STAGE,
          surface: 'privileged',
        },
      );
      return {
        verified: true,
        userId: userData.user.id,
        currentLevel: 'superseded',
        reason: 'aal2-superseded',
      };
    }

    const { data: aalData, error: aalErr } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(token);
    if (aalErr || !aalData) {
      iamLogger.error('AAL2-Lookup fehlgeschlagen - fail-closed verweigert', {
        requestId: req.requestId,
        userId: userData.user.id,
        error: aalErr?.message || 'no-data',
      });
      return { verified: false, userId: userData.user.id, currentLevel: null, reason: 'aal-lookup-failed' };
    }

    if (aalData.currentLevel !== 'aal2') {
      return {
        verified: false,
        userId: userData.user.id,
        currentLevel: aalData.currentLevel,
        reason: 'insufficient-aal',
      };
    }

    return { verified: true, userId: userData.user.id, currentLevel: 'aal2', reason: 'aal2-verified' };
  } catch (err: any) {
    iamLogger.error('requireVerifiedAal2 unerwarteter Fehler - fail-closed verweigert', {
      requestId: req.requestId,
      error: err?.message || String(err),
    });
    return { verified: false, currentLevel: null, reason: 'internal-error' };
  }
}

export async function requireStepUp(req: Request, purpose: string): Promise<boolean> {
  const stepUpHeader = req.headers['x-step-up-token'];
  if (!stepUpHeader || typeof stepUpHeader !== 'string') return false;
  if (stepUpHeader.length > MAX_STEP_UP_TOKEN_LENGTH) return false;
  if (!/^[A-Za-z0-9_-]+$/.test(stepUpHeader)) return false;
  if (!purpose || purpose.length > 128) return false;
  if (!isSupabaseConfigured()) return false;

  const aal2 = await requireVerifiedAal2(req);
  if (!aal2.verified || !aal2.userId) return false;

  try {
    const supabase = getServerSupabase();
    const tokenHash = hashOpaqueToken(stepUpHeader);
    const { data, error } = await supabase
      .from('step_up_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', aal2.userId)
      .eq('token_hash', tokenHash)
      .eq('purpose', purpose)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .select('id')
      .maybeSingle();
    return !error && !!data;
  } catch (err: any) {
    iamLogger.error('requireStepUp fehlgeschlagen', { requestId: req.requestId, error: err?.message || String(err) });
    return false;
  }
}

export async function logIamEvent(
  actorUserId: string | undefined,
  targetUserId: string | undefined,
  action: string,
  previousValue: unknown,
  newValue: unknown
) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getServerSupabase();
    await supabase.from('audit_logs_iam').insert({
      event_type: 'IAM',
      actor_user_id: actorUserId || null,
      target_user_id: targetUserId || null,
      action,
      previous_value: previousValue ?? null,
      new_value: newValue ?? null,
    });
  } catch (err: any) {
    console.error(`[IAM][ERROR] logIamEvent-Insert fehlgeschlagen (action="${action}"): ${err?.message || err}`);
  }
}
