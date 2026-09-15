import { describe, expect, it } from 'vitest';
import {
  OPERATIONAL_TRACE_STATE_SCHEMA_VERSION,
  type OperationalTraceStateSourceRecord,
} from '../../src/platform/Traceability/Contracts/OperationalTraceStateContract';
import {
  buildOperationalTraceStateProjection,
  projectOperationalTraceStateRecord,
} from '../../src/platform/Traceability/Services/OperationalTraceStateProjection';

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

const STRICT_IDENTITY = 'asset:equity:US:AAPL|provider.alpaca|quote|last';
const STRICT_EVIDENCE_REF = 'evd:alpaca:AAPL:last:20260915T160000Z';
const STRICT_CORRELATION = 'corr-s1-r2-11';

function strictSource(overrides: Partial<OperationalTraceStateSourceRecord> = {}): OperationalTraceStateSourceRecord {
  return source({
    identity: {
      projectId: 'CAPITAL-AI-OPS',
      pvcId: 'PVC-18',
      statusId: 'REQ-COMP-033',
    },
    evidence: [{
      ref: STRICT_EVIDENCE_REF,
      kind: 'trace',
      identityRef: STRICT_IDENTITY,
      correlationId: STRICT_CORRELATION,
    }],
    provenance: {
      source: 'DATA/PVC-10:S1-R2-11',
      sourceRef: 'S1-R2-11',
      sourceTimestamp: '2026-09-15T16:00:00.000Z',
      observedAt: '2026-09-15T16:00:01.000Z',
      freshness: 'FRESH',
    },
    trace: { correlationId: STRICT_CORRELATION, traceId: 'trace-s1-r2-11' },
    strictEvidenceBinding: {
      mode: 'STRICT_IDENTITY_CORRELATION',
      evidenceIdentityRef: STRICT_IDENTITY,
      evidenceRef: STRICT_EVIDENCE_REF,
      correlationId: STRICT_CORRELATION,
    },
    ...overrides,
  });
}

describe('GOV08 OPS operational trace-state projection', () => {
  it('preserves evidenced fresh state without turning it into authority', () => {
    const result = projectOperationalTraceStateRecord(source());

    expect(result.state).toBe('CURRENT');
    expect(result.validation).toBe('PASS');
    expect(result.failsClosed).toBe(false);
    expect(result.strictEvidenceBindingRequired).toBe(false);
    expect(result.trace).toEqual({ correlationId: 'corr-1', traceId: 'trace-1' });

    const envelope = buildOperationalTraceStateProjection([source()], '2026-09-07T04:01:00.000Z');
    expect(envelope.schemaVersion).toBe(OPERATIONAL_TRACE_STATE_SCHEMA_VERSION);
    expect(envelope.schemaVersion).toBe('1.1');
    expect(envelope.authority).toEqual({
      semantics: 'EVIDENCE_ONLY',
      decisionAuthority: false,
      mergeAuthority: false,
      releaseAuthority: false,
      deploymentAuthority: false,
    });
    expect(envelope.missingStateSemantics).toBe('UNKNOWN_NON_PASS');
  });

  it('preserves a fully identity/correlation/freshness-bound strict record', () => {
    const result = projectOperationalTraceStateRecord(strictSource());

    expect(result.state).toBe('CURRENT');
    expect(result.validation).toBe('PASS');
    expect(result.strictEvidenceBindingRequired).toBe(true);
    expect(result.missingCorrelation).toBe(false);
    expect(result.missingEvidenceIdentity).toBe(false);
    expect(result.missingSourceTimestamp).toBe(false);
    expect(result.evidenceBindingMismatch).toBe(false);
    expect(result.failsClosed).toBe(false);
  });

  it('fails closed when strict correlation is missing', () => {
    const result = projectOperationalTraceStateRecord(strictSource({ trace: undefined }));

    expect(result.state).toBe('UNKNOWN');
    expect(result.validation).toBe('UNKNOWN');
    expect(result.missingCorrelation).toBe(true);
    expect(result.failsClosed).toBe(true);
  });

  it('fails closed when strict correlation does not match the trace', () => {
    const result = projectOperationalTraceStateRecord(strictSource({
      trace: { correlationId: 'corr-wrong', traceId: 'trace-s1-r2-11' },
    }));

    expect(result.state).toBe('UNKNOWN');
    expect(result.validation).toBe('UNKNOWN');
    expect(result.evidenceBindingMismatch).toBe(true);
    expect(result.failsClosed).toBe(true);
  });

  it('fails closed when strict evidence identity is missing', () => {
    const result = projectOperationalTraceStateRecord(strictSource({
      evidence: [{
        ref: STRICT_EVIDENCE_REF,
        kind: 'trace',
        correlationId: STRICT_CORRELATION,
      }],
    }));

    expect(result.state).toBe('UNKNOWN');
    expect(result.missingEvidenceIdentity).toBe(true);
    expect(result.failsClosed).toBe(true);
  });

  it('fails closed when strict evidence identity does not match', () => {
    const result = projectOperationalTraceStateRecord(strictSource({
      evidence: [{
        ref: STRICT_EVIDENCE_REF,
        kind: 'trace',
        identityRef: 'asset:equity:US:MSFT|provider.alpaca|quote|last',
        correlationId: STRICT_CORRELATION,
      }],
    }));

    expect(result.state).toBe('UNKNOWN');
    expect(result.evidenceBindingMismatch).toBe(true);
    expect(result.failsClosed).toBe(true);
  });

  it('fails closed when strict evidence has no authoritative source timestamp', () => {
    const result = projectOperationalTraceStateRecord(strictSource({
      provenance: {
        source: 'DATA/PVC-10:S1-R2-11',
        sourceRef: 'S1-R2-11',
        sourceTimestamp: null,
        observedAt: '2026-09-15T16:00:01.000Z',
        freshness: 'FRESH',
      },
    }));

    expect(result.state).toBe('UNKNOWN');
    expect(result.missingSourceTimestamp).toBe(true);
    expect(result.failsClosed).toBe(true);
  });

  it('downgrades stale evidence to UNKNOWN/non-PASS while preserving reported facts', () => {
    const result = projectOperationalTraceStateRecord(strictSource({
      provenance: {
        source: 'DATA/PVC-10:S1-R2-11',
        sourceRef: 'S1-R2-11',
        sourceTimestamp: '2026-09-15T15:00:00.000Z',
        observedAt: '2026-09-15T16:00:01.000Z',
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
    const result = projectOperationalTraceStateRecord(strictSource({ evidence: [] }));

    expect(result.missingEvidence).toBe(true);
    expect(result.state).toBe('UNKNOWN');
    expect(result.validation).toBe('UNKNOWN');
    expect(result.failsClosed).toBe(true);
  });

  it('does not synthesize trace/correlation identity for generic records', () => {
    const { trace: _trace, ...withoutTrace } = source();
    const result = projectOperationalTraceStateRecord(withoutTrace);

    expect(result.trace).toBeUndefined();
    expect(result.strictEvidenceBindingRequired).toBe(false);
    expect(result.state).toBe('CURRENT');
    expect(result.validation).toBe('PASS');
    expect(result.failsClosed).toBe(false);
    expect(JSON.stringify(result)).not.toContain('corr-');
    expect(JSON.stringify(result)).not.toContain('trace-');
  });

  it('does not invent records for missing graph nodes', () => {
    const envelope = buildOperationalTraceStateProjection([], '2026-09-07T04:01:00.000Z');
    expect(envelope.records).toEqual([]);
    expect(envelope.missingStateSemantics).toBe('UNKNOWN_NON_PASS');
  });
});
