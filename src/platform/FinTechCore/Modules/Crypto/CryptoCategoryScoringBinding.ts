import type {
  CryptoCategory,
  CryptoClassification,
  CryptoSubCategory,
} from '../../../../types/crypto.types';
import type { CanonicalScoreResult } from '../../../../types/scoringIntegrity';
import {
  projectValidatedDataInputForFintech,
  type FintechNumericObservation,
} from '../../../MarketData/FintechDataHandoff';
import type {
  ValidatedDataInput,
  ValidatedDataStatus,
} from '../../../MarketData/ValidatedDataInput';
import {
  scoringModelRegistry,
  RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
} from '../../../Scoring/ScoringModelRegistry';
import type { ScoringModelDescriptor } from '../../../Scoring/contracts';
import {
  CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT,
  CRYPTO_MEME_RESEARCH_MODEL_CONTRACT,
  type CryptoResearchModelContract,
} from '../../../Scoring/CryptoResearchModelContracts';
import {
  resolveCryptoAnalysisProfile,
  type CryptoAnalysisProfileId,
  type CryptoProfileBinding,
} from '../../CryptoModuleContracts';
import {
  CRYPTO_UNIVERSAL_MARKET_FEATURES,
  buildCryptoCategoryFeatureContract,
  getCryptoCategoryFeatureDefinitions,
  type CryptoCategoryFeatureContract,
  type CryptoFeatureEvidence,
} from './CryptoCategoryFeatureContracts';

export const CRYPTO_CATEGORY_SCORING_BINDING_VERSION =
  'fintech-core.crypto/category-scoring-binding/1.0.0' as const;
export const CRYPTO_SCORING_LINEAGE_PROJECTION_VERSION =
  'fintech-core.crypto/scoring-lineage-projection/1.0.0' as const;

export type CryptoCategoryBindingStatus = 'READY' | 'NOT_COMPUTABLE' | 'BLOCKED';

export interface CryptoValidatedFeatureLineage {
  readonly sourceField: string;
  readonly featureKey: string;
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

export interface CryptoValidatedCategoryFeatureBinding {
  readonly bindingVersion: typeof CRYPTO_CATEGORY_SCORING_BINDING_VERSION;
  readonly status: CryptoCategoryBindingStatus;
  readonly sourceDataContractVersion: string;
  readonly assetId: string;
  readonly correlationId: string;
  readonly classification: CryptoClassification;
  readonly requestedProfileId: CryptoAnalysisProfileId;
  readonly effectiveProfileId: CryptoAnalysisProfileId;
  readonly profileBinding: CryptoProfileBinding;
  readonly categoryFeatureContract: CryptoCategoryFeatureContract;
  readonly lineage: readonly CryptoValidatedFeatureLineage[];
  readonly dataQuality: ValidatedDataStatus;
  readonly blockingReasons: readonly string[];
}

export interface CryptoModelProjection {
  readonly modelId: string;
  readonly modelVersion: string;
  readonly lifecycle: ScoringModelDescriptor['lifecycle'];
  readonly featureContractVersion: string;
  readonly evidencePolicy: ScoringModelDescriptor['evidencePolicy'];
  readonly formulaOrMethodReference: string;
  readonly weightsIfApplicable: Readonly<Record<string, number>> | null;
  readonly hardGates: readonly string[];
  readonly antiCorrelationRules: readonly string[];
  readonly scoreEligible: boolean;
  readonly executionEligible: boolean;
  readonly supportedCategories: readonly CryptoCategory[];
  readonly supportedSubcategories: readonly CryptoSubCategory[];
}

export interface CryptoCategoryModelBinding {
  readonly bindingVersion: typeof CRYPTO_CATEGORY_SCORING_BINDING_VERSION;
  readonly categoryMain: CryptoCategory;
  readonly categorySub: CryptoSubCategory;
  readonly canonical: CryptoModelProjection;
  readonly researchChallengers: readonly CryptoModelProjection[];
  readonly researchTarget: {
    readonly authority: 'RESEARCH_TARGET_NOT_MODEL';
    readonly lenses: readonly string[];
  } | null;
}

export interface CryptoCategoryDispatchBinding {
  readonly assetId: string;
  readonly categoryMain: CryptoCategory;
  readonly categorySub: CryptoSubCategory;
  readonly modelId: string;
  readonly modelVersion: string;
  readonly featureContractVersion: string;
  readonly evidenceRefs: readonly string[];
  readonly dataQuality: ValidatedDataStatus;
  readonly correlationId: string;
}

export interface CryptoFrontendScoringProjection {
  readonly model_id: string;
  readonly model_version: string;
  readonly lifecycle: ScoringModelDescriptor['lifecycle'];
  readonly canonical_vs_research: 'CANONICAL';
  readonly category_main: CryptoCategory;
  readonly category_sub: CryptoSubCategory;
  readonly tier: CryptoClassification['tier'];
  readonly confidence: number;
  readonly providers: readonly string[];
  readonly evidence_ids: readonly string[];
  readonly freshness: readonly FintechNumericObservation['freshness'][];
  readonly data_quality: ValidatedDataStatus;
  readonly scoreEligible: boolean;
  readonly executionEligible: boolean;
  readonly explicit_not_computable_reason: string | null;
}

export interface CryptoOpsTraceProjection {
  readonly projectionVersion: typeof CRYPTO_SCORING_LINEAGE_PROJECTION_VERSION;
  readonly correlationId: string;
  readonly assetId: string;
  readonly categoryMain: CryptoCategory;
  readonly categorySub: CryptoSubCategory;
  readonly modelId: string;
  readonly modelVersion: string;
  readonly featureContractVersion: string;
  readonly providerSet: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly dataQuality: ValidatedDataStatus;
  readonly canonicalScoreStatus: CanonicalScoreResult['status'];
  readonly observedAt: readonly string[];
  readonly retrievedAt: readonly string[];
}

export interface CryptoScoringLineageProjection {
  readonly projectionVersion: typeof CRYPTO_SCORING_LINEAGE_PROJECTION_VERSION;
  readonly status: 'READY' | 'NOT_COMPUTABLE';
  readonly frontend: CryptoFrontendScoringProjection;
  readonly opsTrace: CryptoOpsTraceProjection;
  readonly reasons: readonly string[];
}

const UNIVERSAL_SOURCE_FIELD_TO_FEATURE: Readonly<Record<string, string>> = Object.freeze({
  price: 'market.priceUsd',
  marketCapUsd: 'market.marketCapUsd',
  volume24hUsd: 'market.volume24hUsd',
  circulatingSupply: 'tokenomics.circulatingSupply',
  maxSupply: 'tokenomics.maxSupply',
  totalSupply: 'tokenomics.totalSupply',
});

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function effectiveProfile(classification: CryptoClassification): Readonly<{
  requestedProfileId: CryptoAnalysisProfileId;
  effectiveProfileId: CryptoAnalysisProfileId;
  profileBinding: CryptoProfileBinding;
  reason?: string;
}> {
  const binding = resolveCryptoAnalysisProfile(classification.category_main);
  if (binding.binding === 'CONDITIONAL') {
    return {
      requestedProfileId: binding.profileId,
      effectiveProfileId: 'generic',
      profileBinding: binding.binding,
      reason: `conditional-profile-evidence-required:${binding.profileId}`,
    };
  }
  return {
    requestedProfileId: binding.profileId,
    effectiveProfileId: binding.profileId,
    profileBinding: binding.binding,
  };
}

function exactFeatureKey(
  observation: FintechNumericObservation,
  categoryKeys: ReadonlySet<string>,
  universalKeys: ReadonlySet<string>,
): string | null {
  if (categoryKeys.has(observation.field) || universalKeys.has(observation.field)) return observation.field;
  const mapped = UNIVERSAL_SOURCE_FIELD_TO_FEATURE[observation.field];
  if (!mapped) return null;
  if (mapped === 'market.priceUsd' && observation.currency !== 'USD') return null;
  return universalKeys.has(mapped) ? mapped : null;
}

function toEvidence(observation: FintechNumericObservation, featureKey: string): CryptoFeatureEvidence {
  return Object.freeze({
    key: featureKey,
    status: 'VERIFIED' as const,
    value: observation.value,
    provider: observation.providerId,
    evidenceRefs: Object.freeze([observation.evidenceRef]),
    observedAt: observation.observedAt,
    retrievedAt: observation.retrievedAt,
  });
}

/**
 * FIN-12 category/subclass feature boundary. Only DATA-admitted numeric observations are considered.
 * Exact category feature keys pass through unchanged; a deliberately tiny universal alias map exists
 * for unambiguous DATA fields. No provider call, semantic estimate, neutral default or null-to-zero
 * conversion occurs here.
 */
export function bindValidatedDataToCryptoCategoryFeatures(
  input: ValidatedDataInput,
  classification: CryptoClassification,
): CryptoValidatedCategoryFeatureBinding {
  const projection = projectValidatedDataInputForFintech(input);
  const profile = effectiveProfile(classification);
  const categoryDefinitions = getCryptoCategoryFeatureDefinitions(profile.effectiveProfileId);
  const categoryKeys = new Set(categoryDefinitions.map(item => item.key));
  const universalKeys = new Set(CRYPTO_UNIVERSAL_MARKET_FEATURES.map(item => item.key));
  const blockingReasons = [...projection.blockingReasons];
  if (profile.reason) blockingReasons.push(profile.reason);

  const mapped = projection.numericObservations.flatMap((observation) => {
    const featureKey = exactFeatureKey(observation, categoryKeys, universalKeys);
    return featureKey ? [{ observation, featureKey }] : [];
  });
  const ambiguousKeys = new Set<string>();
  const counts = new Map<string, number>();
  for (const item of mapped) counts.set(item.featureKey, (counts.get(item.featureKey) ?? 0) + 1);
  for (const [key, count] of counts.entries()) {
    if (count > 1) {
      ambiguousKeys.add(key);
      blockingReasons.push(`feature-source-ambiguous:${key}`);
    }
  }

  const accepted = mapped.filter(item => !ambiguousKeys.has(item.featureKey));
  const categoryEvidence = accepted
    .filter(item => categoryKeys.has(item.featureKey))
    .map(item => toEvidence(item.observation, item.featureKey));
  const universalEvidence = accepted
    .filter(item => universalKeys.has(item.featureKey))
    .map(item => toEvidence(item.observation, item.featureKey));

  const categoryFeatureContract = buildCryptoCategoryFeatureContract({
    assetId: projection.assetId,
    profileId: profile.effectiveProfileId,
    evidence: categoryEvidence,
    universalMarketEvidence: universalEvidence,
  });

  if (categoryFeatureContract.status === 'BLOCKED') blockingReasons.push('category-feature-hard-gate-failed');
  if (categoryFeatureContract.status !== 'READY' && categoryFeatureContract.status !== 'BLOCKED') {
    blockingReasons.push(`category-feature-status:${categoryFeatureContract.status}`);
  }

  const status: CryptoCategoryBindingStatus = categoryFeatureContract.status === 'BLOCKED'
    ? 'BLOCKED'
    : projection.admissibleForNumericFeatures
      && categoryFeatureContract.status === 'READY'
      && blockingReasons.length === 0
      ? 'READY'
      : 'NOT_COMPUTABLE';

  return Object.freeze({
    bindingVersion: CRYPTO_CATEGORY_SCORING_BINDING_VERSION,
    status,
    sourceDataContractVersion: projection.sourceContractVersion,
    assetId: projection.assetId,
    correlationId: projection.correlationId,
    classification,
    requestedProfileId: profile.requestedProfileId,
    effectiveProfileId: profile.effectiveProfileId,
    profileBinding: profile.profileBinding,
    categoryFeatureContract,
    lineage: Object.freeze(accepted.map(({ observation, featureKey }) => Object.freeze({
      sourceField: observation.field,
      featureKey,
      value: observation.value,
      currency: observation.currency,
      providerId: observation.providerId,
      providerFeed: observation.providerFeed,
      evidenceRef: observation.evidenceRef,
      observedAt: observation.observedAt,
      retrievedAt: observation.retrievedAt,
      freshness: observation.freshness,
      dataStatus: observation.status,
    }))),
    dataQuality: projection.aggregateStatus,
    blockingReasons: Object.freeze(uniqueSorted(blockingReasons)),
  });
}

function researchContractForCategory(category: CryptoCategory): CryptoResearchModelContract | null {
  if (category === 'Meme') return CRYPTO_MEME_RESEARCH_MODEL_CONTRACT;
  if (category === 'DeFi') return CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT;
  return null;
}

function toModelProjection(
  model: ScoringModelDescriptor,
  classification: CryptoClassification,
  researchContract: CryptoResearchModelContract | null,
): CryptoModelProjection {
  return Object.freeze({
    modelId: model.modelId,
    modelVersion: model.version,
    lifecycle: model.lifecycle,
    featureContractVersion: model.featureContractVersion,
    evidencePolicy: model.evidencePolicy,
    formulaOrMethodReference: model.executorKey,
    weightsIfApplicable: null,
    hardGates: Object.freeze(researchContract
      ? researchContract.features.filter(item => item.role === 'HARD_GATE').map(item => item.key)
      : []),
    antiCorrelationRules: Object.freeze(researchContract?.antiCorrelationRules ?? []),
    scoreEligible: model.scoreEligible !== false,
    executionEligible: model.lifecycle === 'canonical'
      && model.scoreEligible !== false
      && model.executorKey !== RESEARCH_ONLY_CHALLENGER_EXECUTOR_KEY,
    supportedCategories: Object.freeze([classification.category_main]),
    supportedSubcategories: Object.freeze([classification.category_sub]),
  });
}

function researchLenses(category: CryptoCategory): readonly string[] {
  switch (category) {
    case 'Layer 1': return Object.freeze(['network_security', 'liquidity', 'adoption_activity', 'supply_dynamics']);
    case 'Layer 2': return Object.freeze(['settlement_dependency', 'sequencer_or_bridge_risk', 'liquidity', 'activity']);
    case 'Stablecoin': return Object.freeze(['peg_quality', 'liquidity', 'reserve_evidence_when_available', 'depeg_risk']);
    case 'Oracle': return Object.freeze(['protocol_adoption', 'data_quality_or_uptime_evidence_when_available', 'concentration', 'market_liquidity']);
    case 'Liquid Staking':
    case 'Restaking': return Object.freeze(['protocol_risk', 'yield_evidence', 'liquidity', 'depeg_risk']);
    case 'Real World Assets': return Object.freeze(['issuer_or_instrument_evidence', 'oracle_dependency', 'liquidity', 'counterparty_risk']);
    case 'Payments': return Object.freeze(['liquidity', 'network_usage_evidence', 'settlement_context']);
    default: return Object.freeze([]);
  }
}

/**
 * Registry projection only: canonical selection remains ScoringModelRegistry. This function never
 * registers a model. Meme/DeFi challenger metadata is projected from the existing registry and
 * research contracts; all other category-specific model ideas remain non-authoritative research targets.
 */
export function resolveCryptoCategoryModelBinding(
  classification: CryptoClassification,
): CryptoCategoryModelBinding {
  const canonicalModel = scoringModelRegistry.get('crypto-technical-provenance', '0.7.0');
  if (!canonicalModel) throw new Error('CRYPTO_CANONICAL_CHAMPION_NOT_REGISTERED');

  const researchContract = researchContractForCategory(classification.category_main);
  const researchModels: CryptoModelProjection[] = [];
  if (researchContract) {
    const model = scoringModelRegistry.get(researchContract.modelId, researchContract.modelVersion);
    if (!model) throw new Error(`CRYPTO_RESEARCH_MODEL_NOT_REGISTERED:${researchContract.modelId}@${researchContract.modelVersion}`);
    researchModels.push(toModelProjection(model, classification, researchContract));
  }

  const lenses = researchLenses(classification.category_main);
  return Object.freeze({
    bindingVersion: CRYPTO_CATEGORY_SCORING_BINDING_VERSION,
    categoryMain: classification.category_main,
    categorySub: classification.category_sub,
    canonical: toModelProjection(canonicalModel, classification, null),
    researchChallengers: Object.freeze(researchModels),
    researchTarget: lenses.length > 0
      ? Object.freeze({ authority: 'RESEARCH_TARGET_NOT_MODEL' as const, lenses })
      : null,
  });
}

export function buildCryptoCategoryDispatchBinding(
  featureBinding: CryptoValidatedCategoryFeatureBinding,
  modelBinding: CryptoCategoryModelBinding,
): CryptoCategoryDispatchBinding {
  return Object.freeze({
    assetId: featureBinding.assetId,
    categoryMain: featureBinding.classification.category_main,
    categorySub: featureBinding.classification.category_sub,
    modelId: modelBinding.canonical.modelId,
    modelVersion: modelBinding.canonical.modelVersion,
    featureContractVersion: modelBinding.canonical.featureContractVersion,
    evidenceRefs: Object.freeze(uniqueSorted(featureBinding.lineage.map(item => item.evidenceRef))),
    dataQuality: featureBinding.dataQuality,
    correlationId: featureBinding.correlationId,
  });
}

/** FIN-20 owner-side lineage projection. OPS owns transport/retention; FE owns presentation. */
export function projectCryptoScoringLineage(
  featureBinding: CryptoValidatedCategoryFeatureBinding,
  modelBinding: CryptoCategoryModelBinding,
  canonical: CanonicalScoreResult,
): CryptoScoringLineageProjection {
  const reasons = [...featureBinding.blockingReasons];
  const integrity = canonical.integrity;
  if (integrity.assetId !== featureBinding.assetId) reasons.push('canonical-asset-identity-mismatch');
  if (integrity.modelId && integrity.modelId !== modelBinding.canonical.modelId) reasons.push('canonical-model-id-mismatch');
  if (integrity.modelVersion && integrity.modelVersion !== modelBinding.canonical.modelVersion) reasons.push('canonical-model-version-mismatch');
  if (integrity.featureVersion && integrity.featureVersion !== modelBinding.canonical.featureContractVersion) reasons.push('canonical-feature-version-mismatch');
  if (canonical.status !== 'READY' && integrity.reason) reasons.push(`canonical:${integrity.reason}`);

  const providers = uniqueSorted(featureBinding.lineage.map(item => item.providerId));
  const evidenceIds = uniqueSorted(featureBinding.lineage.map(item => item.evidenceRef));
  const observedAt = uniqueSorted(featureBinding.lineage.map(item => item.observedAt));
  const retrievedAt = uniqueSorted(featureBinding.lineage.map(item => item.retrievedAt));
  const status = canonical.status === 'READY'
    && featureBinding.status === 'READY'
    && reasons.length === 0
    ? 'READY'
    : 'NOT_COMPUTABLE';
  const reason = status === 'READY' ? null : uniqueSorted(reasons).join('; ') || 'category-scoring-lineage-not-computable';

  return Object.freeze({
    projectionVersion: CRYPTO_SCORING_LINEAGE_PROJECTION_VERSION,
    status,
    frontend: Object.freeze({
      model_id: modelBinding.canonical.modelId,
      model_version: modelBinding.canonical.modelVersion,
      lifecycle: modelBinding.canonical.lifecycle,
      canonical_vs_research: 'CANONICAL' as const,
      category_main: featureBinding.classification.category_main,
      category_sub: featureBinding.classification.category_sub,
      tier: featureBinding.classification.tier,
      confidence: featureBinding.classification.confidence,
      providers: Object.freeze(providers),
      evidence_ids: Object.freeze(evidenceIds),
      freshness: Object.freeze(featureBinding.lineage.map(item => item.freshness)),
      data_quality: featureBinding.dataQuality,
      scoreEligible: modelBinding.canonical.scoreEligible,
      executionEligible: modelBinding.canonical.executionEligible,
      explicit_not_computable_reason: reason,
    }),
    opsTrace: Object.freeze({
      projectionVersion: CRYPTO_SCORING_LINEAGE_PROJECTION_VERSION,
      correlationId: featureBinding.correlationId,
      assetId: featureBinding.assetId,
      categoryMain: featureBinding.classification.category_main,
      categorySub: featureBinding.classification.category_sub,
      modelId: modelBinding.canonical.modelId,
      modelVersion: modelBinding.canonical.modelVersion,
      featureContractVersion: modelBinding.canonical.featureContractVersion,
      providerSet: Object.freeze(providers),
      evidenceIds: Object.freeze(evidenceIds),
      dataQuality: featureBinding.dataQuality,
      canonicalScoreStatus: canonical.status,
      observedAt: Object.freeze(observedAt),
      retrievedAt: Object.freeze(retrievedAt),
    }),
    reasons: Object.freeze(uniqueSorted(reasons)),
  });
}
