export const SCREENING_ELIGIBILITY_CONTRACT_VERSION = 'screening-eligibility/1.0.0' as const;

export type ScreeningEligibilityStatus =
  | 'ELIGIBLE'
  | 'SCORE_NOT_READY'
  | 'INSUFFICIENT_EVIDENCE'
  | 'INSUFFICIENT_PROVIDER_DIVERSITY'
  | 'STALE_EVIDENCE'
  | 'SOURCE_CONFLICT';

export interface ScreeningEligibilityInput {
  scoreStatus: string;
  score: number | null;
  providers: string[];
  evidenceIds: string[];
  observedAt?: string | null;
  nowMs?: number;
  maxAgeMs?: number;
  sourceConflict?: boolean;
  minimumEvidence?: number;
  minimumProviders?: number;
}

export interface ScreeningEligibilityResult {
  contractVersion: typeof SCREENING_ELIGIBILITY_CONTRACT_VERSION;
  eligible: boolean;
  status: ScreeningEligibilityStatus;
  score: number | null;
  providers: string[];
  evidenceIds: string[];
  evidenceAgeMs: number | null;
  rules: {
    scoreMustBeReady: true;
    syntheticFallbackAllowed: false;
    sourceConflictAllowed: false;
    minimumEvidence: number;
    minimumProviders: number;
    maxAgeMs: number;
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function evaluateScreeningEligibility(input: ScreeningEligibilityInput): ScreeningEligibilityResult {
  const providers = unique(input.providers);
  const evidenceIds = unique(input.evidenceIds);
  const minimumEvidence = input.minimumEvidence ?? 1;
  const minimumProviders = input.minimumProviders ?? 1;
  const maxAgeMs = input.maxAgeMs ?? 24 * 60 * 60 * 1000;
  const nowMs = input.nowMs ?? Date.now();
  const observedMs = input.observedAt && Number.isFinite(Date.parse(input.observedAt))
    ? Date.parse(input.observedAt)
    : null;
  const evidenceAgeMs = observedMs === null ? null : Math.max(0, nowMs - observedMs);

  const base = {
    contractVersion: SCREENING_ELIGIBILITY_CONTRACT_VERSION,
    score: input.score,
    providers,
    evidenceIds,
    evidenceAgeMs,
    rules: {
      scoreMustBeReady: true as const,
      syntheticFallbackAllowed: false as const,
      sourceConflictAllowed: false as const,
      minimumEvidence,
      minimumProviders,
      maxAgeMs,
    },
  };

  if (input.sourceConflict) return { ...base, eligible: false, status: 'SOURCE_CONFLICT' };
  if (input.scoreStatus !== 'READY' || input.score === null || !Number.isFinite(input.score)) {
    return { ...base, eligible: false, status: 'SCORE_NOT_READY' };
  }
  if (evidenceIds.length < minimumEvidence) return { ...base, eligible: false, status: 'INSUFFICIENT_EVIDENCE' };
  if (providers.length < minimumProviders) return { ...base, eligible: false, status: 'INSUFFICIENT_PROVIDER_DIVERSITY' };
  if (evidenceAgeMs !== null && evidenceAgeMs > maxAgeMs) return { ...base, eligible: false, status: 'STALE_EVIDENCE' };

  return { ...base, eligible: true, status: 'ELIGIBLE' };
}
