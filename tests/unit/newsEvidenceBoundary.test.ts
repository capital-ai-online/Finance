import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const newsRoutes = readFileSync('src/features/news/newsRoutes.ts', 'utf8');
const realtimeViewer = readFileSync('src/components/RealtimeAiNewsfeed.tsx', 'utf8');
const verifiedViewer = readFileSync('src/components/VerifiedNewsFeed.tsx', 'utf8');
const providerMatrix = readFileSync('src/platform/MarketData/ProviderMatrix.ts', 'utf8');
const secretManifest = readFileSync('scripts/security/secretFileManifest.ts', 'utf8');

describe('SC4 news evidence boundary', () => {
  it('uses the active keyless provider set and contains no NewsAPI provider dependency', () => {
    expect(newsRoutes).toContain('GdeltNewsEvidenceProvider');
    expect(newsRoutes).toContain('FreeCryptoNewsEvidenceProvider');
    expect(newsRoutes).not.toContain('NewsApiEvidenceProvider');
    expect(providerMatrix).toContain("id: 'gdelt'");
    expect(providerMatrix).toContain("id: 'free-crypto-news'");
    expect(providerMatrix).not.toContain("id: 'newsapi'");
    expect(secretManifest).not.toContain("'NEWS_API_KEY'");
  });

  it('keeps the default feed independent from the Enterprise Scorer selection', () => {
    expect(newsRoutes).toContain('The default feed is deliberately asset-independent');
    expect(newsRoutes).toContain('Promise.all(tasks)');
    expect(realtimeViewer).toContain('Standard: gesamtes Enterprise-Universum');
    expect(realtimeViewer).toContain('Die Auswahl im Enterprise Scorer ändert den Newsfeed nicht automatisch.');
    expect(realtimeViewer).not.toContain("const symbol = props.selectedSymbol?.trim().toUpperCase() ?? '';");
  });

  it('exposes explicit asset and source filters without creating a second scoring authority', () => {
    expect(newsRoutes).toContain('req.query.asset ?? req.query.symbol');
    expect(newsRoutes).toContain("newsRouter.get('/assets'");
    expect(newsRoutes).toContain("newsRouter.get('/sources'");
    expect(realtimeViewer).toContain('Newsfeed nach Asset filtern');
    expect(realtimeViewer).toContain('Newsfeed nach Nachrichtenherkunft filtern');
    expect(verifiedViewer).toContain("params.set('asset'");
    expect(verifiedViewer).toContain("provider === 'multi-provider'");
    expect(newsRoutes).toContain("source: 'assetRegistry'");
    expect(newsRoutes).not.toContain('dispatchCanonicalScore');
    expect(newsRoutes).not.toContain('calculateRankScore');
    expect(newsRoutes).not.toContain('eligible_for_top10');
  });

  it('does not fall back to unrelated crypto news for a non-crypto or unknown explicit asset', () => {
    expect(newsRoutes).toContain("if (!symbol || asset?.type === 'crypto')");
    expect(newsRoutes).not.toContain('if (!asset || asset.type');
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
