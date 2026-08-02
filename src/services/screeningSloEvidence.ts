import type { ScreeningOperationsResult } from './screeningOperations';

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
  quoteFresh: boolean | null;
  slaState: string;
  reasons: string[];
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
  report: ScreeningOperationsResult;
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
    eligible: report.screeningEligible,
    eligibilityStatus: report.screeningEligibilityStatus,
    quoteStatus: report.quote.status,
    quoteAgeMs: report.quote.ageMs,
    quoteFresh: report.quote.fresh,
    slaState: report.providerSlaState,
    reasons: [...report.reasons],
    scoreImpactEnabled: false,
    hardScreeningBlockEnabled: false,
    persistencePolicy: {
      appendOnlyRecommended: true,
      syntheticEvidenceAllowed: false,
      secretsAllowed: false,
    },
  };
}
