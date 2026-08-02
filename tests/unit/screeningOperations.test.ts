import { describe, expect, it } from 'vitest';
import { buildScreeningOperationsReport } from '../../src/services/screeningOperations';
import type { ScreeningEligibilityResult } from '../../src/services/screeningEligibility';
import type { ScreeningSlaReport } from '../../src/services/screeningSla';

const eligibility = (eligible: boolean, status: ScreeningEligibilityResult['status'] = eligible ? 'ELIGIBLE' : 'SCORE_NOT_READY'): ScreeningEligibilityResult => ({
  contractVersion: 'screening-eligibility/1.0.0',
  eligible,
  status,
  score: eligible ? 80 : null,
  providers: eligible ? ['TwelveData'] : [],
  evidenceIds: eligible ? ['ev-1'] : [],
  evidenceAgeMs: eligible ? 1_000 : null,
  rules: {
    scoreMustBeReady: true,
    syntheticFallbackAllowed: false,
    sourceConflictAllowed: false,
    minimumEvidence: 1,
    minimumProviders: 1,
    maxAgeMs: 86_400_000,
  },
});

const sla = (state: ScreeningSlaReport['state']): ScreeningSlaReport => ({
  contractVersion: 'screening-sla/1.0.0',
  state,
  providersObserved: state === 'NO_RUNTIME_EVIDENCE' ? 0 : 1,
  healthy: state === 'HEALTHY' ? 1 : 0,
  degraded: state === 'DEGRADED' ? 1 : 0,
  unavailable: state === 'UNAVAILABLE' ? 1 : 0,
  noRuntimeEvidence: state === 'NO_RUNTIME_EVIDENCE',
  thresholds: { degradedLatencyMs: 3000, degradedFailureRate: 0.2, unavailableConsecutiveFailures: 3 },
  providers: [],
  hardScreeningBlockEnabled: false,
});

describe('screening operations contract', () => {
  it('reports healthy when eligibility, SLA and quote freshness are healthy', () => {
    const now = Date.parse('2026-08-02T12:00:00Z');
    const result = buildScreeningOperationsReport({
      eligibility: eligibility(true),
      sla: sla('HEALTHY'),
      quoteStatus: 'READY',
      quoteObservedAt: '2026-08-02T11:59:00Z',
      nowMs: now,
    });
    expect(result.state).toBe('HEALTHY');
    expect(result.reasons).toEqual([]);
    expect(result.hardScreeningBlockEnabled).toBe(false);
    expect(result.scoreImpactEnabled).toBe(false);
  });

  it('reports degraded for stale quote evidence without changing the score contract', () => {
    const result = buildScreeningOperationsReport({
      eligibility: eligibility(true),
      sla: sla('HEALTHY'),
      quoteStatus: 'READY',
      quoteObservedAt: '2026-08-02T10:00:00Z',
      nowMs: Date.parse('2026-08-02T12:00:00Z'),
      quoteMaxAgeMs: 15 * 60 * 1000,
    });
    expect(result.state).toBe('DEGRADED');
    expect(result.quote.fresh).toBe(false);
    expect(result.reasons).toContain('quote:STALE_EVIDENCE');
    expect(result.scoreImpactEnabled).toBe(false);
  });

  it('keeps an ineligible score visible as an operations reason rather than mutating it', () => {
    const result = buildScreeningOperationsReport({
      eligibility: eligibility(false, 'SOURCE_CONFLICT'),
      sla: sla('HEALTHY'),
    });
    expect(result.state).toBe('DEGRADED');
    expect(result.screeningEligible).toBe(false);
    expect(result.reasons).toContain('screening:SOURCE_CONFLICT');
  });

  it('propagates unavailable provider SLA', () => {
    const result = buildScreeningOperationsReport({ eligibility: eligibility(true), sla: sla('UNAVAILABLE') });
    expect(result.state).toBe('UNAVAILABLE');
    expect(result.reasons).toContain('sla:UNAVAILABLE');
  });
});
