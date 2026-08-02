import type { ScreeningOperationsReport } from './screeningOperations';

export const SCREENING_SLO_EVIDENCE_VERSION = 'screening-slo-evidence/1.0.0' as const;

export type ScreeningSloEvidenceState = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'NO_RUNTIME_EVIDENCE';

export interface ScreeningSloEvidenceRecord {
  contractVersion: typeof SCREENING_SLO_EVIDENCE_VERSION;
  correlationId: string;
  observedAt: string;
  symbol?: string;
  assetClass?: string;
  state: ScreeningSloEvidenceState;
  eligible: boolean;
  eligibilityStatus: string;
  quoteStatus: string | null;
  quoteAgeMs: number | null;
  slaState: string;
  providersObserved: number;
  healthyProviders: number;
  degradedProviders: number;
  unavailableProviders: number;
  scoreImpactEnabled: false;
  hardScreeningBlockEnabled: false;
  persistencePolicy: {
    appendOnlyRecommended: true;
    syntheticEvidenceAllowed: false;
    secretsAllowed: false;
  };
}

export function buildScreeningSloEvidenceRecord(input: {
  correlationId: string;
  report: ScreeningOperationsReport;
  symbol?: string;
  assetClass?: string;
  observedAt?: string;
}): ScreeningSloEvidenceRecord {
  const { report } = input;
  return {
    contractVersion: SCREENING_SLO_EVIDENCE_VERSION,
    correlationId: input.correlationId,
    observedAt: input.observedAt ?? new Date().toISOString(),
    symbol: input.symbol,
    assetClass: input.assetClass,
    state: report.state,
    eligible: report.eligibility.eligible,
    eligibilityStatus: report.eligibility.status,
    quoteStatus: report.quote?.status ?? null,
    quoteAgeMs: report.quote?.ageMs ?? null,
    slaState: report.sla.state,
    providersObserved: report.sla.providersObserved,
    healthyProviders: report.sla.healthy,
    degradedProviders: report.sla.degraded,
    unavailableProviders: report.sla.unavailable,
    scoreImpactEnabled: false,
    hardScreeningBlockEnabled: false,
    persistencePolicy: {
      appendOnlyRecommended: true,
      syntheticEvidenceAllowed: false,
      secretsAllowed: false,
    },
  };
}
