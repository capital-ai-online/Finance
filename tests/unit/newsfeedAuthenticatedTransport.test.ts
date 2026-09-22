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

describe('AI Newsfeed backend-session REST transport', () => {
  it('binds browser news transport to the shared backend auth transport', () => {
    expect(transport).toContain("import { authFetch } from '../../lib/authFetch'");
    expect(transport).toContain('return authFetch(path, init)');
    expect(transport).not.toContain('supabase');
    expect(transport).not.toContain('Authorization');
  });

  it('does not permit authenticated transport outside /api/news', () => {
    expect(transport).toContain("const NEWS_API_PREFIX = '/api/news'");
    expect(transport).toContain("throw new Error('NEWS_AUTH_FETCH_PATH_OUTSIDE_ALLOWED_SCOPE')");
  });

  it('uses the authenticated transport for articles and metadata', () => {
    expect(feed).toContain('fetchAuthenticatedNews');
    expect(viewer).toContain('fetchAuthenticatedNews');
  });

  it('preserves server-side entitlement and verified-identity gating', () => {
    expect(authMiddleware).toContain('export async function resolveVerifiedIdentity');
    expect(authMiddleware).toContain('resolveVerifiedBackendAuth');
    expect(routeComposition).toContain("app.use('/api/news', realtimeAiNewsfeedEntitlement, newsRouter);");
  });

  it('keeps authorized news providers and retired NewsAPI state', () => {
    expect(newsRoutes).toContain('FreeCryptoNewsEvidenceProvider');
    expect(newsRoutes).toContain('GdeltNewsEvidenceProvider');
    expect(providerMatrix).not.toContain("id: 'newsapi'");
  });
});
