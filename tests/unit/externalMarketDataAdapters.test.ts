import { describe, expect, it, vi } from 'vitest';
import { fetchExternalHistory } from '../../src/services/externalMarketDataAdapters';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('external market-data adapters', () => {
  it('uses X-CoinAPI-Key and normalizes CoinAPI daily OHLCV', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toContain('/v1/ohlcv/COINBASE_SPOT_BTC_USD/history');
      expect(new Headers(init?.headers).get('X-CoinAPI-Key')).toBe('coin-secret');
      return jsonResponse([
        { time_period_start: '2026-07-01T00:00:00Z', price_open: 100, price_high: 110, price_low: 90, price_close: 105, volume_traded: 5 },
        { time_period_start: '2026-07-02T00:00:00Z', price_open: 105, price_high: 115, price_low: 100, price_close: 112, volume_traded: 6 },
      ]);
    }) as unknown as typeof fetch;

    const result = await fetchExternalHistory('CoinAPI', { symbol: 'BTC', assetClass: 'crypto', days: 30 }, {
      fetchImpl,
      apiKeys: { CoinAPI: 'coin-secret' },
      nowMs: () => Date.UTC(2026, 7, 2),
    });

    expect(result.provider).toBe('CoinAPI');
    expect(result.points.map(point => point.close)).toEqual([105, 112]);
    expect(result.metadata?.symbolId).toBe('COINBASE_SPOT_BTC_USD');
  });

  it('uses Twelve Data Authorization header and supports crypto pair normalization', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toContain('symbol=ETH%2FUSD');
      expect(new Headers(init?.headers).get('Authorization')).toBe('apikey twelve-secret');
      return jsonResponse({
        status: 'ok',
        meta: { symbol: 'ETH/USD', exchange: 'Coinbase', currency: 'USD', exchange_timezone: 'UTC' },
        values: [
          { datetime: '2026-07-02', open: '2000', high: '2100', low: '1950', close: '2050', volume: '1000' },
          { datetime: '2026-07-01', open: '1900', high: '2050', low: '1850', close: '2000', volume: '900' },
        ],
      });
    }) as unknown as typeof fetch;

    const result = await fetchExternalHistory('TwelveData', { symbol: 'ETH', assetClass: 'crypto', days: 30 }, {
      fetchImpl,
      apiKeys: { TwelveData: 'twelve-secret' },
    });

    expect(result.points.map(point => point.date)).toEqual(['2026-07-01', '2026-07-02']);
    expect(result.points.map(point => point.close)).toEqual([2000, 2050]);
    expect(result.metadata?.currency).toBe('USD');
  });

  it('uses EODHD token server-side and normalizes stock ticker to .US', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain('/api/eod/AAPL.US');
      expect(url).toContain('api_token=eod-secret');
      return jsonResponse([
        { date: '2026-07-01', open: 200, high: 205, low: 198, close: 202, adjusted_close: 201.5, volume: 12345 },
        { date: '2026-07-02', open: 202, high: 210, low: 201, close: 208, adjusted_close: 207.5, volume: 14000 },
      ]);
    }) as unknown as typeof fetch;

    const result = await fetchExternalHistory('EODHD', { symbol: 'AAPL', assetClass: 'stock', days: 30 }, {
      fetchImpl,
      apiKeys: { EODHD: 'eod-secret' },
      nowMs: () => Date.UTC(2026, 7, 2),
    });

    expect(result.points.map(point => point.close)).toEqual([201.5, 207.5]);
    expect(result.metadata?.symbol).toBe('AAPL.US');
    expect(result.sourcePath).not.toContain('eod-secret');
  });

  it('fails closed when a provider key is missing', async () => {
    await expect(fetchExternalHistory('CoinAPI', { symbol: 'BTC', assetClass: 'crypto' }, { apiKeys: {} }))
      .rejects.toThrow('COIN_API_KEY is not configured');
  });
});
