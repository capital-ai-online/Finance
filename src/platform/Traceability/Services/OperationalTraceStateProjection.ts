// GOV08-OPS-TRACE-STATE-001 / PVC-18.
// Pure projection only: no storage, no EventMesh instance, no trace registry and no authority.

import {
  OPERATIONAL_TRACE_STATE_SCHEMA_VERSION,
  type OperationalTraceStateEnvelope,
  type OperationalTraceStateRecord,
  type OperationalTraceStateSourceRecord,
} from '../Contracts/OperationalTraceStateContract';

function copySourceRecord(source: OperationalTraceStateSourceRecord): OperationalTraceStateSourceRecord {
  return {
    identity: { ...source.identity },
    reportedState: source.reportedState,
    reportedValidation: source.reportedValidation,
    evidence: source.evidence.map((reference) => ({ ...reference })),
    provenance: { ...source.provenance },
    ...(source.trace ? { trace: { ...source.trace } } : {}),
  };
}

export function projectOperationalTraceStateRecord(
  sourceRecord: OperationalTraceStateSourceRecord,
): OperationalTraceStateRecord {
  const source = copySourceRecord(sourceRecord);
  const missingEvidence = source.evidence.length === 0;
  const staleOrUnknownFreshness = source.provenance.freshness !== 'FRESH';
  const failsClosed = missingEvidence || staleOrUnknownFreshness;

  return {
    ...source,
    state: failsClosed ? 'UNKNOWN' : source.reportedState,
    validation: failsClosed ? 'UNKNOWN' : source.reportedValidation,
    missingEvidence,
    staleOrUnknownFreshness,
    failsClosed,
  };
}

/**
 * Builds the smallest immutable JSON-shaped projection required by a read-only Admin graph.
 * Missing graph nodes are intentionally absent from `records`; consumers must apply the envelope's
 * UNKNOWN_NON_PASS rule rather than inventing CURRENT/PASS state.
 */
export function buildOperationalTraceStateProjection(
  sourceRecords: readonly OperationalTraceStateSourceRecord[],
  generatedAt = new Date().toISOString(),
): OperationalTraceStateEnvelope {
  return {
    schemaVersion: OPERATIONAL_TRACE_STATE_SCHEMA_VERSION,
    generatedAt,
    authority: {
      semantics: 'EVIDENCE_ONLY',
      decisionAuthority: false,
      mergeAuthority: false,
      releaseAuthority: false,
      deploymentAuthority: false,
    },
    missingStateSemantics: 'UNKNOWN_NON_PASS',
    records: sourceRecords.map(projectOperationalTraceStateRecord),
  };
}
