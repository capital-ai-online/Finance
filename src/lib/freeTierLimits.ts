/**
 * Server-side enforcement of the AIFinancial pricing tiers (see Pricing.md).
 *
 * IMPORTANT: This was previously NOT enforced server-side at all — the Free
 * tier's "3 Screenings / 5 Tage" limit only existed in the frontend
 * (localStorage), which any user could bypass by clearing storage or calling
 * the API directly. This module closes that gap.
 *
 * Quota counters are persisted in Supabase (table: user_quota) so they
 * survive restarts and work correctly once the backend is scaled to more
 * than one instance (in-memory counters would NOT survive horizontal
 * scaling on Render).
 */

import { DATA_INTEGRITY_MODE } from './dataIntegrity';

export type SubscriptionTier = 'Free' | 'Starter' | 'Pro' | 'Enterprise';

export interface TierLimits {
  screeningsPerWindow: number | 'unlimited';
  windowDays: number; // quota reset window, in days
  backtests: 'none' | 'unlimited';
  monteCarloPerDay: number; // 0 = not included
  fullAiAnalysesPerDay: number | 'unlimited';
}

// Mirrors Pricing.md exactly. Do not loosen these without updating Pricing.md.
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = Object.freeze({
  Free: {
    screeningsPerWindow: 3,
    windowDays: 5,
    backtests: 'none',
    monteCarloPerDay: 0,
    fullAiAnalysesPerDay: 0,
  },
  Starter: {
    screeningsPerWindow: 5,
    windowDays: 1,
    backtests: 'unlimited',
    monteCarloPerDay: 0,
    fullAiAnalysesPerDay: 1,
  },
  Pro: {
    screeningsPerWindow: 20,
    windowDays: 1,
    backtests: 'unlimited',
    monteCarloPerDay: 1,
    fullAiAnalysesPerDay: 'unlimited',
  },
  Enterprise: {
    screeningsPerWindow: 'unlimited',
    windowDays: 1,
    backtests: 'unlimited',
    monteCarloPerDay: 999999,
    fullAiAnalysesPerDay: 'unlimited',
  },
});

export interface QuotaCheckResult {
  allowed: boolean;
  tier: SubscriptionTier;
  used: number;
  limit: number | 'unlimited';
  windowDays: number;
  resetAt: string | null;
  dataIntegrityMode: typeof DATA_INTEGRITY_MODE;
}

/**
 * Checks and (if allowed) increments a quota counter for a given user +
 * quota kind ('screening' | 'monte_carlo' | 'full_ai_analysis') using
 * Supabase as the shared, scaling-safe store.
 *
 * Expects a `user_quota` table:
 *   email           text primary key + quota_kind (composite key recommended)
 *   quota_kind      text
 *   window_start    timestamptz
 *   count           integer
 *
 * See sql/001_user_quota.sql for the migration.
 */
export async function checkAndConsumeQuota(
  supabase: any,
  email: string,
  tier: SubscriptionTier,
  quotaKind: 'screening' | 'monte_carlo' | 'full_ai_analysis'
): Promise<QuotaCheckResult> {
  const limits = TIER_LIMITS[tier];

  let limit: number | 'unlimited';
  let windowDays: number;

  if (quotaKind === 'screening') {
    limit = limits.screeningsPerWindow;
    windowDays = limits.windowDays;
  } else if (quotaKind === 'monte_carlo') {
    limit = limits.monteCarloPerDay;
    windowDays = 1;
  } else {
    limit = limits.fullAiAnalysesPerDay;
    windowDays = 1;
  }

  if (limit === 'unlimited') {
    return {
      allowed: true,
      tier,
      used: 0,
      limit: 'unlimited',
      windowDays,
      resetAt: null,
      dataIntegrityMode: DATA_INTEGRITY_MODE,
    };
  }

  const now = new Date();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  const { data: existing, error: fetchErr } = await supabase
    .from('user_quota')
    .select('*')
    .eq('email', email)
    .eq('quota_kind', quotaKind)
    .maybeSingle();

  if (fetchErr) {
    // Fail closed on screenings (paid-tier protection), fail open is NOT
    // acceptable here since it would let quota enforcement be bypassed by
    // simply breaking the DB connection.
    throw new Error(`Quota lookup failed: ${fetchErr.message}`);
  }

  let windowStart = existing ? new Date(existing.window_start) : now;
  let count = existing ? existing.count : 0;

  const windowExpired = now.getTime() - windowStart.getTime() >= windowMs;
  if (!existing || windowExpired) {
    windowStart = now;
    count = 0;
  }

  const resetAt = new Date(windowStart.getTime() + windowMs).toISOString();

  if (count >= (limit as number)) {
    return {
      allowed: false,
      tier,
      used: count,
      limit,
      windowDays,
      resetAt,
      dataIntegrityMode: DATA_INTEGRITY_MODE,
    };
  }

  const newCount = count + 1;
  const { error: upsertErr } = await supabase
    .from('user_quota')
    .upsert(
      {
        email,
        quota_kind: quotaKind,
        window_start: windowStart.toISOString(),
        count: newCount,
      },
      { onConflict: 'email,quota_kind' }
    );

  if (upsertErr) {
    throw new Error(`Quota update failed: ${upsertErr.message}`);
  }

  return {
    allowed: true,
    tier,
    used: newCount,
    limit,
    windowDays,
    resetAt,
    dataIntegrityMode: DATA_INTEGRITY_MODE,
  };
}
