import { describe, expect, it } from 'vitest';
import { getLiveCryptoSnapshotConsensus } from '../../src/services/liveCryptoSnapshotConsensus';
import { resetCryptoSnapshotProviderState } from '../../src/services/cryptoSnapshotProvider';

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('live crypto snapshot consensus', () => {
  it('produces cross-provider consensus for compatible CoinGecko and CoinMarketCap fields', async () => {
    resetCryptoSnapshotProviderState();
    const observedAt = '2026-08-02T08:00:00.000Z';
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.coingecko.com')) {
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
      if (url.includes('pro-api.coinmarketcap.com')) {
        return jsonResponse({
          data: {
            BTC: [{
              circulating_supply: 19_010_000,
              max_supply: 21_000_000,
              total_supply: 20_005_000,
              quote: { USD: { market_cap: 1_003_000, volume_24h: 102_000, last_updated: observedAt } },
            }],
          },
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }) as typeof fetch;

    const result = await getLiveCryptoSnapshotConsensus('BTC', {
      fetchImpl,
      coinMarketCapApiKey: 'test-key',
      nowMs: () => Date.parse('2026-08-02T08:01:00.000Z'),
    });

    expect(result.status).toBe('CONSENSUS');
    expect(result.providers).toEqual(['CoinGecko', 'CoinMarketCap']);
    expect(result.fields.find(field => field.field === 'marketCapUsd')?.status).toBe('CONSENSUS');
    expect(result.evidenceIds.some(id => id.includes('coinmarketcap'))).toBe(true);
  });

  it('returns SOURCE_CONFLICT instead of a canonical value when critical fields diverge', async () => {
    resetCryptoSnapshotProviderState();
    const observedAt = '2026-08-02T08:00:00.000Z';
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.coingecko.com')) {
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
      return jsonResponse({
        data: {
          BTC: [{
            circulating_supply: 15_000_000,
            max_supply: 21_000_000,
            total_supply: 16_000_000,
            quote: { USD: { market_cap: 1_500_000, volume_24h: 250_000, last_updated: observedAt } },
          }],
        },
      });
    }) as typeof fetch;

    const result = await getLiveCryptoSnapshotConsensus('BTC', {
      fetchImpl,
      coinMarketCapApiKey: 'test-key',
      nowMs: () => Date.parse('2026-08-02T08:01:00.000Z'),
    });

    expect(result.status).toBe('SOURCE_CONFLICT');
    const marketCap = result.fields.find(field => field.field === 'marketCapUsd');
    expect(marketCap?.status).toBe('SOURCE_CONFLICT');
    expect(marketCap?.canonicalValue).toBeNull();
  });
});
