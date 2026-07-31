// ADR-0017 — Serverseitige Durchsetzung des Screening-Limits.
//
// Ergaenzt, ersetzt aber nicht, den bestehenden client-seitigen Zaehler in
// src/lib/dailyScreeningTracker.ts, der weiterhin fuer sofortiges UI-Feedback
// zustaendig bleibt (Anzeige "X von 5 Screenings verbleibend" ohne Server-
// Roundtrip). Dieser Zaehler war bislang die EINZIGE Kontrolle - trivial
// per DevTools/curl/Inkognito-Fenster umgehbar (Audit-Befund S-04).
//
// Eingeloggte User werden per E-Mail in public.user_quota gezaehlt
// (persistent, geraeteuebergreifend, Service-Role-only via RLS). Nicht
// eingeloggte Free/Gast-Aufrufe ohne verifizierte Identitaet fallen auf den
// bestehenden In-Memory IP-Rate-Limiter zurueck, weil fuer sie keine stabile
// Identitaet existiert, gegen die serverseitig gezaehlt werden koennte.

import type { Request } from 'express';
import { getServerSupabase, isSupabaseConfigured, getSubscription } from './db';
import { resolveVerifiedIdentity } from './iam/authMiddleware';
import { checkRateLimit, getClientIp } from './iam/rateLimiter';

export const STARTER_DAILY_LIMIT = 5;
const UNLIMITED_TIERS = new Set(['PRO', 'ENTERPRISE', 'ENTERPRISE OS']);

function isUnlimitedTier(tier: string): boolean {
  return UNLIMITED_TIERS.has(tier.trim().toUpperCase());
}

function isNewUtcDay(windowStart: string): boolean {
  const start = new Date(windowStart);
  const now = new Date();
  return (
    start.getUTCFullYear() !== now.getUTCFullYear() ||
    start.getUTCMonth() !== now.getUTCMonth() ||
    start.getUTCDate() !== now.getUTCDate()
  );
}

export interface QuotaResult {
  allowed: boolean;
  remaining: number;
  reason?: string;
}

export async function enforceScreeningQuota(req: Request): Promise<QuotaResult> {
  const identity = await resolveVerifiedIdentity(req);

  // Keine verifizierte Identitaet -> Free/Gast-Aufruf ohne Session.
  // IP-basiertes Fallback-Limit, konsistent mit dem bereits bestehenden
  // In-Memory-Limiter aus server/iam/rateLimiter.ts.
  if (!identity || !identity.email) {
    const ip = getClientIp(req as any);
    const allowed = checkRateLimit(`screening:${ip}`, STARTER_DAILY_LIMIT, 24 * 60 * 60 * 1000);
    return {
      allowed,
      remaining: allowed ? STARTER_DAILY_LIMIT : 0,
      reason: allowed ? undefined : 'daily-limit-reached',
    };
  }

  const tier = await getSubscription(identity.userId);
  if (isUnlimitedTier(tier)) {
    return { allowed: true, remaining: 9999 };
  }

  if (!isSupabaseConfigured()) {
    // Ohne Supabase kann serverseitig nicht persistent gezaehlt werden - die
    // App muss im lokalen Fallback-Modus (siehe db.ts) trotzdem funktionieren.
    // Der client-seitige Tracker bleibt in diesem Fall die einzige Kontrolle.
    return { allowed: true, remaining: STARTER_DAILY_LIMIT };
  }

  const email = identity.email.toLowerCase().trim();
  const supabase = getServerSupabase();

  try {
    const { data: existing } = await supabase
      .from('user_quota')
      .select('window_start, count')
      .eq('email', email)
      .eq('quota_kind', 'screening')
      .maybeSingle();

    if (!existing || isNewUtcDay(existing.window_start)) {
      await supabase.from('user_quota').upsert(
        { email, quota_kind: 'screening', window_start: new Date().toISOString(), count: 1 },
        { onConflict: 'email,quota_kind' }
      );
      return { allowed: true, remaining: STARTER_DAILY_LIMIT - 1 };
    }

    if (existing.count >= STARTER_DAILY_LIMIT) {
      return { allowed: false, remaining: 0, reason: 'daily-limit-reached' };
    }

    await supabase
      .from('user_quota')
      .update({ count: existing.count + 1 })
      .eq('email', email)
      .eq('quota_kind', 'screening');

    return { allowed: true, remaining: STARTER_DAILY_LIMIT - (existing.count + 1) };
  } catch (err: any) {
    // Fail-open: ein Datenbankfehler in einem Rate-Limit-Pfad soll zahlende
    // Kunden nicht aussperren. Anders als bei checkAdminAccess() (fail-closed,
    // sicherheitskritisch) ist dies eine Verfuegbarkeits-/Kulanzentscheidung.
    console.warn('[Quota] Fehler bei serverseitiger Quota-Pruefung, fail-open:', err?.message || err);
    return { allowed: true, remaining: STARTER_DAILY_LIMIT };
  }
}
