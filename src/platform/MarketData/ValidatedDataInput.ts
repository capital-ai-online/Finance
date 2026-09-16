import {
  UNIVERSAL_ASSET_CONTRACT_VERSION,
  type UniversalAssetIdentity,
} from '../Scoring/contracts';
import { assessMarketDataSnapshot } from './DataQualityService';
import {
  evaluateDataQualityGate,
  mapEvidenceQualityToDataStatus,
} from './dataQualityGate';
import {
  evaluateDataFreshness,
  maxAgeForCapability,
} from './dataFreshness';
import {
  DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION,
  evaluateProvenanceLineage,
} from './dataProvenanceLineage';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  assertMarketEvidenceContract,
  type MarketEvidenceQualityRecord,
} from './evidenceQualityContracts';
import {
  validateProviderHistoryInput,
  validateProviderSnapshotInput,
  type ProviderHistoryValueSemantics,
} from './providerInputValidation';
import type {
  CanonicalMarketDataHistory,
  CanonicalMarketDataSnapshot,
  HistoryRequest,
  SnapshotRequest,
} from './contracts';

export const VALIDATED_DATA_INPUT_CONTRACT_VERSION = 'validated-data-input/1.0.0' as const;

export type ValidatedDataStatus =
  | 'PASS'
  | 'PARTIAL'
  | 'FAIL'
  | 'NOT_COMPUTABLE'
  | 'STALE'
  | 'MISSING'
  | 'UNKNOWN';

export type ValidatedHistoryValueSemantics = ProviderHistoryValueSemantics;

export interface ValidatedDataObservation {
  readonly field: string;
  readonly value: number | null;
  readonly currency: string | null;
  readonly providerId: string;
  readonly providerFeed: string | null;
  readonly evidenceRef: string | null;
  readonly observedAt: string | null;
  readonly retrievedAt: string;
  readonly freshness: {
    readonly ageMs: number | null;
    readonly maxAgeMs: number | null;
    readonly evaluatedAt: string;
  };
  readonly status: ValidatedDataStatus;
  readonly reason?: string;
}

export interface ValidatedDataInput {
  readonly contractVersion: typeof VALIDATED_DATA_INPUT_CONTRACT_VERSION;
  readonly assetIdentity: UniversalAssetIdentity;
  readonly correlationId: string;
  readonly observations: readonly ValidatedDataObservation[];
  readonly aggregateStatus: ValidatedDataStatus;
  readonly missingRequiredFields: readonly string[];
  readonly nonComputableReasons: readonly string[];
  readonly provenanceComplete: boolean;
}

export interface ValidatedHistoryInput {
  readonly contractVersion: typeof VALIDATED_DATA_INPUT_CONTRACT_VERSION;
  readonly assetIdentity: UniversalAssetIdentity;
  readonly correlationId: string;
  readonly providerId: string;
  readonly providerFeed: string | null;
  readonly evidenceRef: string | null;
  readonly receivedAt: string;
  readonly valueSemantics: ValidatedHistoryValueSemantics;
  readonly points: readonly { readonly timestamp: string; readonly close: number }[];
  readonly status: ValidatedDataStatus;
  readonly provenanceComplete: boolean;
  readonly reason?: string;
}

function normalizeSymbol(value: string): string {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function assertUniversalAssetIdentity(asset: UniversalAssetIdentity): void {
  if (asset.contractVersion !== UNIVERSAL_ASSET_CONTRACT_VERSION) {
    throw new Error('VALIDATED_DATA_UAI_VERSION_MISMATCH');
  }
  const symbol = normalizeSymbol(asset.symbol);
  if (!symbol || asset.assetId !== `${asset.assetClass}:${symbol}`) {
    throw new Error('VALIDATED_DATA_UAI_IDENTITY_INVALID');
  }
}

function requireCorrelationId(value: string): string {
  const correlationId = String(value || '').trim();
  if (!correlationId) throw new Error('VALIDATED_DATA_CORRELATION_ID_REQUIRED');
  return correlationId;
}

function snapshotMatchesAsset(asset: UniversalAssetIdentity, snapshot: CanonicalMarketDataSnapshot): boolean {
  return normalizeSymbol(snapshot.symbol) === normalizeSymbol(asset.symbol)
    && snapshot.assetClass === asset.assetClass;
}

function historyMatchesAsset(asset: UniversalAssetIdentity, history: CanonicalMarketDataHistory): boolean {
  return normalizeSymbol(history.symbol) === normalizeSymbol(asset.symbol)
    && history.assetClass === asset.assetClass;
}

function latestHistoryObservedAt(
  points: readonly { readonly timestamp: string }[],
): string | null {
  if (points.length === 0) return null;
  return points[points.length - 1]?.timestamp ?? null;
}

function evaluatedTimestamp(input: string | undefined, fallback: string): string {
  const value = input ?? fallback;
  if (!Number.isFinite(Date.parse(value))) throw new Error('VALIDATED_DATA_EVALUATED_AT_INVALID');
  return value;
}

function evidenceAgeMs(observedAt: string | null, evaluatedAt: string): number | null {
  if (!observedAt || !Number.isFinite(Date.parse(observedAt))) return null;
  return Math.max(0, Date.parse(evaluatedAt) - Date.parse(observedAt));
}

function applyFreshnessAndProvenance(
  status: ValidatedDataStatus,
  freshnessState: 'FRESH' | 'STALE' | 'UNKNOWN',
  provenanceComplete: boolean,
): ValidatedDataStatus {
  if (status === 'FAIL' || status === 'MISSING') return status;
  if (!provenanceComplete && (status === 'PASS' || status === 'PARTIAL')) return 'FAIL';
  if (freshnessState === 'STALE' && (status === 'PASS' || status === 'PARTIAL')) return 'STALE';
  if (freshnessState === 'UNKNOWN' && (status === 'PASS' || status === 'PARTIAL')) return 'UNKNOWN';
  return status;
}

function historyPointValueIsValid(value: number, semantics: ValidatedHistoryValueSemantics): boolean {
  if (!Number.isFinite(value)) return false;
  if (semantics === 'SIGNED_VALUE') return true;
  return semantics === 'POSITIVE_PRICE' && value > 0;
}

export function buildSnapshotRequestForUniversalAsset(
  asset: UniversalAssetIdentity,
  correlationIdInput: string,
  options: Omit<SnapshotRequest, 'symbol' | 'assetClass' | 'correlationId'> = {},
): SnapshotRequest {
  assertUniversalAssetIdentity(asset);
  return {
    ...options,
    symbol: asset.symbol,
    assetClass: asset.assetClass,
    correlationId: requireCorrelationId(correlationIdInput),
  };
}

export function buildHistoryRequestForUniversalAsset(
  asset: UniversalAssetIdentity,
  correlationIdInput: string,
  options: Omit<HistoryRequest, 'symbol' | 'assetClass' | 'correlationId'> = {},
): HistoryRequest {
  assertUniversalAssetIdentity(asset);
  return {
    ...options,
    symbol: asset.symbol,
    assetClass: asset.assetClass,
    correlationId: requireCorrelationId(correlationIdInput),
  };
}

export function snapshotToMarketEvidenceQualityRecord(
  asset: UniversalAssetIdentity,
  snapshot: CanonicalMarketDataSnapshot,
  options: { readonly maxAgeMs?: number; readonly evaluatedAt?: string } = {},
): MarketEvidenceQualityRecord {
  assertUniversalAssetIdentity(asset);
  const maxAgeMs = Math.max(0, options.maxAgeMs ?? maxAgeForCapability('snapshot'));
  const evaluatedAt = evaluatedTimestamp(options.evaluatedAt, snapshot.receivedAt);
  const identityMatches = snapshotMatchesAsset(asset, snapshot);
  const correlationPresent = Boolean(snapshot.correlationId.trim());
  const assessment = assessMarketDataSnapshot(snapshot, {
    nowMs: Date.parse(evaluatedAt),
    maxAgeMs,
    allowStale: false,
  });

  let qualityStatus: MarketEvidenceQualityRecord['qualityStatus'];
  if (!identityMatches || !correlationPresent || assessment.state === 'INVALID') {
    qualityStatus = 'INVALID';
  } else if (assessment.state === 'STALE') {
    qualityStatus = 'STALE';
  } else if (assessment.state === 'UNAVAILABLE') {
    qualityStatus = 'UNAVAILABLE';
  } else if (assessment.accepted && snapshot.sourceTimestamp && snapshot.evidenceId?.trim()) {
    qualityStatus = 'VERIFIED';
  } else {
    qualityStatus = 'INVALID';
  }

  const record: MarketEvidenceQualityRecord = {
    assetId: asset.assetId,
    providerId: snapshot.provider,
    capability: 'snapshot',
    field: 'price',
    observedAt: snapshot.sourceTimestamp,
    retrievedAt: snapshot.ingestedAt,
    freshness: {
      ageMs: evidenceAgeMs(snapshot.sourceTimestamp, evaluatedAt),
      maxAgeMs,
      evaluatedAt,
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus,
    evidenceRef: snapshot.evidenceId,
  };
  assertMarketEvidenceContract(record);
  return record;
}

export function buildValidatedDataInputFromSnapshot(
  asset: UniversalAssetIdentity,
  snapshot: CanonicalMarketDataSnapshot,
  options: { readonly maxAgeMs?: number; readonly evaluatedAt?: string } = {},
): ValidatedDataInput {
  assertUniversalAssetIdentity(asset);
  const evidence = snapshotToMarketEvidenceQualityRecord(asset, snapshot, options);
  const identityMatches = snapshotMatchesAsset(asset, snapshot);
  const correlationMatches = Boolean(snapshot.correlationId.trim());
  const hasPrice = typeof snapshot.price === 'number' && Number.isFinite(snapshot.price) && snapshot.price > 0;
  const inputGate = validateProviderSnapshotInput({
    providerId: snapshot.provider,
    symbol: snapshot.symbol,
    assetClass: snapshot.assetClass,
    price: snapshot.price,
    sourceTimestamp: snapshot.sourceTimestamp,
    ingestedAt: snapshot.ingestedAt,
    correlationId: snapshot.correlationId,
    evidenceRef: snapshot.evidenceId,
  });
  const freshness = evaluateDataFreshness({
    capability: 'snapshot',
    observedAt: evidence.observedAt,
    evaluatedAt: evidence.freshness.evaluatedAt,
  });
  let fieldStatus = identityMatches && correlationMatches
    ? mapEvidenceQualityToDataStatus(evidence, hasPrice)
    : 'FAIL';
  if (fieldStatus !== 'MISSING' && inputGate.admissibility === 'NON_ADMISSIBLE' && fieldStatus !== 'FAIL') {
    fieldStatus = 'FAIL';
  }
  const lineage = evaluateProvenanceLineage({
    contractVersion: DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION,
    assetId: asset.assetId,
    providerId: snapshot.provider,
    providerFeed: snapshot.providerFeed,
    capability: 'snapshot',
    field: 'price',
    evidenceRef: evidence.evidenceRef,
    observedAt: evidence.observedAt,
    retrievedAt: evidence.retrievedAt,
    correlationId: snapshot.correlationId,
  });
  const provenanceComplete = identityMatches && lineage.complete;
  fieldStatus = applyFreshnessAndProvenance(fieldStatus, freshness.state, provenanceComplete);
  const gate = evaluateDataQualityGate([fieldStatus]);
  const status = gate.status;
  const reason = !identityMatches
    ? 'asset identity mismatch'
    : !correlationMatches
      ? 'correlationId is required'
      : inputGate.admissibility === 'NON_ADMISSIBLE' && status !== 'MISSING'
        ? inputGate.reason
        : status === 'PASS'
          ? undefined
          : snapshot.reason || freshness.reason || `evidence status ${evidence.qualityStatus}`;
  const missingRequiredFields = hasPrice ? [] : ['price'];
  const nonComputableReasons = gate.admissibleForFintech
    ? []
    : [reason ?? `validated data status ${status}`];

  return {
    contractVersion: VALIDATED_DATA_INPUT_CONTRACT_VERSION,
    assetIdentity: asset,
    correlationId: snapshot.correlationId,
    observations: [{
      field: 'price',
      value: hasPrice ? snapshot.price : null,
      currency: snapshot.currency,
      providerId: snapshot.provider,
      providerFeed: snapshot.providerFeed,
      evidenceRef: evidence.evidenceRef,
      observedAt: evidence.observedAt,
      retrievedAt: evidence.retrievedAt,
      freshness: {
        ageMs: freshness.ageMs,
        maxAgeMs: freshness.maxAgeMs,
        evaluatedAt: evidence.freshness.evaluatedAt,
      },
      status,
      ...(reason ? { reason } : {}),
    }],
    aggregateStatus: status,
    missingRequiredFields,
    nonComputableReasons,
    provenanceComplete,
  };
}

export function buildValidatedHistoryInput(
  asset: UniversalAssetIdentity,
  history: CanonicalMarketDataHistory,
  options: { readonly valueSemantics?: ValidatedHistoryValueSemantics } = {},
): ValidatedHistoryInput {
  assertUniversalAssetIdentity(asset);
  const valueSemantics = options.valueSemantics ?? 'POSITIVE_PRICE';
  const identityMatches = historyMatchesAsset(asset, history);
  const pointsValid = history.points.length > 0
    && history.points.every(
      point => historyPointValueIsValid(point.close, valueSemantics) && Number.isFinite(Date.parse(point.timestamp)),
    );
  const observedAt = latestHistoryObservedAt(history.points);
  const inputGate = validateProviderHistoryInput({
    providerId: history.provider,
    symbol: history.symbol,
    assetClass: history.assetClass,
    receivedAt: history.receivedAt,
    correlationId: history.correlationId,
    evidenceRef: history.evidenceId,
    points: history.points,
    valueSemantics,
  });
  const lineage = evaluateProvenanceLineage({
    contractVersion: DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION,
    assetId: asset.assetId,
    providerId: history.provider,
    providerFeed: history.providerFeed,
    capability: 'history',
    field: 'close',
    evidenceRef: history.evidenceId,
    observedAt,
    retrievedAt: history.receivedAt,
    correlationId: history.correlationId,
  });
  const freshness = evaluateDataFreshness({
    capability: 'history',
    observedAt,
    evaluatedAt: history.receivedAt,
  });
  const provenanceComplete = identityMatches && lineage.complete;
  let status: ValidatedDataStatus = history.qualityState === 'UNAVAILABLE'
    ? 'MISSING'
    : history.qualityState === 'HISTORICAL' && pointsValid && provenanceComplete && inputGate.admissibility === 'ADMISSIBLE'
      ? 'PASS'
      : 'FAIL';
  status = applyFreshnessAndProvenance(status, freshness.state, provenanceComplete);
  const reason = status === 'PASS'
    ? undefined
    : !identityMatches
      ? 'asset identity mismatch'
      : inputGate.admissibility === 'NON_ADMISSIBLE'
        ? inputGate.reason
        : history.reason || freshness.reason || 'history is not admissible';

  return {
    contractVersion: VALIDATED_DATA_INPUT_CONTRACT_VERSION,
    assetIdentity: asset,
    correlationId: history.correlationId,
    providerId: history.provider,
    providerFeed: history.providerFeed,
    evidenceRef: history.evidenceId,
    receivedAt: history.receivedAt,
    valueSemantics,
    points: history.points,
    status,
    provenanceComplete,
    ...(reason ? { reason } : {}),
  };
}
