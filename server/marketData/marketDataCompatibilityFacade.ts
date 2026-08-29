import type { MarketDataAsset, MarketDataProviderStage } from './marketDataCoordinator';
import { refreshMarketData } from './marketDataCoordinator';
import { createMarketDataProviderStages } from './createMarketDataProviderStages';
import type { StooqFallbackAsset } from './stooqProviderStage';

const DEFAULT_ENRICHMENT_CONCURRENCY = 4;
const MAX_ENRICHMENT_CONCURRENCY = 8;

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
  enrichmentConcurrency?: number;
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

function normalizeConcurrency(value: number | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_ENRICHMENT_CONCURRENCY;
  return Math.max(1, Math.min(MAX_ENRICHMENT_CONCURRENCY, Math.floor(value as number)));
}

function yieldToEventLoop(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

async function mapWithBoundedConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);

  const worker = async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;

      results[index] = await mapper(items[index], index);
      // Provider callbacks may resolve many promises in the same turn. Yielding here prevents
      // continuation bursts from starving unrelated HTTP/static-file requests on the single
      // Render Node process.
      await yieldToEventLoop();
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

/**
 * Compatibility facade for the legacy `/api/market-data` call sites.
 *
 * Periodic refresh is deliberately restricted to evidence enrichment of assets that were actually
 * observed by a provider in the current refresh (`dataSource=live`). Catalog/bootstrap fallback
 * rows remain compatibility metadata and MUST NOT trigger downstream history/fundamental/scoring
 * provider calls. This prevents the full AssetRegistry from turning every 60s/periodic market-data
 * refresh into a global evidence crawl. New and long-tail assets use their per-symbol verified
 * contracts instead (ADR-0032 revalidation / SC-MD-SPT-0001).
 *
 * PERFORMANCE-2026-08-29: live Evidence enrichment is intentionally bounded. The previous
 * unbounded Promise.all fan-out could hit the same upstream provider concurrently for every live
 * asset, amplify HTTP 429 responses and schedule a large continuation burst on the single Node
 * event loop. The bounded worker pool preserves input order and canonical scoring semantics while
 * reducing both upstream pressure and request starvation risk.
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
  const enrichmentConcurrency = normalizeConcurrency(options.enrichmentConcurrency);

  return refreshMarketData({
    providerStages,
    appendMissingFallbackAssets: assets => appendMissingFallbackAssets(assets, options.registryAssets()),
    enrichAssets: assets => mapWithBoundedConcurrency(
      assets,
      enrichmentConcurrency,
      async asset => asset.dataSource === 'live' ? options.enrichAsset(asset) : asset,
    ),
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