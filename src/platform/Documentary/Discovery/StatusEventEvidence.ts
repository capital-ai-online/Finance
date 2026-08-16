/**
 * Documentary Phase B — Status-Event Drift types (read-only).
 * Authority: docs/architecture/DOCUMENTARY_STATUS_EVENT_DRIFT_CONTRACT.md
 * ESS-0010 Discovery / Governance input. No file writes.
 */

export type StatusHeaderClass =
  | 'PRE_MUTATION'
  | 'IN_PROGRESS'
  | 'APPLIED'
  | 'VERIFIED'
  | 'SUPERSEDED'
  | 'ARCHIVED'
  | 'OTHER'
  | 'UNKNOWN';

export type EvidenceStatus =
  | 'NONE'
  | 'APPLIED'
  | 'APPLIED_WITH_VERIFICATION'
  | 'CONFLICTING';

/** Optional trigger context: successful merge of a related PR/commit. */
export interface StatusEventMergeTrigger {
  /** True when the scan is driven by a successful merge event. */
  mergeSucceeded: boolean;
  /** Merged PR number when known. */
  pullRequestNumber?: number;
  /** Merge commit SHA when known. */
  mergeCommitSha?: string;
  /** ISO timestamp of the merge when known. */
  mergedAt?: string;
}

export interface StatusEventDriftFinding {
  documentPath: string;
  headerStatus: string | null;
  headerClass: StatusHeaderClass;
  evidenceStatus: EvidenceStatus;
  claimId: string | null;
  claimStatus: string | null;
  claimPath: string | null;
  drift: boolean;
  conflict: boolean;
  recommendedHeaderStatus: string | null;
  sourceEvidenceIds: string[];
  evidenceTimestamps: string[];
  /** Present when the scan was triggered by a successful merge. */
  mergeTrigger?: StatusEventMergeTrigger;
  provenance: {
    claimPath: string | null;
    evidenceSection: string | null;
    detectorVersion: string;
    scannedAt: string;
    sourceCommit?: string;
  };
}

export interface StatusEventDriftReport {
  scannedAt: string;
  detectorVersion: string;
  sourceCommit?: string;
  mergeTrigger?: StatusEventMergeTrigger;
  findings: StatusEventDriftFinding[];
  summary: {
    scanned: number;
    drift: number;
    conflict: number;
    clean: number;
  };
}

export const STATUS_EVENT_DETECTOR_VERSION = '0.1.0-phase-b';
