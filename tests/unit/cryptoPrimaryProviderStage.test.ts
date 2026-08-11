import { describe, expect, it, vi } from 'vitest';
import { createCryptoMarketDataStage } from '../../server/marketData/cryptoMarketDataStage';

const fallbackAssets = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 1, change24h: 0, volume24h: 10, score: 5 },
];

describe('crypto market-data priority', () => {
  it('loads live data from CoinGecko and does not call lower-priority providers', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('coingecko')) {
        return { ok: true, json: async () => [{ symbol: 'btc', name: 'Bitcoin', current_price: 69000, price_change_percentage_24h: 1, market_cap: 900_000_000_000, total_volume: 9_000_000_000 }] } as any;
      }
      throw new Error(`unexpected provider call: ${url}`);
    });

    const stage = createCryptoMarketDataStage({
      fallbackAssets,
      fetchImpl: fetchImpl as any,
      now: () => 1,
      logger: { info: vi.fn(), warn: vi.fn() },
    });

    const assets = await stage.load();
    expect(assets[0].symbol).toBe('BTC');
    expect(assets[0].price).toBe(69000);
    expect(assets[0].dataSource).toBe('live');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('falls through to resilient exchange providers when CoinGecko fails', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('coingecko')) return { ok: false, status: 500, json: async () => ({}) } as any;
      if (url.includes('binance')) {
        return { ok: true, json: async () => [{ symbol: 'BTCUSDT', lastPrice: '68000', priceChangePercent: '1.5', volume: '1000' }] } as any;
      }
      throw new Error(`unexpected provider call: ${url}`);
    });

    const stage = createCryptoMarketDataStage({
      fallbackAssets,
      fetchImpl: fetchImpl as any,
      now: () => 10_000_000,
      logger: { info: vi.fn(), warn: vi.fn() },
    });

    const assets = await stage.load();
    expect(assets[0].price).toBe(68000);
    expect(assets[0].dataSource).toBe('live');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
