import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getVerifiedCryptoSnapshot,
  resetCryptoSnapshotProviderState,
} from '../../src/services/cryptoSnapshotProvider';
import { RateLimitBudget } from '../../src/platform/MarketData/RateLimitBudget';
import { CircuitBreaker } from '../../src/platform/MarketData/CircuitBreaker';
import {
  getProviderHealth,
  resetProviderHealth,
} from '../../src/platform/Supervisor/providerHealth';

function payload() {
  return {
    last_updated: '2026-08-02T06:00:00.000Z',
    market_data: {
      current_price: { usd: 3_450.25 },
      price_change_percentage_24h: -1.2,
      market_cap: { usd: 400_000_000_000 },
      total_volume: { usd: 20_000_000_000 },
      circulating_supply: 120_000_000,
      max_supply: null,
      total_supply: 120_000_000,
    },
  };
}

afterEach(() => {
  resetCryptoSnapshotProviderState();
  resetProviderHealth();
  vi.restoreAllMocks();
});

describe('cryptoSnapshotProvider provenance', () => {
  it('returns verified display and market fields with source paths and timestamps', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(payload()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const snapshot = await getVerifiedCryptoSnapshot('ETH', {
      fetchImpl: fetchMock as unknown as typeof fetch,
      nowMs: () => Date.parse('2026-08-02T06:00:01.000Z'),
    });

    expect(snapshot?.priceUsd).toBe(3_450.25);
    expect(snapshot?.change24hPct).toBe(-1.2);
    expect(snapshot?.marketCapUsd).toBe(400_000_000_000);
    expect(snapshot?.volume24hUsd).toBe(20_000_000_000);
    expect(snapshot?.provenance.priceUsd?.sourcePath).toBe('market_data.current_price.usd');
    expect(snapshot?.provenance.change24hPct?.sourcePath).toBe('market_data.price_change_percentage_24h');
    expect(snapshot?.provenance.marketCapUsd?.sourcePath).toBe('market_data.market_cap.usd');
    expect(snapshot?.provenance.maxSupply?.value).toBeNull();
    expect(snapshot?.observedAt).toBe('2026-08-02T06:00:00.000Z');
    expect(snapshot?.degraded).toBe(false);
  });

  it('uses a verified cache hit instead of another provider request', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(payload()), { status: 200 }));
    const fetchImpl = fetchMock as unknown as typeof fetch;
    const nowMs = () => Date.parse('2026-08-02T06:00:01.000Z');

    const first = await getVerifiedCryptoSnapshot('ETH', { fetchImpl, nowMs });
    const second = await getVerifiedCryptoSnapshot('ETH', { fetchImpl, nowMs });

    expect(first?.cacheMode).toBe('fresh');
    expect(second?.cacheMode).toBe('cache-hit');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never substitutes registry/bootstrap values when the provider has no usable market data', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ market_data: {} }), { status: 200 }));
    const snapshot = await getVerifiedCryptoSnapshot('ETH', {
      fetchImpl: fetchMock as unknown as typeof fetch,
      maxAttempts: 1,
    });

    expect(snapshot).toBeNull();
  });
});

describe('SC-5 Phase B matrix guards', () => {
  it('returns last-known-good when rate-limit budget is exhausted', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(payload()), { status: 200 }));
    const fetchImpl = fetchMock as unknown as typeof fetch;
    let now = Date.parse('2026-08-16T12:00:00.000Z');
    const nowMs = () => now;
    const budget = new RateLimitBudget({
      nowMs,
      perProvider: { coingecko: { capacity: 1, windowMs: 60_000 } },
    });

    const first = await getVerifiedCryptoSnapshot('ETH', {
      fetchImpl,
      nowMs,
      rateLimitBudget: budget,
      cacheTtlMs: 0,
    });
    expect(first?.cacheMode).toBe('fresh');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    now += 1;

    const second = await getVerifiedCryptoSnapshot('ETH', {
      fetchImpl,
      nowMs,
      rateLimitBudget: budget,
      cacheTtlMs: 0,
    });
    expect(second?.cacheMode).toBe('last-known-good');
    expect(second?.degraded).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const health = getProviderHealth().find(
      (h) => h.provider === 'CoinGecko' && h.capability === 'market-fields',
    );
    expect(health?.state).toBe('degraded');
    expect(health?.diagnosticCode).toBe('rate_limited');
  });

  it('skips upstream when circuit breaker is open', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(payload()), { status: 200 }));
    let now = Date.parse('2026-08-16T12:00:00.000Z');
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      cooldownMs: 30_000,
      nowMs: () => now,
    });
    breaker.failure('coingecko');
    expect(breaker.state('coingecko')).toBe('OPEN');

    const snapshot = await getVerifiedCryptoSnapshot('ETH', {
      fetchImpl: fetchMock as unknown as typeof fetch,
      nowMs: () => now,
      circuitBreaker: breaker,
      cacheTtlMs: 0,
    });

    expect(snapshot).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
