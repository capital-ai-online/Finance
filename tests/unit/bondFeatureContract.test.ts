import { describe, expect, it } from 'vitest';
import { validateBondFeatureCandidate, BOND_FEATURE_CONTRACT_VERSION } from '../../src/services/bondFeatureContract';
import { BOND_GOLDEN_DATASET } from '../fixtures/bondGoldenDataset';

describe('bond feature evidence contract', () => {
  for (const fixture of BOND_GOLDEN_DATASET) {
    it(fixture.name, () => {
      const result = validateBondFeatureCandidate(fixture.candidate, Date.parse('2026-08-02T09:00:00.000Z'));
      expect(result.version).toBe(BOND_FEATURE_CONTRACT_VERSION);
      expect(result.status).toBe(fixture.expectedStatus);
      expect(result.scoringEnabled).toBe(false);
    });
  }

  it('rejects stale evidence before any scoring activation', () => {
    const base = BOND_GOLDEN_DATASET[0].candidate;
    const result = validateBondFeatureCandidate({
      ...base,
      evidence: base.evidence.map(item => ({
        ...item,
        observedAt: '2026-07-01T00:00:00.000Z',
        retrievedAt: '2026-07-01T01:00:00.000Z',
      })),
    }, Date.parse('2026-08-02T09:00:00.000Z'));

    expect(result.status).toBe('STALE_EVIDENCE');
    expect(result.scoringEnabled).toBe(false);
  });
});
