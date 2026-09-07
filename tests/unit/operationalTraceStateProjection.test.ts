import { describe, expect, it } from 'vitest';
import {
  buildOperationalTraceStateProjection,
  projectOperationalTraceStateRecord,
} from '../../src/platform/Traceability/Services/OperationalTraceStateProjection';
import type { OperationalTraceStateSourceRecord } from '../../src/platform/Traceability/Contracts/OperationalTraceStateContract';

function source(overrides: Partial<OperationalTraceStateSourceRecord> = {}): OperationalTraceStateSourceRecord {
  return {
    identity: {
      projectId: 'CAPITAL-AI-OPS',
      pvcId: 'PVC-18',
      statusId: 'OPS-18-A',
    },
    reportedState: 'CURRENT',
    reportedValidation: 'PASS',
    evidence: [{ ref: 'docs/projects/operations/eventmesh/README.md', kind: 'repository' }],
    provenance: {
      source: 'Traceability',
      sourceRef: 'OPS-18-A',
      sourceTimestamp: '2026-09-07T03:56:12.000Z',
      observedAt: '2026-09-07T04:00:00.000Z',
      freshness: 'FRESH',
    },
    trace: { correlationId: 'corr-1', traceId: 'trace-1' },
    ...overrides,
  };
}

describe('GOV08 OPS operational trace-state projection', () => {
  it('preserves evidenced fresh state without turning it into authority', () => {
    const result = projectOperationalTraceStateRecord(source());

    expect(result.state).toBe('CURRENT');
    expect(result.validation).toBe('PASS');
    expect(result.failsClosed).toBe(false);
    expect(result.trace).toEqual({ correlationId: 'corr-1', traceId: 'trace-1' });

    const envelope = buildOperationalTraceStateProjection([source()], '2026-09-07T04:01:00.000Z');
    expect(envelope.authority).toEqual({
      semantics: 'EVIDENCE_ONLY',
      decisionAuthority: false,
      mergeAuthority: false,
      releaseAuthority: false,
      deploymentAuthority: false,
    });
    expect(envelope.missingStateSemantics).toBe('UNKNOWN_NON_PASS');
  });

  it('downgrades stale evidence to UNKNOWN/non-PASS while preserving reported facts', () => {
    const result = projectOperationalTraceStateRecord(source({
      provenance: {
        source: 'Traceability',
        sourceTimestamp: '2026-09-06T04:00:00.000Z',
        observedAt: '2026-09-07T04:00:00.000Z',
        freshness: 'STALE',
      },
    }));

    expect(result.reportedState).toBe('CURRENT');
    expect(result.reportedValidation).toBe('PASS');
    expect(result.state).toBe('UNKNOWN');
    expect(result.validation).toBe('UNKNOWN');
    expect(result.staleOrUnknownFreshness).toBe(true);
    expect(result.failsClosed).toBe(true);
  });

  it('downgrades unknown freshness to UNKNOWN/non-PASS', () => {
    const result = projectOperationalTraceStateRecord(source({
      provenance: {
        source: 'Traceability',
        sourceTimestamp: null,
        observedAt: '2026-09-07T04:00:00.000Z',
        freshness: 'UNKNOWN',
      },
    }));

    expect(result.state).toBe('UNKNOWN');
    expect(result.validation).toBe('UNKNOWN');
    expect(result.staleOrUnknownFreshness).toBe(true);
    expect(result.failsClosed).toBe(true);
  });

  it('downgrades missing evidence to UNKNOWN/non-PASS', () => {
    const result = projectOperationalTraceStateRecord(source({ evidence: [] }));

    expect(result.missingEvidence).toBe(true);
    expect(result.state).toBe('UNKNOWN');
    expect(result.validation).toBe('UNKNOWN');
    expect(result.failsClosed).toBe(true);
  });

  it('does not synthesize trace or correlation identities', () => {
    const { trace: _trace, ...withoutTrace } = source();
    const result = projectOperationalTraceStateRecord(withoutTrace);

    expect(result.trace).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain('corr-');
    expect(JSON.stringify(result)).not.toContain('trace-');
  });

  it('does not invent records for missing graph nodes', () => {
    const envelope = buildOperationalTraceStateProjection([], '2026-09-07T04:01:00.000Z');
    expect(envelope.records).toEqual([]);
    expect(envelope.missingStateSemantics).toBe('UNKNOWN_NON_PASS');
  });
});
