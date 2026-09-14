import { describe, expect, it } from 'vitest';
import { getLiveCryptoSnapshotConsensus } from '../../src/services/liveCryptoSnapshotConsensus';
import { resetCryptoSnapshotProviderState } from '../../src/services/cryptoSnapshotProvider';
import { hostEquals } from '../../src/platform/Security/safeIo';

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('live crypto snapshot consensus', () => {
  it('reports INSUFFICIENT_SOURCES with only a single provenance source (CoinGecko)', async () => {
    resetCryptoSnapshotProviderState();
    const observedAt = '2026-08-02T08:00:00.000Z';
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (hostEquals(url, 'api.coingecko.com')) {
        return jsonResponse({
          market_data: {
            market_cap: { usd: 1_000_000 },
            total_volume: { usd: 100_000 },
            circulating_supply: 19_000_000,
            max_supply: 21_000_000,
            total_supply: 20_000_000,
            last_updated: observedAt,
          },
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }) as typeof fetch;

    const result = await getLiveCryptoSnapshotConsensus('BTC', {
      fetchImpl,
      nowMs: () => Date.parse('2026-08-02T08:01:00.000Z'),
    });

    // Every quorum-gated field requires >=2 independent providers (see FIELD_POLICY in
    // marketSnapshotConsensus.ts). With CoinMarketCap removed and no replacement second
    // provider, a single-source snapshot must never be reported as CONSENSUS.
    expect(result.status).toBe('INSUFFICIENT_SOURCES');
    expect(result.providers).toEqual(['CoinGecko']);
    expect(result.fields.find(field => field.field === 'marketCapUsd')?.status).toBe('INSUFFICIENT_SOURCES');
    expect(result.fields.find(field => field.field === 'marketCapUsd')?.canonicalValue).toBeNull();
  });

  it('reports INSUFFICIENT_SOURCES when no provider snapshot is available at all', async () => {
    resetCryptoSnapshotProviderState();
    const fetchImpl = (async () => new Response('not found', { status: 404 })) as typeof fetch;

    const result = await getLiveCryptoSnapshotConsensus('BTC', {
      fetchImpl,
      nowMs: () => Date.parse('2026-08-02T08:01:00.000Z'),
    });

    expect(result.status).toBe('INSUFFICIENT_SOURCES');
    expect(result.providers).toEqual([]);
  });
});
