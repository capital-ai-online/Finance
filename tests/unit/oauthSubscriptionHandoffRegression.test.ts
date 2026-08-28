import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('OAuth subscription handoff regression boundary', () => {
  it('repairs one rotated Supabase session before emitting a global unauthorized event', () => {
    const source = readRepoFile('src/lib/authFetch.ts');

    expect(source).toContain('supabase.auth.getSession()');
    expect(source).toContain('supabase.auth.refreshSession()');
    expect(source).toContain('let refreshInFlight');
    expect(source).toContain('const firstResponse = await sendAuthenticatedRequest');
    expect(source).toContain('const retryResponse = await sendAuthenticatedRequest');

    const first401 = source.indexOf("if (firstResponse.status !== 401)");
    const refresh = source.indexOf('const refreshedToken = await refreshAccessToken()', first401);
    const retry = source.indexOf('const retryResponse = await sendAuthenticatedRequest', refresh);
    const notify = source.indexOf('notifyUnauthorized(url)', retry);

    expect(first401).toBeGreaterThan(-1);
    expect(refresh).toBeGreaterThan(first401);
    expect(retry).toBeGreaterThan(refresh);
    expect(notify).toBeGreaterThan(retry);
  });

  it('does not confuse authenticated authorization refusal with an invalid session', () => {
    const source = readRepoFile('server/orchestrator.ts');

    expect(source).toContain("authz.reason === 'insufficient-role'");
    expect(source).toContain('? 403');
    expect(source).toContain("authz.reason === 'rate-limited'");
    expect(source).toContain('? 429');
  });

  it('keeps subscription entitlement bound to the verified Supabase user id', () => {
    const stripe = readRepoFile('server/stripe.ts');
    const db = readRepoFile('server/db.ts');

    const routeStart = stripe.indexOf("stripeRouter.get('/user-subscription'");
    const routeEnd = stripe.indexOf('// 6. PDF Credits management', routeStart);
    const route = stripe.slice(routeStart, routeEnd);

    expect(routeStart).toBeGreaterThan(-1);
    expect(route).toContain('const identity = await resolveVerifiedIdentity(req)');
    expect(route).toContain('getSubscription(identity.userId)');
    expect(route).not.toContain('req.query.userId');
    expect(route).not.toContain('req.query.email');

    const getSubscriptionStart = db.indexOf('export async function getSubscription');
    const getSubscriptionEnd = db.indexOf('// PDF export credits', getSubscriptionStart);
    const getSubscriptionSource = db.slice(getSubscriptionStart, getSubscriptionEnd);
    expect(getSubscriptionSource).toContain(".eq('user_id', cleanKey)");
    expect(getSubscriptionSource).not.toContain('stripe_customer_id');
  });

  it('represents intentionally unavailable sentiment as capability state, not server failure', () => {
    const source = readRepoFile('server/routes/marketSentimentRoutes.ts');
    const routeStart = source.indexOf("router.get('/market-sentiment'");
    const routeEnd = source.indexOf("router.post('/market-sentiment/simulate-shock'", routeStart);
    const route = source.slice(routeStart, routeEnd);

    expect(route).toContain("status: 'DATA_UNAVAILABLE'");
    expect(route).toContain('available: false');
    expect(route).toContain('return res.status(200).json');
    expect(route).not.toContain('return res.status(503).json');
  });

  it('degrades optional news and source projections without returning 503', () => {
    const source = readRepoFile('src/features/news/newsRoutes.ts');

    const newsStart = source.indexOf("newsRouter.get('/',");
    const sourcesStart = source.indexOf("newsRouter.get('/sources'", newsStart);
    const assetsStart = source.indexOf("newsRouter.get('/assets'", sourcesStart);
    const newsRoute = source.slice(newsStart, sourcesStart);
    const sourcesRoute = source.slice(sourcesStart, assetsStart);

    expect(newsRoute).toContain("x-capital-ai-news-degraded");
    expect(newsRoute).toContain('return res.status(200).json([])');
    expect(newsRoute).not.toContain('res.status(503)');

    expect(sourcesRoute).toContain("cache: 'stale'");
    expect(sourcesRoute).toContain('degraded: true');
    expect(sourcesRoute).toContain('sources: []');
    expect(sourcesRoute).not.toContain('res.status(503)');
  });
});
