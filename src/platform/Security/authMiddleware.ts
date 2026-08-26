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

// Audit ARCH-AUDIT-0002 (S4): strukturierte, Correlation-ID-tragende Logs fuer den
// sicherheitskritischsten Modul dieser Codebasis statt Ad-hoc-console.error-Strings.
const iamLogger = createLogger('iam');

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
  } catch (err: any) {
    // Audit ARCH-AUDIT-0002 (AUD2-F-020): zuvor stillschweigend verschluckt - ein
    // Token-Aufloesungsfehler konnte damit unbemerkt bleiben statt im Log sichtbar zu sein.
    console.error(`[IAM][ERROR] resolveRoleFromToken fehlgeschlagen: ${err?.message || err}`);
    return { role: null };
  }
}

// Compliance-Review Punkt 3: vollständiger Kontext (User-ID, Ziel-Ressource/Zone,
// Grund, IP, User-Agent) statt nur role/zone/outcome - notwendig, um Angriffsmuster
// (z.B. wiederholte Versuche derselben IP gegen wechselnde Zonen) überhaupt erkennen
// zu können.
// F-01: Wiederholte identische Abweisungen werden verdichtet statt einzeln geschrieben. Der
// Zähler der unterdrückten Wiederholungen reist mit dem nächsten Datensatz mit, es geht also
// keine Evidenz verloren. GRANTED bleibt bewusst unentprellt.
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
    await supabase.from('iam_access_log').insert({
      role,
      zone,
      outcome,
      token_id: ctx.tokenRef ? `tok_${ctx.tokenRef.slice(0, 10)}` : 'no-token',
      user_id: ctx.userId || null,
      reason,
      ip_address: ctx.ip || null,
      user_agent: ctx.userAgent || null,
    });
  } catch (err: any) {
    // Audit ARCH-AUDIT-0002 (AUD2-F-020): Request bleibt bewusst unblockiert (Zugriffslog ist
    // nicht sicherheitsentscheidend), aber der Fehler war zuvor komplett unsichtbar - genau das
    // Muster, das AUD2-F-011 (Schema-Mismatch) unbemerkt liess.
    iamLogger.error('iam_access_log-Insert fehlgeschlagen', { zone, error: err?.message || String(err) });
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
  } catch (err: any) {
    // Audit ARCH-AUDIT-0002 (AUD2-F-020)
    iamLogger.error('resolveVerifiedIdentity fehlgeschlagen', { requestId: req.requestId, error: err?.message || String(err) });
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
      iamLogger.error('Zugriff verweigert - Supabase nicht konfiguriert (fail-closed)', { requestId: req.requestId, zone });
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
      iamLogger.error('Zugriff verweigert - IAM-Schema nicht verfuegbar (fail-closed)', { requestId: req.requestId, zone });
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
    iamLogger.error('Unerwarteter Fehler in checkAdminAccess', { requestId: req.requestId, zone, error: err?.message || String(err) });
    try {
      await logAccess('unknown', zone, 'DENIED', { ip: clientIp, userAgent, reason: `internal-error: ${err?.message || 'unknown'}` });
    } catch (logErr: any) {
      // Logging selbst darf hier nicht nochmal fehlschlagen können - stdout als letzte Instanz.
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
  reason: Aal2DenyReason | 'aal2-verified';
}

/**
 * ADR-0064 / ESS-0020 — zentrale, serverseitige AAL2-Prüfung.
 *
 * Nutzt den bereits vorliegenden Bearer-Token (dieselbe Identität wie checkAdminAccess/
 * resolveVerifiedIdentity) und fragt Supabase Auth direkt nach dem Authenticator Assurance
 * Level DIESES Tokens - `supabase.auth.mfa.getAuthenticatorAssuranceLevel(jwt)` löst dafür einen
 * echten Netzwerk-Roundtrip gegen Supabase Auth aus und validiert den Token dabei erneut. Das
 * `aal`-Claim ist Teil des von GoTrue signierten Tokens und daher vom Client nicht fälschbar;
 * diese Funktion vertraut ausdrücklich NIEMALS einem client-gelieferten AAL-Feld, Header oder
 * einem UI-/sessionStorage-Marker (siehe nativeMfa.ts Modul-Kommentar).
 *
 * Fail-closed bei jedem Fehler: fehlender Token, ungültiger Token, Lookup-Fehler (Netzwerk/Auth)
 * oder AAL kleiner als `aal2` führen alle zu `verified: false`. Da jeder Aufruf den Token frisch
 * gegen Supabase verifiziert, kann kein zwischenzeitlich zurückgestufter/abgelaufener Zustand
 * unbemerkt bleiben ("stale aal2/aal1" - es gibt keinen gecachten Vorzustand, der veralten könnte).
 */
export async function requireVerifiedAal2(req: Request): Promise<Aal2Result> {
  if (!isSupabaseConfigured()) {
    return { verified: false, currentLevel: null, reason: 'supabase-not-configured' };
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return { verified: false, currentLevel: null, reason: 'no-bearer-token' };
  }

  try {
    const supabase = getServerSupabase();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return { verified: false, currentLevel: null, reason: 'invalid-token' };
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
    // Fail-closed: jeder unerwartete Fehler (Netzwerk, SDK) verweigert AAL2 statt offen zu scheitern.
    iamLogger.error('requireVerifiedAal2 unerwarteter Fehler - fail-closed verweigert', {
      requestId: req.requestId,
      error: err?.message || String(err),
    });
    return { verified: false, currentLevel: null, reason: 'internal-error' };
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
 *
 * ADR-0064: ein gespeichertes Step-Up-Token allein genügt seit M5A nicht mehr. Die aktuelle
 * Session muss ZUM ZEITPUNKT DIESES REQUESTS AAL2 sein - ein Token kann eine AAL1-Sitzung nicht
 * auf AAL2 anheben, und ein Token aus einer inzwischen auf AAL1 zurückgefallenen Sitzung
 * (Logout/Ablauf/Faktor entfernt) darf nicht mehr akzeptiert werden.
 *
 * M9 (Independent Evidence Review, Finding F2, 2026-08-16): `purpose` ist jetzt ein
 * Pflichtparameter und wird gegen den bei Ausstellung (`server/stepUp.ts`) gespeicherten
 * `purpose`-Wert geprüft. Vorher wurde `purpose` bei Ausstellung gespeichert, aber beim Konsum nie
 * gelesen - ein für einen Zweck ausgestelltes Token (z. B. `version-bump`) hätte innerhalb seines
 * 5-Minuten-Fensters für jeden anderen Step-up-gated Endpunkt wiederverwendet werden können. Jeder
 * Aufrufer muss seinen eigenen, bereits vorhandenen eindeutigen Bezeichner (z. B. den `zone`-String,
 * den er ohnehin schon an `checkAdminAccess` übergibt) als `purpose` reichen.
 */
export async function requireStepUp(req: Request, purpose: string): Promise<boolean> {
  const stepUpHeader = req.headers['x-step-up-token'];
  if (!stepUpHeader || typeof stepUpHeader !== 'string') return false;
  if (!purpose) return false;
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
    // Fail-closed korrekt (return false), aber der Fehler war zuvor unsichtbar - Audit
    // ARCH-AUDIT-0002 (AUD2-F-020).
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
    // Audit ARCH-AUDIT-0002 (AUD2-F-020): audit_logs_iam existiert produktiv (siehe Kopf dieser
    // Datei); ein Insert-Fehler hier verdient Sichtbarkeit statt stillem Verschlucken.
    console.error(`[IAM][ERROR] logIamEvent-Insert fehlgeschlagen (action="${action}"): ${err?.message || err}`);
  }
}
