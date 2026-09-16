import type { BackendRankingProjection } from '../Ranking/BackendRankingProjection';
import type { RankedCanonicalAsset } from '../Ranking/contracts';
import type { CanonicalScoreResult } from '../../types/scoringIntegrity';
import type { ValidatedFinancialFeatureContract } from './ValidatedFinancialFeatureContract';

export const FINTECH_SCORING_TRACE_LINEAGE_CONTRACT_VERSION =
  'fintech-scoring-trace-lineage/1.0.0' as const;

export interface FintechOpsTraceHandoff {
  /** PVC-18 remains owned by Operations. FINTECH supplies evidence only. */
  readonly targetProject: 'CAPITAL-AI-OPS';
  readonly targetPvc: 'PVC-18';
  readonly semantics: 'EVIDENCE_ONLY';
  readonly correlationId: string;
  readonly sourceLineageIdentityRef: string;
  readonly sourceTimestamp: string;
  readonly sourceEvidenceRefs: readonly string[];
  readonly requiredBinding: {
    readonly mode: 'STRICT_IDENTITY_CORRELATION';
    readonly correlationId: string;
    readonly evidenceIdentityRefs: readonly string[];
  };
}

export interface FintechScoringTraceLineage {
  readonly contractVersion: typeof FINTECH_SCORING_TRACE_LINEAGE_CONTRACT_VERSION;
  readonly assetId: string;
  readonly correlationId: string;
  readonly data: {
    readonly sourceContractVersion: string;
    readonly status: 'PASS' | 'PARTIAL';
    readonly provenanceComplete: true;
    readonly providers: readonly string[];
    readonly evidenceRefs: readonly string[];
  };
  readonly feature: {
    readonly mappingContractVersion: string;
    readonly targetFeatureContractVersion: string;
    readonly featureKeys: readonly string[];
  };
  readonly scoring: {
    readonly status: 'READY';
    readonly score: number;
    readonly finalScore: number;
    readonly dispatcherVersion: string;
    readonly modelRegistryVersion: string;
    readonly modelId: string;
    readonly modelVersion: string;
    readonly executorKey: string;
    readonly resultContractVersion: string;
    readonly scoringVersion: string;
    readonly evidenceRefs: readonly string[];
  };
  readonly ranking: {
    readonly projectionContractVersion: string;
    readonly rankingContractVersion: string;
    readonly authority: 'CrossAssetRanking';
    readonly cohortKey: string;
    readonly rank: number;
    readonly rankingValue: number;
  };
  readonly opsTraceHandoff: FintechOpsTraceHandoff;
  readonly generatedAt: string;
}

export interface FintechScoringTraceLineageReady {
  readonly status: 'READY';
  readonly lineage: FintechScoringTraceLineage;
}

export interface FintechScoringTraceLineageFailure {
  readonly status: 'LINEAGE_NOT_COMPUTABLE';
  readonly lineage: null;
  readonly assetId: string;
  readonly correlationId: string;
  readonly reasons: readonly string[];
}

export type FintechScoringTraceLineageResult =
  | FintechScoringTraceLineageReady
  | FintechScoringTraceLineageFailure;

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function nonEmpty(value: string | undefined): value is string {
  return Boolean(value && value.trim());
}

function lineageIdentityRef(
  feature: ValidatedFinancialFeatureContract,
): string {
  return [
    'fintech-lineage',
    encodeURIComponent(feature.assetId),
    encodeURIComponent(feature.correlationId),
    `${encodeURIComponent(feature.model.modelId)}@${encodeURIComponent(feature.model.version)}`,
  ].join(':');
}

function findRankedEntry(
  ranking: BackendRankingProjection,
  assetId: string,
): { entry: RankedCanonicalAsset | null; matches: number } {
  const matches = ranking.result.cohorts
    .flatMap(cohort => cohort.entries)
    .filter(entry => entry.assetId === assetId);
  return { entry: matches[0] ?? null, matches: matches.length };
}

/**
 * FIN-20 evidence-lineage boundary.
 *
 * This function does not score, rank, publish an EventMesh event or create an OPS trace record. It
 * proves that one accepted DATA identity/provenance set is still represented by the FIN-12 feature
 * mapping, the canonical score metadata and the FIN-17 backend rank. The returned OPS handoff keeps
 * the exact source evidence/correlation identities required by the existing PVC-18 strict binding
 * surface; EventMesh publication and operational trace projection remain CAPITAL-AI-OPS authority.
 */
export function buildFintechScoringTraceLineage(input: {
  readonly feature: ValidatedFinancialFeatureContract;
  readonly canonical: CanonicalScoreResult;
  readonly ranking: BackendRankingProjection;
  readonly generatedAt?: string;
}): FintechScoringTraceLineageResult {
  const { feature, canonical, ranking } = input;
  const reasons: string[] = [];
  const integrity = canonical.integrity;
  const generatedAt = input.generatedAt ?? new Date().toISOString();

  if (!Number.isFinite(Date.parse(generatedAt))) reasons.push('generated-at-invalid');
  if (canonical.status !== 'READY') reasons.push(`canonical-score-not-ready:${canonical.status}`);
  if (integrity.assetId !== feature.assetId) reasons.push('score-asset-identity-mismatch');
  if (integrity.featureVersion !== feature.targetFeatureContractVersion) {
    reasons.push('score-feature-contract-version-mismatch');
  }
  if (integrity.modelRegistryVersion !== feature.model.registryVersion) {
    reasons.push('score-model-registry-version-mismatch');
  }
  if (integrity.modelId !== feature.model.modelId) reasons.push('score-model-id-mismatch');
  if (integrity.modelVersion !== feature.model.version) reasons.push('score-model-version-mismatch');
  if (integrity.executorKey !== feature.model.executorKey) reasons.push('score-executor-mismatch');

  const scoreEvidenceRefs = uniqueSorted(integrity.evidence.map(evidence => evidence.id));
  for (const evidenceRef of feature.evidenceRefs) {
    if (!scoreEvidenceRefs.includes(evidenceRef)) {
      reasons.push(`score-evidence-lineage-missing:${evidenceRef}`);
    }
  }

  if (!nonEmpty(integrity.dispatcherVersion)) reasons.push('score-dispatcher-version-missing');
  if (!nonEmpty(integrity.resultContractVersion)) reasons.push('score-result-contract-version-missing');
  if (!nonEmpty(integrity.scoringVersion)) reasons.push('score-version-missing');

  const ranked = findRankedEntry(ranking, feature.assetId);
  if (ranked.matches !== 1 || !ranked.entry) {
    reasons.push(ranked.matches === 0 ? 'rank-entry-missing' : 'rank-entry-ambiguous');
  }

  if (ranked.entry) {
    if (ranked.entry.featureVersion !== integrity.featureVersion) reasons.push('rank-feature-version-mismatch');
    if (ranked.entry.scoringVersion !== integrity.scoringVersion) reasons.push('rank-scoring-version-mismatch');
    if (ranked.entry.dispatcherVersion !== integrity.dispatcherVersion) reasons.push('rank-dispatcher-version-mismatch');
    if (ranked.entry.modelRegistryVersion !== integrity.modelRegistryVersion) reasons.push('rank-model-registry-version-mismatch');
    if (ranked.entry.modelId !== integrity.modelId) reasons.push('rank-model-id-mismatch');
    if (ranked.entry.modelVersion !== integrity.modelVersion) reasons.push('rank-model-version-mismatch');
    if (ranked.entry.executorKey !== integrity.executorKey) reasons.push('rank-executor-mismatch');
    if (ranked.entry.resultContractVersion !== integrity.resultContractVersion) reasons.push('rank-result-contract-version-mismatch');
    if (canonical.status === 'READY' && ranked.entry.canonicalScore !== canonical.score) {
      reasons.push('rank-canonical-score-mismatch');
    }
  }

  const uniqueReasons = uniqueSorted(reasons);
  if (uniqueReasons.length > 0 || canonical.status !== 'READY' || !ranked.entry) {
    return {
      status: 'LINEAGE_NOT_COMPUTABLE',
      lineage: null,
      assetId: feature.assetId,
      correlationId: feature.correlationId,
      reasons: uniqueReasons,
    };
  }

  const requiredEvidenceRefs = uniqueSorted([
    ...feature.evidenceRefs,
    ...scoreEvidenceRefs,
  ]);
  const sourceLineageIdentityRef = lineageIdentityRef(feature);

  return {
    status: 'READY',
    lineage: {
      contractVersion: FINTECH_SCORING_TRACE_LINEAGE_CONTRACT_VERSION,
      assetId: feature.assetId,
      correlationId: feature.correlationId,
      data: {
        sourceContractVersion: feature.sourceDataContractVersion,
        status: feature.aggregateDataStatus,
        provenanceComplete: true,
        providers: [...feature.providers],
        evidenceRefs: [...feature.evidenceRefs],
      },
      feature: {
        mappingContractVersion: feature.mappingContractVersion,
        targetFeatureContractVersion: feature.targetFeatureContractVersion,
        featureKeys: feature.features.map(item => item.featureKey).sort((left, right) => left.localeCompare(right)),
      },
      scoring: {
        status: 'READY',
        score: canonical.score,
        finalScore: canonical.final_score,
        dispatcherVersion: integrity.dispatcherVersion!,
        modelRegistryVersion: integrity.modelRegistryVersion!,
        modelId: integrity.modelId!,
        modelVersion: integrity.modelVersion!,
        executorKey: integrity.executorKey!,
        resultContractVersion: integrity.resultContractVersion!,
        scoringVersion: integrity.scoringVersion,
        evidenceRefs: scoreEvidenceRefs,
      },
      ranking: {
        projectionContractVersion: ranking.contractVersion,
        rankingContractVersion: ranking.result.contractVersion,
        authority: ranking.authority,
        cohortKey: ranked.entry.cohortKey,
        rank: ranked.entry.rank,
        rankingValue: ranked.entry.rankingValue,
      },
      opsTraceHandoff: {
        targetProject: 'CAPITAL-AI-OPS',
        targetPvc: 'PVC-18',
        semantics: 'EVIDENCE_ONLY',
        correlationId: feature.correlationId,
        sourceLineageIdentityRef,
        sourceTimestamp: generatedAt,
        sourceEvidenceRefs: requiredEvidenceRefs,
        requiredBinding: {
          mode: 'STRICT_IDENTITY_CORRELATION',
          correlationId: feature.correlationId,
          evidenceIdentityRefs: requiredEvidenceRefs,
        },
      },
      generatedAt,
    },
  };
}
