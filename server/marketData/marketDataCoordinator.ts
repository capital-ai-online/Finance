export type MarketDataAsset = Record<string, any> & {
  symbol: string;
  type: string;
  dataSource?: 'live' | 'fallback';
};

export interface MarketDataProviderStage {
  name: string;
  load: () => Promise<MarketDataAsset[]>;
}

export interface MarketDataRefreshDependencies {
  providerStages: MarketDataProviderStage[];
  appendMissingFallbackAssets: (assets: MarketDataAsset[]) => Promise<MarketDataAsset[]> | MarketDataAsset[];
  enrichAssets: (assets: MarketDataAsset[]) => Promise<MarketDataAsset[]>;
  persistSnapshots?: (assets: MarketDataAsset[]) => Promise<void> | void;
  onProviderFailure?: (stage: string, error: unknown) => void;
}

/**
 * Canonical orchestration boundary for one market-data refresh cycle.
 *
 * Provider-specific fetching, scoring and persistence remain injected dependencies.
 * This keeps fail-open provider behavior explicit while preventing the refresh loop
 * from owning Binance/Kraken/Coinbase/Stooq/FMP implementation details.
 */
export async function refreshMarketData(
  dependencies: MarketDataRefreshDependencies,
): Promise<MarketDataAsset[]> {
  const collected: MarketDataAsset[] = [];

  for (const stage of dependencies.providerStages) {
    try {
      const assets = await stage.load();
      collected.push(...assets);
    } catch (error) {
      dependencies.onProviderFailure?.(stage.name, error);
    }
  }

  const withFallbacks = await dependencies.appendMissingFallbackAssets(collected);
  const enriched = await dependencies.enrichAssets(withFallbacks);

  if (dependencies.persistSnapshots) {
    // Snapshot persistence is deliberately best-effort. A persistence failure must
    // never invalidate an otherwise valid live market-data refresh response.
    Promise.resolve(dependencies.persistSnapshots(enriched)).catch(error => {
      dependencies.onProviderFailure?.('snapshot-persistence', error);
    });
  }

  return enriched;
}
