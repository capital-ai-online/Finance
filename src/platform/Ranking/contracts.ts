import type { UniversalAssetIdentity } from '../Scoring/contracts';
import type { CanonicalScoreResult, DataQualityLevel } from '../../types/scoringIntegrity';

/**
 * SC-7 cross-asset ranking contract.
 *
 * This layer ranks already-canonical results. It never executes a scoring model, changes a score,
 * or invents cross-model/cross-segment comparability. Cohort membership is explicit and
 * cross-cohort ordering is forbidden until a separately validated comparability contract exists.
 */
export const CROSS_ASSET_RANKING_CONTRACT_VERSION = 'cross-asset-ranking/1.0.0' as const;

/** Hard gate: Phase D is shadow/read-only and must not alter productive ranking decisions. */
export const CROSS_ASSET_RANKING_IMPACT_ENABLED = false as const;

export type CrossAssetRankingMode = 'overall' | 'category' | 'tier' | 'growth';

export type RankingOperationsState =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'NO_RUNTIME_EVIDENCE';

export interface CrossAssetRankingGovernance {
  /** Explicit screening/governance admission. Absence or false fails closed. */
  eligible: boolean;
  eligibilityStatus?: string;
  operationsState?: RankingOperationsState;
  sourceConflict?: boolean;
}

/**
 * Cross-model/cross-segment score comparability is never inferred from equal-looking numeric
 * scales. A caller must provide a separately validated normalization result with method/evidence
 * lineage before candidates from different default cohorts can share an ordering.
 */
export interface ScoreComparabilityEvidence {
  normalizedValue: number;
  comparisonKey: string;
  methodVersion: string;
  evidenceId: string;
  observedAt: string;
  retrievedAt: string;
  verified: boolean;
}

/**
 * Growth is never inferred from the canonical score. A caller must provide separately verified,
 * horizon-specific evidence plus a comparison key whose semantics were established upstream.
 */
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
  /** Optional peer metadata. Required by category mode. */
  category?: string | null;
  /** Optional peer metadata. Required by tier mode. */
  tier?: 1 | 2 | 3 | null;
  /**
   * Optional verified normalization evidence. When omitted, model id + version + asset class is
   * the cohort boundary. Supplying only a label is insufficient: a normalized value and method
   * lineage are required before different model/segment cohorts can share a ranking cohort.
   */
  scoreComparability?: ScoreComparabilityEvidence | null;
  /** Required by growth mode; ignored by score-based modes. */
  growth?: GrowthRankingEvidence | null;
  /** Explicit governance evidence is required for admission. */
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
  modelId: string;
  modelVersion: string;
  dispatcherVersion: string;
  /** Stable deterministic tie-breaker; no hidden financial factor is applied. */
  tieBreaker: string;
}

export interface CrossAssetRankingCohort {
  key: string;
  mode: CrossAssetRankingMode;
  comparisonBasis:
    | 'canonical-score-same-model-asset-class'
    | 'verified-normalized-score'
    | 'verified-growth-evidence';
  /** Cross-cohort positions are intentionally undefined. */
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
