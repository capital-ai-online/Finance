import type { ProviderRoutingTelemetry } from './marketDataProviderRouter';

export const SCREENING_SLA_CONTRACT_VERSION = 'screening-sla/1.0.0' as const;

export type ScreeningSlaState = 'NO_RUNTIME_EVIDENCE' | 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';

export interface ScreeningSlaProviderAssessment {
  provider: string;
  state: ScreeningSlaState;
  totalCalls: number;
  failureRate: number | null;
  consecutiveFailures: number;
  ewmaLatencyMs: number | null;
  cooldownActive: boolean;
}

export interface ScreeningSlaReport {
  contractVersion: typeof SCREENING_SLA_CONTRACT_VERSION;
  state: ScreeningSlaState;
  providersObserved: number;
  healthy: number;
  degraded: number;
  unavailable: number;
  noRuntimeEvidence: boolean;
  thresholds: {
    degradedLatencyMs: number;
    degradedFailureRate: number;
    unavailableConsecutiveFailures: number;
  };
  providers: ScreeningSlaProviderAssessment[];
  hardScreeningBlockEnabled: false;
}

export function buildScreeningSlaReport(
  telemetry: ProviderRoutingTelemetry[],
  options: {
    nowMs?: number;
    degradedLatencyMs?: number;
    degradedFailureRate?: number;
    unavailableConsecutiveFailures?: number;
  } = {},
): ScreeningSlaReport {
  const nowMs = options.nowMs ?? Date.now();
  const degradedLatencyMs = options.degradedLatencyMs ?? 3_000;
  const degradedFailureRate = options.degradedFailureRate ?? 0.2;
  const unavailableConsecutiveFailures = options.unavailableConsecutiveFailures ?? 3;

  const providers = telemetry.map<ScreeningSlaProviderAssessment>((item) => {
    const totalCalls = item.successes + item.failures;
    const failureRate = totalCalls > 0 ? item.failures / totalCalls : null;
    const cooldownActive = item.cooldownUntilMs > nowMs;
    let state: ScreeningSlaState = 'HEALTHY';

    if (totalCalls === 0) state = 'NO_RUNTIME_EVIDENCE';
    else if (item.consecutiveFailures >= unavailableConsecutiveFailures) state = 'UNAVAILABLE';
    else if (
      cooldownActive ||
      (failureRate !== null && failureRate >= degradedFailureRate) ||
      (item.ewmaLatencyMs !== undefined && item.ewmaLatencyMs >= degradedLatencyMs)
    ) state = 'DEGRADED';

    return {
      provider: item.provider,
      state,
      totalCalls,
      failureRate,
      consecutiveFailures: item.consecutiveFailures,
      ewmaLatencyMs: item.ewmaLatencyMs ?? null,
      cooldownActive,
    };
  });

  const observed = providers.filter((provider) => provider.totalCalls > 0);
  const healthy = observed.filter((provider) => provider.state === 'HEALTHY').length;
  const degraded = observed.filter((provider) => provider.state === 'DEGRADED').length;
  const unavailable = observed.filter((provider) => provider.state === 'UNAVAILABLE').length;

  const state: ScreeningSlaState = observed.length === 0
    ? 'NO_RUNTIME_EVIDENCE'
    : unavailable > 0
      ? 'UNAVAILABLE'
      : degraded > 0
        ? 'DEGRADED'
        : 'HEALTHY';

  return {
    contractVersion: SCREENING_SLA_CONTRACT_VERSION,
    state,
    providersObserved: observed.length,
    healthy,
    degraded,
    unavailable,
    noRuntimeEvidence: observed.length === 0,
    thresholds: { degradedLatencyMs, degradedFailureRate, unavailableConsecutiveFailures },
    providers,
    hardScreeningBlockEnabled: false,
  };
}
