import { describe, expect, it } from 'vitest';
import { evaluateCryptoSnapshotIntegrity } from '../../src/services/cryptoSnapshotIntegrity';
import type { VerifiedCryptoSnapshot } from '../../src/services/cryptoSnapshotProvider';

function snapshot(overrides: Partial<VerifiedCryptoSnapshot> = {}): VerifiedCryptoSnapshot {
  const observedAt = '2026-08-02T08:00:00.000Z';
  const retrievedAt = '2026-08-02T08:00:05.000Z';
  return {
    symbol: 'BTC',
    provider: 'CoinGecko',
    observedAt,
    retrievedAt,
    marketCapUsd: 2_000_000,
    circulatingSupply: 20_000,
    totalSupply: 21_000,
    maxSupply: 21_000,
    volume24hUsd: 100_000,
    provenance: {
      marketCapUsd: { field: 'marketCapUsd', provider: 'CoinGecko', sourcePath: 'market_data.market_cap.usd', observedAt, retrievedAt, value: 2_000_000, unit: 'USD' },
      circulatingSupply: { field: 'circulatingSupply', provider: 'CoinGecko', sourcePath: 'market_data.circulating_supply', observedAt, retrievedAt, value: 20_000, unit: 'token' },
      totalSupply: { field: 'totalSupply', provider: 'CoinGecko', sourcePath: 'market_data.total_supply', observedAt, retrievedAt, value: 21_000, unit: 'token' },
      maxSupply: { field: 'maxSupply', provider: 'CoinGecko', sourcePath: 'market_data.max_supply', observedAt, retrievedAt, value: 21_000, unit: 'token' },
    },
    cacheMode: 'fresh',
    degraded: false,
    ...overrides,
  };
}

describe('crypto snapshot integrity', () => {
  it('accepts market cap consistent with independent spot quorum × circulating supply', async () => {
    const result = await evaluateCryptoSnapshotIntegrity('BTC', {
      snapshotProvider: async () => snapshot(),
      spotConsensusProvider: async () => ({
        status: 'CONSENSUS',
        canonicalValue: 100,
        observations: [],
        providers: ['CoinAPI', 'TwelveData'],
        evidenceIds: ['spot:coinapi:BTC', 'spot:twelvedata:BTC'],
        maxDeviationBps: 10,
      }),
    });
    expect(result.status).toBe('CONSISTENT');
    expect(result.impliedMarketCapUsd).toBe(2_000_000);
    expect(result.checks.marketCapConsistent).toBe(true);
  });

  it('fails closed when supply ordering is impossible', async () => {
    const result = await evaluateCryptoSnapshotIntegrity('BTC', {
      snapshotProvider: async () => snapshot({ circulatingSupply: 22_000, totalSupply: 21_000, maxSupply: 21_000 }),
      spotConsensusProvider: async () => { throw new Error('must not be called'); },
    });
    expect(result.status).toBe('INVALID_SNAPSHOT');
    expect(result.checks.supplyOrderingValid).toBe(false);
  });

  it('reports source conflict when reported market cap materially disagrees with independent implied value', async () => {
    const result = await evaluateCryptoSnapshotIntegrity('BTC', {
      snapshotProvider: async () => snapshot({ marketCapUsd: 2_500_000 }),
      spotConsensusProvider: async () => ({
        status: 'CONSENSUS',
        canonicalValue: 100,
        observations: [],
        providers: ['CoinAPI', 'TwelveData'],
        evidenceIds: ['spot:coinapi:BTC', 'spot:twelvedata:BTC'],
        maxDeviationBps: 10,
      }),
      marketCapToleranceBps: 500,
    });
    expect(result.status).toBe('SOURCE_CONFLICT');
    expect(result.checks.marketCapConsistent).toBe(false);
    expect(result.marketCapDeviationBps).toBe(2500);
  });
});
