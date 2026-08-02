import { describe, expect, it } from 'vitest';
import { evaluateHorizonExactScoreValidation } from '../../src/services/horizonExactScoreValidation';

describe('horizon exact score validation', () => {
  it('evaluates only snapshots with verified horizon evidence', async () => {
    const snapshots = [
      { symbol: 'AAA', assetClass: 'stock' as const, snapshotDate: '2026-01-01', snapshotPrice: 100, score: 8, scoreBasis: 'market-data' },
      { symbol: 'BBB', assetClass: 'stock' as const, snapshotDate: '2026-01-01', snapshotPrice: 100, score: 8, scoreBasis: 'market-data' },
    ];

    const result = await evaluateHorizonExactScoreValidation({
      snapshots,
      horizonDays: 30,
      threshold: 6.5,
      minimumEvaluated: 1,
      resolveEvidence: async (snapshot) => snapshot.symbol === 'AAA'
        ? {
            contractVersion: 'horizon-validation-provider/1.0.0',
            providersAttempted: ['TwelveData'],
            providersSucceeded: ['TwelveData'],
            evidence: {
              contractVersion: 'horizon-validation-evidence/1.0.0',
              status: 'READY',
              targetAt: '2026-01-31T00:00:00.000Z',
              selected: { observedAt: '2026-01-31T00:00:00.000Z', price: 110, provider: 'TwelveData', evidenceId: 'td:AAA:2026-01-31' },
              distanceMs: 0,
              maxDistanceMs: 129600000,
              interpolationAllowed: false,
              syntheticEvidenceAllowed: false,
              reason: 'verified',
            },
            sourceErrors: [],
            requestBudget: { maxProvidersPerSnapshot: 1, stopAfterFirstReady: true, exhausted: false },
            syntheticEvidenceAllowed: false,
          }
        : {
            contractVersion: 'horizon-validation-provider/1.0.0',
            providersAttempted: ['TwelveData'],
            providersSucceeded: [],
            evidence: {
              contractVersion: 'horizon-validation-evidence/1.0.0',
              status: 'NO_VERIFIED_POINT_IN_WINDOW',
              targetAt: '2026-01-31T00:00:00.000Z',
              selected: null,
              distanceMs: null,
              maxDistanceMs: 129600000,
              interpolationAllowed: false,
              syntheticEvidenceAllowed: false,
              reason: 'none',
            },
            sourceErrors: [],
            requestBudget: { maxProvidersPerSnapshot: 1, stopAfterFirstReady: true, exhausted: false },
            syntheticEvidenceAllowed: false,
          },
    });

    expect(result.status).toBe('READY');
    expect(result.overall.evaluated).toBe(1);
    expect(result.overall.skippedNoEvidence).toBe(1);
    expect(result.overall.truePositives).toBe(1);
    expect(result.methodology.currentRegistryPriceAllowed).toBe(false);
  });
});
