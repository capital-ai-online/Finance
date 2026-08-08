import type { MarketDataAsset, MarketDataProviderStage } from './marketDataCoordinator';
import { refreshMarketData } from './marketDataCoordinator';
import { createMarketDataProviderStages } from './createMarketDataProviderStages';

export interface MarketDataCompatibilityFacadeOptions {
  fallbackAssets: MarketDataAsset[];
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

function appendMissingFallbackAssets(
  collected: MarketDataAsset[],
  registryAssets: MarketDataAsset[],
): MarketDataAsset[] {
  const existingSymbols = new Set(collected.map(asset => asset.symbol.toUpperCase()));
  const missing = registryAssets
    .filter(asset => !existingSymbols.has(asset.symbol.toUpperCase()))
    .map(asset => ({
      ...asset,
      status: 'Fallback',
      dataSource: 'fallback' as const,
    }));

  return [...collected, ...missing];
}

/**
 * Compatibility facade for the legacy `fetchLiveMarketData()` call sites.
 *
 * This module is deliberately responsible only for composition. Provider-specific I/O,
 * scoring/enrichment and persistence remain injected or delegated to the canonical
 * market-data modules. This keeps the eventual `server.application.ts` cutover small while
 * preserving the existing fail-open and No-Demo-Data semantics.
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
    enrichAssets: assets => Promise.all(assets.map(options.enrichAsset)),
    persistSnapshots: async assets => {
      // Both side effects are best-effort at the coordinator boundary. A failure here must
      // not invalidate otherwise usable market data returned to the caller.
      const tasks: Promise<unknown>[] = [];
      if (options.persistSnapshots) tasks.push(Promise.resolve(options.persistSnapshots(assets)));
      if (options.evaluateAlerts) tasks.push(Promise.resolve(options.evaluateAlerts(assets)));
      await Promise.allSettled(tasks);
    },
    onProviderFailure: options.onProviderFailure,
  });
}
