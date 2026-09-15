import { describe, expect, it } from 'vitest';
import {
  DOCUMENTARY_QUALITY_SLO_TARGETS,
  evaluateDocumentaryQualitySlo,
} from '../../src/platform/Documentary/Observability/DocumentaryQualitySlo';
import type { DocumentaryMaintenanceHealthSnapshot } from '../../src/platform/Documentary/Observability/DocumentaryMaintenanceObservability';

function snapshot(overrides: Partial<DocumentaryMaintenanceHealthSnapshot> = {}): DocumentaryMaintenanceHealthSnapshot {
  const base: DocumentaryMaintenanceHealthSnapshot = {
    observabilityVersion: 'documentary-maintenance-observability/1.0.0',
    correlationId: 'corr-quality-slo',
    sourceCommit: 'a'.repeat(40),
    observedAt: '2026-09-15T15:00:00.000Z',
    status: 'HEALTHY',
    metrics: {
      registeredDocuments: 20,
      readableRegisteredDocuments: 20,
      semanticCandidates: 1,
      patchableCandidates: 1,
      reviewOnlyCandidates: 0,
      plannedPatches: 0,
      skippedPatches: 0,
      appliedDocuments: 0,
      hygieneFindingCodes: 0,
      freshnessRatio: 0.95,
      registryCoverageRatio: 1,
      orphanRate: 0,
    },
  };

  return {
    ...base,
    ...overrides,
    metrics: {
      ...base.metrics,
      ...(overrides.metrics ?? {}),
    },
  };
}

describe('Documentary Quality SLO', () => {
  it('meets the owner-approved point-in-time target without granting authority', () => {
    const result = evaluateDocumentaryQualitySlo(snapshot());

    expect(result.status).toBe('MEETS_SLO');
    expect(result.reasons).toEqual([]);
    expect(result.targets).toEqual(DOCUMENTARY_QUALITY_SLO_TARGETS);
    expect(result.evaluationScope).toBe('point-in-time-snapshot');
    expect(result.temporalSloVerified).toBe(false);
    expect(result.decisionAuthorized).toBe(false);
    expect(result.mutationAuthorized).toBe(false);
    expect(result.qualityCenterMutationPerformed).toBe(false);
    expect(result.observabilityMutationPerformed).toBe(false);
  });

  it('reports a freshness SLO breach without converting it into a blocking integrity failure', () => {
    const result = evaluateDocumentaryQualitySlo(snapshot({
      status: 'DEGRADED',
      metrics: {
        ...snapshot().metrics,
        freshnessRatio: 0.949999,
      },
    }));

    expect(result.status).toBe('SLO_BREACH');
    expect(result.reasons).toEqual(['freshness-below-target']);
    expect(result.upstreamHealthStatus).toBe('DEGRADED');
  });

  it('blocks when registry coverage or orphan integrity invariants fail', () => {
    const result = evaluateDocumentaryQualitySlo(snapshot({
      metrics: {
        ...snapshot().metrics,
        registryCoverageRatio: 0.99,
        orphanRate: 0.01,
      },
    }));

    expect(result.status).toBe('BLOCKED');
    expect(result.reasons).toEqual([
      'orphan-rate-invariant-failed',
      'registry-coverage-invariant-failed',
    ]);
  });

  it('blocks on upstream BLOCKED health even when all ratios meet their targets', () => {
    const result = evaluateDocumentaryQualitySlo(snapshot({ status: 'BLOCKED' }));

    expect(result.status).toBe('BLOCKED');
    expect(result.reasons).toEqual(['upstream-health-blocked']);
  });

  it('fails closed on malformed or out-of-range SLI evidence', () => {
    const malformed = snapshot({
      correlationId: ' ',
      sourceCommit: 'not-a-sha',
      observedAt: 'not-a-time',
      metrics: {
        ...snapshot().metrics,
        freshnessRatio: Number.NaN,
        registryCoverageRatio: 1.1,
        orphanRate: -0.1,
      },
    });

    const result = evaluateDocumentaryQualitySlo(malformed);

    expect(result.status).toBe('BLOCKED');
    expect(result.reasons).toEqual([
      'invalid-correlation-id',
      'invalid-freshness-ratio',
      'invalid-observed-at',
      'invalid-orphan-rate',
      'invalid-registry-coverage-ratio',
      'invalid-source-commit',
    ]);
  });

  it('is deterministic for an identical snapshot', () => {
    const input = snapshot({
      metrics: {
        ...snapshot().metrics,
        freshnessRatio: 0.97,
      },
    });

    expect(evaluateDocumentaryQualitySlo(input)).toEqual(evaluateDocumentaryQualitySlo(input));
  });
});
