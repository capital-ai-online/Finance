import { readFileSync } from 'node:fs';
import type { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';
import {
  REALTIME_AI_NEWSFEED_CONTRACT_VERSION,
  evaluateRealtimeAiNewsfeedAccess,
  type RealtimeAiNewsfeedEntitlementDependencies,
} from '../../server/middleware/realtimeAiNewsfeedEntitlement';

function request(input: {
  authorization?: string;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
} = {}): Request {
  return {
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

describe('realtime_ai_newsfeed entitlement boundary', () => {
  it('denies when no bearer resolves to a verified principal', async () => {
    const decision = await evaluateRealtimeAiNewsfeedAccess(request(), dependencies({ identity: null }));

    expect(decision).toEqual({
      allowed: false,
      status: 401,
      reason: 'authentication-required',
    });
  });

  it('denies an invalid bearer that does not resolve to a verified principal', async () => {
    const decision = await evaluateRealtimeAiNewsfeedAccess(
      request({ authorization: 'Bearer invalid-token' }),
      dependencies({ identity: null }),
    );

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe(401);
    expect(decision.reason).toBe('authentication-required');
  });

  it.each(['Free', 'Starter'])('denies %s from the canonical subscription contract', async tier => {
    const decision = await evaluateRealtimeAiNewsfeedAccess(
      request({ authorization: 'Bearer verified-token' }),
      dependencies({ identity: { userId: 'user-1', email: 'user@example.com' }, tier }),
    );

    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe(403);
    expect(decision.tier).toBe(tier);
    expect(decision.reason).toBe('feature-not-entitled');
  });

  it.each(['Pro', 'Enterprise'])('allows %s from the canonical subscription contract', async tier => {
    const decision = await evaluateRealtimeAiNewsfeedAccess(
      request({ authorization: 'Bearer verified-token' }),
      dependencies({ identity: { userId: 'user-1', email: 'user@example.com' }, tier }),
    );

    expect(decision).toEqual({ allowed: true, status: 200, tier });
  });

  it('ignores forged client subscriptionTier values and keeps authoritative Starter denied', async () => {
    const deps = dependencies({
      identity: { userId: 'user-1', email: 'user@example.com' },
      tier: 'Starter',
    });
    const req = request({
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

  it('fails closed when authoritative subscription state cannot be resolved', async () => {
    const decision = await evaluateRealtimeAiNewsfeedAccess(
      request({ authorization: 'Bearer verified-token' }),
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

  it('binds the gate to ADR-0034 subscription-entitlements/1.0.0', () => {
    expect(REALTIME_AI_NEWSFEED_CONTRACT_VERSION).toBe('subscription-entitlements/1.0.0');
  });

  it('mounts one gate before the news router so every productive /api/news* subpath is protected', () => {
    const registration = readFileSync('server/routes/registerApplicationRoutes.ts', 'utf8');
    const newsRoutes = readFileSync('src/features/news/newsRoutes.ts', 'utf8');

    expect(registration).toContain("app.use('/api/news', realtimeAiNewsfeedEntitlement, newsRouter);");
    expect(newsRoutes).toContain("newsRouter.get('/', async (req, res) => {");
    expect(newsRoutes).toContain("newsRouter.get('/sources', async (_req, res) => {");
    expect(newsRoutes).toContain("newsRouter.get('/assets', (_req, res) => {");
  });

  it('authorizes before news provider I/O by gating at the parent router mount', () => {
    const registration = readFileSync('server/routes/registerApplicationRoutes.ts', 'utf8');
    const newsRoutes = readFileSync('src/features/news/newsRoutes.ts', 'utf8');

    const mount = registration.indexOf("app.use('/api/news', realtimeAiNewsfeedEntitlement, newsRouter);");
    expect(mount).toBeGreaterThan(-1);
    expect(newsRoutes).toContain('new GdeltNewsEvidenceProvider()');
    expect(newsRoutes).toContain('new FreeCryptoNewsEvidenceProvider()');
    expect(readFileSync('server/middleware/realtimeAiNewsfeedEntitlement.ts', 'utf8')).not.toContain('EvidenceProvider');
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
