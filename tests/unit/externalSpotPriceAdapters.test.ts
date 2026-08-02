import { describe, expect, it, vi } from 'vitest';
import { fetchCryptoSpotObservation } from '../../src/services/externalSpotPriceAdapters';

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('external crypto spot price adapters', () => {
  it('normalizes CoinAPI USD exchange rate with provider timestamp', async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(new Headers(init?.headers).get('X-CoinAPI-Key')).toBe('coin-key');
      return jsonResponse({ time: '2026-08-02T08:00:00Z', asset_id_base: 'BTC', asset_id_quote: 'USD', rate: 65000 });
    }) as unknown as typeof fetch;
    const observation = await fetchCryptoSpotObservation('CoinAPI', 'BTC', {
      fetchImpl,
      apiKeys: { CoinAPI: 'coin-key' },
      nowMs: () => Date.parse('2026-08-02T08:00:10Z'),
    });
    expect(observation.value).toBe(65000);
    expect(observation.unit).toBe('USD');
    expect(observation.observedAt).toBe('2026-08-02T08:00:00.000Z');
  });

  it('normalizes Twelve Data /price response', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toContain('symbol=ETH%2FUSD');
      expect(new Headers(init?.headers).get('Authorization')).toBe('apikey twelve-key');
      return jsonResponse({ price: '3200.50' });
    }) as unknown as typeof fetch;
    const observation = await fetchCryptoSpotObservation('TwelveData', 'ETH', {
      fetchImpl,
      apiKeys: { TwelveData: 'twelve-key' },
      nowMs: () => Date.parse('2026-08-02T08:01:00Z'),
    });
    expect(observation.value).toBe(3200.5);
    expect(observation.provider).toBe('TwelveData');
  });

  it('treats EODHD as dated EOD evidence rather than current timestamp', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse([
      { date: '2026-08-01', close: 64000, adjusted_close: 64100 },
    ])) as unknown as typeof fetch;
    const observation = await fetchCryptoSpotObservation('EODHD', 'BTC', {
      fetchImpl,
      apiKeys: { EODHD: 'eod-key' },
      nowMs: () => Date.parse('2026-08-02T08:02:00Z'),
    });
    expect(observation.value).toBe(64100);
    expect(observation.observedAt).toBe('2026-08-01T23:59:59.000Z');
  });
});
