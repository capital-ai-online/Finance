import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isSupabaseConfigured: vi.fn(() => true),
  getSubscription: vi.fn(),
  getUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('../../server/db', () => ({
  isSupabaseConfigured: mocks.isSupabaseConfigured,
  getSubscription: mocks.getSubscription,
  getServerSupabase: () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
  }),
}));

import {
  enforceBacktestEntitlement,
  enforceFullAiAnalysisQuota,
  enforceMonteCarloQuota,
} from '../../server/quota';
import { evaluatePaidAnalysisAccess } from '../../server/middleware/paidAnalysisEntitlement';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

function request(authorization?: string, forgedClientTier = 'Enterprise'): Request {
  return {
    headers: {
      ...(authorization ? { authorization } : {}),
      'x-subscription-tier': forgedClientTier,
    },
    ip: '127.0.0.1',
  } as unknown as Request;
}

function validIdentity() {
  mocks.getUser.mockResolvedValue({
    data: {
      user: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'security-verification@example.invalid',
      },
    },
    error: null,
  });
}

describe('S1-R2-06 / FIN-SEC-03 independent Security verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSupabaseConfigured.mockReturnValue(true);
    mocks.getSubscription.mockResolvedValue('Pro');
    validIdentity();
    mocks.rpc.mockResolvedValue({
      data: {
        allowed: true,
        remaining: 0,
        next_eligible_at: '2026-09-16T00:00:00.000Z',
      },
      error: null,
    });
  });

  it('denies Backtest when the bearer credential is missing before subscription lookup', async () => {
    const decision = await evaluatePaidAnalysisAccess(
      request(undefined, 'Enterprise'),
      'backtest',
      enforceBacktestEntitlement,
    );

    expect(decision).toMatchObject({
      allowed: false,
      status: 401,
      reason: 'authentication-required',
      feature: 'backtest',
    });
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.getSubscription).not.toHaveBeenCalled();
  });

  it('denies Backtest for a forged bearer that Supabase Auth does not verify', async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'invalid token' } });

    const decision = await evaluatePaidAnalysisAccess(
      request('Bearer forged-token', 'Enterprise'),
      'backtest',
      enforceBacktestEntitlement,
    );

    expect(decision).toMatchObject({
      allowed: false,
      status: 401,
      reason: 'authentication-required',
      feature: 'backtest',
    });
    expect(mocks.getUser).toHaveBeenCalledWith('forged-token');
    expect(mocks.getSubscription).not.toHaveBeenCalled();
  });

  it('uses the server subscription tier for Backtest and ignores a forged browser tier', async () => {
    mocks.getSubscription.mockResolvedValueOnce('Starter');
    const denied = await evaluatePaidAnalysisAccess(
      request('Bearer valid-token', 'Enterprise'),
      'backtest',
      enforceBacktestEntitlement,
    );

    expect(denied).toMatchObject({
      allowed: false,
      status: 403,
      reason: 'feature-not-entitled',
      feature: 'backtest',
    });

    mocks.getSubscription.mockResolvedValueOnce('Pro');
    const allowed = await evaluatePaidAnalysisAccess(
      request('Bearer valid-token', 'Free'),
      'backtest',
      enforceBacktestEntitlement,
    );

    expect(allowed).toMatchObject({
      allowed: true,
      status: 200,
      feature: 'backtest',
      quota: { tier: 'Pro' },
    });
  });

  it('requires the server Monte Carlo quota decision and fails closed after the rolling quota is exhausted', async () => {
    mocks.getSubscription.mockResolvedValue('Pro');

    const allowed = await evaluatePaidAnalysisAccess(
      request('Bearer valid-token', 'Enterprise'),
      'monte_carlo',
      enforceMonteCarloQuota,
    );
    expect(allowed).toMatchObject({
      allowed: true,
      status: 200,
      feature: 'monte_carlo',
      quota: { tier: 'Pro', remaining: 0 },
    });
    expect(mocks.rpc).toHaveBeenCalledWith('consume_user_quota', expect.objectContaining({
      p_quota_kind: 'monte_carlo',
      p_limit: 1,
      p_window_seconds: 86400,
    }));

    mocks.rpc.mockResolvedValueOnce({
      data: {
        allowed: false,
        remaining: 0,
        next_eligible_at: '2026-09-16T00:00:00.000Z',
      },
      error: null,
    });
    const denied = await evaluatePaidAnalysisAccess(
      request('Bearer valid-token', 'Enterprise'),
      'monte_carlo',
      enforceMonteCarloQuota,
    );
    expect(denied).toMatchObject({
      allowed: false,
      status: 429,
      reason: 'quota-limit-reached',
      feature: 'monte_carlo',
    });
  });

  it('fails full_ai_analysis closed when the server entitlement authority is unavailable', async () => {
    mocks.getSubscription.mockRejectedValueOnce(new Error('subscription authority unavailable'));

    const decision = await evaluatePaidAnalysisAccess(
      request('Bearer valid-token', 'Enterprise'),
      'full_ai_analysis',
      enforceFullAiAnalysisQuota,
    );

    expect(decision).toMatchObject({
      allowed: false,
      status: 503,
      reason: 'entitlement-authority-unavailable',
      feature: 'full_ai_analysis',
    });
  });

  it('keeps Backtest, Monte Carlo and full_ai_analysis alternate execution paths behind fail-closed gates', () => {
    const historyRoutes = read('server/routes/historyRoutes.ts');
    const entitlements = read('server/entitlements.ts');
    const monteCarlo = read('src/components/MonteCarloDetailed.tsx');
    const portfolioReview = read('server/routes/portfolioReviewRoutes.ts');
    const serverApplication = read('server.application.ts');

    const backtestGate = historyRoutes.indexOf("router.get('/api/backtest-history', backtestEntitlement");
    const backtestExecution = historyRoutes.indexOf('assetRegistry.getHistory(rawSymbol, limit)');
    expect(backtestGate).toBeGreaterThanOrEqual(0);
    expect(backtestExecution).toBeGreaterThan(backtestGate);

    expect(entitlements).toContain("entitlementsRouter.post('/monte-carlo/authorize'");
    expect(entitlements).toContain("evaluatePaidAnalysisAccess(req, 'monte_carlo')");
    expect(monteCarlo).toContain("authFetch('/api/entitlements/monte-carlo/authorize'");
    expect(monteCarlo).not.toContain('runSimulation(true)');
    expect(monteCarlo).not.toContain('bypassTrigger');

    const providerGuard = portfolioReview.indexOf('if (!anthropic && !openai)');
    const fullAiAccess = portfolioReview.indexOf("evaluatePaidAnalysisAccess(req, 'full_ai_analysis')");
    const fullAiExecutor = portfolioReview.indexOf('generateStructuredWithFallback({');
    expect(providerGuard).toBeGreaterThanOrEqual(0);
    expect(fullAiAccess).toBeGreaterThan(providerGuard);
    expect(fullAiExecutor).toBeGreaterThan(fullAiAccess);
    expect(portfolioReview).toContain("error: 'FULL_AI_ANALYSIS_UNAVAILABLE'");
    expect(portfolioReview).toContain('return res.status(503)');
    expect(portfolioReview).toContain('if (!result)');

    const canonicalMount = serverApplication.indexOf('registerApplicationRoutes(app, { ai, anthropic, openai });');
    const legacyInlinePortfolioReview = serverApplication.indexOf("app.post('/api/portfolio-review'");
    expect(canonicalMount).toBeGreaterThanOrEqual(0);
    expect(legacyInlinePortfolioReview).toBeGreaterThan(canonicalMount);
  });
});
