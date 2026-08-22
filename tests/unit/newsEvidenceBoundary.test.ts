import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const newsRoutes = readFileSync('src/features/news/newsRoutes.ts', 'utf8');
const realtimeViewer = readFileSync('src/components/RealtimeAiNewsfeed.tsx', 'utf8');
const providerMatrix = readFileSync('src/platform/MarketData/ProviderMatrix.ts', 'utf8');
const secretManifest = readFileSync('scripts/security/secretFileManifest.ts', 'utf8');

describe('SC4 news evidence boundary', () => {
  it('uses GDELT and contains no NewsAPI provider dependency', () => {
    expect(newsRoutes).toContain('GdeltNewsEvidenceProvider');
    expect(newsRoutes).not.toContain('NewsApiEvidenceProvider');
    expect(providerMatrix).toContain("id: 'gdelt'");
    expect(providerMatrix).not.toContain("id: 'newsapi'");
    expect(secretManifest).not.toContain("'NEWS_API_KEY'");
  });

  it('does not restore synthetic realtime headlines or synthetic score impacts', () => {
    expect(realtimeViewer).toContain('VerifiedNewsFeed');
    for (const forbidden of [
      'INITIAL_ALERTS',
      'NEW_REALTIME_ALERTS',
      'generateCustomAlertsForAsset',
      'calculateNewsImpactScore',
      'Single-Buy Order im Wert',
      'Fed signalisiert unerwartete Zinspause',
    ]) {
      expect(realtimeViewer).not.toContain(forbidden);
    }
  });

  it('keeps news sentiment presentation-only', () => {
    expect(newsRoutes).toContain("NewsSentimentBasis = 'heuristic'");
    expect(newsRoutes).not.toContain('dispatchCanonicalScore');
    expect(newsRoutes).not.toContain('calculateRankScore');
    expect(newsRoutes).not.toContain('eligible_for_top10');
  });
});
