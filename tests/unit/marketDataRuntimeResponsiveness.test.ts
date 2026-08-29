import { describe, expect, it } from 'vitest';
import { runMarketDataCompatibilityRefresh } from '../../server/marketData/marketDataCompatibilityFacade';
import { createMarketDataRuntimeFacade } from '../../server/marketData/marketDataRuntimeFacade';

const liveAssets = Array.from({ length: 8 }, (_, index) => ({
  symbol: `ASSET${index}`,
  type: 'crypto',
  dataSource: 'live' as const,
}));

describe('market-data runtime responsiveness', () => {
  it('bounds evidence-enrichment concurrency and preserves asset order', async () => {
    let active = 0;
    let maxActive = 0;

    const result = await runMarketDataCompatibilityRefresh({
      fallbackAssets: [],
      stockTickers: [],
      forexTickers: [],
      commodityTickers: [],
      registryAssets: () => [],
      providerStages: [{ name: 'test-live', load: async () => liveAssets }],
      enrichmentConcurrency: 2,
      enrichAsset: async asset => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise(resolve => setTimeout(resolve, 4));
        active -= 1;
        return { ...asset, enriched: true };
      },
    });

    expect(maxActive).toBeLessThanOrEqual(2);
    expect(result.map(asset => asset.symbol)).toEqual(liveAssets.map(asset => asset.symbol));
    expect(result.every(asset => asset.enriched === true)).toBe(true);
  });

  it('reports foreground/background refresh timing without changing cache authority', async () => {
    const timings: Array<{ kind: string; outcome: string; assetCount: number }> = [];
    let refreshCount = 0;

    const runtime = createMarketDataRuntimeFacade({
      ttlMs: 60_000,
      backgroundRefreshIntervalMs: 0,
      refresh: async () => {
        refreshCount += 1;
        return [{ symbol: `BTC-${refreshCount}`, type: 'crypto', dataSource: 'live' }];
      },
      syncAsset: () => undefined,
      onRefreshTiming: timing => timings.push(timing),
    });

    const foreground = await runtime.get();
    const cached = await runtime.get();
    const background = await runtime.backgroundRefresh();

    expect(foreground[0].symbol).toBe('BTC-1');
    expect(cached[0].symbol).toBe('BTC-1');
    expect(background?.[0].symbol).toBe('BTC-2');
    expect(refreshCount).toBe(2);
    expect(timings.map(timing => timing.kind)).toEqual(['foreground', 'background']);
    expect(timings.every(timing => timing.outcome === 'success')).toBe(true);
    expect(timings.every(timing => timing.assetCount === 1)).toBe(true);
  });
});
