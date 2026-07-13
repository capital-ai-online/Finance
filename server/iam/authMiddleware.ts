// ADR-0003.5 / ADR-0008 — zentrale IAM-Autorisierung.
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

export interface AuthzResult {
  authorized: boolean;
  role: Role | null;
  reason: 'iam-role' | 'insufficient-role' | 'no-valid-credentials' | 'supabase-not-configured';
  userId?: string;
  /** Für Logging/Anzeige-Zwecke, NICHT für Autorisierungsentscheidungen verwenden. */
  actorLabel: string;
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

async function logAccess(role: string, zone: string, outcome: 'GRANTED' | 'DENIED', tokenRef?: string) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getServerSupabase();
    await supabase.from('iam_access_log').insert({
      role,
      zone,
      outcome,
      token_id: tokenRef ? `tok_${tokenRef.slice(0, 10)}` : 'no-token',
    });
  } catch {
    // iam_access_log existiert evtl. noch nicht (Migration ausstehend) -> Request nicht blockieren
  }
}

/**
 * Zentrale Autorisierungsprüfung für Systemadmin-/Master-Supervisor-Endpunkte.
 * Ersetzt die bisher pro Datei duplizierte ADMIN_EMAILS-Prüfung.
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
  if (!isSupabaseConfigured()) {
    // Fail closed: ohne Supabase kann keine Rolle verifiziert werden. Kein Fallback.
    console.error(`[IAM][BLOCKED] Zone "${zone}" — Supabase nicht konfiguriert, Zugriff verweigert (fail-closed).`);
    return { authorized: false, role: null, reason: 'supabase-not-configured', actorLabel: 'unknown' };
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    await logAccess('unknown', zone, 'DENIED');
    return { authorized: false, role: null, reason: 'no-valid-credentials', actorLabel: 'unknown' };
  }

  const { role, userId } = await resolveRoleFromToken(token);

  if (role && allowedRoles.includes(role)) {
    await logAccess(role, zone, 'GRANTED', token);
    return { authorized: true, role, reason: 'iam-role', userId, actorLabel: userId || role };
  }
  if (role) {
    await logAccess(role, zone, 'DENIED', token);
    return { authorized: false, role, reason: 'insufficient-role', actorLabel: userId || role };
  }

  await logAccess('unknown', zone, 'DENIED', token);
  return { authorized: false, role: null, reason: 'no-valid-credentials', actorLabel: 'unknown' };
}

/**
 * Prüft einen kurzlebigen Step-up-Claim für kritische Owner-Aktionen
 * (Rollenverwaltung, Break-Glass, Stufe-6-Freigabe).
 *
 * HINWEIS: Ausstellungs-Endpunkt für Step-up-Tokens ist Teil von Prompt 2
 * (Produktions-Migration + Supabase-Anbindung) und noch zu ergänzen.
 * Bis dahin liefert diese Funktion `false`, sodass step-up-pflichtige Aktionen
 * serverseitig blockiert bleiben, statt fälschlich durchzulaufen.
 */
export async function requireStepUp(req: Request): Promise<boolean> {
  const stepUpHeader = req.headers['x-step-up-token'];
  if (!stepUpHeader || typeof stepUpHeader !== 'string') return false;
  return false; // TODO(Prompt 2): echte Verifikation (Ablauf max. 2-5 Min) implementieren
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
