import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sentiment = readFileSync(
  'src/features/public/ui/runtime/MarketSentimentPresentation.tsx',
  'utf8',
);
const newsTransport = readFileSync('src/features/news/authenticatedNewsFetch.ts', 'utf8');
const routeComposition = readFileSync('server/routes/registerApplicationRoutes.ts', 'utf8');

describe('Market sentiment evidence wiring', () => {
  it('reuses the governed authenticated news evidence boundary', () => {
    expect(sentiment).toContain("fetchAuthenticatedNews('/api/news?limit=20'");
    expect(sentiment).toContain("from '../../../news/authenticatedNewsFetch'");
    expect(newsTransport).toContain("const NEWS_API_PREFIX = '/api/news'");
    expect(routeComposition).toContain("app.use('/api/news', realtimeAiNewsfeedEntitlement, newsRouter);");
  });

  it('keeps heuristic news sentiment presentation-only and numeric scoring fail-closed', () => {
    expect(sentiment).toContain("status: 'NOT_COMPUTABLE'");
    expect(sentiment).toContain('score: null');
    expect(sentiment).toContain('Headline-Sentiment bleibt Heuristik/Präsentationsmetadatum');
    expect(sentiment).toContain("category === 'KRYPTO' ? 'crypto-sentiment-research/0.1.0' : null");
    expect(sentiment).not.toContain('evaluateSentimentResearch(');
    expect(sentiment).not.toContain('CATEGORY_SENTIMENTS');
    expect(sentiment).not.toContain('generate30DaySentimentHistory');
  });

  it('lets an attested upstream projection override evidence-only presentation data', () => {
    expect(sentiment).toContain('() => ({ ...evidenceProjections, ...projections })');
    expect(sentiment).toContain("projection?.modelVersion ?? 'Kein FINTECH-Modell attestiert'");
  });
});
