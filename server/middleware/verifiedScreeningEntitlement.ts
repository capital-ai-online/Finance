import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { enforceScreeningQuota, type QuotaResult } from '../quota';

export const VERIFIED_SCREENING_CONTRACT_VERSION = 'subscription-entitlements/1.0.0';
export const VERIFIED_SCREENING_FEATURE = 'verified_screening' as const;

export type VerifiedScreeningDenyReason = NonNullable<QuotaResult['reason']> | 'entitlement-authority-unavailable';

export interface VerifiedScreeningAccessDecision {
  readonly allowed: boolean;
  readonly status: 200 | 401 | 403 | 429 | 503;
  readonly quota: QuotaResult;
}

export type ScreeningQuotaEnforcer = (req: Request) => Promise<QuotaResult>;

/**
 * Productive canonical verified-score / context / batch HTTP paths.
 * Case-insensitive matching follows the productive Express Router defaults.
 * Legacy `/api/crypto-scoring/:symbol` stays on its existing inline
 * `enforceScreeningQuota()` call so quota is not consumed twice.
 */
export const VERIFIED_SCREENING_PATH_PATTERNS: readonly RegExp[] = Object.freeze([
  /^\/api\/registry\/assets\/verified-scores\/?$/i,
  /^\/api\/registry\/assets\/[^/]+\/verified-context\/?$/i,
  /^\/api\/registry\/assets\/[^/]+\/verified-score\/?$/i,
  /^\/api\/raw-materials\/verified-score\/[^/]+\/?$/i,
  /^\/api\/crypto\/list\/?$/i,
  /^\/api\/crypto\/score\/?$/i,
  /^\/api\/crypto\/top10\/?$/i,
]);

export function requestPath(req: Request): string {
  const raw = typeof req.originalUrl === 'string' && req.originalUrl
    ? req.originalUrl
    : (typeof req.url === 'string' ? req.url : '');
  return raw.split('?')[0];
}

export function isVerifiedScreeningPath(pathname: string): boolean {
  return VERIFIED_SCREENING_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function mapVerifiedScreeningDenyStatus(reason?: QuotaResult['reason']): 401 | 403 | 429 {
  if (reason === 'authentication-required') return 401;
  if (reason === 'feature-not-entitled') return 403;
  return 429;
}

/**
 * ADR-0034 / FIN-SEC-02 decision surface. Reuses the accepted screening quota authority.
 * Browser/local subscription-tier projections are ignored; only server identity + quota count.
 */
export async function evaluateVerifiedScreeningAccess(
  req: Request,
  enforce: ScreeningQuotaEnforcer = enforceScreeningQuota,
): Promise<VerifiedScreeningAccessDecision> {
  try {
    const quota = await enforce(req);
    if (quota.allowed) {
      return { allowed: true, status: 200, quota };
    }
    return {
      allowed: false,
      status: mapVerifiedScreeningDenyStatus(quota.reason),
      quota,
    };
  } catch (error: any) {
    console.warn(
      '[VerifiedScreeningEntitlement] Authoritative quota lookup unavailable; denying request:',
      error?.message || error,
    );
    return {
      allowed: false,
      status: 503,
      quota: {
        allowed: false,
        remaining: 0,
        tier: 'Free',
        reason: 'feature-not-entitled',
      },
    };
  }
}

export function createVerifiedScreeningEntitlementMiddleware(
  enforce: ScreeningQuotaEnforcer = enforceScreeningQuota,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const decision = await evaluateVerifiedScreeningAccess(req, enforce);
    if (decision.allowed) {
      return next();
    }

    return res.status(decision.status).json({
      allowed: false,
      reason: decision.quota.reason ?? 'entitlement-authority-unavailable',
      tier: decision.quota.tier,
      remaining: decision.quota.remaining,
      nextEligibleAt: decision.quota.nextEligibleAt,
      windowDays: decision.quota.windowDays,
      feature: VERIFIED_SCREENING_FEATURE,
      contractVersion: VERIFIED_SCREENING_CONTRACT_VERSION,
    });
  };
}

export function createVerifiedScreeningPathGate(
  enforce: ScreeningQuotaEnforcer = enforceScreeningQuota,
): RequestHandler {
  const inner = createVerifiedScreeningEntitlementMiddleware(enforce);
  return (req, res, next) => {
    if (!isVerifiedScreeningPath(requestPath(req))) {
      return next();
    }
    return inner(req, res, next);
  };
}

export const verifiedScreeningEntitlement = createVerifiedScreeningEntitlementMiddleware();
export const verifiedScreeningPathGate = createVerifiedScreeningPathGate();
