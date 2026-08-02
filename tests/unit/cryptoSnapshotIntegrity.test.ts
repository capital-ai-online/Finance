import { describe, expect, it } from 'vitest';
import { evaluateCryptoSnapshotIntegrity } from '../../src/services/cryptoSnapshotIntegrity';
import type { VerifiedCryptoSnapshot } from '../../src/services/cryptoSnapshotProvider';
import type { MarketConsensusResult } from '../../src/services/marketDataConsensus';

const snapshot: VerifiedCryptoSnapshot = {
  symbol: 'BTC',
  provider: 'CoinGecko',
  observedAt: '2026-08-02T08:00:00.000Z',
  retrievedAt: '2026-08-02T08:00:10.000Z',
  marketCapUsd: 1_000_000,
  volume24hUsd: 50_000,
  circulatingSupply: 100,
  totalSupply: 120,
  maxSupply: 150,
  provenance: {
    marketCapUsd: { field: 'marketCapUsd', provider: 'CoinGecko', sourcePath: 'market_data.market_cap.usd', observedAt: '2026-08-02T08:00:00.000Z', retrievedAt: '2026-08-02T08:00:10.000Z', value: 1_000_000, unit: 'USD' },
    circulatingSupply: { field: 'circulatingSupply', provider: 'CoinGecko', sourcePath: 'market_data.circulating_supply', observedAt: '2026-08-02T08:00:00.000Z', retrievedAt: '2026-08-02T08:00:10.000Z', value: 100, unit: 'token' },
  },
  cacheMode: 'fresh',
  degraded: false,
};

function consensus(value: number): MarketConsensusResult {
  return {
    status: 'CONSENSUS',
    canonicalValue: value,
    observations: [],
    providers: ['CoinAPI', 'TwelveData'],
    evidenceIds: ['spot:coinapi:BTC', 'spot:twelvedata:BTC'],
    maxDeviationBps: 5,
  };
}

describe('crypto snapshot integrity', () => {
  it('accepts a market cap consistent with independent price quorum', async () => {
    const result = await evaluateCryptoSnapshotIntegrity('BTC', {
      snapshotProvider: async () => snapshot,
      spotConsensusProvider: async () => consensus(10_000),
    });
    expect(result.status).toBe('CONSISTENT');
    expect(result.checks.supplyOrderingValid).toBe(true);
    expect(result.checks.marketCapConsistent).toBe(true);
    expect(result.marketCapDeviationBps).toBe(0);
  });

  it('flags a material market-cap conflict without synthesizing a replacement value', async () => {
    const result = await evaluateCryptoSnapshotIntegrity('BTC', {
      snapshotProvider: async () => snapshot,
      spotConsensusProvider: async () => consensus(8_000),
      marketCapToleranceBps: 500,
    });
    expect(result.status).toBe('SOURCE_CONFLICT');
    expect(result.checks.marketCapConsistent).toBe(false);
    expect(result.reportedMarketCapUsd).toBe(1_000_000);
    expect(result.impliedMarketCapUsd).toBe(800_000);
  });

  it('rejects invalid supply ordering before price comparison', async () => {
    const invalid: VerifiedCryptoSnapshot = { ...snapshot, circulatingSupply: 200, totalSupply: 120, maxSupply: 150 };
    const result = await evaluateCryptoSnapshotIntegrity('BTC', {
      snapshotProvider: async () => invalid,
      spotConsensusProvider: async () => { throw new Error('must not be called'); },
    });
    expect(result.status).toBe('INVALID_SNAPSHOT');
    expect(result.checks.supplyOrderingValid).toBe(false);
  });
});
