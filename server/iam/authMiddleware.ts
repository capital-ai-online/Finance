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
import { getServerSupabase, isSupabaseConfigured } from '../db';
import type { Role } from './types';
import { ADMIN_ZONE_ROLES } from './types';
import { checkRateLimit, getClientIp } from './rateLimiter';
import { hashOpaqueToken } from './secretCrypto';

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

// --- IAM-Schema-Health-Check (Compliance-Review Punkt 2) -----------------------
//
// Prüft EINMALIG beim Serverstart (server.ts ruft runIamSchemaHealthCheck() auf),
// ob profiles.iam_role tatsächlich existiert, statt das stillschweigend erst beim
// ersten Request zu bemerken. Ergebnis wird gecacht, damit checkAdminAccess() bei
// jedem Request sofort und ohne zusätzliche Query fail-closed reagieren kann,
// falls das Schema fehlt (z.B. Migration in einer neuen Umgebung noch nicht gelaufen).
let iamSchemaHealthy: boolean | null = null; // null = noch nicht geprüft

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

    // information_schema ist über PostgREST i.d.R. nicht direkt abfragbar; Fallback
    // auf einen echten Lesezugriff mit LIMIT 0, der bei fehlender Spalte einen
    // eindeutigen Fehler wirft.
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
      // profiles.role existiert evtl. noch nicht (Migration ausstehend) -> kontrolliert null zurückgeben
      return { role: null, userId: userData.user.id };
    }
    return { role: (profile.iam_role as Role) || 'user', userId: userData.user.id };
  } catch {
    return { role: null };
  }
}

// Compliance-Review Punkt 3: vollständiger Kontext (User-ID, Ziel-Ressource/Zone,
// Grund, IP, User-Agent) statt nur role/zone/outcome - notwendig, um Angriffsmuster
// (z.B. wiederholte Versuche derselben IP gegen wechselnde Zonen) überhaupt erkennen
// zu können.
async function logAccess(
  role: string,
  zone: string,
  outcome: 'GRANTED' | 'DENIED',
  ctx: { tokenRef?: string; userId?: string; reason?: string; ip?: string; userAgent?: string } = {}
) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getServerSupabase();
    await supabase.from('iam_access_log').insert({
      role,
      zone,
      outcome,
      token_id: ctx.tokenRef ? `tok_${ctx.tokenRef.slice(0, 10)}` : 'no-token',
      user_id: ctx.userId || null,
      reason: ctx.reason || null,
      ip_address: ctx.ip || null,
      user_agent: ctx.userAgent || null,
    });
  } catch {
    // iam_access_log existiert evtl. noch nicht (Migration ausstehend) -> Request nicht blockieren
  }
}

/**
 * Ermittelt die verifizierte Identität des Aufrufers aus dem Bearer-Token, OHNE eine
 * bestimmte Rolle zu verlangen. Für Endpunkte, die selbst kein Admin-Zone sind, aber
 * niemals einem client-gelieferten email/userId-Parameter vertrauen dürfen, um zu
 * bestimmen, wessen Konto betroffen ist (z.B. Abo-/Credits-Endpunkte in stripe.ts).
 * Gibt null zurück, wenn kein gültiges Token vorliegt - Aufrufer müssen das als 401 behandeln.
 */
export async function resolveVerifiedIdentity(req: Request): Promise<{ userId: string; email: string | null } | null> {
  if (!isSupabaseConfigured()) return null;
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return { userId: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}

/**
 * Zentrale Autorisierungsprüfung für Systemadmin-/Master-Supervisor-Endpunkte.
 * Ersetzt die bisher pro Datei duplizierte ADMIN_EMAILS-Prüfung.
 *
 * Compliance-Review Punkt 1: die gesamte Funktion ist in einen Top-Level try/catch
 * gehüllt - kein unerwarteter Fehler (z.B. Netzwerkfehler bei Supabase, Bug in einer
 * Hilfsfunktion) kann hier je zu einer unbehandelten Promise-Rejection werden. Jeder
 * Fehlerfall führt zu einer klaren, fail-closed AuthzResult-Antwort statt zu einem
 * hängenden Request oder Prozessabsturz.
 *
 * @param req Express-Request
 * @param zone Bezeichner der geschützten Zone (für iam_access_log), z.B. 'system-events', 'agents-registry'
 * @param allowedRoles erlaubte Rollen für diese Zone (Default: owner, admin)
 */
export async function checkAdminAccess(
  req: Request,
  zone: string,
  allowedRoles: Role[] = ADMIN_ZONE_ROLES
): Promise<AuthzResult> {
  const clientIp = getClientIp(req);
  const userAgent = (req.headers['user-agent'] as string) || undefined;

  try {
    if (!isSupabaseConfigured()) {
      // Fail closed: ohne Supabase kann keine Rolle verifiziert werden. Kein Fallback.
      console.error(`[IAM][BLOCKED] Zone "${zone}" — Supabase nicht konfiguriert, Zugriff verweigert (fail-closed).`);
      await logAccess('unknown', zone, 'DENIED', { ip: clientIp, userAgent, reason: 'supabase-not-configured' });
      return { authorized: false, role: null, reason: 'supabase-not-configured', actorLabel: 'unknown' };
    }

    // Compliance-Review Punkt 2: Health-Check-Ergebnis konsultieren, bevor überhaupt
    // eine Token-Prüfung versucht wird. Noch nicht geprüft (null) -> on-demand nachholen,
    // damit einzelne, isoliert gestartete Prozesse (z.B. Tests) nicht fälschlich blockieren.
    if (iamSchemaHealthy === null) {
      await runIamSchemaHealthCheck();
    }
    if (iamSchemaHealthy === false) {
      console.error(`[IAM][BLOCKED] Zone "${zone}" — IAM-Schema nicht verfügbar (siehe Health-Check-Log), fail-closed.`);
      await logAccess('unknown', zone, 'DENIED', { ip: clientIp, userAgent, reason: 'iam-schema-unavailable' });
      return { authorized: false, role: null, reason: 'iam-schema-unavailable', actorLabel: 'unknown' };
    }

    // ADR-0003.5: Rate-Limiting pro IP+Zone, bevor überhaupt eine Token-Prüfung passiert -
    // schützt gegen Brute-Force/Enumeration auf Admin-Zonen. Siehe rateLimiter.ts für die
    // bekannte Einschränkung (Single-Instance, In-Memory).
    if (!checkRateLimit(`admin:${clientIp}:${zone}`, 30, 60_000)) {
      await logAccess('unknown', zone, 'DENIED', { ip: clientIp, userAgent, reason: 'rate-limited (zone)' });
      return { authorized: false, role: null, reason: 'rate-limited', actorLabel: clientIp };
    }
    // Zusätzlicher globaler Zähler über alle Admin-Zonen hinweg pro IP, gegen verteiltes
    // Durchprobieren (eine Zone knapp unter dem Limit halten, dafür viele Zonen parallel).
    if (!checkRateLimit(`admin-global:${clientIp}`, 120, 60_000)) {
      await logAccess('unknown', zone, 'DENIED', { ip: clientIp, userAgent, reason: 'rate-limited (global)' });
      return { authorized: false, role: null, reason: 'rate-limited', actorLabel: clientIp };
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      await logAccess('unknown', zone, 'DENIED', { ip: clientIp, userAgent, reason: 'no-bearer-token' });
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
    // Fängt JEDEN unerwarteten Fehler ab (z.B. Supabase-Netzwerkfehler) und garantiert
    // eine fail-closed Antwort statt einer unbehandelten Promise-Rejection.
    console.error(`[IAM][ERROR] Unerwarteter Fehler in checkAdminAccess (Zone "${zone}"): ${err?.message || err}`);
    try {
      await logAccess('unknown', zone, 'DENIED', { ip: clientIp, userAgent, reason: `internal-error: ${err?.message || 'unknown'}` });
    } catch {
      // Logging selbst darf hier nicht nochmal fehlschlagen können.
    }
    return { authorized: false, role: null, reason: 'internal-error', actorLabel: 'unknown' };
  }
}

/**
 * Prüft einen kurzlebigen Step-up-Nachweis für kritische Owner-Aktionen
 * (Rollenverwaltung, Break-Glass, Versions-Bumps/Rollbacks).
 *
 * Erwartet: normaler Authorization-Bearer-Token (Identität) PLUS x-step-up-token-Header
 * (ausgestellt durch POST /api/auth/step-up/verify nach frischer TOTP-Eingabe, 5 Min gültig).
 * Verifikation ist atomar und Einmal-verwendbar (UPDATE ... WHERE used_at IS NULL),
 * um Race-Conditions bei parallelen Requests mit demselben Token auszuschließen.
 */
export async function requireStepUp(req: Request): Promise<boolean> {
  const stepUpHeader = req.headers['x-step-up-token'];
  if (!stepUpHeader || typeof stepUpHeader !== 'string') return false;
  if (!isSupabaseConfigured()) return false;

  const identity = await resolveVerifiedIdentity(req);
  if (!identity) return false;

  try {
    const supabase = getServerSupabase();
    const tokenHash = hashOpaqueToken(stepUpHeader);
    const { data, error } = await supabase
      .from('step_up_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', identity.userId)
      .eq('token_hash', tokenHash)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .select('id')
      .maybeSingle();
    return !error && !!data;
  } catch {
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
  } catch {
    // audit_logs_iam existiert evtl. noch nicht (Migration ausstehend)
  }
}
