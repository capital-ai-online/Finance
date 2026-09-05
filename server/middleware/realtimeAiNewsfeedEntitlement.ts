import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { getSubscription } from '../db';
import { canUseFeature, normalizeSubscriptionTier, type SubscriptionTier } from '../../src/config/subscriptionEntitlements';
import { resolveVerifiedIdentity } from '../../src/platform/Security/authMiddleware';

export const REALTIME_AI_NEWSFEED_CONTRACT_VERSION = 'subscription-entitlements/1.0.0';

export type RealtimeAiNewsfeedDenyReason =
  | 'authentication-required'
  | 'feature-not-entitled'
  | 'entitlement-authority-unavailable';

export interface RealtimeAiNewsfeedAccessDecision {
  readonly allowed: boolean;
  readonly status: 200 | 401 | 403 | 503;
  readonly tier?: SubscriptionTier;
  readonly reason?: RealtimeAiNewsfeedDenyReason;
}

export interface RealtimeAiNewsfeedEntitlementDependencies {
  readonly resolveIdentity: typeof resolveVerifiedIdentity;
  readonly getSubscriptionTier: typeof getSubscription;
}

const defaultDependencies: RealtimeAiNewsfeedEntitlementDependencies = {
  resolveIdentity: resolveVerifiedIdentity,
  getSubscriptionTier: getSubscription,
};

/**
 * ADR-0034 / subscription-entitlements/1.0.0 authorization decision for the productive
 * realtime AI newsfeed. Identity and subscription state are resolved server-side only;
 * browser/client tier projections are intentionally ignored.
 */
export async function evaluateRealtimeAiNewsfeedAccess(
  req: Request,
  dependencies: RealtimeAiNewsfeedEntitlementDependencies = defaultDependencies,
): Promise<RealtimeAiNewsfeedAccessDecision> {
  try {
    const identity = await dependencies.resolveIdentity(req);
    if (!identity) {
      return {
        allowed: false,
        status: 401,
        reason: 'authentication-required',
      };
    }

    const tier = normalizeSubscriptionTier(await dependencies.getSubscriptionTier(identity.userId));
    if (!canUseFeature('registered', tier, 'realtime_ai_newsfeed')) {
      return {
        allowed: false,
        status: 403,
        tier,
        reason: 'feature-not-entitled',
      };
    }

    return { allowed: true, status: 200, tier };
  } catch (error: any) {
    console.warn(
      '[NewsfeedEntitlement] Authoritative identity/subscription lookup unavailable; denying request:',
      error?.message || error,
    );
    return {
      allowed: false,
      status: 503,
      reason: 'entitlement-authority-unavailable',
    };
  }
}

export function createRealtimeAiNewsfeedEntitlementMiddleware(
  dependencies: RealtimeAiNewsfeedEntitlementDependencies = defaultDependencies,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const decision = await evaluateRealtimeAiNewsfeedAccess(req, dependencies);
    if (decision.allowed) {
      return next();
    }

    return res.status(decision.status).json({
      allowed: false,
      reason: decision.reason,
      tier: decision.tier,
      feature: 'realtime_ai_newsfeed',
      contractVersion: REALTIME_AI_NEWSFEED_CONTRACT_VERSION,
    });
  };
}

/**
 * Mounted at /api/news before newsRouter, so every current and future productive /api/news*
 * subpath passes the same entitlement gate before provider/evidence handlers execute.
 */
export const realtimeAiNewsfeedEntitlement = createRealtimeAiNewsfeedEntitlementMiddleware();
