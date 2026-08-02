import { describe, expect, it } from 'vitest';
import { decorateScreeningBatchWithGovernance } from '../../src/services/screeningBatchGovernance';

describe('screeningBatchGovernance', () => {
  it('decorates eligible screening results without modifying the score', () => {
    const result = decorateScreeningBatchWithGovernance([
      {
        correlationId: 'root:AAPL',
        symbol: 'AAPL',
        assetType: 'stock',
        status: 'READY',
        score: 7.4,
        providers: ['TwelveData'],
        evidenceIds: ['ev-1'],
        observedAt: '2026-08-02T12:00:00.000Z',
      },
    ], [{ provider: 'TwelveData', successes: 10, failures: 0, consecutiveFailures: 0, cooldownUntilMs: 0, ewmaLatencyMs: 200 }]);

    expect(result.results[0].score).toBe(7.4);
    expect(result.results[0].screeningEligibility.eligible).toBe(true);
    expect(result.results[0].screeningOperations.scoreImpactEnabled).toBe(false);
    expect(result.results[0].screeningSloEvidence.hardScreeningBlockEnabled).toBe(false);
  });

  it('keeps non-computable results ineligible instead of fabricating a score', () => {
    const result = decorateScreeningBatchWithGovernance([
      {
        correlationId: 'root:XYZ',
        symbol: 'XYZ',
        assetType: 'stock',
        status: 'SCORE_NOT_COMPUTABLE',
        score: null,
        providers: [],
        evidenceIds: [],
      },
    ], []);

    expect(result.results[0].score).toBeNull();
    expect(result.results[0].screeningEligibility.eligible).toBe(false);
    expect(result.providerSlaState).toBe('NO_RUNTIME_EVIDENCE');
  });
});
