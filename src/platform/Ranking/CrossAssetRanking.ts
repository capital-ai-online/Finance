import {
  CROSS_ASSET_RANKING_CONTRACT_VERSION,
  CROSS_ASSET_RANKING_IMPACT_ENABLED,
  type CanonicalRankingCandidate,
  type CrossAssetRankingCohort,
  type CrossAssetRankingExclusion,
  type CrossAssetRankingMode,
  type CrossAssetRankingResult,
} from './contracts';

interface PreparedCandidate {
  candidate: CanonicalRankingCandidate;
  cohortKey: string;
  rankingValue: number;
  comparisonBasis: CrossAssetRankingCohort['comparisonBasis'];
}

function exclusion(
  candidate: CanonicalRankingCandidate,
  reason: CrossAssetRankingExclusion['reason'],
  detail?: string,
): CrossAssetRankingExclusion {
  return {
    assetId: candidate.asset.assetId,
    symbol: candidate.asset.symbol,
    assetClass: candidate.asset.assetClass,
    reason,
    ...(detail ? { detail } : {}),
  };
}

function normalizedKey(value: string): string {
  return encodeURIComponent(value.trim().toLowerCase());
}

function validateSharedAdmission(
  candidate: CanonicalRankingCandidate,
): CrossAssetRankingExclusion | null {
  if (candidate.canonical.status !== 'READY') {
    return exclusion(candidate, 'SCORE_NOT_READY', `canonical_status=${candidate.canonical.status}`);
  }

  if (!Number.isFinite(candidate.canonical.score) || !Number.isFinite(candidate.canonical.final_score)) {
    return exclusion(candidate, 'SCORE_VALUE_INVALID', 'READY canonical result carries a non-finite score.');
  }

  if (candidate.canonical.integrity.assetId !== candidate.asset.assetId) {
    return exclusion(
      candidate,
      'IDENTITY_MISMATCH',
      `uai=${candidate.asset.assetId}; canonical=${candidate.canonical.integrity.assetId}`,
    );
  }

  const lineage = candidate.canonical.integrity;
  if (
    !lineage.dispatcherVersion ||
    !lineage.modelId ||
    !lineage.modelVersion ||
    !lineage.executorKey ||
    !lineage.resultContractVersion
  ) {
    return exclusion(
      candidate,
      'MODEL_LINEAGE_MISSING',
      'Dispatcher/model/executor/result-contract lineage is required for cross-asset ranking.',
    );
  }

  if (!candidate.governance) return exclusion(candidate, 'GOVERNANCE_EVIDENCE_MISSING');
  if (!candidate.governance.eligible) {
    return exclusion(candidate, 'GOVERNANCE_INELIGIBLE', candidate.governance.eligibilityStatus);
  }
  if (candidate.governance.sourceConflict) return exclusion(candidate, 'SOURCE_CONFLICT');
  if (
    candidate.governance.operationsState === 'UNAVAILABLE' ||
    candidate.governance.operationsState === 'NO_RUNTIME_EVIDENCE'
  ) {
    return exclusion(
      candidate,
      'OPERATIONS_EVIDENCE_UNAVAILABLE',
      `operationsState=${candidate.governance.operationsState}`,
    );
  }

  return null;
}

function prepareScoreComparison(
  candidate: CanonicalRankingCandidate,
): PreparedCandidate | CrossAssetRankingExclusion {
  const comparison = candidate.scoreComparability;
  if (!comparison) {
    const { modelId, modelVersion } = candidate.canonical.integrity;
    return {
      candidate,
      cohortKey: `model:${normalizedKey(`${modelId}@${modelVersion}`)}|asset-class:${candidate.asset.assetClass}`,
      rankingValue: candidate.canonical.score as number,
      comparisonBasis: 'canonical-score-same-model',
    };
  }

  if (!comparison.verified) return exclusion(candidate, 'COMPARABILITY_EVIDENCE_UNVERIFIED');
  if (!Number.isFinite(comparison.normalizedValue)) {
    return exclusion(candidate, 'COMPARABILITY_VALUE_INVALID');
  }

  const comparisonKey = comparison.comparisonKey?.trim();
  const methodVersion = comparison.methodVersion?.trim();
  if (!comparisonKey || !methodVersion) {
    return exclusion(
      candidate,
      'COMPARISON_KEY_MISSING',
      'Score comparability requires comparisonKey and methodVersion.',
    );
  }
  if (!comparison.evidenceId.trim() || !comparison.observedAt.trim() || !comparison.retrievedAt.trim()) {
    return exclusion(
      candidate,
      'COMPARABILITY_EVIDENCE_UNVERIFIED',
      'Score comparability requires evidenceId, observedAt and retrievedAt.',
    );
  }

  return {
    candidate,
    cohortKey: `calibrated:${normalizedKey(comparisonKey)}|method:${normalizedKey(methodVersion)}`,
    rankingValue: comparison.normalizedValue,
    comparisonBasis: 'verified-normalized-score',
  };
}

function prepareScoreMode(
  candidate: CanonicalRankingCandidate,
  mode: Exclude<CrossAssetRankingMode, 'growth'>,
): PreparedCandidate | CrossAssetRankingExclusion {
  const comparison = prepareScoreComparison(candidate);
  if ('reason' in comparison) return comparison;

  if (mode === 'category') {
    const category = candidate.category?.trim();
    if (!category) return exclusion(candidate, 'CATEGORY_MISSING');
    return { ...comparison, cohortKey: `${comparison.cohortKey}|category:${normalizedKey(category)}` };
  }

  if (mode === 'tier') {
    if (candidate.tier !== 1 && candidate.tier !== 2 && candidate.tier !== 3) {
      return exclusion(candidate, 'TIER_MISSING');
    }
    return { ...comparison, cohortKey: `${comparison.cohortKey}|tier:${candidate.tier}` };
  }

  return comparison;
}

function prepareGrowthMode(
  candidate: CanonicalRankingCandidate,
): PreparedCandidate | CrossAssetRankingExclusion {
  const growth = candidate.growth;
  if (!growth) return exclusion(candidate, 'GROWTH_EVIDENCE_MISSING');
  if (!growth.verified) return exclusion(candidate, 'GROWTH_EVIDENCE_UNVERIFIED');
  if (!Number.isFinite(growth.value)) return exclusion(candidate, 'GROWTH_VALUE_INVALID');
  const comparisonKey = growth.comparisonKey?.trim();
  if (!comparisonKey) return exclusion(candidate, 'COMPARISON_KEY_MISSING');
  if (!growth.evidenceId.trim() || !growth.observedAt.trim() || !growth.retrievedAt.trim()) {
    return exclusion(
      candidate,
      'GROWTH_EVIDENCE_UNVERIFIED',
      'Growth evidence requires evidenceId, observedAt and retrievedAt.',
    );
  }

  return {
    candidate,
    cohortKey: `growth:${normalizedKey(comparisonKey)}`,
    rankingValue: growth.value,
    comparisonBasis: 'verified-growth-evidence',
  };
}

function prepareCandidate(
  candidate: CanonicalRankingCandidate,
  mode: CrossAssetRankingMode,
): PreparedCandidate | CrossAssetRankingExclusion {
  const admissionFailure = validateSharedAdmission(candidate);
  if (admissionFailure) return admissionFailure;
  return mode === 'growth' ? prepareGrowthMode(candidate) : prepareScoreMode(candidate, mode);
}

function isExclusion(
  value: PreparedCandidate | CrossAssetRankingExclusion,
): value is CrossAssetRankingExclusion {
  return 'reason' in value;
}

/**
 * Build deterministic ranking cohorts without creating hidden comparability assumptions. Even when
 * the same model version serves multiple asset classes, the default cohort remains asset-class
 * scoped because intended use, feature coverage and weighting can differ by segment. Cross-asset
 * or cross-model cohorts require separately verified normalized score-comparability evidence.
 */
export function rankCanonicalUniverse(
  candidates: readonly CanonicalRankingCandidate[],
  mode: CrossAssetRankingMode,
): CrossAssetRankingResult {
  const excluded: CrossAssetRankingExclusion[] = [];
  const prepared: PreparedCandidate[] = [];
  const seenAssetIds = new Set<string>();

  for (const candidate of candidates) {
    if (seenAssetIds.has(candidate.asset.assetId)) {
      excluded.push(exclusion(candidate, 'DUPLICATE_ASSET'));
      continue;
    }
    seenAssetIds.add(candidate.asset.assetId);

    const result = prepareCandidate(candidate, mode);
    if (isExclusion(result)) excluded.push(result);
    else prepared.push(result);
  }

  const grouped = new Map<string, PreparedCandidate[]>();
  for (const item of prepared) {
    const group = grouped.get(item.cohortKey) ?? [];
    group.push(item);
    grouped.set(item.cohortKey, group);
  }

  const cohorts: CrossAssetRankingCohort[] = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, members]) => {
      const ordered = [...members].sort(
        (a, b) => b.rankingValue - a.rankingValue || a.candidate.asset.assetId.localeCompare(b.candidate.asset.assetId),
      );
      return {
        key,
        mode,
        comparisonBasis: members[0].comparisonBasis,
        crossCohortOrder: false,
        entries: ordered.map((item, index) => ({
          assetId: item.candidate.asset.assetId,
          symbol: item.candidate.asset.symbol,
          assetClass: item.candidate.asset.assetClass,
          mode,
          cohortKey: key,
          rank: index + 1,
          rankingValue: item.rankingValue,
          canonicalScore: item.candidate.canonical.score as number,
          dataQuality: item.candidate.canonical.integrity.dataQuality,
          modelId: item.candidate.canonical.integrity.modelId as string,
          modelVersion: item.candidate.canonical.integrity.modelVersion as string,
          dispatcherVersion: item.candidate.canonical.integrity.dispatcherVersion as string,
          tieBreaker: item.candidate.asset.assetId,
        })),
      };
    });

  excluded.sort((a, b) => a.assetId.localeCompare(b.assetId) || a.reason.localeCompare(b.reason));
  const rankedCount = cohorts.reduce((sum, cohort) => sum + cohort.entries.length, 0);
  const status: CrossAssetRankingResult['status'] =
    rankedCount === 0 ? 'NO_RANKABLE_ASSETS' : excluded.length > 0 ? 'PARTIAL' : 'READY';

  return {
    contractVersion: CROSS_ASSET_RANKING_CONTRACT_VERSION,
    impactEnabled: CROSS_ASSET_RANKING_IMPACT_ENABLED,
    mode,
    status,
    cohorts,
    excluded,
  };
}
