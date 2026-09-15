// GOV08-OPS-TRACE-STATE-001 / PVC-18.
//
// Canonical read-only operational/traceability projection consumed by presentation surfaces.
// This contract transports evidence. It never grants approval, merge, release, deployment or
// business-decision authority, and it does not create a second EventMesh or trace store.

export const OPERATIONAL_TRACE_STATE_SCHEMA_VERSION = '1.1' as const;

export type OperationalTraceState = 'CURRENT' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';
export type OperationalTraceValidationState = 'PASS' | 'FAIL' | 'PENDING' | 'NOT_RUN' | 'UNKNOWN';
export type OperationalTraceFreshnessState = 'FRESH' | 'STALE' | 'UNKNOWN';
export type OperationalTraceEvidenceKind =
  | 'repository'
  | 'runtime'
  | 'trace'
  | 'validation'
  | 'external';

/** Organizational identity only. PVC ownership remains canonical in docs/projects/*. */
export interface OperationalTraceProjectIdentity {
  projectId: string;
  pvcId: `PVC-${number}`;
  /** Stable identity of the projected status/work item supplied by the owning source. */
  statusId: string;
}

/**
 * Trace identifiers are copied only when the authoritative source already supplies them.
 * This projection MUST NOT synthesize correlation, trace or span identities.
 */
export interface OperationalTraceCorrelationIdentity {
  correlationId?: string;
  traceId?: string;
  spanId?: string;
}

export interface OperationalTraceEvidenceReference {
  /** Repository path, evidence ID, trace reference or other source-owned opaque reference. */
  ref: string;
  kind: OperationalTraceEvidenceKind;
  label?: string;
  /** Optional source-owned immutable identity. Never synthesized by this projection. */
  identityRef?: string;
  /** Optional source-owned correlation identity for this exact evidence reference. */
  correlationId?: string;
}

/**
 * Optional bounded integrity requirement for records that must prove one exact source-owned
 * evidence identity/correlation pair. Generic operational records remain backward-compatible and
 * do not acquire this stricter requirement unless the source explicitly opts in.
 */
export interface OperationalTraceStrictEvidenceBinding {
  mode: 'STRICT_IDENTITY_CORRELATION';
  evidenceIdentityRef: string;
  evidenceRef: string;
  correlationId: string;
}

/**
 * sourceTimestamp is the source event/state time only when the source can state it authoritatively.
 * observedAt is when the projection source observed/read that fact. They are deliberately separate.
 */
export interface OperationalTraceProvenance {
  source: string;
  sourceRef?: string;
  sourceTimestamp: string | null;
  observedAt: string;
  freshness: OperationalTraceFreshnessState;
}

/** Input supplied by an existing EventMesh/Traceability/status owner. No state is invented here. */
export interface OperationalTraceStateSourceRecord {
  identity: OperationalTraceProjectIdentity;
  reportedState: OperationalTraceState;
  reportedValidation: OperationalTraceValidationState;
  evidence: readonly OperationalTraceEvidenceReference[];
  provenance: OperationalTraceProvenance;
  trace?: OperationalTraceCorrelationIdentity;
  strictEvidenceBinding?: OperationalTraceStrictEvidenceBinding;
}

/**
 * Normalized record exposed to read-only consumers.
 * `state` and `validation` are fail-closed effective values; reported values remain visible only
 * so a consumer can explain why stale/missing or strictly unbound evidence was downgraded to UNKNOWN.
 */
export interface OperationalTraceStateRecord extends OperationalTraceStateSourceRecord {
  state: OperationalTraceState;
  validation: OperationalTraceValidationState;
  missingEvidence: boolean;
  staleOrUnknownFreshness: boolean;
  strictEvidenceBindingRequired: boolean;
  missingCorrelation: boolean;
  missingEvidenceIdentity: boolean;
  missingSourceTimestamp: boolean;
  evidenceBindingMismatch: boolean;
  failsClosed: boolean;
}

export interface OperationalTraceStateEnvelope {
  schemaVersion: typeof OPERATIONAL_TRACE_STATE_SCHEMA_VERSION;
  generatedAt: string;
  authority: {
    semantics: 'EVIDENCE_ONLY';
    decisionAuthority: false;
    mergeAuthority: false;
    releaseAuthority: false;
    deploymentAuthority: false;
  };
  missingStateSemantics: 'UNKNOWN_NON_PASS';
  records: readonly OperationalTraceStateRecord[];
}
