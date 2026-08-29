import { performance } from 'node:perf_hooks';
import type { MarketDataAsset } from './marketDataCoordinator';

export type MarketDataRefreshKind = 'foreground' | 'background';

export interface MarketDataRefreshTiming {
  kind: MarketDataRefreshKind;
  durationMs: number;
  assetCount: number;
  outcome: 'success' | 'failure';
}

export interface MarketDataRuntimeFacadeOptions {
  refresh: () => Promise<MarketDataAsset[]>;
  syncAsset: (asset: MarketDataAsset) => void;
  ttlMs?: number;
  backgroundRefreshIntervalMs?: number;
  now?: () => number;
  cooperativeYield?: () => Promise<void>;
  onRefreshFailure?: (error: unknown) => void;
  onRefreshTiming?: (timing: MarketDataRefreshTiming) => void;
}

function yieldToEventLoop(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

/**
 * Owns only the runtime cache/coalescing and registry-sync mechanics that previously
 * surrounded `fetchLiveMarketData()` inside server.application.ts.
 *
 * Provider I/O, fallback completion, scoring/enrichment and persistence remain behind
 * the injected refresh callback (the ADR-0014 compatibility facade).
 *
 * PERFORMANCE-2026-08-29: cache synchronization yields cooperatively and every actual refresh
 * reports stage timing. This keeps long background refreshes observable without moving provider
 * semantics or cache authority into the HTTP layer.
 */
export function createMarketDataRuntimeFacade(options: MarketDataRuntimeFacadeOptions) {
  const ttlMs = options.ttlMs ?? 60_000;
  const backgroundRefreshIntervalMs = Math.max(0, options.backgroundRefreshIntervalMs ?? 0);
  const now = options.now ?? Date.now;
  // Production keeps a real macrotask boundary so pending HTTP/static work can progress.
  // Tests that virtualize timers may inject a deterministic yield without weakening runtime behavior.
  const cooperativeYield = options.cooperativeYield ?? yieldToEventLoop;

  let cached: MarketDataAsset[] | null = null;
  let lastRefreshAt = 0;
  let lastProviderRefreshStartedAt: number | null = null;
  let activeRefresh: Promise<MarketDataAsset[]> | null = null;
  let scheduledBackgroundRefresh: Promise<MarketDataAsset[] | null> | null = null;

  const syncAll = async (assets: MarketDataAsset[]) => {
    for (let index = 0; index < assets.length; index += 1) {
      options.syncAsset(assets[index]);
      if ((index + 1) % 25 === 0) await cooperativeYield();
    }
  };

  const refreshAndSync = (kind: MarketDataRefreshKind): Promise<MarketDataAsset[]> => {
    if (activeRefresh) return activeRefresh;

    lastProviderRefreshStartedAt = now();
    const startedAt = performance.now();

    const transaction = (async (): Promise<MarketDataAsset[]> => {
      try {
        // Background work deliberately gives already-ready HTTP/static work one turn before
        // provider/scoring fan-out begins on the single Render Node process.
        if (kind === 'background') await cooperativeYield();

        const assets = await options.refresh();
        cached = assets;
        lastRefreshAt = now();
        await syncAll(assets);
        options.onRefreshTiming?.({
          kind,
          durationMs: performance.now() - startedAt,
          assetCount: assets.length,
          outcome: 'success',
        });
        return assets;
      } catch (error) {
        options.onRefreshTiming?.({
          kind,
          durationMs: performance.now() - startedAt,
          assetCount: 0,
          outcome: 'failure',
        });
        throw error;
      }
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
    try {
      return await refreshAndSync('background');
    } catch (error) {
      options.onRefreshFailure?.(error);
      return null;
    }
  };

  const get = async (): Promise<MarketDataAsset[]> => {
    if (cached && now() - lastRefreshAt < ttlMs) return cached;

    try {
      return await refreshAndSync('foreground');
    } catch (error) {
      options.onRefreshFailure?.(error);
      if (cached) return cached;
      throw error;
    }
  };

  const backgroundRefresh = (): Promise<MarketDataAsset[] | null> => {
    if (backgroundRefreshIntervalMs === 0 || lastProviderRefreshStartedAt === null) {
      return runBackgroundRefresh();
    }

    const remainingMs = backgroundRefreshIntervalMs - (now() - lastProviderRefreshStartedAt);
    if (remainingMs <= 0) return runBackgroundRefresh();
    if (scheduledBackgroundRefresh) return scheduledBackgroundRefresh;

    scheduledBackgroundRefresh = new Promise((resolve) => {
      const timer = setTimeout(() => {
        scheduledBackgroundRefresh = null;
        void backgroundRefresh().then(resolve);
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
