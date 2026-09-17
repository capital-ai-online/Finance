import {
  UNIVERSAL_ASSET_CONTRACT_VERSION,
  type UniversalAssetIdentity,
} from '../Scoring/contracts';
import {
  evaluateDataQualityGate,
  isAdmissibleFintechInput,
  mapEvidenceQualityToDataStatus,
} from './dataQualityGate';
import {
  DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION,
  evaluateProvenanceLineage,
} from './dataProvenanceLineage';
import {
  assertMarketEvidenceContract,
  type MarketEvidenceQualityRecord,
} from './evidenceQualityContracts';
import {
  VALIDATED_DATA_INPUT_CONTRACT_VERSION,
  type ValidatedDataInput,
  type ValidatedDataObservation,
  type ValidatedDataStatus,
} from './ValidatedDataInput';

/**
 * DATA/PVC-09..11 field-level input used to close FIN-12 upstream gaps without
 * introducing a second provider, provenance, freshness or Data Quality plane.
 *
 * Each field arrives with the canonical MarketEvidenceQualityRecord. This
 * builder validates that envelope, binds it to UAI + correlation identity and
 * returns the existing ValidatedDataInput contract consumed by the canonical
 * PVC-11 -> PVC-12 handoff.
 */
export interface ValidatedFeatureFieldInput {
  readonly field: string;
  readonly value: number | null;
  readonly currency?: string | null;
  readonly providerFeed?: string | null;
  readonly evidence: MarketEvidenceQualityRecord;
}

export interface BuildValidatedFeatureDataInputOptions {
  readonly correlationId: string;
  readonly evaluatedAt: string;
  readonly requiredFields: readonly string[];
}

function normalizeSymbol(value: string): string {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function assertUniversalAssetIdentity(asset: UniversalAssetIdentity): void {
  const symbol = normalizeSymbol(asset.symbol);
  if (
    asset.contractVersion !== UNIVERSAL_ASSET_CONTRACT_VERSION
    || !symbol
    || asset.assetId !== `${asset.assetClass}:${symbol}`
  ) {
    throw new Error('VALIDATED_FEATURE_INPUT_UAI_INVALID');
  }
}

function requireNonEmpty(value: string, code: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function requireTimestamp(value: string, code: string): string {
  const normalized = requireNonEmpty(value, code);
  if (!Number.isFinite(Date.parse(normalized))) throw new Error(code);
  return normalized;
}

function fieldName(value: string): string {
  return requireNonEmpty(value, 'VALIDATED_FEATURE_INPUT_FIELD_REQUIRED');
}

function reasonForStatus(status: ValidatedDataStatus): string {
  switch (status) {
    case 'PASS':
    case 'PARTIAL':
      return `field-admissible:${status}`;
    case 'STALE':
      return 'field-stale';
    case 'MISSING':
      return 'field-missing';
    case 'UNKNOWN':
      return 'field-conflicting-or-unknown';
    case 'NOT_COMPUTABLE':
      return 'field-not-computable';
    case 'FAIL':
      return 'field-invalid';
  }
}

function missingObservation(field: string, evaluatedAt: string): ValidatedDataObservation {
  return {
    field,
    value: null,
    currency: null,
    providerId: '',
    providerFeed: null,
    evidenceRef: null,
    observedAt: null,
    retrievedAt: evaluatedAt,
    freshness: {
      ageMs: null,
      maxAgeMs: null,
      evaluatedAt,
    },
    status: 'MISSING',
    reason: 'required field missing from DATA input',
  };
}

function buildObservation(
  asset: UniversalAssetIdentity,
  correlationId: string,
  evaluatedAt: string,
  input: ValidatedFeatureFieldInput,
  duplicateField: boolean,
): { observation: ValidatedDataObservation; provenanceComplete: boolean } {
  const field = fieldName(input.field);
  const evidence = input.evidence;
  let contractValid = true;
  let contractError: string | undefined;

  try {
    assertMarketEvidenceContract(evidence);
  } catch (error: unknown) {
    contractValid = false;
    contractError = error instanceof Error ? error.message : 'MARKET_EVIDENCE_DQ_INVALID';
  }

  const identityMatches = evidence.assetId === asset.assetId;
  const fieldMatches = evidence.field === field;
  const evaluationMatches = evidence.freshness.evaluatedAt === evaluatedAt;
  const valueFinite = input.value === null || Number.isFinite(input.value);
  const lineage = evaluateProvenanceLineage({
    contractVersion: DATA_PROVENANCE_LINEAGE_CONTRACT_VERSION,
    assetId: evidence.assetId,
    providerId: evidence.providerId,
    providerFeed: input.providerFeed ?? null,
    capability: evidence.capability,
    field: evidence.field,
    evidenceRef: evidence.evidenceRef,
    observedAt: evidence.observedAt,
    retrievedAt: evidence.retrievedAt,
    correlationId,
  });

  let status: ValidatedDataStatus = mapEvidenceQualityToDataStatus(
    evidence,
    input.value !== null && Number.isFinite(input.value),
  );
  let reason = reasonForStatus(status);

  if (!contractValid) {
    status = 'FAIL';
    reason = `evidence-contract-invalid:${contractError}`;
  } else if (!identityMatches) {
    status = 'FAIL';
    reason = 'evidence-asset-identity-mismatch';
  } else if (!fieldMatches) {
    status = 'FAIL';
    reason = 'evidence-field-mismatch';
  } else if (!evaluationMatches) {
    status = 'FAIL';
    reason = 'evidence-evaluated-at-mismatch';
  } else if (duplicateField) {
    status = 'FAIL';
    reason = 'duplicate-field-conflict';
  } else if (!valueFinite) {
    status = 'FAIL';
    reason = 'field-value-non-finite';
  } else if (isAdmissibleFintechInput(status) && !lineage.complete) {
    status = 'FAIL';
    reason = lineage.reason;
  }

  const provenanceComplete = contractValid
    && identityMatches
    && fieldMatches
    && evaluationMatches
    && !duplicateField
    && lineage.complete;

  return {
    observation: {
      field,
      value: valueFinite ? input.value : null,
      currency: input.currency ?? null,
      providerId: evidence.providerId,
      providerFeed: input.providerFeed ?? null,
      evidenceRef: evidence.evidenceRef,
      observedAt: evidence.observedAt,
      retrievedAt: evidence.retrievedAt,
      freshness: {
        ageMs: evidence.freshness.ageMs,
        maxAgeMs: evidence.freshness.maxAgeMs,
        evaluatedAt: evidence.freshness.evaluatedAt,
      },
      status,
      ...(reason ? { reason } : {}),
    },
    provenanceComplete,
  };
}

export function buildValidatedFeatureDataInput(
  asset: UniversalAssetIdentity,
  fields: readonly ValidatedFeatureFieldInput[],
  options: BuildValidatedFeatureDataInputOptions,
): ValidatedDataInput {
  assertUniversalAssetIdentity(asset);
  const correlationId = requireNonEmpty(
    options.correlationId,
    'VALIDATED_FEATURE_INPUT_CORRELATION_ID_REQUIRED',
  );
  const evaluatedAt = requireTimestamp(
    options.evaluatedAt,
    'VALIDATED_FEATURE_INPUT_EVALUATED_AT_INVALID',
  );
  const requiredFields = [...new Set(options.requiredFields.map(fieldName))];

  const counts = new Map<string, number>();
  for (const input of fields) {
    const field = fieldName(input.field);
    counts.set(field, (counts.get(field) ?? 0) + 1);
  }

  const built = fields.map(input => buildObservation(
    asset,
    correlationId,
    evaluatedAt,
    input,
    (counts.get(fieldName(input.field)) ?? 0) > 1,
  ));
  const observations = built.map(item => item.observation);
  const observedFields = new Set(observations.map(observation => observation.field));
  const missingRequiredFields = requiredFields.filter(field => {
    const matches = observations.filter(observation => observation.field === field);
    return matches.length === 0 || matches.every(observation => observation.value === null);
  });

  for (const missing of missingRequiredFields) {
    if (!observedFields.has(missing)) observations.push(missingObservation(missing, evaluatedAt));
  }

  const gate = evaluateDataQualityGate(observations.map(observation => observation.status));
  const nonComputableReasons = observations
    .filter(observation => !isAdmissibleFintechInput(observation.status))
    .map(observation => `${observation.field}:${observation.reason ?? observation.status}`);
  const provenanceComplete = missingRequiredFields.length === 0
    && built.every(item => item.provenanceComplete)
    && observations.every(observation => observation.status !== 'FAIL');

  return {
    contractVersion: VALIDATED_DATA_INPUT_CONTRACT_VERSION,
    assetIdentity: asset,
    correlationId,
    observations,
    aggregateStatus: gate.status,
    missingRequiredFields,
    nonComputableReasons,
    provenanceComplete,
  };
}
