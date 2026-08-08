import { describe, expect, it, vi } from 'vitest';
import { runMarketDataCompatibilityRefresh } from '../../server/marketData/marketDataCompatibilityFacade';

const fallbackAssets = [
  { symbol: 'BTC', type: 'crypto', price: 1, change24h: 0, dataSource: 'fallback' as const },
  { symbol: 'AAPL', type: 'stock', price: 100, change24h: 0, dataSource: 'fallback' as const },
];

describe('marketDataCompatibilityFacade', () => {
  it('keeps provider assets, appends missing registry assets as fallback and enriches all assets', async () => {
    const providerStages = [
      { name: 'test-live', load: async () => [{ symbol: 'BTC', type: 'crypto', price: 2, change24h: 1, dataSource: 'live' as const }] },
    ];

    const result = await runMarketDataCompatibilityRefresh({
      fallbackAssets,
      stockTickers: [],
      forexTickers: [],
      commodityTickers: [],
      providerStages,
      registryAssets: () => fallbackAssets,
      enrichAsset: async asset => ({ ...asset, enriched: true }),
    });

    expect(result).toEqual([
      expect.objectContaining({ symbol: 'BTC', dataSource: 'live', enriched: true }),
      expect.objectContaining({ symbol: 'AAPL', dataSource: 'fallback', status: 'Fallback', enriched: true }),
    ]);
  });

  it('keeps snapshot and alert side effects best-effort', async () => {
    const persistSnapshots = vi.fn(async () => { throw new Error('snapshot unavailable'); });
    const evaluateAlerts = vi.fn(async () => { throw new Error('alerts unavailable'); });

    await expect(runMarketDataCompatibilityRefresh({
      fallbackAssets,
      stockTickers: [],
      forexTickers: [],
      commodityTickers: [],
      providerStages: [{ name: 'test', load: async () => [] }],
      registryAssets: () => fallbackAssets,
      enrichAsset: async asset => asset,
      persistSnapshots,
      evaluateAlerts,
    })).resolves.toHaveLength(2);

    expect(persistSnapshots).toHaveBeenCalledTimes(1);
    expect(evaluateAlerts).toHaveBeenCalledTimes(1);
  });

  it('continues after a provider stage fails', async () => {
    const onProviderFailure = vi.fn();
    const result = await runMarketDataCompatibilityRefresh({
      fallbackAssets,
      stockTickers: [],
      forexTickers: [],
      commodityTickers: [],
      providerStages: [
        { name: 'broken', load: async () => { throw new Error('offline'); } },
        { name: 'healthy', load: async () => [{ symbol: 'BTC', type: 'crypto', price: 3, change24h: 2, dataSource: 'live' as const }] },
      ],
      registryAssets: () => fallbackAssets,
      enrichAsset: async asset => asset,
      onProviderFailure,
    });

    expect(onProviderFailure).toHaveBeenCalledWith('broken', expect.any(Error));
    expect(result.find(asset => asset.symbol === 'BTC')?.dataSource).toBe('live');
  });
});
