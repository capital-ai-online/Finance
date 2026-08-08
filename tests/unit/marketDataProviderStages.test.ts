import { describe, expect, it, vi } from 'vitest';
import { createMarketDataProviderStages } from '../../server/marketData/createMarketDataProviderStages';
import { createStooqProviderStage } from '../../server/marketData/stooqProviderStage';

const fallbackAssets = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 1, change24h: 0, volume24h: 10, score: 5 },
  { symbol: 'AAPL', name: 'Apple', type: 'stock', price: 100, change24h: 0, volume24h: 20, score: 6 },
  { symbol: 'GLD', name: 'Gold Spot', type: 'commodity', price: 2000, change24h: 0, volume24h: 30, score: 7 },
];

describe('market-data provider stage composition', () => {
  it('keeps the canonical provider order crypto -> stooq -> fmp', () => {
    const stages = createMarketDataProviderStages({
      fallbackAssets,
      stockTickers: ['AAPL.US'],
      forexTickers: [],
      commodityTickers: ['XAUUSD'],
    });
    expect(stages.map(stage => stage.name)).toEqual(['crypto-live-chain', 'stooq', 'fmp-indices']);
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
      'crypto-live-chain',
      'stooq',
      'fmp-indices',
      'custom-provider',
    ]);
  });

  it('marks stooq fallback data honestly when the provider fails', async () => {
    const stage = createStooqProviderStage({
      fallbackAssets,
      stockTickers: ['AAPL.US'],
      forexTickers: [],
      commodityTickers: ['XAUUSD'],
      fetchImpl: vi.fn(async () => { throw new Error('offline'); }) as any,
      logger: { warn: vi.fn() },
    });
    const assets = await stage.load();
    expect(assets.every(asset => asset.dataSource === 'fallback')).toBe(true);
    expect(assets.some(asset => asset.symbol === 'AAPL')).toBe(true);
  });

  it('does not synthesize commodity volume when stooq omits it', async () => {
    const csv = 'Symbol,Date,Name,Open,Close,Change,Change%,Volume\nXAUUSD,2026-08-08,Gold,2000,2010,10,0.5%,0\n';
    const stage = createStooqProviderStage({
      fallbackAssets,
      stockTickers: [],
      forexTickers: [],
      commodityTickers: ['XAUUSD'],
      fetchImpl: vi.fn(async () => ({ ok: true, text: async () => csv })) as any,
      logger: { warn: vi.fn() },
    });
    const assets = await stage.load();
    const gold = assets.find(asset => asset.symbol === 'GLD');
    expect(gold?.volume24h).toBe(30);
    expect(gold?.dataSource).toBe('live');
  });
});
