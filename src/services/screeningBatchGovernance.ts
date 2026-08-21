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
  const results = governedResults.map(item => ({
    ...item,
    universeSla: isUniverseAssetClass(item.assetType)
      ? universeByClass.get(item.assetType) ?? null
      : null,
  }));

  return {
    screeningOperationsContractVersion: 'screening-operations/1.0.0' as const,
    screeningSloEvidenceContractVersion: 'screening-slo-evidence/1.0.0' as const,
    universeAvailabilityContractVersion: universeAvailability.contractVersion,
    providerSlaState: sla.state,
    eligible: results.filter(item => item.screeningEligibility.eligible).length,
    universeAvailability,
    results,
  };
}
