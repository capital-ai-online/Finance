import type { MarketDataAsset } from './marketDataCoordinator';

export interface MarketDataRuntimeFacadeOptions {
  refresh: () => Promise<MarketDataAsset[]>;
  syncAsset: (asset: MarketDataAsset) => void;
  ttlMs?: number;
  now?: () => number;
  onRefreshFailure?: (error: unknown) => void;
}

/**
 * Owns only the runtime cache/coalescing and registry-sync mechanics that previously
 * surrounded `fetchLiveMarketData()` inside server.application.ts.
 *
 * Provider I/O, fallback completion, scoring/enrichment and persistence remain behind
 * the injected refresh callback (the ADR-0014 compatibility facade).
 */
export function createMarketDataRuntimeFacade(options: MarketDataRuntimeFacadeOptions) {
  const ttlMs = options.ttlMs ?? 60_000;
  const now = options.now ?? Date.now;

  let cached: MarketDataAsset[] | null = null;
  let lastRefreshAt = 0;
  let activeRefresh: Promise<MarketDataAsset[]> | null = null;

  const syncAll = (assets: MarketDataAsset[]) => {
    for (const asset of assets) options.syncAsset(asset);
  };

  const refreshAndSync = async (): Promise<MarketDataAsset[]> => {
    if (!activeRefresh) {
      activeRefresh = options.refresh();
    }

    try {
      const assets = await activeRefresh;
      cached = assets;
      lastRefreshAt = now();
      syncAll(assets);
      return assets;
    } finally {
      activeRefresh = null;
    }
  };

  const get = async (): Promise<MarketDataAsset[]> => {
    if (cached && now() - lastRefreshAt < ttlMs) return cached;

    try {
      return await refreshAndSync();
    } catch (error) {
      options.onRefreshFailure?.(error);
      if (cached) return cached;
      throw error;
    }
  };

  const backgroundRefresh = async (): Promise<MarketDataAsset[] | null> => {
    try {
      return await refreshAndSync();
    } catch (error) {
      options.onRefreshFailure?.(error);
      return null;
    }
  };

  const getCached = () => cached;

  return {
    get,
    backgroundRefresh,
    getCached,
  };
}
