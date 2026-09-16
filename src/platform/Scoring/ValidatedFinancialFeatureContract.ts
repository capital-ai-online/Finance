import {
  projectValidatedDataInputForFintech,
  type FintechNumericObservation,
} from '../MarketData/FintechDataHandoff';
import type {
  ValidatedDataInput,
  ValidatedDataStatus,
} from '../MarketData/ValidatedDataInput';
import type { ScoringModelDescriptor } from './contracts';

export const VALIDATED_FINANCIAL_FEATURE_MAPPING_CONTRACT_VERSION =
  'validated-financial-feature-mapping/1.0.0' as const;

export interface ValidatedFinancialFeatureBinding {
  /** Exact key expected by the target model feature contract. */
  readonly featureKey: string;
  /** Exact field exported by DATA through the PVC-11 -> PVC-12 handoff. */
  readonly sourceField: string;
}

export interface ValidatedFinancialFeatureValue {
  readonly featureKey: string;
  readonly sourceField: string;
  readonly value: number;
  readonly currency: string | null;
  readonly providerId: string;
  readonly providerFeed: string | null;
  readonly evidenceRef: string;
  readonly observedAt: string;
  readonly retrievedAt: string;
  readonly freshness: FintechNumericObservation['freshness'];
  readonly dataStatus: FintechNumericObservation['status'];
}

export interface ValidatedFinancialFeatureContract {
  readonly mappingContractVersion: typeof VALIDATED_FINANCIAL_FEATURE_MAPPING_CONTRACT_VERSION;
  readonly sourceDataContractVersion: string;
  readonly targetFeatureContractVersion: string;
  readonly assetId: string;
  readonly correlationId: string;
  readonly aggregateDataStatus: Extract<ValidatedDataStatus, 'PASS' | 'PARTIAL'>;
  readonly provenanceComplete: true;
  readonly model: {
    readonly registryVersion: string;
    readonly modelId: string;
    readonly version: string;
    readonly alias: string;
    readonly lifecycle: string;
    readonly executorKey: string;
  };
  readonly features: readonly ValidatedFinancialFeatureValue[];
  readonly evidenceRefs: readonly string[];
  readonly providers: readonly string[];
}

export interface ValidatedFinancialFeatureMappingReady {
  readonly status: 'READY';
  readonly contract: ValidatedFinancialFeatureContract;
}

export interface ValidatedFinancialFeatureMappingFailure {
  readonly status: 'FEATURE_NOT_COMPUTABLE';
  readonly contract: null;
  readonly assetId: string;
  readonly correlationId: string;
  readonly targetFeatureContractVersion: string;
  readonly reasons: readonly string[];
}

export type ValidatedFinancialFeatureMappingResult =
  | ValidatedFinancialFeatureMappingReady
  | ValidatedFinancialFeatureMappingFailure;

function normalized(value: string): string {
  return String(value || '').trim();
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function canonicalModelReady(model: ScoringModelDescriptor): boolean {
  return model.lifecycle === 'canonical'
    && model.alias === 'champion'
    && model.scoreEligible !== false
    && model.evidencePolicy === 'verified-required'
    && model.canonicalResultAdapterRequired === false;
}

/**
 * FIN-12 / PVC-12 boundary.
 *
 * Converts the DATA-owned fail-closed FintechDataHandoff projection into an explicit, versioned
 * FINTECH feature-mapping contract. The function performs no feature synthesis or estimation: every
 * output value is a one-to-one mapping of one admitted DATA observation and carries its exact
 * provider/evidence/freshness lineage. Reusing one source observation under multiple feature names
 * is rejected so this boundary cannot silently create correlated double-counting.
 */
export function mapValidatedDataToFinancialFeatureContract(
  input: ValidatedDataInput,
  model: ScoringModelDescriptor,
  bindings: readonly ValidatedFinancialFeatureBinding[],
): ValidatedFinancialFeatureMappingResult {
  const projection = projectValidatedDataInputForFintech(input);
  const reasons = [...projection.blockingReasons];

  if (!canonicalModelReady(model)) {
    reasons.push(`model-not-canonical-score-eligible:${model.modelId}@${model.version}`);
  }
  if (!normalized(model.featureContractVersion)) {
    reasons.push('target-feature-contract-version-required');
  }
  if (bindings.length === 0) {
    reasons.push('feature-binding-required');
  }

  const normalizedBindings = bindings.map(binding => ({
    featureKey: normalized(binding.featureKey),
    sourceField: normalized(binding.sourceField),
  }));
  const featureKeys = normalizedBindings.map(binding => binding.featureKey);
  const sourceFields = normalizedBindings.map(binding => binding.sourceField);

  if (featureKeys.some(key => !key)) reasons.push('feature-key-required');
  if (sourceFields.some(field => !field)) reasons.push('source-field-required');
  if (new Set(featureKeys).size !== featureKeys.length) reasons.push('duplicate-feature-key');
  if (new Set(sourceFields).size !== sourceFields.length) reasons.push('duplicate-source-field');

  const mapped: ValidatedFinancialFeatureValue[] = [];
  if (projection.admissibleForNumericFeatures) {
    for (const binding of normalizedBindings) {
      if (!binding.featureKey || !binding.sourceField) continue;
      const candidates = projection.numericObservations.filter(
        observation => observation.field === binding.sourceField,
      );
      if (candidates.length === 0) {
        reasons.push(`source-field-missing:${binding.sourceField}`);
        continue;
      }
      if (candidates.length > 1) {
        reasons.push(`source-field-ambiguous:${binding.sourceField}`);
        continue;
      }
      const source = candidates[0];
      mapped.push({
        featureKey: binding.featureKey,
        sourceField: binding.sourceField,
        value: source.value,
        currency: source.currency,
        providerId: source.providerId,
        providerFeed: source.providerFeed,
        evidenceRef: source.evidenceRef,
        observedAt: source.observedAt,
        retrievedAt: source.retrievedAt,
        freshness: { ...source.freshness },
        dataStatus: source.status,
      });
    }
  }

  if (mapped.length !== normalizedBindings.length) {
    reasons.push('feature-binding-incomplete');
  }

  const uniqueReasons = uniqueSorted(reasons);
  if (
    uniqueReasons.length > 0
    || !projection.admissibleForNumericFeatures
    || (projection.aggregateStatus !== 'PASS' && projection.aggregateStatus !== 'PARTIAL')
  ) {
    return {
      status: 'FEATURE_NOT_COMPUTABLE',
      contract: null,
      assetId: projection.assetId,
      correlationId: projection.correlationId,
      targetFeatureContractVersion: model.featureContractVersion,
      reasons: uniqueReasons,
    };
  }

  return {
    status: 'READY',
    contract: {
      mappingContractVersion: VALIDATED_FINANCIAL_FEATURE_MAPPING_CONTRACT_VERSION,
      sourceDataContractVersion: projection.sourceContractVersion,
      targetFeatureContractVersion: model.featureContractVersion,
      assetId: projection.assetId,
      correlationId: projection.correlationId,
      aggregateDataStatus: projection.aggregateStatus,
      provenanceComplete: true,
      model: {
        registryVersion: model.registryVersion,
        modelId: model.modelId,
        version: model.version,
        alias: model.alias,
        lifecycle: model.lifecycle,
        executorKey: model.executorKey,
      },
      features: mapped,
      evidenceRefs: uniqueSorted(mapped.map(feature => feature.evidenceRef)),
      providers: uniqueSorted(mapped.map(feature => feature.providerId)),
    },
  };
}
