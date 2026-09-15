import type { NextFunction, Request, RequestHandler, Response } from 'express';
import {
  enforceBacktestEntitlement,
  enforceFullAiAnalysisQuota,
  enforceMonteCarloQuota,
  type QuotaResult,
} from '../quota';

export const PAID_ANALYSIS_CONTRACT_VERSION = 'subscription-entitlements/1.0.0';

export type PaidAnalysisFeature = 'backtest' | 'monte_carlo' | 'full_ai_analysis';
export type PaidAnalysisDenyReason =
  | NonNullable<QuotaResult['reason']>
  | 'entitlement-authority-unavailable';

export interface PaidAnalysisAccessDecision {
  readonly allowed: boolean;
  readonly status: 200 | 401 | 403 | 429 | 503;
  readonly feature: PaidAnalysisFeature;
  readonly quota: QuotaResult;
  readonly reason?: PaidAnalysisDenyReason;
}

export type PaidAnalysisQuotaEnforcer = (req: Request) => Promise<QuotaResult>;

const defaultEnforcers: Readonly<Record<PaidAnalysisFeature, PaidAnalysisQuotaEnforcer>> = Object.freeze({
  backtest: enforceBacktestEntitlement,
  monte_carlo: enforceMonteCarloQuota,
  full_ai_analysis: enforceFullAiAnalysisQuota,
});

export function mapPaidAnalysisDenyStatus(reason?: QuotaResult['reason']): 401 | 403 | 429 {
  if (reason === 'authentication-required') return 401;
  if (reason === 'feature-not-entitled') return 403;
  return 429;
}

/**
 * ADR-0034 / FIN-SEC-03 authorization decision for paid financial-domain analysis.
 * Browser-visible tier state is deliberately ignored: the default enforcers resolve a
 * verified principal and persisted subscription state on the server and apply the
 * canonical quota contract before protected execution can continue.
 */
export async function evaluatePaidAnalysisAccess(
  req: Request,
  feature: PaidAnalysisFeature,
  enforce: PaidAnalysisQuotaEnforcer = defaultEnforcers[feature],
): Promise<PaidAnalysisAccessDecision> {
  try {
    const quota = await enforce(req);
    if (quota.allowed) {
      return {
        allowed: true,
        status: 200,
        feature,
        quota,
      };
    }

    return {
      allowed: false,
      status: mapPaidAnalysisDenyStatus(quota.reason),
      feature,
      quota,
      reason: quota.reason ?? 'feature-not-entitled',
    };
  } catch (error: any) {
    console.warn(
      `[PaidAnalysisEntitlement] ${feature} authority unavailable; denying request:`,
      error?.message || error,
    );
    return {
      allowed: false,
      status: 503,
      feature,
      reason: 'entitlement-authority-unavailable',
      quota: {
        allowed: false,
        remaining: 0,
        tier: 'Free',
        reason: 'feature-not-entitled',
      },
    };
  }
}

export function paidAnalysisDecisionBody(decision: PaidAnalysisAccessDecision) {
  return {
    allowed: decision.allowed,
    reason: decision.reason,
    tier: decision.quota.tier,
    remaining: decision.quota.remaining,
    nextEligibleAt: decision.quota.nextEligibleAt,
    windowDays: decision.quota.windowDays,
    feature: decision.feature,
    contractVersion: PAID_ANALYSIS_CONTRACT_VERSION,
  };
}

export function createPaidAnalysisEntitlementMiddleware(
  feature: PaidAnalysisFeature,
  enforce: PaidAnalysisQuotaEnforcer = defaultEnforcers[feature],
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const decision = await evaluatePaidAnalysisAccess(req, feature, enforce);
    if (decision.allowed) {
      return next();
    }

    return res.status(decision.status).json(paidAnalysisDecisionBody(decision));
  };
}

export const backtestEntitlement = createPaidAnalysisEntitlementMiddleware('backtest');
