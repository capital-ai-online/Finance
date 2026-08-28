import { ClassificationService } from '../../../services/classification.service';
import {
  resolveCryptoAnalysisProfile,
  type CryptoAnalysisProfileId,
  type CryptoMetricDirection,
  type CryptoProfileBinding,
  type CryptoProfileSourceStatus,
} from '../../../platform/FinTechCore/CryptoModuleContracts';
import { resolveEffectiveCryptoCategoryAnalysisProfile } from '../../../platform/FinTechCore/Modules/Crypto/CryptoMemeProfileSupersession';
import {
  CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT,
  CRYPTO_MEME_RESEARCH_MODEL_CONTRACT,
  type CryptoResearchModelContract,
} from '../../../platform/Scoring/CryptoResearchModelContracts';
import type { CryptoCategory, CryptoClassification, CryptoSubCategory, CryptoTier } from '../../../types/crypto.types';

export const CRYPTO_CATEGORY_RESEARCH_VIEW_MODEL_VERSION = 'crypto-category-research-view/1.0.0' as const;

export interface CryptoCategoryMetricView {
  readonly key: string;
  readonly label: string;
  readonly weight: number;
  readonly direction: CryptoMetricDirection;
}

export interface CryptoResearchFeatureView {
  readonly key: string;
  readonly label: string;
  readonly source: string;
  readonly latentFactor: string;
  readonly correlationGroup: string;
  readonly requiredForResearch: boolean;
}

export interface CryptoResearchGroupView {
  readonly id: string;
  readonly label: string;
  readonly features: readonly CryptoResearchFeatureView[];
}

export interface CryptoResearchLensView {
  readonly modelId: string;
  readonly modelVersion: string;
  readonly lifecycle: string;
  readonly scoreEligible: false;
  readonly featureContractVersion: string;
  readonly groups: readonly CryptoResearchGroupView[];
  readonly hardGates: readonly CryptoResearchFeatureView[];
  readonly antiCorrelationRules: readonly string[];
}

export interface CryptoCategoryResearchViewModel {
  readonly viewModelVersion: typeof CRYPTO_CATEGORY_RESEARCH_VIEW_MODEL_VERSION;
  readonly symbol: string;
  readonly category: CryptoCategory;
  readonly subCategory: CryptoSubCategory;
  readonly tier: CryptoTier;
  readonly confidence: number;
  readonly classificationReasoning: readonly string[];
  readonly profileId: CryptoAnalysisProfileId;
  readonly binding: CryptoProfileBinding;
  readonly bindingReason: string;
  readonly sourceStatus: CryptoProfileSourceStatus;
  readonly analysisReady: boolean;
  readonly metrics: readonly CryptoCategoryMetricView[];
  readonly unweightedPenaltyMetrics: readonly string[];
  readonly hardGates: readonly string[];
  readonly scoreAuthority: 'SCORING_DISPATCHER_ONLY';
  readonly researchLens: CryptoResearchLensView | null;
}

const LABELS: Readonly<Record<string, string>> = Object.freeze({
  layer1: 'Layer 1',
  layer2: 'Layer 2',
  defi: 'DeFi',
  rwa: 'Real World Assets',
  nft: 'NFT / Creator',
  stablecoin: 'Stablecoin',
  'exchange-token': 'Exchange Token',
  gamefi: 'GameFi',
  'ai-depin': 'AI / DePIN',
  meme: 'Meme',
  generic: 'Generisches Profil',
});

export function humanizeCryptoMetricKey(value: string): string {
  const tail = value.split('.').pop() ?? value;
  return tail
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function cryptoProfileLabel(profileId: CryptoAnalysisProfileId): string {
  return LABELS[profileId] ?? humanizeCryptoMetricKey(profileId);
}

function selectResearchContract(category: CryptoCategory): CryptoResearchModelContract | null {
  if (category === 'Meme') return CRYPTO_MEME_RESEARCH_MODEL_CONTRACT;
  if (category === 'DeFi') return CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT;
  return null;
}

function projectResearchContract(contract: CryptoResearchModelContract | null): CryptoResearchLensView | null {
  if (!contract) return null;

  const grouped = new Map<string, CryptoResearchFeatureView[]>();
  const hardGates: CryptoResearchFeatureView[] = [];

  for (const feature of contract.features) {
    const projected: CryptoResearchFeatureView = Object.freeze({
      key: feature.key,
      label: humanizeCryptoMetricKey(feature.key),
      source: feature.source,
      latentFactor: feature.latentFactor,
      correlationGroup: feature.correlationGroup,
      requiredForResearch: feature.requiredForResearch,
    });

    if (feature.role === 'HARD_GATE') {
      hardGates.push(projected);
      continue;
    }

    const group = grouped.get(feature.correlationGroup) ?? [];
    group.push(projected);
    grouped.set(feature.correlationGroup, group);
  }

  const groups = [...grouped.entries()].map(([id, features]) => Object.freeze({
    id,
    label: humanizeCryptoMetricKey(id),
    features: Object.freeze(features),
  }));

  return Object.freeze({
    modelId: contract.modelId,
    modelVersion: contract.modelVersion,
    lifecycle: contract.lifecycle,
    scoreEligible: false as const,
    featureContractVersion: contract.featureContractVersion,
    groups: Object.freeze(groups),
    hardGates: Object.freeze(hardGates),
    antiCorrelationRules: Object.freeze([...contract.antiCorrelationRules]),
  });
}

export function buildCryptoCategoryResearchViewModel(
  symbolInput: string,
  classificationOverride?: CryptoClassification,
): CryptoCategoryResearchViewModel {
  const symbol = symbolInput.toUpperCase().trim();
  const classification = classificationOverride ?? ClassificationService.classifyAsset(symbol);
  const binding = resolveCryptoAnalysisProfile(classification.category_main);
  const profile = resolveEffectiveCryptoCategoryAnalysisProfile(binding.profileId);

  const metrics = profile.metrics.map((metric) => Object.freeze({
    key: metric.metric,
    label: humanizeCryptoMetricKey(metric.metric),
    weight: metric.weight,
    direction: metric.direction,
  }));

  return Object.freeze({
    viewModelVersion: CRYPTO_CATEGORY_RESEARCH_VIEW_MODEL_VERSION,
    symbol,
    category: classification.category_main,
    subCategory: classification.category_sub,
    tier: classification.tier,
    confidence: classification.confidence,
    classificationReasoning: Object.freeze([...classification.reasoning]),
    profileId: profile.id,
    binding: binding.binding,
    bindingReason: binding.reason,
    sourceStatus: profile.sourceStatus,
    analysisReady: profile.sourceStatus === 'SOURCE_DEFINED',
    metrics: Object.freeze(metrics),
    unweightedPenaltyMetrics: Object.freeze([...(profile.unweightedPenaltyMetrics ?? [])]),
    hardGates: Object.freeze([...(profile.hardGates ?? [])]),
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
    researchLens: projectResearchContract(selectResearchContract(classification.category_main)),
  });
}
