import { describe, expect, it } from 'vitest';
import { evaluateScreeningEligibility } from '../../src/services/screeningEligibility';
import { buildScreeningSlaReport } from '../../src/services/screeningSla';
import { buildScreeningOperationsReport } from '../../src/services/screeningOperations';
import { buildScreeningSloEvidenceRecord } from '../../src/services/screeningSloEvidence';

const eligible = evaluateScreeningEligibility({
  scoreStatus: 'READY',
  score: 81.4,
  providers: ['Twelve Data'],
  evidenceIds: ['td:AAPL:quote:1'],
  observedAt: '2026-08-02T12:00:00.000Z',
  nowMs: Date.parse('2026-08-02T12:01:00.000Z'),
});

const healthySla = buildScreeningSlaReport([
  {
    provider: 'Twelve Data',
    successes: 10,
    failures: 0,
    consecutiveFailures: 0,
    cooldownUntilMs: 0,
    ewmaLatencyMs: 320,
  },
], { nowMs: Date.parse('2026-08-02T12:01:00.000Z') });

describe('screening SLO evidence', () => {
  it('creates append-only-ready evidence without changing the score boundary', () => {
    const operations = buildScreeningOperationsReport({
      eligibility: eligible,
      sla: healthySla,
      quoteStatus: 'READY',
      quoteObservedAt: '2026-08-02T12:00:30.000Z',
      nowMs: Date.parse('2026-08-02T12:01:00.000Z'),
    });

    const evidence = buildScreeningSloEvidenceRecord({
      correlationId: 'screening:AAPL:123',
      symbol: 'AAPL',
      assetClass: 'stock',
      observedAt: '2026-08-02T12:01:00.000Z',
      report: operations,
    });

    expect(evidence.contractVersion).toBe('screening-slo-evidence/1.0.0');
    expect(evidence.state).toBe('HEALTHY');
    expect(evidence.eligible).toBe(true);
    expect(evidence.quoteFresh).toBe(true);
    expect(evidence.scoreImpactEnabled).toBe(false);
    expect(evidence.hardScreeningBlockEnabled).toBe(false);
    expect(evidence.persistencePolicy.syntheticEvidenceAllowed).toBe(false);
    expect(evidence.persistencePolicy.secretsAllowed).toBe(false);
  });

  it('preserves degraded operations evidence rather than fabricating a healthy SLO', () => {
    const degradedSla = buildScreeningSlaReport([
      {
        provider: 'Twelve Data',
        successes: 5,
        failures: 3,
        consecutiveFailures: 1,
        cooldownUntilMs: 0,
        ewmaLatencyMs: 4500,
      },
    ], { nowMs: Date.parse('2026-08-02T12:01:00.000Z') });

    const operations = buildScreeningOperationsReport({
      eligibility: eligible,
      sla: degradedSla,
      quoteStatus: 'READY',
      quoteObservedAt: '2026-08-02T11:20:00.000Z',
      quoteMaxAgeMs: 15 * 60 * 1000,
      nowMs: Date.parse('2026-08-02T12:01:00.000Z'),
    });

    const evidence = buildScreeningSloEvidenceRecord({ correlationId: 'screening:AAPL:degraded', report: operations });
    expect(evidence.state).toBe('DEGRADED');
    expect(evidence.quoteFresh).toBe(false);
    expect(evidence.reasons).toContain('quote:STALE_EVIDENCE');
    expect(evidence.scoreImpactEnabled).toBe(false);
  });
});
