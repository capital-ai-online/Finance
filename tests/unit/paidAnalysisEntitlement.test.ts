import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import {
  PAID_ANALYSIS_CONTRACT_VERSION,
  evaluatePaidAnalysisAccess,
  mapPaidAnalysisDenyStatus,
  paidAnalysisDecisionBody,
} from '../../server/middleware/paidAnalysisEntitlement';

const request = {} as Request;

describe('FIN-SEC-03 paid analysis entitlement boundary', () => {
  it('allows an authoritative paid Backtest decision', async () => {
    const decision = await evaluatePaidAnalysisAccess(request, 'backtest', async () => ({
      allowed: true,
      remaining: 9999,
      tier: 'Pro',
    }));

    expect(decision.allowed).toBe(true);
    expect(decision.status).toBe(200);
    expect(paidAnalysisDecisionBody(decision)).toMatchObject({
      allowed: true,
      feature: 'backtest',
      tier: 'Pro',
      contractVersion: PAID_ANALYSIS_CONTRACT_VERSION,
    });
  });

  it.each([
    ['authentication-required', 401],
    ['feature-not-entitled', 403],
    ['quota-limit-reached', 429],
  ] as const)('maps %s to fail-closed HTTP %s', async (reason, status) => {
    const decision = await evaluatePaidAnalysisAccess(request, 'monte_carlo', async () => ({
      allowed: false,
      remaining: 0,
      tier: 'Starter',
      reason,
    }));

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe(status);
    expect(decision.reason).toBe(reason);
    expect(mapPaidAnalysisDenyStatus(reason)).toBe(status);
  });

  it('fails closed when the entitlement authority throws', async () => {
    const decision = await evaluatePaidAnalysisAccess(request, 'full_ai_analysis', async () => {
      throw new Error('subscription authority unavailable');
    });

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe(503);
    expect(decision.reason).toBe('entitlement-authority-unavailable');
    expect(paidAnalysisDecisionBody(decision)).toMatchObject({
      allowed: false,
      feature: 'full_ai_analysis',
      reason: 'entitlement-authority-unavailable',
      contractVersion: 'subscription-entitlements/1.0.0',
    });
  });
});
