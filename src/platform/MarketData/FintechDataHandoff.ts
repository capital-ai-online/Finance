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
  type ValidatedHistoryInput,
  type ValidatedHistoryValueSemantics,
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

/** DATA-owned projection at the PVC-11 -> PVC-12 boundary. */
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

/**
 * DATA-owned validated history projection for FINTECH.
 * Signed-value semantics are preserved and no points leave DATA when the input is blocked.
 */
export interface FintechHistoryHandoffProjection {
  readonly sourceContractVersion: typeof VALIDATED_DATA_INPUT_CONTRACT_VERSION;
  readonly assetId: string;
  readonly correlationId: string;
  readonly providerId: string;
  readonly providerFeed: string | null;
  readonly evidenceRef: string | null;
  readonly receivedAt: string;
  readonly valueSemantics: ValidatedHistoryValueSemantics;
  readonly status: ValidatedDataStatus;
  readonly provenanceComplete: boolean;
  readonly admissibleForFeatures: boolean;
  readonly points: readonly { readonly timestamp: string; readonly close: number }[];
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

function hasValidUniversalAssetIdentity(input: Pick<ValidatedDataInput, 'assetIdentity'>): boolean {
  const { assetIdentity } = input;
  const symbol = normalizeSymbol(assetIdentity.symbol);
  return assetIdentity.contractVersion === UNIVERSAL_ASSET_CONTRACT_VERSION
    && Boolean(symbol)
    && assetIdentity.assetId === `${assetIdentity.assetClass}:${symbol}`;
}

function observationIsRequired(observation: ValidatedDataObservation): boolean {
  return observation.required !== false;
}

function numericCandidate(
  observation: ValidatedDataObservation,
  index: number,
  reasons: string[],
): FintechNumericObservation | null {
  const required = observationIsRequired(observation);
  if (!isFintechAdmissibleStatus(observation.status)) {
    if (required) addReason(reasons, `observation:${index}:${observation.field}:status:${observation.status}`);
    return null;
  }

  if (observation.value === null) {
    if (required) addReason(reasons, `observation:${index}:${observation.field}:value-required`);
    return null;
  }
  if (!Number.isFinite(observation.value)) {
    if (required) addReason(reasons, `observation:${index}:${observation.field}:non-finite-value`);
    return null;
  }

  const localReasons: string[] = [];
  const providerId = observation.providerId.trim();
  const evidenceRef = observation.evidenceRef?.trim() ?? '';
  if (!providerId) localReasons.push(`observation:${index}:${observation.field}:provider-required`);
  if (!evidenceRef) localReasons.push(`observation:${index}:${observation.field}:evidence-required`);
  if (!isTimestamp(observation.observedAt)) {
    localReasons.push(`observation:${index}:${observation.field}:observed-at-required`);
  }
  if (!isTimestamp(observation.retrievedAt)) {
    localReasons.push(`observation:${index}:${observation.field}:retrieved-at-invalid`);
  }
  if (!isTimestamp(observation.freshness.evaluatedAt)) {
    localReasons.push(`observation:${index}:${observation.field}:freshness-evaluated-at-invalid`);
  }

  const ageMs = observation.freshness.ageMs;
  const maxAgeMs = observation.freshness.maxAgeMs;
  if (ageMs === null || !Number.isFinite(ageMs) || ageMs < 0) {
    localReasons.push(`observation:${index}:${observation.field}:freshness-age-invalid`);
  }
  if (maxAgeMs === null || !Number.isFinite(maxAgeMs) || maxAgeMs < 0) {
    localReasons.push(`observation:${index}:${observation.field}:freshness-max-age-invalid`);
  }
  if (
    ageMs !== null
    && maxAgeMs !== null
    && Number.isFinite(ageMs)
    && Number.isFinite(maxAgeMs)
    && ageMs > maxAgeMs
  ) {
    localReasons.push(`observation:${index}:${observation.field}:stale`);
  }

  if (localReasons.length > 0) {
    if (required) localReasons.forEach(reason => addReason(reasons, reason));
    return null;
  }

  return {
    field: observation.field,
    value: observation.value,
    currency: observation.currency,
    providerId,
    providerFeed: observation.providerFeed,
    evidenceRef,
    observedAt: observation.observedAt as string,
    retrievedAt: observation.retrievedAt,
    freshness: {
      ageMs: ageMs as number,
      maxAgeMs: maxAgeMs as number,
      evaluatedAt: observation.freshness.evaluatedAt,
    },
    status: observation.status,
    required: observation.required,
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

  const seenFields = new Set<string>();
  for (const observation of input.observations) {
    if (seenFields.has(observation.field)) addReason(blockingReasons, `duplicate-observation-field:${observation.field}`);
    seenFields.add(observation.field);
  }

  const requiredObservations = input.observations.filter(observationIsRequired);
  const recomputedGate = evaluateDataQualityGate(requiredObservations.map(observation => observation.status));
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
  const requiredNumericFields = new Set(
    requiredObservations
      .filter(observation => observation.value !== null)
      .map(observation => observation.field),
  );
  const exportedFields = new Set(numericCandidates.map(observation => observation.field));
  for (const field of requiredNumericFields) {
    if (!exportedFields.has(field)) addReason(blockingReasons, `required-numeric-observation-missing:${field}`);
  }
  if (numericCandidates.length === 0) addReason(blockingReasons, 'numeric-observation-required');

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

export function projectValidatedHistoryInputForFintech(
  input: ValidatedHistoryInput,
): FintechHistoryHandoffProjection {
  const blockingReasons: string[] = [];
  const symbol = normalizeSymbol(input.assetIdentity.symbol);
  const identityValid = input.assetIdentity.contractVersion === UNIVERSAL_ASSET_CONTRACT_VERSION
    && Boolean(symbol)
    && input.assetIdentity.assetId === `${input.assetIdentity.assetClass}:${symbol}`;

  if (String(input.contractVersion) !== VALIDATED_DATA_INPUT_CONTRACT_VERSION) {
    addReason(blockingReasons, `contract-version:${String(input.contractVersion)}`);
  }
  if (!identityValid) addReason(blockingReasons, 'asset-identity-invalid');
  if (!input.correlationId.trim()) addReason(blockingReasons, 'correlation-id-required');
  if (!input.providerId.trim()) addReason(blockingReasons, 'provider-required');
  if (!input.evidenceRef?.trim()) addReason(blockingReasons, 'evidence-required');
  if (!isTimestamp(input.receivedAt)) addReason(blockingReasons, 'received-at-invalid');
  if (!input.provenanceComplete) addReason(blockingReasons, 'provenance-incomplete');
  if (!isAdmissibleFintechInput(input.status)) addReason(blockingReasons, `status:${input.status}`);
  if (input.points.length === 0) addReason(blockingReasons, 'history-points-required');
  for (const [index, point] of input.points.entries()) {
    if (!isTimestamp(point.timestamp)) addReason(blockingReasons, `point:${index}:timestamp-invalid`);
    if (!Number.isFinite(point.close)) addReason(blockingReasons, `point:${index}:value-invalid`);
    if (input.valueSemantics === 'POSITIVE_PRICE' && !(point.close > 0)) {
      addReason(blockingReasons, `point:${index}:positive-price-required`);
    }
  }

  const admissibleForFeatures = blockingReasons.length === 0;
  return {
    sourceContractVersion: VALIDATED_DATA_INPUT_CONTRACT_VERSION,
    assetId: input.assetIdentity.assetId,
    correlationId: input.correlationId,
    providerId: input.providerId,
    providerFeed: input.providerFeed,
    evidenceRef: input.evidenceRef,
    receivedAt: input.receivedAt,
    valueSemantics: input.valueSemantics,
    status: input.status,
    provenanceComplete: input.provenanceComplete,
    admissibleForFeatures,
    points: admissibleForFeatures ? input.points : [],
    blockingReasons,
  };
}
