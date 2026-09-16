import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const transport = read('src/features/news/authenticatedNewsFetch.ts');
const feed = read('src/features/news/ui/VerifiedNewsFeed.tsx');
const viewer = read('src/features/news/ui/RealtimeAiNewsfeed.tsx');
const authMiddleware = read('src/platform/Security/authMiddleware.ts');
const routeComposition = read('server/routes/registerApplicationRoutes.ts');
const newsRoutes = read('src/features/news/newsRoutes.ts');
const providerMatrix = read('src/platform/MarketData/ProviderMatrix.ts');

describe('AI Newsfeed authenticated REST transport', () => {
  it('binds the browser news transport to the Supabase session bearer token', () => {
    expect(transport).toContain("import { supabase } from '../../supabaseClient'");
    expect(transport).toContain('supabase.auth.getSession()');
    expect(transport).toContain("headers.set('Authorization', `Bearer ${accessToken}`)");
    expect(transport).toContain("throw new Error('NEWS_AUTH_SESSION_REQUIRED')");
  });

  it('does not permit the news bearer token to be forwarded outside the same-origin /api/news surface', () => {
    expect(transport).toContain("const NEWS_API_PREFIX = '/api/news'");
    expect(transport).toContain("throw new Error('NEWS_AUTH_FETCH_PATH_OUTSIDE_ALLOWED_SCOPE')");
  });

  it('uses the authenticated transport for articles, source metadata and asset metadata', () => {
    expect(feed).toContain("fetchAuthenticatedNews(`/api/news?${params.toString()}`");
    expect(viewer).toContain("fetchMetadata('/api/news/assets')");
    expect(viewer).toContain("fetchMetadata('/api/news/sources')");
    expect(viewer).toContain('fetchAuthenticatedNews(url');
    expect(feed).not.toContain("fetch(`/api/news?");
    expect(viewer).not.toContain("fetch('/api/news/");
  });

  it('preserves the server-side entitlement and verified-identity gate', () => {
    expect(authMiddleware).toContain('export async function resolveVerifiedIdentity');
    expect(authMiddleware).toContain('extractBearerToken(req)');
    expect(routeComposition).toContain("app.use('/api/news', realtimeAiNewsfeedEntitlement, newsRouter);");
  });

  it('keeps every currently authorized news REST provider and does not restore retired NewsAPI', () => {
    expect(newsRoutes).toContain('FreeCryptoNewsEvidenceProvider');
    expect(newsRoutes).toContain('GdeltNewsEvidenceProvider');
    expect(providerMatrix).toContain("id: 'free-crypto-news'");
    expect(providerMatrix).toContain("id: 'gdelt'");
    expect(providerMatrix).not.toContain("id: 'newsapi'");
  });
});
