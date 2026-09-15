import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import {
  PAID_ANALYSIS_CONTRACT_VERSION,
  createPaidAnalysisEntitlementMiddleware,
  evaluatePaidAnalysisAccess,
  mapPaidAnalysisDenyStatus,
  paidAnalysisDecisionBody,
} from '../../server/middleware/paidAnalysisEntitlement';

function fakeRequest(overrides: Record<string, unknown> = {}): Request {
  return {
    headers: {
      'x-subscription-tier': 'Enterprise',
      ...((overrides.headers as Record<string, unknown> | undefined) ?? {}),
    },
    ...overrides,
  } as unknown as Request;
}

describe('FIN-SEC-03 paid analysis entitlement boundary', () => {
  it('allows an authoritative paid Backtest decision', async () => {
    const request = fakeRequest();
    const enforce = vi.fn(async () => ({
      allowed: true,
      remaining: 9999,
      tier: 'Pro' as const,
    }));
    const decision = await evaluatePaidAnalysisAccess(request, 'backtest', enforce);

    expect(decision.allowed).toBe(true);
    expect(decision.status).toBe(200);
    expect(enforce).toHaveBeenCalledWith(request);
    expect(request.headers['x-subscription-tier']).toBe('Enterprise');
    expect(paidAnalysisDecisionBody(decision)).toMatchObject({
      allowed: true,
      feature: 'backtest',
      tier: 'Pro',
      contractVersion: PAID_ANALYSIS_CONTRACT_VERSION,
    });
  });

  it('does not allow a forged browser tier to override an authoritative DENY', async () => {
    const request = fakeRequest();
    const decision = await evaluatePaidAnalysisAccess(request, 'backtest', async () => ({
      allowed: false,
      remaining: 0,
      tier: 'Free',
      reason: 'feature-not-entitled',
    }));

    expect(request.headers['x-subscription-tier']).toBe('Enterprise');
    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe(403);
    expect(decision.quota.tier).toBe('Free');
  });

  it.each([
    ['authentication-required', 401],
    ['feature-not-entitled', 403],
    ['quota-limit-reached', 429],
  ] as const)('maps %s to fail-closed HTTP %s', async (reason, status) => {
    const decision = await evaluatePaidAnalysisAccess(fakeRequest(), 'monte_carlo', async () => ({
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
    const decision = await evaluatePaidAnalysisAccess(fakeRequest(), 'full_ai_analysis', async () => {
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

  it('middleware short-circuits a DENY and never enters protected Backtest execution', async () => {
    const middleware = createPaidAnalysisEntitlementMiddleware('backtest', async () => ({
      allowed: false,
      remaining: 0,
      tier: 'Starter',
      reason: 'feature-not-entitled',
    }));
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const next = vi.fn();

    await middleware(fakeRequest(), { status } as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      allowed: false,
      feature: 'backtest',
      reason: 'feature-not-entitled',
      contractVersion: PAID_ANALYSIS_CONTRACT_VERSION,
    }));
  });

  it('middleware continues only on authoritative ALLOW', async () => {
    const middleware = createPaidAnalysisEntitlementMiddleware('backtest', async () => ({
      allowed: true,
      remaining: 9999,
      tier: 'Enterprise',
    }));
    const next = vi.fn();
    const status = vi.fn();

    await middleware(fakeRequest(), { status } as unknown as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });
});
