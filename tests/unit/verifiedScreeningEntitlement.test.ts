import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { QuotaResult } from '../../server/quota';
import {
  VERIFIED_SCREENING_CONTRACT_VERSION,
  createVerifiedScreeningEntitlementMiddleware,
  evaluateVerifiedScreeningAccess,
  mapVerifiedScreeningDenyStatus,
} from '../../server/middleware/verifiedScreeningEntitlement';

function fakeRequest(overrides: Record<string, unknown> = {}): Request {
  return {
    headers: {
      'x-subscription-tier': 'Enterprise',
      ...((overrides.headers as Record<string, unknown> | undefined) ?? {}),
    },
    socket: { remoteAddress: '203.0.113.10' },
    ...overrides,
  } as unknown as Request;
}

describe('FIN-SEC-02 verified_screening entitlement gate', () => {
  it('maps deny reasons to authoritative HTTP statuses', () => {
    expect(mapVerifiedScreeningDenyStatus('authentication-required')).toBe(401);
    expect(mapVerifiedScreeningDenyStatus('feature-not-entitled')).toBe(403);
    expect(mapVerifiedScreeningDenyStatus('quota-limit-reached')).toBe(429);
    expect(mapVerifiedScreeningDenyStatus(undefined)).toBe(429);
  });

  it('ALLOWs a paid/within-quota principal and ignores browser-tier escalation headers', async () => {
    const quota: QuotaResult = { allowed: true, remaining: 19, tier: 'Pro' };
    const enforce = vi.fn(async () => quota);
    const decision = await evaluateVerifiedScreeningAccess(fakeRequest(), enforce);

    expect(decision.allowed).toBe(true);
    expect(decision.status).toBe(200);
    expect(decision.quota.tier).toBe('Pro');
    expect(enforce).toHaveBeenCalledTimes(1);
    const req = enforce.mock.calls[0][0] as Request;
    expect(req.headers['x-subscription-tier']).toBe('Enterprise');
  });

  it('DENYs quota exhaustion with 429', async () => {
    const enforce = vi.fn(async (): Promise<QuotaResult> => ({
      allowed: false,
      remaining: 0,
      tier: 'Starter',
      reason: 'quota-limit-reached',
      nextEligibleAt: '2026-09-08T00:00:00.000Z',
    }));
    const decision = await evaluateVerifiedScreeningAccess(fakeRequest(), enforce);
    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe(429);
    expect(decision.quota.reason).toBe('quota-limit-reached');
  });

  it('DENYs missing identity when the quota authority requires authentication', async () => {
    const enforce = vi.fn(async (): Promise<QuotaResult> => ({
      allowed: false,
      remaining: 0,
      tier: 'Free',
      reason: 'authentication-required',
    }));
    const decision = await evaluateVerifiedScreeningAccess(fakeRequest(), enforce);
    expect(decision.status).toBe(401);
    expect(decision.quota.reason).toBe('authentication-required');
  });

  it('DENYs stale or non-entitled subscription state', async () => {
    const enforce = vi.fn(async (): Promise<QuotaResult> => ({
      allowed: false,
      remaining: 0,
      tier: 'Free',
      reason: 'feature-not-entitled',
    }));
    const decision = await evaluateVerifiedScreeningAccess(fakeRequest(), enforce);
    expect(decision.status).toBe(403);
  });

  it('fails closed when the quota authority throws', async () => {
    const enforce = vi.fn(async () => {
      throw new Error('subscription-store-unavailable');
    });
    const decision = await evaluateVerifiedScreeningAccess(fakeRequest(), enforce);
    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe(503);
  });

  it('middleware short-circuits DENY without calling next()', async () => {
    const enforce = vi.fn(async (): Promise<QuotaResult> => ({
      allowed: false,
      remaining: 0,
      tier: 'Free',
      reason: 'quota-limit-reached',
    }));
    const middleware = createVerifiedScreeningEntitlementMiddleware(enforce);
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const next = vi.fn();
    const res = { status } as unknown as Response;

    await middleware(fakeRequest(), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      allowed: false,
      reason: 'quota-limit-reached',
      feature: 'verified_screening',
      contractVersion: VERIFIED_SCREENING_CONTRACT_VERSION,
    }));
  });

  it('path gate skips non-screening routes without consuming quota', async () => {
    const { createVerifiedScreeningPathGate } = await import('../../server/middleware/verifiedScreeningEntitlement');
    const enforce = vi.fn(async (): Promise<QuotaResult> => ({
      allowed: true,
      remaining: 3,
      tier: 'Free',
    }));
    const gate = createVerifiedScreeningPathGate(enforce);
    const next = vi.fn();
    await gate(fakeRequest({ originalUrl: '/api/registry/assets/AAPL/verified-quote' }), { status: vi.fn() } as unknown as Response, next);
    expect(enforce).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('path gate consumes the accepted quota authority on a batch screening path', async () => {
    const { createVerifiedScreeningPathGate } = await import('../../server/middleware/verifiedScreeningEntitlement');
    const enforce = vi.fn(async (): Promise<QuotaResult> => ({
      allowed: false,
      remaining: 0,
      tier: 'Free',
      reason: 'quota-limit-reached',
    }));
    const gate = createVerifiedScreeningPathGate(enforce);
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const next = vi.fn();
    await gate(
      fakeRequest({ originalUrl: '/api/registry/assets/verified-scores?symbols=AAPL' }),
      { status } as unknown as Response,
      next,
    );
    expect(enforce).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(429);
  });

  it('middleware continues on ALLOW', async () => {
    const enforce = vi.fn(async (): Promise<QuotaResult> => ({
      allowed: true,
      remaining: 9999,
      tier: 'Enterprise',
    }));
    const middleware = createVerifiedScreeningEntitlementMiddleware(enforce);
    const next = vi.fn();
    const res = { status: vi.fn() } as unknown as Response;

    await middleware(fakeRequest(), res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
