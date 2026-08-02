import { describe, expect, it } from 'vitest';
import {
  evaluateCryptoSnapshotConsensus,
  type SnapshotFieldProvenance,
} from '../../src/services/cryptoSnapshotConsensus';

function p(input: Partial<SnapshotFieldProvenance> & Pick<SnapshotFieldProvenance, 'field' | 'provider' | 'value' | 'unit'>): SnapshotFieldProvenance {
  return {
    sourcePath: 'https://provider.example/data',
    observedAt: '2026-08-02T08:00:00.000Z',
    retrievedAt: '2026-08-02T08:00:05.000Z',
    ...input,
  };
}

describe('crypto snapshot field consensus', () => {
  it('does not treat a single provider as quorum', () => {
    const result = evaluateCryptoSnapshotConsensus('BTC', [
      p({ field: 'marketCapUsd', provider: 'CoinGecko', value: 1_000_000, unit: 'USD', semanticScope: 'global-circulating-supply' }),
    ]);

    expect(result.status).toBe('INSUFFICIENT_SOURCES');
    expect(result.fields.find(item => item.field === 'marketCapUsd')?.canonicalValue).toBeNull();
  });

  it('returns consensus only for compatible independent observations', () => {
    const result = evaluateCryptoSnapshotConsensus('BTC', [
      p({ field: 'marketCapUsd', provider: 'CoinGecko', value: 1_000_000, unit: 'USD', semanticScope: 'global-circulating-supply' }),
      p({ field: 'marketCapUsd', provider: 'TwelveData', value: 1_005_000, unit: 'USD', semanticScope: 'global-circulating-supply' }),
    ]);

    const field = result.fields.find(item => item.field === 'marketCapUsd');
    expect(field?.status).toBe('CONSENSUS');
    expect(field?.canonicalValue).not.toBeNull();
    expect(field?.providers).toEqual(['CoinGecko', 'TwelveData']);
    expect(result.status).toBe('PARTIAL');
  });

  it('fails closed on material disagreement', () => {
    const result = evaluateCryptoSnapshotConsensus('BTC', [
      p({ field: 'marketCapUsd', provider: 'CoinGecko', value: 1_000_000, unit: 'USD', semanticScope: 'global-circulating-supply' }),
      p({ field: 'marketCapUsd', provider: 'EODHD', value: 1_250_000, unit: 'USD', semanticScope: 'global-circulating-supply' }),
    ]);

    const field = result.fields.find(item => item.field === 'marketCapUsd');
    expect(field?.status).toBe('SOURCE_CONFLICT');
    expect(field?.canonicalValue).toBeNull();
    expect(result.status).toBe('SOURCE_CONFLICT');
  });

  it('rejects apparently similar volume observations with incompatible aggregation scope', () => {
    const result = evaluateCryptoSnapshotConsensus('BTC', [
      p({ field: 'volume24hUsd', provider: 'CoinGecko', value: 10_000_000, unit: 'USD', semanticScope: 'global-aggregate-24h' }),
      p({ field: 'volume24hUsd', provider: 'CoinAPI', value: 9_950_000, unit: 'USD', semanticScope: 'single-exchange-24h' }),
    ]);

    const field = result.fields.find(item => item.field === 'volume24hUsd');
    expect(field?.status).toBe('NON_COMPARABLE_EVIDENCE');
    expect(field?.canonicalValue).toBeNull();
    expect(result.status).toBe('NON_COMPARABLE_EVIDENCE');
  });
});
