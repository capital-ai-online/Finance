import type { ProviderCapability } from '../MarketData/contracts';

export const ANALYSIS_COMPONENT_REGISTRY_VERSION = 'analysis-component-registry/1.0.0' as const;
export const ANALYSIS_COMPONENT_RESULT_CONTRACT_VERSION = 'analysis-component-result/1.0.0' as const;

export type AnalysisComponentStatus =
  | 'planned'
  | 'mock'
  | 'shadow'
  | 'active'
  | 'degraded'
  | 'blocked'
  | 'retired';

export type AnalysisDataAvailability =
  | 'live'
  | 'delayed'
  | 'cached'
  | 'simulated'
  | 'unavailable'
  | 'degraded';

export type MarketIntelligenceAssetClass =
  | 'stock'
  | 'etf'
  | 'index'
  | 'crypto'
  | 'forex'
  | 'commodity'
  | 'future'
  | 'option'
  | 'bond'
  | 'macro'
  | 'portfolio'
  | 'multi-asset';

export type CanonicalMarketIntelligenceDomain =
  | 'market-data'
  | 'provider-registry'
  | 'asset-master'
  | 'feature-store'
  | 'market-intelligence'
  | 'scoring'
  | 'ranking'
  | 'evidence'
  | 'data-quality'
  | 'risk-controls'
  | 'pipeline-configurator'
  | 'observability'
  | 'ui-explainability';

export type AnalysisProviderRequirementMode =
  | 'CANONICAL_INPUT'
  | 'EVIDENCE_INPUT'
  | 'OPTIONAL_CONTEXT';

export interface AnalysisProviderCapabilityDependency {
  readonly capability: ProviderCapability;
  readonly mode: AnalysisProviderRequirementMode;
  readonly purpose: string;
}

export type AnalysisRefreshPolicy =
  | 'event-driven'
  | 'snapshot'
  | 'bar-close'
  | 'news-event'
  | 'fundamental-release'
  | 'macro-release'
  | 'onchain-cadence'
  | 'scheduled';

export type AnalysisWeightPolicy =
  | 'hard-gate'
  | 'fixed-versioned'
  | 'renormalized-versioned'
  | 'research-only'
  | 'not-applicable';

export type AnalysisConfidencePolicy =
  | 'data-sufficiency'
  | 'evidence-coverage'
  | 'not-calibrated'
  | 'not-applicable';

export type AnalysisRiskPolicy =
  | 'hard-block'
  | 'penalty'
  | 'research-block'
  | 'not-applicable';

export type AnalysisEligibilityPolicy =
  | 'hard-gated'
  | 'canonical-score-only'
  | 'research-only'
  | 'display-only'
  | 'not-applicable';

export interface AnalysisComponentDescriptor {
  readonly componentId: string;
  readonly displayName: string;
  readonly domain: CanonicalMarketIntelligenceDomain;
  readonly assetClassScope: readonly MarketIntelligenceAssetClass[];
  readonly status: AnalysisComponentStatus;
  readonly dataAvailability: readonly AnalysisDataAvailability[];
  readonly inputContracts: readonly string[];
  readonly outputContract: typeof ANALYSIS_COMPONENT_RESULT_CONTRACT_VERSION;
  readonly featureDependencies: readonly string[];
  readonly providerDependencies: readonly AnalysisProviderCapabilityDependency[];
  readonly calculationVersion: string;
  readonly refreshPolicy: AnalysisRefreshPolicy;
  readonly weightPolicy: AnalysisWeightPolicy;
  readonly confidencePolicy: AnalysisConfidencePolicy;
  readonly riskPolicy: AnalysisRiskPolicy;
  readonly eligibilityPolicy: AnalysisEligibilityPolicy;
  readonly reasonCodeCatalog: string;
  readonly owner: 'CAPITAL-AI-FINTECH';
  readonly lastValidatedAt: string | null;
  /**
   * Correlation-only references to the existing AnalysisConnectionRegistry.
   * They never grant execution, scoring, provider or compatibility authority.
   */
  readonly analysisConnectionIds: readonly string[];
}

export type AnalysisComponentSourceMode = 'PROVIDER' | 'DERIVED' | 'DEMO';

export interface AnalysisComponentConfidence {
  readonly value: number | null;
  readonly semantics: 'DATA_SUFFICIENCY';
}

export interface AnalysisComponentRisk {
  readonly state: 'PASS' | 'PENALTY' | 'BLOCK';
  readonly reasonCodes: readonly string[];
}

export interface AnalysisComponentEligibility {
  readonly scoreEligible: boolean;
  readonly rankingEligible: boolean;
  readonly alertEligible: boolean;
}

export type AnalysisComponentResultStatus =
  | 'READY'
  | 'PARTIAL'
  | 'NOT_COMPUTABLE'
  | 'BLOCKED';

export interface AnalysisComponentResult<T = number> {
  readonly contractVersion: typeof ANALYSIS_COMPONENT_RESULT_CONTRACT_VERSION;
  readonly componentId: string;
  readonly calculationVersion: string;
  readonly assetId: string;
  readonly correlationId: string;
  readonly evaluatedAt: string;
  readonly status: AnalysisComponentResultStatus;
  readonly sourceMode: AnalysisComponentSourceMode;
  readonly value: T | null;
  readonly confidence: AnalysisComponentConfidence;
  readonly evidenceRefs: readonly string[];
  readonly featureRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly risk: AnalysisComponentRisk;
  readonly eligibility: AnalysisComponentEligibility;
}
