import { readFileSync } from 'node:fs';
import type { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';
import {
  REALTIME_AI_NEWSFEED_CONTRACT_VERSION,
  REALTIME_AI_NEWSFEED_VISIBILITY_VERSION,
  evaluateRealtimeAiNewsfeedAccess,
  type RealtimeAiNewsfeedEntitlementDependencies,
} from '../../server/middleware/realtimeAiNewsfeedEntitlement';

function request(input: {
  authorization?: string;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  method?: string;
} = {}): Request {
  return {
    method: input.method ?? 'GET',
    headers: input.authorization ? { authorization: input.authorization } : {},
    body: input.body ?? {},
    query: input.query ?? {},
  } as unknown as Request;
}

function dependencies(input: {
  identity?: { userId: string; email: string | null } | null;
  tier?: string;
  subscriptionError?: Error;
}): RealtimeAiNewsfeedEntitlementDependencies {
  return {
    resolveIdentity: vi.fn(async () => input.identity ?? null),
    getSubscriptionTier: vi.fn(async () => {
      if (input.subscriptionError) throw input.subscriptionError;
      return input.tier ?? 'Free';
    }),
  };
}

describe('realtime_ai_newsfeed visibility and execution boundary', () => {
  it('allows anonymous read-only GET access in temporary public-visibility mode', async () => {
    const deps = dependencies({ identity: null });
    const decision = await evaluateRealtimeAiNewsfeedAccess(request({ method: 'GET' }), deps);

    expect(decision).toEqual({ allowed: true, status: 200 });
    expect(deps.resolveIdentity).not.toHaveBeenCalled();
    expect(deps.getSubscriptionTier).not.toHaveBeenCalled();
  });

  it('keeps non-GET access behind verified identity', async () => {
    const decision = await evaluateRealtimeAiNewsfeedAccess(
      request({ method: 'POST' }),
      dependencies({ identity: null }),
    );

    expect(decision).toEqual({
      allowed: false,
      status: 401,
      reason: 'authentication-required',
    });
  });

  it.each(['Free', 'Starter'])('keeps protected non-GET %s denied by the canonical subscription contract', async tier => {
    const decision = await evaluateRealtimeAiNewsfeedAccess(
      request({ method: 'POST', authorization: 'Bearer verified-token' }),
      dependencies({ identity: { userId: 'user-1', email: 'user@example.com' }, tier }),
    );

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe(403);
    expect(decision.tier).toBe(tier);
    expect(decision.reason).toBe('feature-not-entitled');
  });

  it.each(['Pro', 'Enterprise'])('keeps protected non-GET %s allowed by the canonical subscription contract', async tier => {
    const decision = await evaluateRealtimeAiNewsfeedAccess(
      request({ method: 'POST', authorization: 'Bearer verified-token' }),
      dependencies({ identity: { userId: 'user-1', email: 'user@example.com' }, tier }),
    );

    expect(decision).toEqual({ allowed: true, status: 200, tier });
  });

  it('ignores forged client tiers on the protected non-GET path', async () => {
    const deps = dependencies({
      identity: { userId: 'user-1', email: 'user@example.com' },
      tier: 'Starter',
    });
    const req = request({
      method: 'POST',
      authorization: 'Bearer verified-token',
      body: { subscriptionTier: 'Enterprise', tier: 'Enterprise' },
      query: { subscriptionTier: 'Pro', tier: 'Pro' },
    });

    const decision = await evaluateRealtimeAiNewsfeedAccess(req, deps);

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe(403);
    expect(decision.tier).toBe('Starter');
    expect(deps.getSubscriptionTier).toHaveBeenCalledWith('user-1');
  });

  it('fails closed on the protected non-GET path when subscription authority is unavailable', async () => {
    const decision = await evaluateRealtimeAiNewsfeedAccess(
      request({ method: 'POST', authorization: 'Bearer verified-token' }),
      dependencies({
        identity: { userId: 'user-1', email: 'user@example.com' },
        subscriptionError: new Error('subscription lookup failed'),
      }),
    );

    expect(decision).toEqual({
      allowed: false,
      status: 503,
      reason: 'entitlement-authority-unavailable',
    });
  });

  it('keeps the execution contract while adding a separate read-only visibility contract', () => {
    expect(REALTIME_AI_NEWSFEED_CONTRACT_VERSION).toBe('subscription-entitlements/1.0.0');
    expect(REALTIME_AI_NEWSFEED_VISIBILITY_VERSION).toBe('public-readonly-news/1.0.0');
  });

  it('mounts one boundary before the GET-only news router', () => {
    const registration = readFileSync('server/routes/registerApplicationRoutes.ts', 'utf8');
    const newsRoutes = readFileSync('src/features/news/newsRoutes.ts', 'utf8');

    expect(registration).toContain("app.use('/api/news', realtimeAiNewsfeedEntitlement, newsRouter);");
    expect(newsRoutes).toContain("newsRouter.get('/', async (req, res) => {");
    expect(newsRoutes).toContain("newsRouter.get('/sources', async (_req, res) => {");
    expect(newsRoutes).toContain("newsRouter.get('/assets', (_req, res) => {");
  });

  it('does not alter provider/evidence/freshness semantics or add scoring authority', () => {
    const newsRoutes = readFileSync('src/features/news/newsRoutes.ts', 'utf8');

    expect(newsRoutes).toContain("if (result.status !== 'VERIFIED') return Object.freeze([]);");
    expect(newsRoutes).toContain("res.setHeader('x-capital-ai-news-cache', 'stale');");
    expect(newsRoutes).toContain('display?.change24hPct');
    expect(newsRoutes).not.toContain('dispatchCanonicalScore');
    expect(newsRoutes).not.toContain('calculateRankScore');
    expect(newsRoutes).not.toContain('eligible_for_top10');
  });
});
