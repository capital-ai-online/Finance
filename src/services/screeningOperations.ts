import type { ScreeningEligibilityResult } from './screeningEligibility';
import type { ScreeningSlaReport, ScreeningSlaState } from './screeningSla';

export const SCREENING_OPERATIONS_CONTRACT_VERSION = 'screening-operations/1.0.0' as const;

export type ScreeningOperationsState =
  | 'NO_RUNTIME_EVIDENCE'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'UNAVAILABLE';

export interface ScreeningOperationsInput {
  eligibility: ScreeningEligibilityResult;
  sla: ScreeningSlaReport;
  quoteStatus?: string | null;
  quoteObservedAt?: string | null;
  quoteMaxAgeMs?: number;
  nowMs?: number;
}

export interface ScreeningOperationsResult {
  contractVersion: typeof SCREENING_OPERATIONS_CONTRACT_VERSION;
  state: ScreeningOperationsState;
  screeningEligible: boolean;
  screeningEligibilityStatus: ScreeningEligibilityResult['status'];
  providerSlaState: ScreeningSlaState;
  quote: {
    status: string | null;
    observedAt: string | null;
    ageMs: number | null;
    fresh: boolean | null;
    maxAgeMs: number;
  };
  hardScreeningBlockEnabled: false;
  scoreImpactEnabled: false;
  reasons: string[];
}

export function buildScreeningOperationsReport(input: ScreeningOperationsInput): ScreeningOperationsResult {
  const nowMs = input.nowMs ?? Date.now();
  const quoteMaxAgeMs = input.quoteMaxAgeMs ?? 15 * 60 * 1000;
  const observedMs = input.quoteObservedAt && Number.isFinite(Date.parse(input.quoteObservedAt))
    ? Date.parse(input.quoteObservedAt)
    : null;
  const quoteAgeMs = observedMs === null ? null : Math.max(0, nowMs - observedMs);
  const quoteFresh = quoteAgeMs === null ? null : quoteAgeMs <= quoteMaxAgeMs;
  const reasons: string[] = [];

  if (!input.eligibility.eligible) reasons.push(`screening:${input.eligibility.status}`);
  if (input.sla.state !== 'HEALTHY') reasons.push(`sla:${input.sla.state}`);
  if (input.quoteStatus && input.quoteStatus !== 'READY' && input.quoteStatus !== 'CONSENSUS') {
    reasons.push(`quote:${input.quoteStatus}`);
  }
  if (quoteFresh === false) reasons.push('quote:STALE_EVIDENCE');

  let state: ScreeningOperationsState;
  if (input.sla.state === 'NO_RUNTIME_EVIDENCE') state = 'NO_RUNTIME_EVIDENCE';
  else if (input.sla.state === 'UNAVAILABLE') state = 'UNAVAILABLE';
  else if (!input.eligibility.eligible || input.sla.state === 'DEGRADED' || quoteFresh === false) state = 'DEGRADED';
  else state = 'HEALTHY';

  return {
    contractVersion: SCREENING_OPERATIONS_CONTRACT_VERSION,
    state,
    screeningEligible: input.eligibility.eligible,
    screeningEligibilityStatus: input.eligibility.status,
    providerSlaState: input.sla.state,
    quote: {
      status: input.quoteStatus ?? null,
      observedAt: input.quoteObservedAt ?? null,
      ageMs: quoteAgeMs,
      fresh: quoteFresh,
      maxAgeMs: quoteMaxAgeMs,
    },
    hardScreeningBlockEnabled: false,
    scoreImpactEnabled: false,
    reasons,
  };
}
