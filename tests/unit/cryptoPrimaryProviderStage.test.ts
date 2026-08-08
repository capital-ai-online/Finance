import { describe, expect, it, vi } from 'vitest';
import { createCryptoMarketDataStage } from '../../server/marketData/cryptoMarketDataStage';

const fallbackAssets = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 1, change24h: 0, volume24h: 10, score: 5 },
];

describe('crypto market-data priority', () => {
  it('prefers CoinMarketCap and does not call lower-priority providers', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('coinmarketcap')) {
        return {
          ok: true,
          json: async () => ({ data: [{ symbol: 'BTC', name: 'Bitcoin', quote: { USD: { price: 70000, percent_change_24h: 2, market_cap: 1_000_000_000_000, volume_24h: 10_000_000_000 } }, circulating_supply: 19_000_000, max_supply: 21_000_000, total_supply: 19_000_000 }] }),
        } as any;
      }
      throw new Error(`unexpected provider call: ${url}`);
    });

    const stage = createCryptoMarketDataStage({
      fallbackAssets,
      getCoinMarketCapApiKey: () => 'test-key',
      fetchImpl: fetchImpl as any,
      now: () => 1,
      logger: { info: vi.fn(), warn: vi.fn() },
    });

    const assets = await stage.load();
    expect(assets[0].symbol).toBe('BTC');
    expect(assets[0].price).toBe(70000);
    expect(assets[0].dataSource).toBe('live');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('falls through CoinGecko before resilient exchange providers', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('coinmarketcap')) return { ok: false, status: 500, json: async () => ({}) } as any;
      if (url.includes('coingecko')) {
        return { ok: true, json: async () => [{ symbol: 'btc', name: 'Bitcoin', current_price: 69000, price_change_percentage_24h: 1, market_cap: 900_000_000_000, total_volume: 9_000_000_000 }] } as any;
      }
      throw new Error(`unexpected provider call: ${url}`);
    });

    const stage = createCryptoMarketDataStage({
      fallbackAssets,
      getCoinMarketCapApiKey: () => 'test-key',
      fetchImpl: fetchImpl as any,
      now: () => 10_000_000,
      logger: { info: vi.fn(), warn: vi.fn() },
    });

    const assets = await stage.load();
    expect(assets[0].price).toBe(69000);
    expect(assets[0].dataSource).toBe('live');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
