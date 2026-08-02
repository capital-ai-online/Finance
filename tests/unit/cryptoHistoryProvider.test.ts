import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getVerifiedCryptoHistory,
  resetCryptoHistoryProviderState,
} from '../../src/services/cryptoHistoryProvider';

function coinGeckoPayload(count = 30) {
  const start = Date.UTC(2026, 6, 4);
  return {
    prices: Array.from({ length: count }, (_, index) => [
      start + index * 24 * 60 * 60 * 1000,
      3000 + index * 10,
    ]),
  };
}

function binancePayload(count = 30) {
  const start = Date.UTC(2026, 6, 4);
  return Array.from({ length: count }, (_, index) => [
    start + index * 24 * 60 * 60 * 1000,
    '3000', '3100', '2950', String(3050 + index * 10), '1000',
  ]);
}

afterEach(() => {
  resetCryptoHistoryProviderState();
  vi.restoreAllMocks();
});

describe('cryptoHistoryProvider resilience', () => {
  it('returns verified CoinGecko history and serves a fresh cache hit without another request', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(coinGeckoPayload()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    const fetchImpl = fetchMock as unknown as typeof fetch;

    const first = await getVerifiedCryptoHistory('ETH', 30, { fetchImpl });
    const second = await getVerifiedCryptoHistory('ETH', 30, { fetchImpl });

    expect(first?.provider).toBe('CoinGecko');
    expect(first?.cacheMode).toBe('fresh');
    expect(first?.degraded).toBe(false);
    expect(first?.points.length).toBeGreaterThanOrEqual(20);
    expect(second?.cacheMode).toBe('cache-hit');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a transient CoinGecko failure with bounded exponential backoff', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('temporary', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(coinGeckoPayload()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }));
    const fetchImpl = fetchMock as unknown as typeof fetch;
    const sleep = vi.fn(async () => undefined);

    const result = await getVerifiedCryptoHistory('ETH', 30, {
      fetchImpl,
      sleep,
      random: () => 0,
      maxAttempts: 3,
    });

    expect(result?.provider).toBe('CoinGecko');
    expect(result?.cacheMode).toBe('fresh');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(200);
  });

  it('falls back to verified Binance history when CoinGecko is unavailable on a cold start', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('coingecko.com')) return new Response('rate limited', { status: 429 });
      if (url.includes('binance.com')) {
        return new Response(JSON.stringify(binancePayload()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('unexpected', { status: 500 });
    });
    const fetchImpl = fetchMock as unknown as typeof fetch;

    const result = await getVerifiedCryptoHistory('BTC', 30, {
      fetchImpl,
      sleep: async () => undefined,
      random: () => 0,
      maxAttempts: 1,
    });

    expect(result?.provider).toBe('Binance');
    expect(result?.points).toHaveLength(30);
    expect(result?.degraded).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('opens provider circuits after the configured failure threshold', async () => {
    const fetchMock = vi.fn(async () => new Response('down', { status: 503 }));
    const fetchImpl = fetchMock as unknown as typeof fetch;
    const sleep = vi.fn(async () => undefined);
    let now = Date.UTC(2026, 7, 2, 6, 0, 0);

    const first = await getVerifiedCryptoHistory('ETH', 30, {
      fetchImpl,
      sleep,
      nowMs: () => now,
      maxAttempts: 1,
      circuitFailureThreshold: 1,
      circuitCooldownMs: 60_000,
    });
    const callsAfterFirst = fetchMock.mock.calls.length;
    now += 1_000;
    const second = await getVerifiedCryptoHistory('ETH', 30, {
      fetchImpl,
      sleep,
      nowMs: () => now,
      maxAttempts: 1,
      circuitFailureThreshold: 1,
      circuitCooldownMs: 60_000,
    });

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(callsAfterFirst).toBeGreaterThanOrEqual(2);
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });

  it('uses last-known-good data in degraded mode when all refresh providers fail', async () => {
    let now = Date.UTC(2026, 7, 2, 6, 0, 0);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(coinGeckoPayload()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValue(new Response('down', { status: 503 }));
    const fetchImpl = fetchMock as unknown as typeof fetch;
    const sleep = vi.fn(async () => undefined);

    const first = await getVerifiedCryptoHistory('ETH', 30, {
      fetchImpl,
      nowMs: () => now,
      cacheTtlMs: 1_000,
    });
    now += 2_000;
    const fallback = await getVerifiedCryptoHistory('ETH', 30, {
      fetchImpl,
      sleep,
      random: () => 0,
      nowMs: () => now,
      cacheTtlMs: 1_000,
      maxAttempts: 1,
    });

    expect(first?.cacheMode).toBe('fresh');
    expect(fallback?.cacheMode).toBe('last-known-good');
    expect(fallback?.degraded).toBe(true);
    expect(fallback?.points).toEqual(first?.points);
  });
});
