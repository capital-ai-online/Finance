import { describe, expect, it } from 'vitest';
import { evaluateCryptoSnapshotConsensus } from '../../src/services/cryptoSnapshotConsensus';
import type { VerifiedFieldProvenance } from '../../src/services/cryptoSnapshotProvider';

function p(input: Partial<VerifiedFieldProvenance> & Pick<VerifiedFieldProvenance, 'field' | 'provider' | 'value' | 'unit'>): VerifiedFieldProvenance {
  return {
    sourcePath: 'https://provider.example/data',
    observedAt: '2026-08-02T08:00:00.000Z',
    retrievedAt: '2026-08-02T08:00:05.000Z',
    ...input,
  } as VerifiedFieldProvenance;
}

describe('crypto snapshot field consensus', () => {
  it('does not treat a single provider as quorum', () => {
    const result = evaluateCryptoSnapshotConsensus('BTC', [
      p({ field: 'marketCapUsd', provider: 'CoinGecko', value: 1_000_000, unit: 'USD' }),
    ]);

    expect(result.status).toBe('INSUFFICIENT_SOURCES');
    expect(result.fields.find(item => item.field === 'marketCapUsd')?.canonicalValue).toBeNull();
  });

  it('returns consensus only for compatible independent observations', () => {
    const result = evaluateCryptoSnapshotConsensus('BTC', [
      p({ field: 'marketCapUsd', provider: 'CoinGecko', value: 1_000_000, unit: 'USD' }),
      p({ field: 'marketCapUsd', provider: 'TwelveData' as any, value: 1_005_000, unit: 'USD' }),
    ], { toleranceBps: 100 });

    const field = result.fields.find(item => item.field === 'marketCapUsd');
    expect(field?.status).toBe('CONSENSUS');
    expect(field?.canonicalValue).not.toBeNull();
    expect(field?.providers).toEqual(['CoinGecko', 'TwelveData']);
    expect(result.status).toBe('PARTIAL');
  });

  it('fails closed on material disagreement', () => {
    const result = evaluateCryptoSnapshotConsensus('BTC', [
      p({ field: 'marketCapUsd', provider: 'CoinGecko', value: 1_000_000, unit: 'USD' }),
      p({ field: 'marketCapUsd', provider: 'EODHD' as any, value: 1_250_000, unit: 'USD' }),
    ], { toleranceBps: 100 });

    const field = result.fields.find(item => item.field === 'marketCapUsd');
    expect(field?.status).toBe('SOURCE_CONFLICT');
    expect(field?.canonicalValue).toBeNull();
    expect(result.status).toBe('SOURCE_CONFLICT');
  });
});
