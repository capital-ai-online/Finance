import { describe, expect, it } from 'vitest';
import { evaluateScreeningEligibility, SCREENING_ELIGIBILITY_CONTRACT_VERSION } from '../../src/services/screeningEligibility';

describe('screeningEligibility', () => {
  it('admits a READY score with provider/evidence coverage', () => {
    const result = evaluateScreeningEligibility({
      scoreStatus: 'READY',
      score: 82,
      providers: ['ProviderA'],
      evidenceIds: ['ev-1'],
      observedAt: '2026-08-02T10:00:00.000Z',
      nowMs: Date.parse('2026-08-02T11:00:00.000Z'),
    });
    expect(result.contractVersion).toBe(SCREENING_ELIGIBILITY_CONTRACT_VERSION);
    expect(result.eligible).toBe(true);
    expect(result.status).toBe('ELIGIBLE');
    expect(result.rules.syntheticFallbackAllowed).toBe(false);
  });

  it('rejects missing scores instead of normalizing them', () => {
    const result = evaluateScreeningEligibility({
      scoreStatus: 'SCORE_NOT_COMPUTABLE', score: null, providers: [], evidenceIds: [],
    });
    expect(result.eligible).toBe(false);
    expect(result.status).toBe('SCORE_NOT_READY');
  });

  it('rejects source conflicts even when a numeric score exists', () => {
    const result = evaluateScreeningEligibility({
      scoreStatus: 'READY', score: 90, providers: ['A', 'B'], evidenceIds: ['1', '2'], sourceConflict: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.status).toBe('SOURCE_CONFLICT');
  });

  it('can require independent provider diversity for critical screening paths', () => {
    const result = evaluateScreeningEligibility({
      scoreStatus: 'READY', score: 75, providers: ['A'], evidenceIds: ['1', '2'], minimumProviders: 2,
    });
    expect(result.eligible).toBe(false);
    expect(result.status).toBe('INSUFFICIENT_PROVIDER_DIVERSITY');
  });

  it('rejects stale evidence when an observation timestamp is available', () => {
    const result = evaluateScreeningEligibility({
      scoreStatus: 'READY',
      score: 75,
      providers: ['A'],
      evidenceIds: ['1'],
      observedAt: '2026-08-01T00:00:00.000Z',
      nowMs: Date.parse('2026-08-03T00:00:00.000Z'),
      maxAgeMs: 24 * 60 * 60 * 1000,
    });
    expect(result.eligible).toBe(false);
    expect(result.status).toBe('STALE_EVIDENCE');
  });
});
