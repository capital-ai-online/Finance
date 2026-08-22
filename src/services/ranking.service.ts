import type { CryptoAnalysisPayload } from "../types/crypto.types";
import {
  compositeLevelToRankingDqPoints,
  type CompositeDqLevel,
} from "../platform/MarketData/CompositeDataQuality";
import { ClassificationService } from "./classification.service";

/**
 * SC-7 phase A (SC-MD-SPT-0001): ranking may resolve DQ points via the SC-3
 * composite level helper. This does NOT enable scoreImpact / rankingImpact.
 * Numeric weights and eligibility thresholds stay unchanged until Owner gate.
 */
export const RANKING_COMPOSITE_OPT_IN_VERSION = "ranking-composite-opt-in/1.0.0" as const;

/** Hard gate: composite never silently changes ranking impact semantics. */
export const RANKING_SCORE_IMPACT_ENABLED = false as const;

export interface RankingGovernanceEvidence {
  eligible: boolean;
  eligibilityStatus?: string;
  operationsState?: "HEALTHY" | "DEGRADED" | "UNAVAILABLE" | "NO_RUNTIME_EVIDENCE";
  sourceConflict?: boolean;
}

/**
 * Optional DQ override for ranking consumers that already hold a composite level.
 * When omitted, payload.data_quality.level is used (same point map).
 */
export interface RankingDqOptions {
  /** Prefer SC-3 composite level when the caller computed one. */
  compositeLevel?: CompositeDqLevel | null;
}

/**
 * Single DQ-points resolution path (legacy payload level OR optional composite level).
 * Mapping is identical to the historical inline ternary (100/70/40/50).
 */
export function resolveRankingDqPoints(
  payload: CryptoAnalysisPayload,
  options?: RankingDqOptions,
): number {
  const level =
    options?.compositeLevel ??
    (payload.data_quality?.level as CompositeDqLevel | undefined) ??
    "unknown";
  return compositeLevelToRankingDqPoints(level);
}

function canonicalRankingClassification(payload: CryptoAnalysisPayload) {
  const candidate = payload as CryptoAnalysisPayload & { symbol?: string; coin?: string };
  const symbol = String(candidate.symbol ?? candidate.coin ?? '').toUpperCase().trim();
  return ClassificationService.classifyAsset(symbol);
}

export function calculateRankScore(
  payload: CryptoAnalysisPayload,
  finalScore: number,
  options?: RankingDqOptions,
) {
  const dq = resolveRankingDqPoints(payload, options);
  // P0 authority boundary: never trust payload.classification for ranking.
  const tier = canonicalRankingClassification(payload).tier;
  const tierScore = tier === 1 ? 100 : tier === 2 ? 78 : 55;
  const liquidity = payload.scores?.liquidity ?? 0;

  // Formula unchanged (ARCH-AUDIT ranking contract): 0.70 / 0.15 / 0.10 / 0.05
  return 0.7 * finalScore + 0.15 * dq + 0.1 * tierScore + 0.05 * liquidity;
}

export function isTop10Eligible(payload: CryptoAnalysisPayload): boolean {
  // P0 authority boundary: caller-provided confidence has zero eligibility authority.
  const confidence = canonicalRankingClassification(payload).confidence ?? 0;
  const liquidity = payload.scores?.liquidity ?? 0;
  const dq = payload.data_quality?.level ?? "unknown";
  return confidence >= 0.65 && liquidity >= 50 && dq !== "low";
}

/**
 * Governance boundary for ranking. It never changes the numeric rank score.
 * Existing financial eligibility must pass first; explicit screening ineligibility,
 * source conflicts or unavailable operations evidence prevent a hard Top-10 admission.
 */
export function isTop10GovernanceEligible(
  payload: CryptoAnalysisPayload,
  governance?: RankingGovernanceEvidence,
): boolean {
  if (!isTop10Eligible(payload)) return false;
  if (!governance) return false;
  if (!governance.eligible) return false;
  if (governance.sourceConflict) return false;
  if (
    governance.operationsState === "UNAVAILABLE" ||
    governance.operationsState === "NO_RUNTIME_EVIDENCE"
  ) {
    return false;
  }
  return true;
}