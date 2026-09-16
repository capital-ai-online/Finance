import { UNIVERSAL_ASSET_CONTRACT_VERSION } from '../Scoring/contracts';
import {
  evaluateDataQualityGate,
  isAdmissibleFintechInput,
} from './dataQualityGate';
import {
  VALIDATED_DATA_INPUT_CONTRACT_VERSION,
  type ValidatedDataInput,
  type ValidatedDataObservation,
  type ValidatedDataStatus,
} from './ValidatedDataInput';

export type FintechAdmissibleDataStatus = Extract<ValidatedDataStatus, 'PASS' | 'PARTIAL'>;

export interface FintechNumericObservation
  extends Omit<ValidatedDataObservation, 'value' | 'evidenceRef' | 'observedAt' | 'freshness' | 'status'> {
  readonly value: number;
  readonly evidenceRef: string;
  readonly observedAt: string;
  readonly freshness: {
    readonly ageMs: number;
    readonly maxAgeMs: number;
    readonly evaluatedAt: string;
  };
  readonly status: FintechAdmissibleDataStatus;
}

/**
 * DATA-owned projection at the PVC-11 -> PVC-12 boundary.
 *
 * The source ValidatedDataInput intentionally retains raw observations for audit/evidence,
 * including values attached to blocking states. This projection is the fail-closed numeric
 * export guard: blocked inputs expose no numeric observation to FINTECH consumers.
 */
export interface FintechDataHandoffProjection {
  readonly sourceContractVersion: typeof VALIDATED_DATA_INPUT_CONTRACT_VERSION;
  readonly assetId: string;
  readonly correlationId: string;
  readonly aggregateStatus: ValidatedDataStatus;
  readonly provenanceComplete: boolean;
  readonly admissibleForNumericFeatures: boolean;
  readonly numericObservations: readonly FintechNumericObservation[];
  readonly blockingReasons: readonly string[];
}

function normalizeSymbol(value: string): string {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function isTimestamp(value: string | null): value is string {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

function addReason(reasons: string[], reason: string): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function isFintechAdmissibleStatus(
  status: ValidatedDataStatus,
): status is FintechAdmissibleDataStatus {
  return isAdmissibleFintechInput(status);
}

function hasValidUniversalAssetIdentity(input: ValidatedDataInput): boolean {
  const { assetIdentity } = input;
  const symbol = normalizeSymbol(assetIdentity.symbol);
  return assetIdentity.contractVersion === UNIVERSAL_ASSET_CONTRACT_VERSION
    && Boolean(symbol)
    && assetIdentity.assetId === `${assetIdentity.assetClass}:${symbol}`;
}

function numericCandidate(
  observation: ValidatedDataObservation,
  index: number,
  reasons: string[],
): FintechNumericObservation | null {
  if (!isFintechAdmissibleStatus(observation.status)) {
    addReason(reasons, `observation:${index}:${observation.field}:status:${observation.status}`);
    return null;
  }

  if (observation.value === null) return null;
  if (!Number.isFinite(observation.value)) {
    addReason(reasons, `observation:${index}:${observation.field}:non-finite-value`);
    return null;
  }

  const providerId = observation.providerId.trim();
  const evidenceRef = observation.evidenceRef?.trim() ?? '';
  if (!providerId) addReason(reasons, `observation:${index}:${observation.field}:provider-required`);
  if (!evidenceRef) addReason(reasons, `observation:${index}:${observation.field}:evidence-required`);
  if (!isTimestamp(observation.observedAt)) {
    addReason(reasons, `observation:${index}:${observation.field}:observed-at-required`);
  }
  if (!isTimestamp(observation.retrievedAt)) {
    addReason(reasons, `observation:${index}:${observation.field}:retrieved-at-invalid`);
  }
  if (!isTimestamp(observation.freshness.evaluatedAt)) {
    addReason(reasons, `observation:${index}:${observation.field}:freshness-evaluated-at-invalid`);
  }

  const ageMs = observation.freshness.ageMs;
  const maxAgeMs = observation.freshness.maxAgeMs;
  if (ageMs === null || !Number.isFinite(ageMs) || ageMs < 0) {
    addReason(reasons, `observation:${index}:${observation.field}:freshness-age-invalid`);
  }
  if (maxAgeMs === null || !Number.isFinite(maxAgeMs) || maxAgeMs < 0) {
    addReason(reasons, `observation:${index}:${observation.field}:freshness-max-age-invalid`);
  }
  if (
    ageMs !== null
    && maxAgeMs !== null
    && Number.isFinite(ageMs)
    && Number.isFinite(maxAgeMs)
    && ageMs > maxAgeMs
  ) {
    addReason(reasons, `observation:${index}:${observation.field}:stale`);
  }

  if (
    !providerId
    || !evidenceRef
    || !isTimestamp(observation.observedAt)
    || !isTimestamp(observation.retrievedAt)
    || !isTimestamp(observation.freshness.evaluatedAt)
    || ageMs === null
    || maxAgeMs === null
    || !Number.isFinite(ageMs)
    || !Number.isFinite(maxAgeMs)
    || ageMs < 0
    || maxAgeMs < 0
    || ageMs > maxAgeMs
  ) {
    return null;
  }

  return {
    field: observation.field,
    value: observation.value,
    currency: observation.currency,
    providerId,
    providerFeed: observation.providerFeed,
    evidenceRef,
    observedAt: observation.observedAt,
    retrievedAt: observation.retrievedAt,
    freshness: {
      ageMs,
      maxAgeMs,
      evaluatedAt: observation.freshness.evaluatedAt,
    },
    status: observation.status,
    ...(observation.reason ? { reason: observation.reason } : {}),
  };
}

export function projectValidatedDataInputForFintech(
  input: ValidatedDataInput,
): FintechDataHandoffProjection {
  const blockingReasons: string[] = [];

  if (String(input.contractVersion) !== VALIDATED_DATA_INPUT_CONTRACT_VERSION) {
    addReason(blockingReasons, `contract-version:${String(input.contractVersion)}`);
  }
  if (!hasValidUniversalAssetIdentity(input)) {
    addReason(blockingReasons, 'asset-identity-invalid');
  }
  if (!input.correlationId.trim()) {
    addReason(blockingReasons, 'correlation-id-required');
  }

  const recomputedGate = evaluateDataQualityGate(input.observations.map(observation => observation.status));
  if (recomputedGate.status !== input.aggregateStatus) {
    addReason(
      blockingReasons,
      `aggregate-status-mismatch:${input.aggregateStatus}:${recomputedGate.status}`,
    );
  }
  if (!isAdmissibleFintechInput(input.aggregateStatus)) {
    addReason(blockingReasons, `aggregate-status:${input.aggregateStatus}`);
  }
  if (!input.provenanceComplete) {
    addReason(blockingReasons, 'provenance-incomplete');
  }
  for (const field of input.missingRequiredFields) {
    addReason(blockingReasons, `missing-required:${field}`);
  }
  for (const reason of input.nonComputableReasons) {
    addReason(blockingReasons, `non-computable:${reason}`);
  }

  const numericCandidates = input.observations.flatMap((observation, index) => {
    const candidate = numericCandidate(observation, index, blockingReasons);
    return candidate ? [candidate] : [];
  });
  if (numericCandidates.length === 0) {
    addReason(blockingReasons, 'numeric-observation-required');
  }

  const admissibleForNumericFeatures = blockingReasons.length === 0;

  return {
    sourceContractVersion: VALIDATED_DATA_INPUT_CONTRACT_VERSION,
    assetId: input.assetIdentity.assetId,
    correlationId: input.correlationId,
    aggregateStatus: input.aggregateStatus,
    provenanceComplete: input.provenanceComplete,
    admissibleForNumericFeatures,
    numericObservations: admissibleForNumericFeatures ? numericCandidates : [],
    blockingReasons,
  };
}
