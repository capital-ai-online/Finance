export const DATA_FRESHNESS_CONTRACT_VERSION = 'data-freshness/1.0.0' as const;

export type DataFreshnessCapability = 'snapshot' | 'history' | 'news';

export type DataFreshnessState = 'FRESH' | 'STALE' | 'UNKNOWN';

export const CAPABILITY_MAX_AGE_MS = Object.freeze({
  snapshot: 90_000,
  history: 86_400_000,
  news: 300_000,
} as const satisfies Record<DataFreshnessCapability, number>);

export interface DataFreshnessInput {
  readonly capability: DataFreshnessCapability;
  readonly observedAt: string | null;
  readonly evaluatedAt: string;
  readonly claimedState?: DataFreshnessState | 'CURRENT' | 'CURRENT_AFTER_REFRESH';
}

export interface DataFreshnessEvaluation {
  readonly contractVersion: typeof DATA_FRESHNESS_CONTRACT_VERSION;
  readonly capability: DataFreshnessCapability;
  readonly maxAgeMs: number;
  readonly ageMs: number | null;
  readonly state: DataFreshnessState;
  readonly scoringAdmissible: boolean;
  readonly silentUpgradeRejected: boolean;
  readonly reason: string;
}

function isIsoTimestamp(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

function claimedFresh(claimed: DataFreshnessInput['claimedState']): boolean {
  return claimed === 'FRESH' || claimed === 'CURRENT' || claimed === 'CURRENT_AFTER_REFRESH';
}

export function maxAgeForCapability(capability: DataFreshnessCapability): number {
  return CAPABILITY_MAX_AGE_MS[capability];
}

export function evaluateDataFreshness(input: DataFreshnessInput): DataFreshnessEvaluation {
  const maxAgeMs = maxAgeForCapability(input.capability);

  if (!isIsoTimestamp(input.evaluatedAt) || !isIsoTimestamp(input.observedAt)) {
    return {
      contractVersion: DATA_FRESHNESS_CONTRACT_VERSION,
      capability: input.capability,
      maxAgeMs,
      ageMs: null,
      state: 'UNKNOWN',
      scoringAdmissible: false,
      silentUpgradeRejected: claimedFresh(input.claimedState),
      reason: claimedFresh(input.claimedState)
        ? 'unknown-freshness-cannot-claim-fresh'
        : 'observation-or-evaluation-time-missing',
    };
  }

  const ageMs = Math.max(0, Date.parse(input.evaluatedAt) - Date.parse(input.observedAt));
  const computed: DataFreshnessState = ageMs > maxAgeMs ? 'STALE' : 'FRESH';
  const silentUpgradeRejected = computed !== 'FRESH' && claimedFresh(input.claimedState);

  return {
    contractVersion: DATA_FRESHNESS_CONTRACT_VERSION,
    capability: input.capability,
    maxAgeMs,
    ageMs,
    state: computed,
    scoringAdmissible: computed === 'FRESH',
    silentUpgradeRejected,
    reason: silentUpgradeRejected
      ? 'stale-cannot-be-relabeled-fresh'
      : computed === 'FRESH'
        ? 'within-capability-max-age'
        : 'exceeds-capability-max-age',
  };
}
