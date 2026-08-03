import express from 'express';
import { orchestrator } from '../../lib/requestOrchestrator';
import { assetRegistry } from '../../lib/assetRegistry';
import {
  fetchLiveMarketData,
  getMarketDataCache,
  setMarketDataCache,
  setActiveMarketDataPromise,
} from '../services/marketData.service';

export const marketDataRouter = express.Router();

marketDataRouter.get('/api/market-data', orchestrator.wrap('market-data', async (_req, res) => {
  const cache = getMarketDataCache();
  if (cache.data && Date.now() - cache.lastFetch < cache.ttl) {
    return res.json(cache.data);
  }

  if (cache.activePromise) {
    const data = await cache.activePromise;
    return res.json(data);
  }

  const promise = fetchLiveMarketData();
  setActiveMarketDataPromise(promise);

  try {
    const data = await promise;
    setMarketDataCache(data);
    assetRegistry.syncAssets(data);
    return res.json(data);
  } finally {
    setActiveMarketDataPromise(null);
  }
}));
