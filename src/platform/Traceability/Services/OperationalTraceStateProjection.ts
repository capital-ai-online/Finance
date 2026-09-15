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
    ...(source.strictEvidenceBinding
      ? { strictEvidenceBinding: { ...source.strictEvidenceBinding } }
      : {}),
  };
}

function normalized(value: string | undefined): string {
  return value?.trim() ?? '';
}

function isValidTimestamp(value: string | null): boolean {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

export function projectOperationalTraceStateRecord(
  sourceRecord: OperationalTraceStateSourceRecord,
): OperationalTraceStateRecord {
  const source = copySourceRecord(sourceRecord);
  const missingEvidence = source.evidence.length === 0;
  const staleOrUnknownFreshness = source.provenance.freshness !== 'FRESH';
  const strictEvidenceBindingRequired = source.strictEvidenceBinding?.mode === 'STRICT_IDENTITY_CORRELATION';

  const requiredIdentity = normalized(source.strictEvidenceBinding?.evidenceIdentityRef);
  const requiredEvidenceRef = normalized(source.strictEvidenceBinding?.evidenceRef);
  const requiredCorrelation = normalized(source.strictEvidenceBinding?.correlationId);
  const traceCorrelation = normalized(source.trace?.correlationId);

  const evidenceHasIdentity = source.evidence.some((reference) => Boolean(normalized(reference.identityRef)));
  const evidenceHasCorrelation = source.evidence.some((reference) => Boolean(normalized(reference.correlationId)));

  const missingCorrelation = strictEvidenceBindingRequired
    && (!requiredCorrelation || !traceCorrelation || !evidenceHasCorrelation);
  const missingEvidenceIdentity = strictEvidenceBindingRequired
    && (!requiredIdentity || !evidenceHasIdentity);
  const missingSourceTimestamp = strictEvidenceBindingRequired
    && !isValidTimestamp(source.provenance.sourceTimestamp);

  const hasExactBoundEvidence = !strictEvidenceBindingRequired || source.evidence.some((reference) => (
    normalized(reference.ref) === requiredEvidenceRef
    && normalized(reference.identityRef) === requiredIdentity
    && normalized(reference.correlationId) === requiredCorrelation
  ));

  const evidenceBindingMismatch = strictEvidenceBindingRequired
    && !missingCorrelation
    && !missingEvidenceIdentity
    && !missingSourceTimestamp
    && (!requiredEvidenceRef || traceCorrelation !== requiredCorrelation || !hasExactBoundEvidence);

  const failsClosed = missingEvidence
    || staleOrUnknownFreshness
    || missingCorrelation
    || missingEvidenceIdentity
    || missingSourceTimestamp
    || evidenceBindingMismatch;

  return {
    ...source,
    state: failsClosed ? 'UNKNOWN' : source.reportedState,
    validation: failsClosed ? 'UNKNOWN' : source.reportedValidation,
    missingEvidence,
    staleOrUnknownFreshness,
    strictEvidenceBindingRequired,
    missingCorrelation,
    missingEvidenceIdentity,
    missingSourceTimestamp,
    evidenceBindingMismatch,
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
