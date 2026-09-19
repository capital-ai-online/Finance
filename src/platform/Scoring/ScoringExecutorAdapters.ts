import type { CanonicalScoreResult, ScoringEvidenceRef } from '../../types/scoringIntegrity';
import {
  TraditionalAssetScoringService,
  type TraditionalAssetScoringInputs,
  type TraditionalAssetScoringResult,
} from '../../services/traditionalAssetScoring';
import {
  buildFinancialEvidenceId,
  TRADITIONAL_FEATURE_VERSION,
  TRADITIONAL_SCORING_VERSION,
  type FinancialFieldProvenance,
} from '../../types/financialProvenance';
import {
  scoreCommodityMarketEvidence,
  type CommodityEvidenceScoringResult,
} from '../../services/commodityEvidenceScoring';
import type { CommodityMarketEvidence } from '../../services/commodityMarketEvidence';
import {
  scoreSovereignBenchmarkEvidence,
  type SovereignBenchmarkScoringResult,
} from '../../services/sovereignBenchmarkEvidenceScoring';
import type { BondEvidenceResult } from '../../services/eodhdBondEvidence';
import type { UniversalAssetIdentity } from './contracts';

export const TRADITIONAL_SCORING_EXECUTOR_KEY =
  'traditionalAssetScoring.TraditionalAssetScoringService' as const;
export const COMMODITY_EVIDENCE_EXECUTOR_KEY =
  'commodityEvidenceScoring.scoreCommodityMarketEvidence' as const;
export const SOVEREIGN_BENCHMARK_EXECUTOR_KEY =
  'sovereignBenchmarkEvidenceScoring.scoreSovereignBenchmarkEvidence' as const;

export interface TraditionalCanonicalScoringAssessment extends TraditionalAssetScoringResult {
  canonical: CanonicalScoreResult;
}

function latestIso(values: Array<string | undefined>): string | undefined {
  return values
    .filter((value): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value)))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}

function provenanceKind(item: FinancialFieldProvenance): ScoringEvidenceRef['kind'] {
  const parents = item.derivedFrom ?? [];
  return parents.some(parent => ['peRatio', 'dividendYieldPct', 'profitMarginPct'].includes(parent))
    ? 'fundamental'
    : 'market-history';
}

function traditionalEvidenceRefs(
  asset: UniversalAssetIdentity,
  provenance: FinancialFieldProvenance[],
): ScoringEvidenceRef[] {
  return provenance.map(item => ({
    id: buildFinancialEvidenceId(asset.assetId, item),
    source: item.provider,
    observedAt: item.observedAt ?? item.retrievedAt,
    retrievedAt: item.retrievedAt,
    kind: provenanceKind(item),
  }));
}

function adaptTraditionalResultToCanonical(
  asset: UniversalAssetIdentity,
  result: TraditionalAssetScoringResult,
): CanonicalScoreResult {
  const providers = [...new Set(result.provenance.map(item => item.provider))].sort();
  const evidence = traditionalEvidenceRefs(asset, result.provenance);
  const factorCount = result.usedFactors.length + result.missingFactors.length;
  const coverage = factorCount > 0 ? result.usedFactors.length / factorCount : 0;
  const retrievedAt = latestIso(result.provenance.map(item => item.retrievedAt)) ?? new Date().toISOString();
  const observedAt = latestIso(result.provenance.map(item => item.observedAt));
  const integrity = {
    status: 'READY' as const,
    assetId: asset.assetId,
    providers,
    observedAt,
    retrievedAt,
    dataQuality: coverage >= 0.8 ? 'high' as const : coverage >= 0.6 ? 'medium' as const : 'low' as const,
    featureVersion: TRADITIONAL_FEATURE_VERSION,
    scoringVersion: TRADITIONAL_SCORING_VERSION,
    coverage,
    evidence,
    missingFields: result.missingFactors,
  };

  if (
    result.usedFactors.length === 0
    || result.provenance.length === 0
    || providers.length === 0
    || !Number.isFinite(result.score)
  ) {
    return {
      status: 'SCORE_NOT_COMPUTABLE',
      score: null,
      final_score: null,
      integrity: {
        ...integrity,
        status: 'SCORE_NOT_COMPUTABLE',
        dataQuality: 'unknown',
        reason: 'Keine ausreichend belegten Traditional-Scoring-Faktoren verfügbar.',
      },
    };
  }

  const finalScore = Math.max(0, Math.min(100, result.score));
  return {
    status: 'READY',
    score: Number((finalScore / 10).toFixed(1)),
    final_score: Number(finalScore.toFixed(2)),
    integrity,
  };
}

/**
 * CanonicalResultAdapter for the existing stock/forex/index model.
 * The domain model and its weights remain unchanged; only its evidence-aware result is normalized
 * into the platform CanonicalScoreResult contract and rebound to the UAI identity.
 */
export function executeTraditionalCanonicalScore(
  asset: UniversalAssetIdentity,
  inputs: TraditionalAssetScoringInputs,
): TraditionalCanonicalScoringAssessment {
  if (inputs.symbol.toUpperCase().trim() !== asset.symbol || inputs.assetType !== asset.assetClass) {
    throw new Error(`TRADITIONAL_EXECUTOR_IDENTITY_MISMATCH:${asset.assetId}`);
  }
  const result = TraditionalAssetScoringService.scoreTraditionalAsset(inputs);
  return { ...result, canonical: adaptTraditionalResultToCanonical(asset, result) };
}

export function executeCommodityCanonicalScore(
  evidence: CommodityMarketEvidence,
): CommodityEvidenceScoringResult {
  return scoreCommodityMarketEvidence(evidence);
}

export function executeSovereignBenchmarkCanonicalScore(
  asset: UniversalAssetIdentity,
  evidence: BondEvidenceResult,
): SovereignBenchmarkScoringResult {
  return scoreSovereignBenchmarkEvidence(asset.symbol, evidence);
}
