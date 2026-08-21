import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  runRefresh: vi.fn(async (_options: any) => []),
  createRuntime: vi.fn((options: any) => ({
    get: () => options.refresh(),
    backgroundRefresh: () => options.refresh(),
    getCached: () => null,
  })),
  canonicalEnrich: vi.fn(async (asset: any) => ({
    ...asset,
    score: asset.type === 'crypto' ? 8.6 : 86,
    scoreBasis: 'canonical-dispatcher',
  })),
}));

vi.mock('../../server/marketData/marketDataCompatibilityFacade', () => ({
  runMarketDataCompatibilityRefresh: mocks.runRefresh,
}));

vi.mock('../../server/marketData/marketDataRuntimeFacade', () => ({
  createMarketDataRuntimeFacade: mocks.createRuntime,
}));

vi.mock('../../server/marketData/canonicalCryptoScoreEnrichment', () => ({
  isCanonicalScorableMarketDataAsset: (asset: any) => ['crypto', 'stock', 'forex', 'commodity', 'index', 'bond'].includes(asset?.type),
  enrichAssetWithCanonicalScore: mocks.canonicalEnrich,
}));

import {
  APPLICATION_BACKGROUND_REFRESH_INTERVAL_MS,
  createApplicationMarketDataRuntime,
} from '../../server/marketData/createApplicationMarketDataRuntime';

describe('application market-data runtime wiring', () => {
  it('routes scoring through the canonical dispatcher and follow-up work through the execution boundary', async () => {
    const fallbackAssets = [
      { symbol: 'BTC', type: 'crypto', price: 1, change24h: 0 },
      { symbol: 'AAPL', type: 'stock', price: 100, change24h: 1 },
    ];
    const registryAssets = vi.fn(() => fallbackAssets);
    const enrichAsset = vi.fn(async (asset: any) => ({ ...asset, enrichedBy: 'legacy' }));
    const syncAsset = vi.fn();
    const persistSnapshots = vi.fn();
    const evaluateAlerts = vi.fn();
    const onProviderFailure = vi.fn();
    const onRefreshFailure = vi.fn();

    const runtime = createApplicationMarketDataRuntime({
      fallbackAssets,
      registryAssets,
      enrichAsset,
      syncAsset,
      persistSnapshots,
      evaluateAlerts,
      onProviderFailure,
      onRefreshFailure,
      ttlMs: 60_000,
    });

    await runtime.get();

    expect(APPLICATION_BACKGROUND_REFRESH_INTERVAL_MS).toBe(90_000);
    expect(mocks.createRuntime).toHaveBeenCalledWith(expect.objectContaining({
      syncAsset,
      onRefreshFailure,
      ttlMs: 60_000,
      backgroundRefreshIntervalMs: 90_000,
      refresh: expect.any(Function),
    }));
    expect(mocks.runRefresh).toHaveBeenCalledWith(expect.objectContaining({
      fallbackAssets,
      stockTickers: ['AAPL.US', 'MSFT.US', 'GOOGL.US', 'AMZN.US', 'NVDA.US', 'TSLA.US', 'META.US', 'NFLX.US', 'AMD.US', 'INTC.US'],
      forexTickers: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'AUDUSD'],
      commodityTickers: ['XAUUSD', 'XAGUSD', 'CL.F', 'NG.F', 'CO.F'],
      registryAssets,
      enrichAsset: expect.any(Function),
      persistSnapshots: expect.any(Function),
      evaluateAlerts: expect.any(Function),
      onProviderFailure,
    }));

    const refreshOptions = mocks.runRefresh.mock.calls[0]?.[0] as any;
    const btc = { symbol: 'BTC', type: 'crypto', price: 1, change24h: 0 };
    const stock = { symbol: 'AAPL', type: 'stock', price: 100, change24h: 1 };
    const macro = { symbol: 'VIX', type: 'macro', price: 20, change24h: 0 };

    await refreshOptions.enrichAsset(btc);
    await refreshOptions.enrichAsset(stock);
    expect(mocks.canonicalEnrich).toHaveBeenCalledWith(btc);
    expect(mocks.canonicalEnrich).toHaveBeenCalledWith(stock);
    expect(enrichAsset).not.toHaveBeenCalledWith(btc);
    expect(enrichAsset).not.toHaveBeenCalledWith(stock);

    await refreshOptions.enrichAsset(macro);
    expect(enrichAsset).toHaveBeenCalledWith(macro);

    expect(refreshOptions.persistSnapshots).not.toBe(persistSnapshots);
    expect(refreshOptions.evaluateAlerts).not.toBe(evaluateAlerts);
    await refreshOptions.persistSnapshots(fallbackAssets);
    await refreshOptions.evaluateAlerts(fallbackAssets);
    expect(persistSnapshots).toHaveBeenCalledWith(fallbackAssets);
    expect(evaluateAlerts).toHaveBeenCalledWith(fallbackAssets);
  });
});
