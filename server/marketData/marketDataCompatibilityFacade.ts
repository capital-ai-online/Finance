import type { MarketDataAsset, MarketDataProviderStage } from './marketDataCoordinator';
import { refreshMarketData } from './marketDataCoordinator';
import { createMarketDataProviderStages } from './createMarketDataProviderStages';
import type { StooqFallbackAsset } from './stooqProviderStage';

export interface MarketDataCompatibilityFacadeOptions {
  // Provider stages require concrete fallback market values. Keep this contract explicit
  // instead of widening to MarketDataAsset[], where price/change24h may be absent.
  fallbackAssets: StooqFallbackAsset[];
  stockTickers: string[];
  forexTickers: string[];
  commodityTickers: string[];
  registryAssets: () => MarketDataAsset[];
  enrichAsset: (asset: MarketDataAsset) => Promise<MarketDataAsset>;
  persistSnapshots?: (assets: MarketDataAsset[]) => Promise<void> | void;
  evaluateAlerts?: (assets: MarketDataAsset[]) => Promise<void> | void;
  onProviderFailure?: (stage: string, error: unknown) => void;
  providerStages?: MarketDataProviderStage[];
}

function fallbackCompatibilityMetadata(asset: MarketDataAsset): MarketDataAsset {
  const {
    score: _score,
    scoreEligible: _scoreEligible,
    scoringEligible: _scoringEligible,
    executionEligible: _executionEligible,
    executionPriceEligible: _executionPriceEligible,
    ...metadata
  } = asset;
  return {
    ...metadata,
    status: 'Fallback',
    dataSource: 'fallback' as const,
  };
}

function appendMissingFallbackAssets(
  collected: MarketDataAsset[],
  registryAssets: MarketDataAsset[],
): MarketDataAsset[] {
  const existingSymbols = new Set(collected.map(asset => asset.symbol.toUpperCase()));
  const missing = registryAssets
    .filter(asset => !existingSymbols.has(asset.symbol.toUpperCase()))
    .map(fallbackCompatibilityMetadata);

  return [...collected, ...missing];
}

/**
 * Compatibility facade for the legacy `/api/market-data` call sites.
 *
 * Periodic refresh is deliberately restricted to evidence enrichment of assets that were actually
 * observed by a provider in the current refresh (`dataSource=live`). Catalog/bootstrap fallback
 * rows remain compatibility metadata and MUST NOT trigger downstream history/fundamental/scoring
 * provider calls. Fallback rows also have score/execution-eligibility fields stripped so catalog
 * bootstrap values cannot be mistaken for current scoring or execution authority. New and
 * long-tail assets use their per-symbol verified contracts instead (ADR-0032 revalidation /
 * SC-MD-SPT-0001).
 */
export async function runMarketDataCompatibilityRefresh(
  options: MarketDataCompatibilityFacadeOptions,
): Promise<MarketDataAsset[]> {
  const providerStages = options.providerStages ?? createMarketDataProviderStages({
    fallbackAssets: options.fallbackAssets,
    stockTickers: options.stockTickers,
    forexTickers: options.forexTickers,
    commodityTickers: options.commodityTickers,
  });

  return refreshMarketData({
    providerStages,
    appendMissingFallbackAssets: assets => appendMissingFallbackAssets(assets, options.registryAssets()),
    enrichAssets: assets => Promise.all(assets.map(asset =>
      asset.dataSource === 'live' ? options.enrichAsset(asset) : Promise.resolve(asset)
    )),
    persistSnapshots: async assets => {
      // Only provider-observed rows may participate in periodic snapshots/alerts. Compatibility
      // fallback rows can carry historical bootstrap values and therefore are not evidence.
      const liveAssets = assets.filter(asset => asset.dataSource === 'live');
      const tasks: Promise<unknown>[] = [];
      if (options.persistSnapshots && liveAssets.length > 0) tasks.push(Promise.resolve(options.persistSnapshots(liveAssets)));
      if (options.evaluateAlerts && liveAssets.length > 0) tasks.push(Promise.resolve(options.evaluateAlerts(liveAssets)));
      await Promise.allSettled(tasks);
    },
    onProviderFailure: options.onProviderFailure,
  });
}
