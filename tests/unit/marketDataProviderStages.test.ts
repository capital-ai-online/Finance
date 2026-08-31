import { describe, expect, it, vi } from 'vitest';
import { createMarketDataProviderStages } from '../../server/marketData/createMarketDataProviderStages';
import { createStooqProviderStage, STOOQ_RUNTIME_ENABLED } from '../../server/marketData/stooqProviderStage';

const fallbackAssets = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 1, change24h: 0, volume24h: 10, score: 5 },
  { symbol: 'AAPL', name: 'Apple', type: 'stock', price: 100, change24h: 0, volume24h: 20, score: 6 },
  { symbol: 'GLD', name: 'Gold Spot', type: 'commodity', price: 2000, change24h: 0, volume24h: 30, score: 7 },
];

describe('market-data provider stage composition', () => {
  it('keeps only canonical active stages in the default provider order', () => {
    const stages = createMarketDataProviderStages({
      fallbackAssets,
      stockTickers: ['AAPL.US'],
      forexTickers: [],
      commodityTickers: ['XAUUSD'],
    });
    expect(stages.map(stage => stage.name)).toEqual(['crypto-market-data', 'fmp-indices']);
    expect(stages.some(stage => stage.name === 'stooq')).toBe(false);
  });

  it('appends custom provider stages after the canonical providers', () => {
    const stages = createMarketDataProviderStages({
      fallbackAssets,
      stockTickers: ['AAPL.US'],
      forexTickers: [],
      commodityTickers: ['XAUUSD'],
      additionalStages: [{ name: 'custom-provider', load: async () => [] }],
    });
    expect(stages.map(stage => stage.name)).toEqual([
      'crypto-market-data',
      'fmp-indices',
      'custom-provider',
    ]);
  });

  it('keeps the legacy Stooq factory fail-closed with no network or fallback observations', async () => {
    const fetchImpl = vi.fn();
    const stage = createStooqProviderStage({
      fallbackAssets,
      stockTickers: ['AAPL.US'],
      forexTickers: [],
      commodityTickers: ['XAUUSD'],
      fetchImpl: fetchImpl as any,
      logger: { warn: vi.fn() },
    });

    expect(STOOQ_RUNTIME_ENABLED).toBe(false);
    expect(await stage.load()).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
