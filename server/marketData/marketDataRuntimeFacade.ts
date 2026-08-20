import type { MarketDataAsset } from './marketDataCoordinator';

export interface MarketDataRuntimeFacadeOptions {
  refresh: () => Promise<MarketDataAsset[]>;
  syncAsset: (asset: MarketDataAsset) => void;
  ttlMs?: number;
  backgroundRefreshIntervalMs?: number;
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
  const backgroundRefreshIntervalMs = Math.max(0, options.backgroundRefreshIntervalMs ?? 0);
  const now = options.now ?? Date.now;

  let cached: MarketDataAsset[] | null = null;
  let lastRefreshAt = 0;
  let lastBackgroundRefreshStartedAt: number | null = null;
  let activeRefresh: Promise<MarketDataAsset[]> | null = null;
  let scheduledBackgroundRefresh: Promise<MarketDataAsset[] | null> | null = null;

  const syncAll = (assets: MarketDataAsset[]) => {
    for (const asset of assets) options.syncAsset(asset);
  };

  const refreshAndSync = (): Promise<MarketDataAsset[]> => {
    if (activeRefresh) return activeRefresh;

    // Coalesce the complete refresh transaction, not only provider I/O. Cache mutation and
    // registry synchronization must therefore execute exactly once for all concurrent callers.
    const transaction = (async (): Promise<MarketDataAsset[]> => {
      const assets = await options.refresh();
      cached = assets;
      lastRefreshAt = now();
      syncAll(assets);
      return assets;
    })();

    activeRefresh = transaction;

    void transaction.finally(() => {
      if (activeRefresh === transaction) activeRefresh = null;
    }).catch(() => {
      // The original transaction remains the error source consumed by get/backgroundRefresh.
    });

    return transaction;
  };

  const runBackgroundRefresh = async (): Promise<MarketDataAsset[] | null> => {
    lastBackgroundRefreshStartedAt = now();
    try {
      return await refreshAndSync();
    } catch (error) {
      options.onRefreshFailure?.(error);
      return null;
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

  const backgroundRefresh = (): Promise<MarketDataAsset[] | null> => {
    if (backgroundRefreshIntervalMs === 0 || lastBackgroundRefreshStartedAt === null) {
      return runBackgroundRefresh();
    }

    const remainingMs = backgroundRefreshIntervalMs - (now() - lastBackgroundRefreshStartedAt);
    if (remainingMs <= 0) return runBackgroundRefresh();
    if (scheduledBackgroundRefresh) return scheduledBackgroundRefresh;

    scheduledBackgroundRefresh = new Promise((resolve) => {
      const timer = setTimeout(async () => {
        try {
          resolve(await runBackgroundRefresh());
        } finally {
          scheduledBackgroundRefresh = null;
        }
      }, remainingMs);
      if (typeof (timer as any).unref === 'function') (timer as any).unref();
    });

    return scheduledBackgroundRefresh;
  };

  const getCached = () => cached;

  return {
    get,
    backgroundRefresh,
    getCached,
  };
}
