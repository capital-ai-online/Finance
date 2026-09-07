import type { MarketDataQualityState } from './contracts';
import type { MarketEvidenceQualityRecord, MarketEvidenceQualityStatus } from './evidenceQualityContracts';
import { isAdmissibleMarketEvidence } from './evidenceQualityContracts';

export const DATA_QUALITY_GATE_CONTRACT_VERSION = 'data-quality-gate/1.0.0' as const;

export type DataExitStatus =
  | 'PASS'
  | 'PARTIAL'
  | 'FAIL'
  | 'NOT_COMPUTABLE'
  | 'STALE'
  | 'MISSING'
  | 'UNKNOWN';

export const DATA_EXIT_STATUSES = [
  'PASS',
  'PARTIAL',
  'FAIL',
  'NOT_COMPUTABLE',
  'STALE',
  'MISSING',
  'UNKNOWN',
] as const satisfies readonly DataExitStatus[];

/**
 * Severity rank used only to prevent silent upgrades.
 * Higher rank is more blocking. PASS is never recovered from a worse status.
 */
const STATUS_RANK: Record<DataExitStatus, number> = {
  PASS: 0,
  PARTIAL: 1,
  NOT_COMPUTABLE: 2,
  UNKNOWN: 3,
  MISSING: 4,
  STALE: 5,
  FAIL: 6,
};

export type DataQualityExportDecision = {
  readonly contractVersion: typeof DATA_QUALITY_GATE_CONTRACT_VERSION;
  readonly status: DataExitStatus;
  readonly admissibleForFintech: boolean;
  readonly reason: string;
};

export function mapSnapshotQualityToDataStatus(
  state: MarketDataQualityState,
): DataExitStatus {
  switch (state) {
    case 'LIVE':
      return 'PASS';
    case 'DELAYED':
    case 'HISTORICAL':
      return 'PARTIAL';
    case 'DEGRADED':
      return 'UNKNOWN';
    case 'STALE':
      return 'STALE';
    case 'UNAVAILABLE':
      return 'MISSING';
    case 'INVALID':
      return 'FAIL';
  }
}

export function mapEvidenceQualityToDataStatus(
  evidence: Pick<MarketEvidenceQualityRecord, 'qualityStatus'> | MarketEvidenceQualityStatus,
  hasRequiredValue = true,
): DataExitStatus {
  const qualityStatus: MarketEvidenceQualityStatus =
    typeof evidence === 'string' ? evidence : evidence.qualityStatus;

  if (typeof evidence !== 'string' && isAdmissibleMarketEvidence(evidence as MarketEvidenceQualityRecord)) {
    return hasRequiredValue ? 'PASS' : 'MISSING';
  }

  switch (qualityStatus) {
    case 'STALE':
      return 'STALE';
    case 'UNAVAILABLE':
      return 'MISSING';
    case 'NOT_APPLICABLE':
      return 'NOT_COMPUTABLE';
    case 'CONFLICTING':
      return 'UNKNOWN';
    case 'INVALID':
      return 'FAIL';
    case 'VERIFIED':
      return hasRequiredValue ? 'PASS' : 'MISSING';
  }
}

export function aggregateDataStatuses(
  statuses: readonly DataExitStatus[],
): DataExitStatus {
  if (statuses.length === 0) return 'MISSING';
  return statuses.reduce((worst, current) => (
    STATUS_RANK[current] > STATUS_RANK[worst] ? current : worst
  ));
}

export function isAdmissibleFintechInput(status: DataExitStatus): boolean {
  return status === 'PASS' || status === 'PARTIAL';
}

export function wouldSilentlyUpgrade(
  from: DataExitStatus,
  to: DataExitStatus,
): boolean {
  return STATUS_RANK[to] < STATUS_RANK[from];
}

export function evaluateDataQualityGate(
  statuses: readonly DataExitStatus[],
): DataQualityExportDecision {
  const status = aggregateDataStatuses(statuses);
  const admissibleForFintech = isAdmissibleFintechInput(status);
  return {
    contractVersion: DATA_QUALITY_GATE_CONTRACT_VERSION,
    status,
    admissibleForFintech,
    reason: admissibleForFintech
      ? `export-admissible:${status}`
      : `blocked-non-admissible:${status}`,
  };
}
