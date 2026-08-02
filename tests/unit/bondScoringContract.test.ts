import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/bond-golden-contract-v1.json';
import {
  BOND_FEATURE_CONTRACT_VERSION,
  BOND_SCORING_CONTRACT_VERSION,
  evaluateBondEvidenceGate,
  type BondFeatureInputs,
} from '../../src/types/bondScoringContract';

describe('bond evidence gate contract', () => {
  it('accepts a complete contract fixture but still emits no score', () => {
    const result = evaluateBondEvidenceGate(fixture as BondFeatureInputs);
    expect(result.status).toBe('READY_FOR_MODEL_VALIDATION');
    expect(result.ready).toBe(true);
    expect(result.score).toBeNull();
    expect(result.featureVersion).toBe(BOND_FEATURE_CONTRACT_VERSION);
    expect(result.scoringVersion).toBe(BOND_SCORING_CONTRACT_VERSION);
    expect(result.providers).toEqual(['EODHD', 'FRED']);
    expect(result.evidenceIds.length).toBe(4);
  });

  it('fails closed when yield or curve evidence is missing', () => {
    const incomplete: BondFeatureInputs = {
      ...(fixture as BondFeatureInputs),
      market: { ...(fixture.market as BondFeatureInputs['market']), yieldHistoryEvidenceIds: [] },
      curve: { ...(fixture.curve as BondFeatureInputs['curve']), evidenceIds: [] },
    };
    const result = evaluateBondEvidenceGate(incomplete);
    expect(result.status).toBe('BOND_EVIDENCE_INCOMPLETE');
    expect(result.ready).toBe(false);
    expect(result.score).toBeNull();
    expect(result.missing).toContain('market.yieldHistoryEvidenceIds');
    expect(result.missing).toContain('curve.evidenceIds');
  });
});
