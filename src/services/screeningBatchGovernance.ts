import type { CanonicalScoreResult } from '../types/scoringIntegrity';
import {
  buildBackendRankingProjection,
  type BackendRankingProjectionInput,
} from '../platform/Ranking';
import type { ProviderRoutingTelemetry } from './marketDataProviderRouter';
import { evaluateScreeningEligibility } from './screeningEligibility';
import { buildScreeningOperationsReport } from './screeningOperations';
import { buildScreeningSlaReport } from './screeningSla';
import { buildScreeningSloEvidenceRecord } from './screeningSloEvidence';
import {
  buildUniverseAvailabilityProjection,
  isUniverseAssetClass,
} from './universeAvailability';

export interface ScreeningBatchItem {
  correlationId: string;
  symbol?: string;
  assetType?: string;
  status?: string;
  score?: number | null;
  providers?: string[];
  evidenceIds?: string[];
  observedAt?: string | null;
  [key: string]: unknown;
}

export interface ScreeningBatchGovernanceOptions {
  /**
   * Optional evaluation clock for deterministic tests and replayable governance evidence.
   * Production callers normally omit this so the current wall clock remains authoritative.
   */
  nowMs?: number;
  /** Optional policy override; defaults to the screening-eligibility contract's 24-hour limit. */
  maxEvidenceAgeMs?: number;
}

function rankingInputFromGovernedItem(
  item: ScreeningBatchItem & {
    screeningEligibility: ReturnType<typeof evaluateScreeningEligibility>;
    screeningOperations: ReturnType<typeof buildScreeningOperationsReport>;
  },
): BackendRankingProjectionInput | null {
  if (!item.symbol || !isUniverseAssetClass(item.assetType)) return null;
  if (!item.integrity || typeof item.integrity !== 'object') return null;

  const integrity = item.integrity as CanonicalScoreResult['integrity'];
  const score = typeof item.score === 'number' && Number.isFinite(item.score) ? item.score : null;
  const finalScore =
    typeof item.final_score === 'number' && Number.isFinite(item.final_score)
      ? item.final_score
      : null;

  let canonical: CanonicalScoreResult;
  switch (item.status) {
    case 'READY':
      if (score === null || finalScore === null) return null;
      canonical = { status: 'READY', score, final_score: finalScore, integrity };
      break;
    case 'DATA_UNAVAILABLE':
    case 'SOURCE_UNAVAILABLE':
    case 'INSUFFICIENT_HISTORY':
    case 'STALE_DATA':
    case 'SCORE_NOT_COMPUTABLE':
      canonical = { status: item.status, score: null, final_score: null, integrity };
      break;
    default:
      return null;
  }

  return {
    symbol: item.symbol,
    name: typeof item.name === 'string' ? item.name : undefined,
    assetClass: item.assetType,
    subtype: typeof item.subtype === 'string' ? item.subtype : undefined,
    instrumentKind: typeof item.instrumentKind === 'string' ? item.instrumentKind : undefined,
    source: 'catalog',
    canonical,
    governance: {
      eligible: item.screeningEligibility.eligible,
      eligibilityStatus: item.screeningEligibility.status,
      operationsState: item.screeningOperations.state,
      sourceConflict: item.screeningEligibility.status === 'SOURCE_CONFLICT',
    },
  };
}

export function decorateScreeningBatchWithGovernance(
  items: ScreeningBatchItem[],
  telemetry: ProviderRoutingTelemetry[],
  options: ScreeningBatchGovernanceOptions = {},
) {
  const sla = buildScreeningSlaReport(telemetry);
  const governedResults = items.map(item => {
    const providers = Array.isArray(item.providers) ? item.providers.filter(Boolean) : [];
    const evidenceIds = Array.isArray(item.evidenceIds) ? item.evidenceIds.filter(Boolean) : [];
    const score = typeof item.score === 'number' && Number.isFinite(item.score) ? item.score : null;
    const scoreStatus = typeof item.status === 'string' ? item.status : 'SCORE_NOT_COMPUTABLE';
    const eligibility = evaluateScreeningEligibility({
      scoreStatus,
      score,
      providers,
      evidenceIds,
      observedAt: item.observedAt ?? null,
      nowMs: options.nowMs,
      maxAgeMs: options.maxEvidenceAgeMs,
      minimumEvidence: 1,
      minimumProviders: 1,
    });
    const screeningOperations = buildScreeningOperationsReport({ eligibility, sla });
    const screeningSloEvidence = buildScreeningSloEvidenceRecord({
      correlationId: item.correlationId,
      report: screeningOperations,
      symbol: item.symbol,
      assetClass: item.assetType,
    });
    return { ...item, screeningEligibility: eligibility, screeningOperations, screeningSloEvidence };
  });

  const backendRankingProjection = buildBackendRankingProjection(
    governedResults
      .map(rankingInputFromGovernedItem)
      .filter((item): item is BackendRankingProjectionInput => item !== null),
  );
  const rankedByAssetId = new Map(
    backendRankingProjection.result.cohorts.flatMap(cohort =>
      cohort.entries.map(entry => [entry.assetId, {
        cohortKey: cohort.key,
        comparisonBasis: cohort.comparisonBasis,
        crossCohortOrder: cohort.crossCohortOrder,
        rank: entry.rank,
        rankingValue: entry.rankingValue,
      }] as const),
    ),
  );
  const excludedByAssetId = new Map(
    backendRankingProjection.result.excluded.map(entry => [entry.assetId, entry] as const),
  );

  const universeAvailability = buildUniverseAvailabilityProjection(
    governedResults.map(item => ({ symbol: item.symbol, type: item.assetType })),
    governedResults.map(item => ({
      symbol: item.symbol,
      assetType: item.assetType,
      status: item.status,
      providers: item.providers,
      evidenceIds: item.evidenceIds,
      screeningEligible: item.screeningEligibility.eligible,
    })),
  );
  const universeByClass = new Map(universeAvailability.classes.map(entry => [entry.assetClass, entry.topLevel]));
  const results = governedResults.map(item => {
    const assetId = item.symbol && isUniverseAssetClass(item.assetType)
      ? `${item.assetType}:${item.symbol.trim().toUpperCase().replace(/\s+/g, '')}`
      : null;
    const ranked = assetId ? rankedByAssetId.get(assetId) ?? null : null;
    const excluded = assetId ? excludedByAssetId.get(assetId) ?? null : null;

    return {
      ...item,
      universeSla: isUniverseAssetClass(item.assetType)
        ? universeByClass.get(item.assetType) ?? null
        : null,
      backendRanking: {
        projectionContractVersion: backendRankingProjection.contractVersion,
        rankingContractVersion: backendRankingProjection.result.contractVersion,
        authority: backendRankingProjection.authority,
        mode: backendRankingProjection.mode,
        status: backendRankingProjection.result.status,
        ...(ranked ?? {
          cohortKey: null,
          comparisonBasis: null,
          crossCohortOrder: false as const,
          rank: null,
          rankingValue: null,
        }),
        exclusionReason: excluded?.reason ?? null,
        exclusionDetail: excluded?.detail ?? null,
      },
    };
  });

  return {
    screeningOperationsContractVersion: 'screening-operations/1.0.0' as const,
    screeningSloEvidenceContractVersion: 'screening-slo-evidence/1.0.0' as const,
    universeAvailabilityContractVersion: universeAvailability.contractVersion,
    backendRankingProjectionContractVersion: backendRankingProjection.contractVersion,
    backendRankingContractVersion: backendRankingProjection.result.contractVersion,
    backendRankingAuthority: backendRankingProjection.authority,
    providerSlaState: sla.state,
    eligible: results.filter(item => item.screeningEligibility.eligible).length,
    universeAvailability,
    results,
  };
}
