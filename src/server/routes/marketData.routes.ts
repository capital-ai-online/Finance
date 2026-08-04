import express from 'express';

export interface MarketDataCacheState<T> {
  data: T | null;
  lastFetch: number;
  ttl: number;
  activePromise: Promise<T> | null;
}

export interface MarketDataRouteDependencies<T> {
  getCache(): MarketDataCacheState<T>;
  fetchLiveMarketData(): Promise<T>;
  setActivePromise(promise: Promise<T> | null): void;
  setCache(data: T): void;
  syncAssets?(data: T): void | Promise<void>;
}

/**
 * Dependency-injected extraction target for the monolithic `/api/market-data` route.
 *
 * This module deliberately does not import a speculative service or call methods that do not
 * exist on the production RequestOrchestrator/AssetRegistry contracts. A future server-bootstrap
 * cutover must provide the already validated production cache, fetch and synchronization
 * functions explicitly. Until then the active route remains in `server.ts`.
 */
export function createMarketDataRouter<T>(dependencies: MarketDataRouteDependencies<T>): express.Router {
  const router = express.Router();

  router.get('/api/market-data', async (_req, res, next) => {
    try {
      const cache = dependencies.getCache();
      if (cache.data !== null && Date.now() - cache.lastFetch < cache.ttl) {
        return res.json(cache.data);
      }

      if (cache.activePromise) {
        const data = await cache.activePromise;
        return res.json(data);
      }

      const promise = dependencies.fetchLiveMarketData();
      dependencies.setActivePromise(promise);

      try {
        const data = await promise;
        dependencies.setCache(data);
        await dependencies.syncAssets?.(data);
        return res.json(data);
      } finally {
        dependencies.setActivePromise(null);
      }
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
