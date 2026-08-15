/**
 * SC-3 Unified Data-Quality + Confidence composite (SC-MD-SPT-0001).
 *
 * Additive pure functions only. Does NOT write into ranking scores, eligibility,
 * or recommendation paths. scoreImpactEnabled remains false until Owner gate.
 *
 * Snapshot-level quality stays in DataQualityService (LIVE/STALE/…). This module
 * builds a cross-asset composite for future ranking consumers.
 */

import type { MarketDataQualityState } from './contracts';

export const COMPOSITE_DATA_QUALITY_VERSION = 'composite-data-quality/1.0.0' as const;
export const UNIFIED_CONFIDENCE_VERSION = 'unified-confidence/1.0.0' as const;

export type CompositeDqLevel = 'low' | 'medium' | 'high' | 'unknown';

export interface CompositeDataQualityInput {
  /** Share of required metrics present with accepted evidence (0–1). */
  sourceCoverage?: number | null;
  /** Observation age in ms; null if unknown. */
  freshnessMs?: number | null;
  /** Max acceptable age before freshness factor degrades. */
  maxAgeMs?: number;
  /** Independent providers contributing consistent evidence. */
  providerCount?: number;
  /** 0–1 transparency/openness of supply or disclosure where applicable. */
  supplyTransparency?: number | null;
  /** True when price/volume outlier detectors flagged the observation. */
  outlierDetected?: boolean;
  /** Snapshot quality from MarketData gateway. */
  snapshotState?: MarketDataQualityState | null;
}

export interface CompositeDataQualityFactorScores {
  sourceCoverage: number | null;
  freshness: number | null;
  supplyTransparency: number | null;
  exchangeBreadth: number | null;
  outlierStability: number | null;
}

export interface CompositeDataQualityResult {
  contractVersion: typeof COMPOSITE_DATA_QUALITY_VERSION;
  /** 0–100 composite; null when no factor available. */
  score: number | null;
  level: CompositeDqLevel;
  factors: CompositeDataQualityFactorScores;
  weightsUsed: Record<string, number>;
  missingFactors: string[];
  /** Always false until Owner enables ranking writeback (SC-7). */
  rankingImpactEnabled: false;
  reasons: string[];
}

const BASE_WEIGHTS = {
  sourceCoverage: 0.25,
  freshness: 0.25,
  supplyTransparency: 0.2,
  exchangeBreadth: 0.15,
  outlierStability: 0.15,
} as const;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function freshnessFactor(freshnessMs: number | null | undefined, maxAgeMs: number): number | null {
  if (freshnessMs === null || freshnessMs === undefined || !Number.isFinite(freshnessMs)) return null;
  if (maxAgeMs <= 0) return null;
  return clamp01(1 - freshnessMs / maxAgeMs);
}

function breadthFactor(providerCount: number | undefined): number | null {
  if (providerCount === undefined || !Number.isFinite(providerCount) || providerCount < 0) return null;
  // 0 providers → 0; 1 → 0.5; 2 → 0.75; ≥3 → 1.0
  if (providerCount <= 0) return 0;
  if (providerCount === 1) return 0.5;
  if (providerCount === 2) return 0.75;
  return 1;
}

function snapshotPenalty(state: MarketDataQualityState | null | undefined): string[] {
  if (!state) return [];
  if (state === 'INVALID' || state === 'UNAVAILABLE') return [`snapshot_state=${state}`];
  if (state === 'STALE' || state === 'DEGRADED') return [`snapshot_state=${state}`];
  return [];
}

/**
 * Compute renormalized composite DQ score (0–100).
 * Missing factors are excluded and weights redistributed (same principle as renormalizeAndScore).
 */
export function computeCompositeDataQuality(input: CompositeDataQualityInput): CompositeDataQualityResult {
  const maxAgeMs = input.maxAgeMs ?? 90_000;
  const reasons: string[] = [];
  const missingFactors: string[] = [];

  const factors: CompositeDataQualityFactorScores = {
    sourceCoverage:
      input.sourceCoverage === null || input.sourceCoverage === undefined
        ? null
        : clamp01(input.sourceCoverage) * 100,
    freshness: (() => {
      const f = freshnessFactor(input.freshnessMs, maxAgeMs);
      return f === null ? null : f * 100;
    })(),
    supplyTransparency:
      input.supplyTransparency === null || input.supplyTransparency === undefined
        ? null
        : clamp01(input.supplyTransparency) * 100,
    exchangeBreadth: (() => {
      const b = breadthFactor(input.providerCount);
      return b === null ? null : b * 100;
    })(),
    outlierStability: input.outlierDetected === undefined ? null : input.outlierDetected ? 0 : 100,
  };

  reasons.push(...snapshotPenalty(input.snapshotState));

  const available: { key: keyof typeof BASE_WEIGHTS; weight: number; value: number }[] = [];
  (Object.keys(BASE_WEIGHTS) as (keyof typeof BASE_WEIGHTS)[]).forEach((key) => {
    const value = factors[key];
    if (value === null || value === undefined) {
      missingFactors.push(key);
      return;
    }
    available.push({ key, weight: BASE_WEIGHTS[key], value });
  });

  if (available.length === 0) {
    return {
      contractVersion: COMPOSITE_DATA_QUALITY_VERSION,
      score: null,
      level: 'unknown',
      factors,
      weightsUsed: {},
      missingFactors,
      rankingImpactEnabled: false,
      reasons: [...reasons, 'no-factors-available'],
    };
  }

  const weightSum = available.reduce((s, a) => s + a.weight, 0);
  const weightsUsed: Record<string, number> = {};
  let score = 0;
  for (const item of available) {
    const w = item.weight / weightSum;
    weightsUsed[item.key] = Number(w.toFixed(4));
    score += item.value * w;
  }

  // Hard ceiling when snapshot is unusable
  if (input.snapshotState === 'INVALID' || input.snapshotState === 'UNAVAILABLE') {
    score = Math.min(score, 20);
    reasons.push('score-capped-for-unusable-snapshot');
  }

  const bounded = Math.max(0, Math.min(100, score));
  const level: CompositeDqLevel =
    bounded >= 75 ? 'high' : bounded >= 40 ? 'medium' : bounded > 0 ? 'low' : 'unknown';

  return {
    contractVersion: COMPOSITE_DATA_QUALITY_VERSION,
    score: Number(bounded.toFixed(2)),
    level,
    factors,
    weightsUsed,
    missingFactors,
    rankingImpactEnabled: false,
    reasons,
  };
}

export interface UnifiedConfidenceInput {
  /** Classification or model base confidence 0–1. */
  baseConfidence: number;
  composite: CompositeDataQualityResult;
  providerCount?: number;
  freshnessMs?: number | null;
}

export interface UnifiedConfidenceResult {
  contractVersion: typeof UNIFIED_CONFIDENCE_VERSION;
  confidence: number;
  multipliers: {
    dataQuality: number;
    sourceCount: number;
    freshness: number;
  };
  /** Hard gate: never true in this foundation commit. */
  scoreImpactEnabled: false;
  recommendationImpactEnabled: false;
  reasons: string[];
}

const DQ_MULTIPLIER: Record<CompositeDqLevel, number> = {
  high: 1.0,
  medium: 0.85,
  low: 0.6,
  unknown: 0.4,
};

/**
 * Multiplicative confidence model from SC-MD-SPT-0001 §SC-3.
 * Does not feed ranking until Owner enables scoreImpactEnabled.
 */
export function computeUnifiedConfidence(input: UnifiedConfidenceInput): UnifiedConfidenceResult {
  const base = clamp01(input.baseConfidence);
  const dqMult = DQ_MULTIPLIER[input.composite.level] ?? 0.4;
  const providers = input.providerCount ?? 0;
  const sourceCountMult = Math.max(0.5, Math.min(1, 0.5 + 0.1 * Math.max(0, providers)));
  const freshnessMs = input.freshnessMs;
  const freshnessMult =
    freshnessMs === null || freshnessMs === undefined || !Number.isFinite(freshnessMs)
      ? 0.75
      : Math.max(0.5, Math.min(1, 1 - freshnessMs / 1_440_000)); // 24h scale

  const confidence = Number((base * dqMult * sourceCountMult * freshnessMult).toFixed(4));
  return {
    contractVersion: UNIFIED_CONFIDENCE_VERSION,
    confidence: Math.max(0, Math.min(1, confidence)),
    multipliers: {
      dataQuality: dqMult,
      sourceCount: Number(sourceCountMult.toFixed(4)),
      freshness: Number(freshnessMult.toFixed(4)),
    },
    scoreImpactEnabled: false,
    recommendationImpactEnabled: false,
    reasons: [
      `base=${base}`,
      `composite_level=${input.composite.level}`,
      ...(input.composite.score === null ? ['composite_score_null'] : []),
    ],
  };
}

/** Map composite level to legacy ranking numeric DQ contribution (documentation only / optional). */
export function compositeLevelToRankingDqPoints(level: CompositeDqLevel): number {
  if (level === 'high') return 100;
  if (level === 'medium') return 70;
  if (level === 'low') return 40;
  return 50;
}
