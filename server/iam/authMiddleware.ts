// ADR-0003.5 / ADR-0008 — zentrale IAM-Autorisierung.
//
// WICHTIG (Übergangsphase): Solange die Supabase-Migration aus
// supabase/migrations/<timestamp>_iam.sql in Produktion noch NICHT ausgeführt wurde
// (profiles.role, audit_logs_iam, iam_access_log existieren noch nicht), fällt diese
// Middleware kontrolliert auf die alte ADMIN_EMAILS-Liste zurück, damit zwischen
// Code-Deployment (Prompt 1) und Migrationsausführung (Prompt 2) keine Admin-/
// Owner-Funktionalität ausfällt.
//
// ENTFERNEN in Prompt 3: sobald docs/adr/IAM_IMPLEMENTATION_LOG.md die erfolgreiche
// Migration bestätigt, müssen LEGACY_ADMIN_EMAILS und der gesamte Fallback-Zweig
// entfernt werden. Bis dahin gilt jeder Fallback-Zugriff als NICHT vollständig
// ADR-konform und wird deshalb mit einem expliziten Warn-Log markiert.

import type { Request } from 'express';
import { getServerSupabase, isSupabaseConfigured } from '../db';
import type { Role } from './types';
import { ADMIN_ZONE_ROLES } from './types';

// TEMPORÄR — nur bis Migration produktiv verifiziert ist (siehe Hinweis oben).
const LEGACY_ADMIN_EMAILS = ['sven.kulessa@gmail.com', 'sven.kulessa@gmx.net'];

export interface AuthzResult {
  authorized: boolean;
  role: Role | 'legacy-admin' | null;
  reason: 'iam-role' | 'insufficient-role' | 'legacy-fallback' | 'no-valid-credentials';
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
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profileErr || !profile) {
      // profiles.role existiert evtl. noch nicht (Migration ausstehend) -> kontrolliert null zurückgeben
      return { role: null, userId: userData.user.id };
    }
    return { role: (profile.role as Role) || 'user', userId: userData.user.id };
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
      token_id: tokenRef ? `tok_${tokenRef.slice(0, 10)}` : 'legacy-email',
    });
  } catch {
    // iam_access_log existiert evtl. noch nicht (Migration ausstehend) -> Request nicht blockieren
  }
}

function extractLegacyEmail(req: Request): string {
  return String(req.query.email || req.body?.email || '').toLowerCase().trim();
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
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (token) {
    const { role, userId } = await resolveRoleFromToken(token);
    if (role && allowedRoles.includes(role)) {
      await logAccess(role, zone, 'GRANTED', token);
      return { authorized: true, role, reason: 'iam-role', userId, actorLabel: userId || role };
    }
    if (role) {
      await logAccess(role, zone, 'DENIED', token);
      return { authorized: false, role, reason: 'insufficient-role', actorLabel: userId || role };
    }
    // role konnte nicht ermittelt werden (keine Session ODER Migration noch nicht ausgeführt)
    // -> kontrollierter Fallback unten, kein sofortiger Abbruch
  }

  const legacyEmail = extractLegacyEmail(req);
  if (legacyEmail && LEGACY_ADMIN_EMAILS.includes(legacyEmail)) {
    console.warn(
      `[IAM][LEGACY FALLBACK AKTIV] Zone "${zone}" — Supabase-Rollenprüfung nicht verfügbar (Migration ausstehend?), ` +
      `ADMIN_EMAILS-Fallback genutzt für ${legacyEmail}. Fallback nach Migrationsabschluss in Prompt 3 entfernen (ADR-0003.5).`
    );
    await logAccess('legacy-admin', zone, 'GRANTED');
    return { authorized: true, role: 'legacy-admin', reason: 'legacy-fallback', actorLabel: legacyEmail };
  }

  await logAccess('unknown', zone, 'DENIED', token || undefined);
  return { authorized: false, role: null, reason: 'no-valid-credentials', actorLabel: legacyEmail || 'unknown' };
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
