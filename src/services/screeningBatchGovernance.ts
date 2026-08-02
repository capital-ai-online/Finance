import type { ProviderRoutingTelemetry } from './marketDataProviderRouter';
import { evaluateScreeningEligibility } from './screeningEligibility';
import { buildScreeningOperationsReport } from './screeningOperations';
import { buildScreeningSlaReport } from './screeningSla';
import { buildScreeningSloEvidenceRecord } from './screeningSloEvidence';

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

export function decorateScreeningBatchWithGovernance(
  items: ScreeningBatchItem[],
  telemetry: ProviderRoutingTelemetry[],
) {
  const sla = buildScreeningSlaReport(telemetry);
  const results = items.map(item => {
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

  return {
    screeningOperationsContractVersion: 'screening-operations/1.0.0' as const,
    screeningSloEvidenceContractVersion: 'screening-slo-evidence/1.0.0' as const,
    providerSlaState: sla.state,
    eligible: results.filter(item => item.screeningEligibility.eligible).length,
    results,
  };
}
