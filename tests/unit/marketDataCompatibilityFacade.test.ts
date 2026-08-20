import { describe, expect, it, vi } from 'vitest';
import { runMarketDataCompatibilityRefresh } from '../../server/marketData/marketDataCompatibilityFacade';

const fallbackAssets = [
  { symbol: 'BTC', type: 'crypto', price: 1, change24h: 0, dataSource: 'fallback' as const },
  { symbol: 'AAPL', type: 'stock', price: 100, change24h: 0, dataSource: 'fallback' as const },
];

describe('marketDataCompatibilityFacade', () => {
  it('enriches only provider-observed assets and leaves appended catalog fallbacks untouched', async () => {
    const providerStages = [
      { name: 'test-live', load: async () => [{ symbol: 'BTC', type: 'crypto', price: 2, change24h: 1, dataSource: 'live' as const }] },
    ];
    const enrichAsset = vi.fn(async asset => ({ ...asset, enriched: true }));

    const result = await runMarketDataCompatibilityRefresh({
      fallbackAssets,
      stockTickers: [],
      forexTickers: [],
      commodityTickers: [],
      providerStages,
      registryAssets: () => fallbackAssets,
      enrichAsset,
    });

    expect(result).toEqual([
      expect.objectContaining({ symbol: 'BTC', dataSource: 'live', enriched: true }),
      expect.objectContaining({ symbol: 'AAPL', dataSource: 'fallback', status: 'Fallback' }),
    ]);
    expect(result.find(asset => asset.symbol === 'AAPL')).not.toHaveProperty('enriched');
    expect(enrichAsset).toHaveBeenCalledTimes(1);
  });

  it('runs snapshot and alert side effects only for provider-observed rows', async () => {
    const persistSnapshots = vi.fn(async () => undefined);
    const evaluateAlerts = vi.fn(async () => undefined);

    await expect(runMarketDataCompatibilityRefresh({
      fallbackAssets,
      stockTickers: [],
      forexTickers: [],
      commodityTickers: [],
      providerStages: [{ name: 'test', load: async () => [{ symbol: 'BTC', type: 'crypto', price: 2, change24h: 1, dataSource: 'live' as const }] }],
      registryAssets: () => fallbackAssets,
      enrichAsset: async asset => asset,
      persistSnapshots,
      evaluateAlerts,
    })).resolves.toHaveLength(2);

    expect(persistSnapshots).toHaveBeenCalledTimes(1);
    expect(evaluateAlerts).toHaveBeenCalledTimes(1);
    expect(persistSnapshots.mock.calls[0][0]).toEqual([
      expect.objectContaining({ symbol: 'BTC', dataSource: 'live' }),
    ]);
    expect(evaluateAlerts.mock.calls[0][0]).toEqual([
      expect.objectContaining({ symbol: 'BTC', dataSource: 'live' }),
    ]);
  });

  it('does not run snapshot/alert side effects when a refresh contains only fallbacks', async () => {
    const persistSnapshots = vi.fn();
    const evaluateAlerts = vi.fn();

    const result = await runMarketDataCompatibilityRefresh({
      fallbackAssets,
      stockTickers: [],
      forexTickers: [],
      commodityTickers: [],
      providerStages: [{ name: 'test', load: async () => [] }],
      registryAssets: () => fallbackAssets,
      enrichAsset: async asset => asset,
      persistSnapshots,
      evaluateAlerts,
    });

    expect(result).toHaveLength(2);
    expect(persistSnapshots).not.toHaveBeenCalled();
    expect(evaluateAlerts).not.toHaveBeenCalled();
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
