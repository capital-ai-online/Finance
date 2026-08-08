import { describe, expect, it, vi } from 'vitest';
import { fetchCryptoMarketAssets } from '../../server/marketData/cryptoProviderChain';

const fallbackAssets = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 1, change24h: 0, volume24h: 10, score: 5 },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', price: 1, change24h: 0, volume24h: 10, score: 5 },
  { symbol: 'AAPL', name: 'Apple', type: 'stock', price: 1, change24h: 0 },
];

function response(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

describe('crypto provider chain', () => {
  it('prefers Binance and preserves live provenance', async () => {
    const fetchImpl = vi.fn(async () => response([
      { symbol: 'BTCUSDT', lastPrice: '50000', priceChangePercent: '2', volume: '100' },
      { symbol: 'ETHUSDT', lastPrice: '3000', priceChangePercent: '-1', volume: '200' },
    ])) as unknown as typeof fetch;

    const result = await fetchCryptoMarketAssets({ fallbackAssets, fetchImpl, logger: { info: vi.fn(), warn: vi.fn() } });

    expect(result.source).toBe('binance');
    expect(result.assets).toHaveLength(2);
    expect(result.assets[0]).toMatchObject({ symbol: 'BTC', price: 50000, dataSource: 'live' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('falls through Binance to Kraken', async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const value = String(url);
      if (value.includes('binance')) return response({}, false, 503);
      if (value.includes('kraken')) return response({ result: { XXBTZUSD: { c: ['49000'], o: '48000', v: ['1', '25'] } } });
      throw new Error(`unexpected URL ${value}`);
    }) as unknown as typeof fetch;

    const result = await fetchCryptoMarketAssets({ fallbackAssets, fetchImpl, logger: { info: vi.fn(), warn: vi.fn() } });

    expect(result.source).toBe('kraken');
    expect(result.assets.find((asset) => asset.symbol === 'BTC')).toMatchObject({ price: 49000, dataSource: 'live' });
  });

  it('uses Coinbase without inventing 24h change or volume', async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const value = String(url);
      if (value.includes('binance') || value.includes('kraken')) return response({}, false, 503);
      if (value.includes('BTC-USD')) return response({ data: { amount: '51000' } });
      return response({}, false, 404);
    }) as unknown as typeof fetch;

    const result = await fetchCryptoMarketAssets({ fallbackAssets, fetchImpl, logger: { info: vi.fn(), warn: vi.fn() } });

    expect(result.source).toBe('coinbase');
    expect(result.assets.find((asset) => asset.symbol === 'BTC')).toMatchObject({
      price: 51000,
      change24h: 0,
      dataSource: 'live',
    });
  });

  it('fails open to static fallback data when every provider fails', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;

    const result = await fetchCryptoMarketAssets({ fallbackAssets, fetchImpl, logger: { info: vi.fn(), warn: vi.fn() } });

    expect(result.source).toBe('fallback');
    expect(result.assets).toEqual([
      expect.objectContaining({ symbol: 'BTC', status: 'Fallback', dataSource: 'fallback' }),
      expect.objectContaining({ symbol: 'ETH', status: 'Fallback', dataSource: 'fallback' }),
    ]);
  });
});
