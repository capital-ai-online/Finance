import { describe, expect, it } from 'vitest';
import { evaluateSnapshotFieldConsensus } from '../../src/services/marketSnapshotConsensus';

const base = {
  assetId: 'BTC',
  observedAt: '2026-08-02T08:00:00.000Z',
  retrievedAt: '2026-08-02T08:00:05.000Z',
  unit: 'USD',
};

describe('market snapshot semantic consensus', () => {
  it('returns consensus for compatible market-cap observations within tolerance', () => {
    const result = evaluateSnapshotFieldConsensus([
      { ...base, field: 'marketCapUsd', semanticScope: 'global-circulating-supply', provider: 'A', value: 100_000, evidenceId: 'a' },
      { ...base, field: 'marketCapUsd', semanticScope: 'global-circulating-supply', provider: 'B', value: 101_000, evidenceId: 'b' },
    ]);
    expect(result.status).toBe('CONSENSUS');
    expect(result.canonicalValue).toBe(100_500);
  });

  it('rejects volume observations with incompatible aggregation scopes', () => {
    const result = evaluateSnapshotFieldConsensus([
      { ...base, field: 'volume24hUsd', semanticScope: 'global-aggregate-24h', provider: 'A', value: 10_000, evidenceId: 'a' },
      { ...base, field: 'volume24hUsd', semanticScope: 'single-exchange-24h', provider: 'B', value: 9_900, evidenceId: 'b' },
    ]);
    expect(result.status).toBe('NON_COMPARABLE_EVIDENCE');
    expect(result.canonicalValue).toBeNull();
  });

  it('returns source conflict when compatible observations exceed field tolerance', () => {
    const result = evaluateSnapshotFieldConsensus([
      { ...base, field: 'circulatingSupply', semanticScope: 'circulating-token-supply', provider: 'A', value: 19_000_000, unit: 'token', evidenceId: 'a' },
      { ...base, field: 'circulatingSupply', semanticScope: 'circulating-token-supply', provider: 'B', value: 20_000_000, unit: 'token', evidenceId: 'b' },
    ]);
    expect(result.status).toBe('SOURCE_CONFLICT');
    expect(result.canonicalValue).toBeNull();
  });
});
