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

export const VALIDATED_DATA_INPUT_CONTRACT_VERSION = 'validated-data-input/1.1.0' as const;

export type ValidatedDataStatus =
  | 'PASS'
  | 'PARTIAL'
  | 'FAIL'
  | 'NOT_COMPUTABLE'
  | 'STALE'
  | 'MISSING'
  | 'UNKNOWN';

export type ValidatedHistoryValueSemantics = ProviderHistoryValueSemantics;

export type ValidatedSnapshotField =
  | 'price'
  | 'marketCapUsd'
  | 'volume24hUsd'
  | 'circulatingSupply'
  | 'maxSupply'
  | 'totalSupply';

export type ValidatedFundamentalsField =
  | 'peRatio'
  | 'dividendYieldPct'
  | 'profitMarginPct'
  | 'debtToEquity'
  | 'epsTtm'
  | 'freeCashFlowPerShare';

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
  /** Optional observations never block otherwise-valid required DATA at the PVC-11 -> PVC-12 handoff. */
  readonly required?: boolean;
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

/** Provider-neutral normalized fundamentals candidate. Provider dialects must terminate before this boundary. */
export interface FundamentalsObservationCandidate {
  readonly field: ValidatedFundamentalsField;
  readonly value: number | null;
  readonly currency?: string | null;
  readonly providerId: string;
  readonly providerFeed: string | null;
  readonly evidenceRef: string | null;
  /** Source reporting/observation period; must never be synthesized from retrieval time. */
  readonly observedAt: string | null;
  readonly retrievedAt: string;
}

const CRYPTO_EXTENDED_SNAPSHOT_FIELDS = [
  'marketCapUsd',
  'volume24hUsd',
  'circulatingSupply',
  'maxSupply',
  'totalSupply',
] as const satisfies readonly Exclude<ValidatedSnapshotField, 'price'>[];

export const PRODUCTIVE_TRADITIONAL_FUNDAMENTAL_FIELDS = [
  'peRatio',
  'dividendYieldPct',
  'profitMarginPct',
] as const satisfies readonly ValidatedFundamentalsField[];

const ALL_TRADITIONAL_FUNDAMENTAL_FIELDS = [
  'peRatio',
  'dividendYieldPct',
  'profitMarginPct',
  'debtToEquity',
  'epsTtm',
  'freeCashFlowPerShare',
] as const satisfies readonly ValidatedFundamentalsField[];

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

function snapshotFieldValue(snapshot: CanonicalMarketDataSnapshot, field: ValidatedSnapshotField): number | null {
  const value = field === 'price' ? snapshot.price : snapshot[field] ?? null;
  return typeof value === 'number' ? value : null;
}

function snapshotFieldValueIsValid(field: ValidatedSnapshotField, value: number | null): boolean {
  if (value === null || !Number.isFinite(value)) return false;
  return value > 0;
}

function snapshotFieldCurrency(
  snapshot: CanonicalMarketDataSnapshot,
  field: ValidatedSnapshotField,
): string | null {
  if (field === 'price') return snapshot.currency;
  if (field === 'marketCapUsd' || field === 'volume24hUsd') return 'USD';
  return null;
}

function fundamentalsFieldValueIsValid(field: ValidatedFundamentalsField, value: number | null): boolean {
  if (value === null || !Number.isFinite(value)) return false;
  switch (field) {
    case 'peRatio':
      return value > 0;
    case 'dividendYieldPct':
      return value >= 0;
    case 'profitMarginPct':
    case 'debtToEquity':
    case 'epsTtm':
    case 'freeCashFlowPerShare':
      return true;
  }
}

function requiredObservation(observation: ValidatedDataObservation): boolean {
  return observation.required !== false;
}

function aggregateRequiredObservations(observations: readonly ValidatedDataObservation[]): ReturnType<typeof evaluateDataQualityGate> {
  return evaluateDataQualityGate(
    observations.filter(requiredObservation).map(observation => observation.status),
  );
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

function snapshotFieldToMarketEvidenceQualityRecord(
  asset: UniversalAssetIdentity,
  snapshot: CanonicalMarketDataSnapshot,
  field: ValidatedSnapshotField,
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
    field,
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

export function snapshotToMarketEvidenceQualityRecord(
  asset: UniversalAssetIdentity,
  snapshot: CanonicalMarketDataSnapshot,
  options: { readonly maxAgeMs?: number; readonly evaluatedAt?: string } = {},
): MarketEvidenceQualityRecord {
  return snapshotFieldToMarketEvidenceQualityRecord(asset, snapshot, 'price', options);
}

export function buildValidatedDataInputFromSnapshot(
  asset: UniversalAssetIdentity,
  snapshot: CanonicalMarketDataSnapshot,
  options: { readonly maxAgeMs?: number; readonly evaluatedAt?: string } = {},
): ValidatedDataInput {
  assertUniversalAssetIdentity(asset);
  const identityMatches = snapshotMatchesAsset(asset, snapshot);
  const correlationMatches = Boolean(snapshot.correlationId.trim());
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

  const fields: ValidatedSnapshotField[] = ['price'];
  if (snapshot.assetClass === 'crypto') fields.push(...CRYPTO_EXTENDED_SNAPSHOT_FIELDS);

  const observationStates = fields.map((field) => {
    const required = field === 'price';
    const rawValue = snapshotFieldValue(snapshot, field);
    const hasValue = rawValue !== null;
    const valueValid = snapshotFieldValueIsValid(field, rawValue);
    const evidence = snapshotFieldToMarketEvidenceQualityRecord(asset, snapshot, field, options);
    const freshness = evaluateDataFreshness({
      capability: 'snapshot',
      observedAt: evidence.observedAt,
      evaluatedAt: evidence.freshness.evaluatedAt,
    });
    const lineage = evaluateProvenanceLineage({
      contractVersion: DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION,
      assetId: asset.assetId,
      providerId: snapshot.provider,
      providerFeed: snapshot.providerFeed,
      capability: 'snapshot',
      field,
      evidenceRef: evidence.evidenceRef,
      observedAt: evidence.observedAt,
      retrievedAt: evidence.retrievedAt,
      correlationId: snapshot.correlationId,
    });
    const provenanceComplete = identityMatches && lineage.complete;

    let status: ValidatedDataStatus = identityMatches && correlationMatches
      ? mapEvidenceQualityToDataStatus(evidence, hasValue)
      : 'FAIL';
    if (hasValue && !valueValid) status = 'FAIL';
    if (
      status !== 'MISSING'
      && inputGate.admissibility === 'NON_ADMISSIBLE'
      && status !== 'FAIL'
    ) {
      status = 'FAIL';
    }
    status = applyFreshnessAndProvenance(status, freshness.state, provenanceComplete);

    const reason = !identityMatches
      ? 'asset identity mismatch'
      : !correlationMatches
        ? 'correlationId is required'
        : hasValue && !valueValid
          ? `invalid ${field} value`
          : inputGate.admissibility === 'NON_ADMISSIBLE' && status !== 'MISSING'
            ? inputGate.reason
            : status === 'PASS' || status === 'PARTIAL'
              ? undefined
              : !hasValue
                ? `${field} unavailable from provider snapshot`
                : snapshot.reason || freshness.reason || `evidence status ${evidence.qualityStatus}`;

    const observation: ValidatedDataObservation = {
      field,
      value: valueValid ? rawValue : null,
      currency: snapshotFieldCurrency(snapshot, field),
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
      required,
      ...(reason ? { reason } : {}),
    };

    return { observation, provenanceComplete };
  });

  const observations = observationStates.map(item => item.observation);
  const gate = aggregateRequiredObservations(observations);
  const missingRequiredFields = observations
    .filter(requiredObservation)
    .filter(observation => observation.status === 'MISSING')
    .map(observation => observation.field);
  const requiredFailures = observations
    .filter(requiredObservation)
    .filter(observation => observation.status !== 'PASS' && observation.status !== 'PARTIAL')
    .map(observation => observation.reason ?? `${observation.field}:${observation.status}`);
  const provenanceComplete = observationStates
    .filter(item => requiredObservation(item.observation))
    .every(item => item.provenanceComplete);

  return {
    contractVersion: VALIDATED_DATA_INPUT_CONTRACT_VERSION,
    assetIdentity: asset,
    correlationId: snapshot.correlationId,
    observations,
    aggregateStatus: gate.status,
    missingRequiredFields,
    nonComputableReasons: gate.admissibleForFintech ? [] : requiredFailures,
    provenanceComplete,
  };
}

function selectFundamentalsCandidate(
  candidates: readonly FundamentalsObservationCandidate[],
): { selected: FundamentalsObservationCandidate | null; conflicting: boolean } {
  const validCandidates = candidates.filter(candidate => candidate.value !== null && Number.isFinite(candidate.value));
  const uniqueValues = [...new Set(validCandidates.map(candidate => Number(candidate.value)))];
  if (uniqueValues.length > 1) return { selected: null, conflicting: true };
  if (validCandidates.length === 0) return { selected: null, conflicting: false };

  const selected = [...validCandidates].sort((left, right) => {
    const leftComplete = Number(Boolean(left.observedAt && left.evidenceRef && Number.isFinite(Date.parse(left.retrievedAt))));
    const rightComplete = Number(Boolean(right.observedAt && right.evidenceRef && Number.isFinite(Date.parse(right.retrievedAt))));
    if (leftComplete !== rightComplete) return rightComplete - leftComplete;
    return left.providerId.localeCompare(right.providerId);
  })[0] ?? null;
  return { selected, conflicting: false };
}

export function buildValidatedDataInputFromFundamentals(
  asset: UniversalAssetIdentity,
  correlationIdInput: string,
  candidates: readonly FundamentalsObservationCandidate[],
  options: {
    readonly evaluatedAt?: string;
    readonly requiredFields?: readonly ValidatedFundamentalsField[];
  } = {},
): ValidatedDataInput {
  assertUniversalAssetIdentity(asset);
  if (asset.assetClass !== 'stock') throw new Error('VALIDATED_FUNDAMENTALS_STOCK_ASSET_REQUIRED');
  const correlationId = requireCorrelationId(correlationIdInput);
  const evaluatedAt = evaluatedTimestamp(options.evaluatedAt, new Date().toISOString());
  const requiredFields = new Set<ValidatedFundamentalsField>(
    options.requiredFields ?? PRODUCTIVE_TRADITIONAL_FUNDAMENTAL_FIELDS,
  );

  const observationStates = ALL_TRADITIONAL_FUNDAMENTAL_FIELDS.map((field) => {
    const required = requiredFields.has(field);
    const fieldCandidates = candidates.filter(candidate => candidate.field === field);
    const { selected, conflicting } = selectFundamentalsCandidate(fieldCandidates);

    if (conflicting) {
      const observation: ValidatedDataObservation = {
        field,
        value: null,
        currency: null,
        providerId: 'multiple',
        providerFeed: null,
        evidenceRef: null,
        observedAt: null,
        retrievedAt: '',
        freshness: { ageMs: null, maxAgeMs: maxAgeForCapability('fundamentals'), evaluatedAt },
        status: 'UNKNOWN',
        required,
        reason: 'conflicting provider values',
      };
      return { observation, provenanceComplete: false };
    }

    if (!selected) {
      const observation: ValidatedDataObservation = {
        field,
        value: null,
        currency: null,
        providerId: 'none',
        providerFeed: null,
        evidenceRef: null,
        observedAt: null,
        retrievedAt: '',
        freshness: { ageMs: null, maxAgeMs: maxAgeForCapability('fundamentals'), evaluatedAt },
        status: 'MISSING',
        required,
        reason: `${field} unavailable from fundamentals providers`,
      };
      return { observation, provenanceComplete: false };
    }

    const valueValid = fundamentalsFieldValueIsValid(field, selected.value);
    const lineage = evaluateProvenanceLineage({
      contractVersion: DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION,
      assetId: asset.assetId,
      providerId: selected.providerId,
      providerFeed: selected.providerFeed,
      capability: 'fundamentals',
      field,
      evidenceRef: selected.evidenceRef,
      observedAt: selected.observedAt,
      retrievedAt: selected.retrievedAt,
      correlationId,
    });
    const freshness = evaluateDataFreshness({
      capability: 'fundamentals',
      observedAt: selected.observedAt,
      evaluatedAt,
    });
    const provenanceComplete = lineage.complete;
    let status: ValidatedDataStatus = valueValid ? 'PASS' : 'FAIL';
    status = applyFreshnessAndProvenance(status, freshness.state, provenanceComplete);

    const reason = status === 'PASS' || status === 'PARTIAL'
      ? undefined
      : !valueValid
        ? `invalid ${field} value`
        : !provenanceComplete
          ? lineage.reason
          : freshness.reason;

    const observation: ValidatedDataObservation = {
      field,
      value: valueValid ? selected.value : null,
      currency: selected.currency ?? null,
      providerId: selected.providerId,
      providerFeed: selected.providerFeed,
      evidenceRef: selected.evidenceRef,
      observedAt: selected.observedAt,
      retrievedAt: selected.retrievedAt,
      freshness: {
        ageMs: freshness.ageMs,
        maxAgeMs: freshness.maxAgeMs,
        evaluatedAt,
      },
      status,
      required,
      ...(reason ? { reason } : {}),
    };
    return { observation, provenanceComplete };
  });

  const observations = observationStates.map(item => item.observation);
  const gate = aggregateRequiredObservations(observations);
  const missingRequiredFields = observations
    .filter(requiredObservation)
    .filter(observation => observation.status === 'MISSING')
    .map(observation => observation.field);
  const requiredFailures = observations
    .filter(requiredObservation)
    .filter(observation => observation.status !== 'PASS' && observation.status !== 'PARTIAL')
    .map(observation => observation.reason ?? `${observation.field}:${observation.status}`);
  const provenanceComplete = observationStates
    .filter(item => requiredObservation(item.observation))
    .every(item => item.provenanceComplete);

  return {
    contractVersion: VALIDATED_DATA_INPUT_CONTRACT_VERSION,
    assetIdentity: asset,
    correlationId,
    observations,
    aggregateStatus: gate.status,
    missingRequiredFields,
    nonComputableReasons: gate.admissibleForFintech ? [] : requiredFailures,
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
