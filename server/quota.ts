// ADR-0017 / ADR-0034 — server-side entitlement and quota enforcement.
//
// Subscription limits are defined once in src/config/subscriptionEntitlements.ts.
// Persistent quota consumption uses public.consume_user_quota() when the production
// migration is available; otherwise the server falls back to the existing in-memory
// limiter so a missing DB function never becomes an entitlement bypass.

import type { Request } from 'express';
import { getServerSupabase, isSupabaseConfigured, getSubscription } from './db';
import { resolveVerifiedIdentity } from '../src/platform/Security/authMiddleware';
import { checkRateLimit, getClientIp } from '../src/platform/Security/rateLimiter';
import {
  getWindowedFeatureLimit,
  normalizeSubscriptionTier,
  type SubscriptionTier,
  type WindowedLimit,
} from '../src/config/subscriptionEntitlements';

export const STARTER_DAILY_LIMIT = 5;
export const FREE_SCREENING_LIMIT = 3;
export const FREE_SCREENING_WINDOW_DAYS = 5;
export const BUFFETT_LIMITED_WINDOW_DAYS = 3;

export interface QuotaResult {
  allowed: boolean;
  remaining: number;
  tier: SubscriptionTier;
  reason?: 'quota-limit-reached' | 'authentication-required' | 'feature-not-entitled';
  nextEligibleAt?: string;
  windowDays?: number;
}

export function isUnlimitedTier(tier: string): boolean {
  return getWindowedFeatureLimit(tier, 'verified_screening') === 'unlimited';
}

// Retained for backwards-compatible test/import surfaces. New quota decisions use rolling
// windows from the entitlement contract instead of resetting at UTC midnight.
export function isNewUtcDay(windowStart: string): boolean {
  const start = new Date(windowStart);
  const now = new Date();
  return (
    start.getUTCFullYear() !== now.getUTCFullYear() ||
    start.getUTCMonth() !== now.getUTCMonth() ||
    start.getUTCDate() !== now.getUTCDate()
  );
}

export function hasWindowElapsed(windowStart: string, windowDays: number, nowMs = Date.now()): boolean {
  const startMs = Date.parse(windowStart);
  if (!Number.isFinite(startMs)) return true;
  return startMs + windowDays * 24 * 60 * 60 * 1000 <= nowMs;
}

function nextEligibleIso(windowStart: string, windowDays: number): string | undefined {
  const startMs = Date.parse(windowStart);
  if (!Number.isFinite(startMs)) return undefined;
  return new Date(startMs + windowDays * 24 * 60 * 60 * 1000).toISOString();
}

async function consumeWindowedQuota(input: {
  req: Request;
  quotaKind: 'screening' | 'buffett_value_check';
  limit: WindowedLimit;
  tier: SubscriptionTier;
  identityKey: string;
  email?: string;
}): Promise<QuotaResult> {
  const windowMs = input.limit.windowDays * 24 * 60 * 60 * 1000;

  if (input.email && isSupabaseConfigured()) {
    try {
      const supabase = getServerSupabase();
      const { data, error } = await supabase.rpc('consume_user_quota', {
        p_email: input.email.toLowerCase().trim(),
        p_quota_kind: input.quotaKind,
        p_limit: input.limit.limit,
        p_window_seconds: Math.round(windowMs / 1000),
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (row && typeof row.allowed === 'boolean') {
        return {
          allowed: row.allowed,
          remaining: Number(row.remaining ?? 0),
          tier: input.tier,
          reason: row.allowed ? undefined : 'quota-limit-reached',
          nextEligibleAt: typeof row.next_eligible_at === 'string' ? row.next_eligible_at : undefined,
          windowDays: input.limit.windowDays,
        };
      }
    } catch (err: any) {
      // Controlled fallback while the repository migration is awaiting production handoff,
      // or during a transient database failure. Crucially this does not fail open.
      console.warn(`[Quota] Persistent ${input.quotaKind} quota unavailable; using in-memory enforcement:`, err?.message || err);
    }
  }

  const allowed = checkRateLimit(
    `entitlement:${input.quotaKind}:${input.identityKey}`,
    input.limit.limit,
    windowMs,
  );
  return {
    allowed,
    remaining: allowed ? Math.max(input.limit.limit - 1, 0) : 0,
    tier: input.tier,
    reason: allowed ? undefined : 'quota-limit-reached',
    windowDays: input.limit.windowDays,
  };
}

export async function enforceScreeningQuota(req: Request): Promise<QuotaResult> {
  const identity = await resolveVerifiedIdentity(req);

  if (!identity || !identity.email) {
    const tier: SubscriptionTier = 'Free';
    const limit = getWindowedFeatureLimit(tier, 'verified_screening');
    if (limit === 'unlimited' || limit === 'none' || limit === 'preview_only') {
      return { allowed: false, remaining: 0, tier, reason: 'feature-not-entitled' };
    }
    return consumeWindowedQuota({
      req,
      quotaKind: 'screening',
      limit,
      tier,
      identityKey: `guest:${getClientIp(req as any)}`,
    });
  }

  const tier = normalizeSubscriptionTier(await getSubscription(identity.userId));
  const limit = getWindowedFeatureLimit(tier, 'verified_screening');
  if (limit === 'unlimited') return { allowed: true, remaining: 9999, tier };
  if (limit === 'none' || limit === 'preview_only') {
    return { allowed: false, remaining: 0, tier, reason: 'feature-not-entitled' };
  }

  return consumeWindowedQuota({
    req,
    quotaKind: 'screening',
    limit,
    tier,
    identityKey: `user:${identity.userId}`,
    email: identity.email,
  });
}

export async function enforceBuffettValueCheckQuota(req: Request): Promise<QuotaResult> {
  const identity = await resolveVerifiedIdentity(req);
  if (!identity || !identity.email) {
    return {
      allowed: false,
      remaining: 0,
      tier: 'Free',
      reason: 'authentication-required',
    };
  }

  const tier = normalizeSubscriptionTier(await getSubscription(identity.userId));
  const limit = getWindowedFeatureLimit(tier, 'buffett_value_check');
  if (limit === 'unlimited') return { allowed: true, remaining: 9999, tier };
  if (limit === 'none' || limit === 'preview_only') {
    return { allowed: false, remaining: 0, tier, reason: 'feature-not-entitled' };
  }

  return consumeWindowedQuota({
    req,
    quotaKind: 'buffett_value_check',
    limit,
    tier,
    identityKey: `user:${identity.userId}`,
    email: identity.email,
  });
}

export function evaluateStoredQuotaWindow(input: {
  count: number;
  windowStart: string;
  limit: WindowedLimit;
  nowMs?: number;
}): { allowed: boolean; remaining: number; nextEligibleAt?: string } {
  if (hasWindowElapsed(input.windowStart, input.limit.windowDays, input.nowMs)) {
    return { allowed: true, remaining: Math.max(input.limit.limit - 1, 0) };
  }
  if (input.count >= input.limit.limit) {
    return {
      allowed: false,
      remaining: 0,
      nextEligibleAt: nextEligibleIso(input.windowStart, input.limit.windowDays),
    };
  }
  return { allowed: true, remaining: Math.max(input.limit.limit - input.count - 1, 0) };
}
