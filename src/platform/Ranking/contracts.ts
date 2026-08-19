import type { UniversalAssetIdentity } from '../Scoring/contracts';
import type { CanonicalScoreResult, DataQualityLevel } from '../../types/scoringIntegrity';

/**
 * SC-7 cross-asset ranking contract.
 * Ranks canonical results only; never executes a model or invents comparability.
 */
export const CROSS_ASSET_RANKING_CONTRACT_VERSION = 'cross-asset-ranking/1.0.0' as const;
export const CROSS_ASSET_RANKING_IMPACT_ENABLED = false as const;

export type CrossAssetRankingMode = 'overall' | 'category' | 'tier' | 'growth';
export type RankingOperationsState = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'NO_RUNTIME_EVIDENCE';

export interface CrossAssetRankingGovernance {
  eligible: boolean;
  eligibilityStatus?: string;
  operationsState?: RankingOperationsState;
  sourceConflict?: boolean;
}

export interface ScoreComparabilityEvidence {
  normalizedValue: number;
  comparisonKey: string;
  methodVersion: string;
  evidenceId: string;
  observedAt: string;
  retrievedAt: string;
  verified: boolean;
}

export interface GrowthRankingEvidence {
  value: number;
  comparisonKey: string;
  evidenceId: string;
  observedAt: string;
  retrievedAt: string;
  verified: boolean;
}

export interface CanonicalRankingCandidate {
  asset: UniversalAssetIdentity;
  canonical: CanonicalScoreResult;
  category?: string | null;
  tier?: 1 | 2 | 3 | null;
  /**
   * Without verified normalization, cohort identity is bounded by model id/version + asset class +
   * feature/scoring contract. Different intended-use contracts cannot share an ordering implicitly.
   */
  scoreComparability?: ScoreComparabilityEvidence | null;
  growth?: GrowthRankingEvidence | null;
  governance?: CrossAssetRankingGovernance | null;
}

export type CrossAssetRankingExclusionReason =
  | 'SCORE_NOT_READY'
  | 'SCORE_VALUE_INVALID'
  | 'IDENTITY_MISMATCH'
  | 'MODEL_LINEAGE_MISSING'
  | 'GOVERNANCE_EVIDENCE_MISSING'
  | 'GOVERNANCE_INELIGIBLE'
  | 'SOURCE_CONFLICT'
  | 'OPERATIONS_EVIDENCE_UNAVAILABLE'
  | 'CATEGORY_MISSING'
  | 'TIER_MISSING'
  | 'COMPARABILITY_EVIDENCE_UNVERIFIED'
  | 'COMPARABILITY_VALUE_INVALID'
  | 'GROWTH_EVIDENCE_MISSING'
  | 'GROWTH_EVIDENCE_UNVERIFIED'
  | 'GROWTH_VALUE_INVALID'
  | 'COMPARISON_KEY_MISSING'
  | 'DUPLICATE_ASSET';

export interface CrossAssetRankingExclusion {
  assetId: string;
  symbol: string;
  assetClass: UniversalAssetIdentity['assetClass'];
  reason: CrossAssetRankingExclusionReason;
  detail?: string;
}

export interface RankedCanonicalAsset {
  assetId: string;
  symbol: string;
  assetClass: UniversalAssetIdentity['assetClass'];
  mode: CrossAssetRankingMode;
  cohortKey: string;
  rank: number;
  rankingValue: number;
  canonicalScore: number;
  dataQuality: DataQualityLevel;
  dispatcherVersion: string;
  modelRegistryVersion: string;
  modelId: string;
  modelVersion: string;
  executorKey: string;
  resultContractVersion: string;
  featureVersion: string;
  scoringVersion: string;
  tieBreaker: string;
}

export interface CrossAssetRankingCohort {
  key: string;
  mode: CrossAssetRankingMode;
  comparisonBasis:
    | 'canonical-score-same-intended-use-contract'
    | 'verified-normalized-score'
    | 'verified-growth-evidence';
  crossCohortOrder: false;
  entries: RankedCanonicalAsset[];
}

export interface CrossAssetRankingResult {
  contractVersion: typeof CROSS_ASSET_RANKING_CONTRACT_VERSION;
  impactEnabled: typeof CROSS_ASSET_RANKING_IMPACT_ENABLED;
  mode: CrossAssetRankingMode;
  status: 'READY' | 'PARTIAL' | 'NO_RANKABLE_ASSETS';
  cohorts: CrossAssetRankingCohort[];
  excluded: CrossAssetRankingExclusion[];
}
