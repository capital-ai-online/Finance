import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DefiLlamaProtocolProvider,
  isDefiLlamaProviderEnabled,
} from '../../src/platform/MarketData/providers/DefiLlamaProtocolProvider';
import { resetProviderHealth } from '../../src/platform/Supervisor/providerHealth';

function protocolPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'AAVE',
    symbol: 'AAVE',
    chains: ['Ethereum'],
    tvl: [
      { date: 1_723_680_000, totalLiquidityUSD: 10_500_000_000 },
      { date: 1_723_766_400, totalLiquidityUSD: 10_800_000_000 },
    ],
    ...overrides,
  };
}

function feesOverviewPayload(overrides: Record<string, unknown> = {}) {
  return {
    protocols: [
      { name: 'AAVE', slug: 'aave', total24h: 250_000, dailyRevenue: 90_000 },
      { name: 'Uniswap', slug: 'uniswap', total24h: 1_500_000, dailyRevenue: 300_000 },
    ],
    ...overrides,
  };
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

beforeEach(() => {
  resetProviderHealth();
});

describe('isDefiLlamaProviderEnabled', () => {
  it('defaults to enabled and only disables on the literal string "false"', () => {
    expect(isDefiLlamaProviderEnabled({})).toBe(true);
    expect(isDefiLlamaProviderEnabled({ DEFILLAMA_PROVIDER_ENABLED: 'false' } as NodeJS.ProcessEnv)).toBe(false);
    expect(isDefiLlamaProviderEnabled({ DEFILLAMA_PROVIDER_ENABLED: 'true' } as NodeJS.ProcessEnv)).toBe(true);
  });
});

describe('DefiLlamaProtocolProvider.getProtocolTvl', () => {
  it('returns VERIFIED TVL from the latest tvl series entry', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(protocolPayload())) as unknown as typeof fetch;
    const provider = new DefiLlamaProtocolProvider({ fetchImpl, nowMs: () => Date.parse('2024-08-16T00:00:00Z') });

    const result = await provider.getProtocolTvl('aave');
    expect(result.status).toBe('VERIFIED');
    expect(result.tvlUsd).toBe(10_800_000_000);
    expect(result.observedAt).toBe(new Date(1_723_766_400 * 1000).toISOString());
    expect(result.evidenceId).toContain('defillama:protocol-tvl:aave');
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('https://api.llama.fi/protocol/aave'),
      expect.anything(),
    );
  });

  it('never coerces a missing/negative/non-finite TVL to zero', async () => {
    const negative = new DefiLlamaProtocolProvider({
      fetchImpl: vi.fn(async () => jsonResponse(protocolPayload({ tvl: [{ date: 1_723_680_000, totalLiquidityUSD: -5 }] }))) as unknown as typeof fetch,
    });
    const negativeResult = await negative.getProtocolTvl('aave');
    expect(negativeResult.status).toBe('INVALID');
    expect(negativeResult.tvlUsd).toBeNull();

    const nanLike = new DefiLlamaProtocolProvider({
      fetchImpl: vi.fn(async () => jsonResponse(protocolPayload({ tvl: [{ date: 1_723_680_000, totalLiquidityUSD: null }] }))) as unknown as typeof fetch,
    });
    const nanResult = await nanLike.getProtocolTvl('aave');
    expect(nanResult.status).toBe('INVALID');
    expect(nanResult.tvlUsd).toBeNull();

    const empty = new DefiLlamaProtocolProvider({
      fetchImpl: vi.fn(async () => jsonResponse(protocolPayload({ tvl: [] }))) as unknown as typeof fetch,
    });
    const emptyResult = await empty.getProtocolTvl('aave');
    expect(emptyResult.status).toBe('INVALID');
    expect(emptyResult.tvlUsd).toBeNull();
  });

  it('returns NOT_AVAILABLE without a network call when no slug is supplied', async () => {
    const fetchImpl = vi.fn();
    const provider = new DefiLlamaProtocolProvider({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const result = await provider.getProtocolTvl('');
    expect(result.status).toBe('NOT_AVAILABLE');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns NOT_AVAILABLE without a network call when the provider is disabled', async () => {
    const original = process.env.DEFILLAMA_PROVIDER_ENABLED;
    process.env.DEFILLAMA_PROVIDER_ENABLED = 'false';
    try {
      const fetchImpl = vi.fn();
      const provider = new DefiLlamaProtocolProvider({ fetchImpl: fetchImpl as unknown as typeof fetch });
      const result = await provider.getProtocolTvl('aave');
      expect(result.status).toBe('NOT_AVAILABLE');
      expect(result.reason).toMatch(/disabled/);
      expect(fetchImpl).not.toHaveBeenCalled();
    } finally {
      if (original === undefined) delete process.env.DEFILLAMA_PROVIDER_ENABLED;
      else process.env.DEFILLAMA_PROVIDER_ENABLED = original;
    }
  });

  it('retries with backoff then reports NOT_AVAILABLE on repeated 5xx, without a synthetic value', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, false, 503));
    const provider = new DefiLlamaProtocolProvider({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      maxAttempts: 2,
      sleep: async () => {},
      random: () => 0,
    });
    const result = await provider.getProtocolTvl('aave');
    expect(result.status).toBe('NOT_AVAILABLE');
    expect(result.tvlUsd).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('opens the circuit after repeated failures and serves NOT_AVAILABLE without calling fetch again', async () => {
    let now = Date.parse('2024-08-16T00:00:00Z');
    const fetchImpl = vi.fn(async () => jsonResponse({}, false, 500));
    const provider = new DefiLlamaProtocolProvider({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      maxAttempts: 1,
      nowMs: () => now,
    });

    await provider.getProtocolTvl('aave');
    await provider.getProtocolTvl('aave');
    await provider.getProtocolTvl('aave');
    const callsBeforeOpen = fetchImpl.mock.calls.length;

    const result = await provider.getProtocolTvl('aave');
    expect(result.status).toBe('NOT_AVAILABLE');
    expect(result.reason).toMatch(/circuit open/);
    expect(fetchImpl.mock.calls.length).toBe(callsBeforeOpen);
    void now;
  });

  it('serves a cached value again within TTL without a second fetch call', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(protocolPayload()));
    let now = Date.parse('2024-08-16T00:00:00Z');
    const provider = new DefiLlamaProtocolProvider({ fetchImpl: fetchImpl as unknown as typeof fetch, nowMs: () => now });

    const first = await provider.getProtocolTvl('aave');
    expect(first.cacheMode).toBe('fresh');
    now += 60_000;
    const second = await provider.getProtocolTvl('aave');
    expect(second.cacheMode).toBe('cache-hit');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('serves last-known-good as STALE within the freshness ceiling once upstream fails', async () => {
    let now = Date.parse('2024-08-16T00:00:00Z');
    let fail = false;
    const fetchImpl = vi.fn(async () => (fail ? jsonResponse({}, false, 500) : jsonResponse(protocolPayload())));
    const provider = new DefiLlamaProtocolProvider({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      nowMs: () => now,
      maxAttempts: 1,
    });

    await provider.getProtocolTvl('aave');
    now += 10 * 60_000; // past the 5-minute TTL, cache entry becomes eligible for last-known-good
    fail = true;
    const result = await provider.getProtocolTvl('aave');
    expect(result.cacheMode).toBe('last-known-good');
    expect(result.status).toBe('STALE');
    expect(result.tvlUsd).toBe(10_800_000_000);
  });
});

describe('DefiLlamaProtocolProvider.getFeesAndRevenue', () => {
  it('returns VERIFIED fees/revenue for an exact slug match', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(feesOverviewPayload())) as unknown as typeof fetch;
    const provider = new DefiLlamaProtocolProvider({ fetchImpl });
    const result = await provider.getFeesAndRevenue('aave');
    expect(result.status).toBe('VERIFIED');
    expect(result.feesUsd24h).toBe(250_000);
    expect(result.revenueUsd24h).toBe(90_000);
  });

  it('returns NOT_AVAILABLE for a protocol absent from the fees overview, never a fuzzy match', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(feesOverviewPayload())) as unknown as typeof fetch;
    const provider = new DefiLlamaProtocolProvider({ fetchImpl });
    const result = await provider.getFeesAndRevenue('some-unlisted-protocol');
    expect(result.status).toBe('NOT_AVAILABLE');
    expect(result.feesUsd24h).toBeNull();
    expect(result.revenueUsd24h).toBeNull();
  });

  it('treats an invalid JSON body as NOT_AVAILABLE', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('invalid json');
      },
    })) as unknown as typeof fetch;
    const provider = new DefiLlamaProtocolProvider({ fetchImpl, maxAttempts: 1 });
    const result = await provider.getFeesAndRevenue('aave');
    expect(result.status).toBe('NOT_AVAILABLE');
  });

  it('treats an aborted/timeout request as NOT_AVAILABLE without a synthetic value', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }) as unknown as typeof fetch;
    const provider = new DefiLlamaProtocolProvider({ fetchImpl, maxAttempts: 1 });
    const result = await provider.getFeesAndRevenue('aave');
    expect(result.status).toBe('NOT_AVAILABLE');
    expect(result.feesUsd24h).toBeNull();
  });
});
