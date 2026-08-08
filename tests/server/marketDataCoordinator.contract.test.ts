import { describe, expect, it, vi } from 'vitest';
import { refreshMarketData } from '../../server/marketData/marketDataCoordinator';

describe('market-data refresh coordinator', () => {
  it('runs provider stages in declared order and enriches the merged result', async () => {
    const calls: string[] = [];
    const result = await refreshMarketData({
      providerStages: [
        { name: 'crypto', load: async () => { calls.push('crypto'); return [{ symbol: 'BTC', type: 'crypto', dataSource: 'live' }]; } },
        { name: 'stooq', load: async () => { calls.push('stooq'); return [{ symbol: 'AAPL', type: 'stock', dataSource: 'live' }]; } },
      ],
      appendMissingFallbackAssets: assets => { calls.push('fallbacks'); return assets; },
      enrichAssets: async assets => { calls.push('enrich'); return assets.map(asset => ({ ...asset, score: 7 })); },
    });

    expect(calls).toEqual(['crypto', 'stooq', 'fallbacks', 'enrich']);
    expect(result).toHaveLength(2);
    expect(result.every(asset => asset.score === 7)).toBe(true);
  });

  it('keeps the refresh fail-open when one provider stage fails', async () => {
    const failures: string[] = [];
    const result = await refreshMarketData({
      providerStages: [
        { name: 'crypto', load: async () => { throw new Error('temporary provider outage'); } },
        { name: 'fmp-index', load: async () => [{ symbol: 'GSPC', type: 'index', dataSource: 'live' }] },
      ],
      appendMissingFallbackAssets: assets => [...assets, { symbol: 'BTC', type: 'crypto', dataSource: 'fallback' }],
      enrichAssets: async assets => assets,
      onProviderFailure: stage => failures.push(stage),
    });

    expect(failures).toEqual(['crypto']);
    expect(result.map(asset => [asset.symbol, asset.dataSource])).toEqual([
      ['GSPC', 'live'],
      ['BTC', 'fallback'],
    ]);
  });

  it('does not fail a successful refresh when best-effort snapshot persistence rejects', async () => {
    const onProviderFailure = vi.fn();
    const result = await refreshMarketData({
      providerStages: [{ name: 'crypto', load: async () => [{ symbol: 'BTC', type: 'crypto', dataSource: 'live' }] }],
      appendMissingFallbackAssets: assets => assets,
      enrichAssets: async assets => assets,
      persistSnapshots: async () => { throw new Error('snapshot store unavailable'); },
      onProviderFailure,
    });

    expect(result).toHaveLength(1);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(onProviderFailure).toHaveBeenCalledWith('snapshot-persistence', expect.any(Error));
  });
});
