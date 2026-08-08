import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  runRefresh: vi.fn(async () => []),
  createRuntime: vi.fn((options: any) => ({
    get: () => options.refresh(),
    backgroundRefresh: () => options.refresh(),
    getCached: () => null,
  })),
}));

vi.mock('../../server/marketData/marketDataCompatibilityFacade', () => ({
  runMarketDataCompatibilityRefresh: mocks.runRefresh,
}));

vi.mock('../../server/marketData/marketDataRuntimeFacade', () => ({
  createMarketDataRuntimeFacade: mocks.createRuntime,
}));

import { createApplicationMarketDataRuntime } from '../../server/marketData/createApplicationMarketDataRuntime';

describe('application market-data runtime wiring', () => {
  it('forwards the canonical provider universe and application callbacks', async () => {
    const fallbackAssets = [
      { symbol: 'BTC', type: 'crypto', price: 1, change24h: 0 },
      { symbol: 'AAPL', type: 'stock', price: 100, change24h: 1 },
    ];
    const registryAssets = vi.fn(() => fallbackAssets);
    const enrichAsset = vi.fn(async (asset: any) => asset);
    const syncAsset = vi.fn();
    const getCoinMarketCapApiKey = vi.fn(() => 'cmc-key');
    const persistSnapshots = vi.fn();
    const evaluateAlerts = vi.fn();
    const onProviderFailure = vi.fn();
    const onRefreshFailure = vi.fn();

    const runtime = createApplicationMarketDataRuntime({
      fallbackAssets,
      registryAssets,
      enrichAsset,
      syncAsset,
      getCoinMarketCapApiKey,
      persistSnapshots,
      evaluateAlerts,
      onProviderFailure,
      onRefreshFailure,
      ttlMs: 60_000,
    });

    await runtime.get();

    expect(mocks.createRuntime).toHaveBeenCalledWith(expect.objectContaining({
      syncAsset,
      onRefreshFailure,
      ttlMs: 60_000,
      refresh: expect.any(Function),
    }));
    expect(mocks.runRefresh).toHaveBeenCalledWith(expect.objectContaining({
      fallbackAssets,
      stockTickers: ['AAPL.US', 'MSFT.US', 'GOOGL.US', 'AMZN.US', 'NVDA.US', 'TSLA.US', 'META.US', 'NFLX.US', 'AMD.US', 'INTC.US'],
      forexTickers: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'AUDUSD'],
      commodityTickers: ['XAUUSD', 'XAGUSD', 'CL.F', 'NG.F', 'CO.F'],
      getCoinMarketCapApiKey,
      registryAssets,
      enrichAsset,
      persistSnapshots,
      evaluateAlerts,
      onProviderFailure,
    }));
  });
});
