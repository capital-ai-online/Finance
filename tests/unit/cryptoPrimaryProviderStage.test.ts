import { describe, expect, it, vi } from 'vitest';
import { createCryptoMarketDataStage } from '../../server/marketData/cryptoMarketDataStage';

const fallbackAssets = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 1, change24h: 0, volume24h: 10, score: 5 },
];

describe('crypto market-data startup priority', () => {
  it('starts directly with the resilient exchange chain and never calls CoinGecko', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('coingecko')) throw new Error('CoinGecko must not be called by startup/background stage');
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
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain('binance');
  });

  it('retains the existing Kraken fallback when Binance is unavailable', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('coingecko')) throw new Error('CoinGecko must not be called by startup/background stage');
      if (url.includes('binance')) return { ok: false, status: 503, json: async () => ({}) } as any;
      if (url.includes('kraken')) {
        return {
          ok: true,
          json: async () => ({ result: { XXBTZUSD: { c: ['67500'], o: '67000', v: ['0', '900'] } } }),
        } as any;
      }
      throw new Error(`unexpected provider call: ${url}`);
    });

    const stage = createCryptoMarketDataStage({
      fallbackAssets,
      fetchImpl: fetchImpl as any,
      logger: { info: vi.fn(), warn: vi.fn() },
    });

    const assets = await stage.load();
    expect(assets[0].price).toBe(67500);
    expect(assets[0].dataSource).toBe('live');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
