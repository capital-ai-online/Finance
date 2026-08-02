import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getVerifiedCryptoSnapshot,
  resetCryptoSnapshotProviderState,
} from '../../src/services/cryptoSnapshotProvider';

function payload() {
  return {
    market_data: {
      market_cap: { usd: 400_000_000_000 },
      total_volume: { usd: 20_000_000_000 },
      circulating_supply: 120_000_000,
      max_supply: null,
      total_supply: 120_000_000,
      last_updated: '2026-08-02T06:00:00.000Z',
    },
  };
}

afterEach(() => {
  resetCryptoSnapshotProviderState();
  vi.restoreAllMocks();
});

describe('cryptoSnapshotProvider provenance', () => {
  it('returns verified fields with source paths and timestamps', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(payload()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    const snapshot = await getVerifiedCryptoSnapshot('ETH', {
      fetchImpl: fetchMock as unknown as typeof fetch,
      nowMs: () => Date.parse('2026-08-02T06:00:01.000Z'),
    });

    expect(snapshot?.marketCapUsd).toBe(400_000_000_000);
    expect(snapshot?.volume24hUsd).toBe(20_000_000_000);
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
