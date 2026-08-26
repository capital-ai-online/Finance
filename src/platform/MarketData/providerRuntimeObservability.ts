import type { CircuitState } from './CircuitBreaker';

export const PROVIDER_RUNTIME_OBSERVABILITY_VERSION = 'provider-runtime-observability/1.0.0' as const;
const DEFAULT_LEDGER_LIMIT = 2_000;

export type ProviderRuntimeOutcome =
  | 'READY'
  | 'NOT_CONFIGURED'
  | 'RATE_LIMITED'
  | 'CIRCUIT_OPEN'
  | 'SOURCE_UNAVAILABLE'
  | 'PROVIDER_ERROR'
  | 'INVALID';

export interface ProviderRuntimeObservation {
  readonly version: typeof PROVIDER_RUNTIME_OBSERVABILITY_VERSION;
  readonly providerId: string;
  readonly capability: string;
  readonly observedAt: string;
  readonly outcome: ProviderRuntimeOutcome;
  readonly requestAttempted: boolean;
  readonly durationMs: number;
  readonly payloadUsable: boolean;
  readonly circuitState: CircuitState;
  readonly httpStatus: number | null;
  readonly rateRemaining: number | null;
  readonly rateResetAt: string | null;
}

export interface ProviderRuntimeSummary {
  readonly version: typeof PROVIDER_RUNTIME_OBSERVABILITY_VERSION;
  readonly providerId: string;
  readonly capability: string;
  readonly sampleCount: number;
  readonly requestAttemptCount: number;
  readonly availabilityRate: number;
  readonly errorRate: number;
  readonly p95LatencyMs: number | null;
  readonly rateLimitedEvents: number;
  readonly circuitOpenEvents: number;
  readonly currentCircuitState: CircuitState | null;
  readonly lastObservedAt: string | null;
  readonly rateRemaining: number | null;
  readonly rateResetAt: string | null;
}

const ledger: ProviderRuntimeObservation[] = [];

function finiteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function percentile95(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return Number(sorted[index].toFixed(2));
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Number((numerator / denominator).toFixed(4));
}

/**
 * P3-A bounded, low-cardinality provider observation ledger.
 *
 * Deliberately stores no request path, URL, query, response payload, API key or provider data.
 * Provider/capability are governed identifiers; statistical aggregation is therefore safe for
 * later OpenTelemetry/Prometheus export without turning high-cardinality request data into labels.
 */
export function recordProviderRuntimeObservation(input: Omit<ProviderRuntimeObservation, 'version'>): ProviderRuntimeObservation {
  const providerId = input.providerId.trim();
  const capability = input.capability.trim();
  if (!providerId) throw new Error('PROVIDER_RUNTIME_OBSERVATION_PROVIDER_REQUIRED');
  if (!capability) throw new Error('PROVIDER_RUNTIME_OBSERVATION_CAPABILITY_REQUIRED');
  if (!Number.isFinite(Date.parse(input.observedAt))) throw new Error('PROVIDER_RUNTIME_OBSERVATION_TIMESTAMP_INVALID');
  if (!finiteNonNegative(input.durationMs)) throw new Error('PROVIDER_RUNTIME_OBSERVATION_DURATION_INVALID');
  if (input.rateRemaining !== null && (!Number.isInteger(input.rateRemaining) || input.rateRemaining < 0)) {
    throw new Error('PROVIDER_RUNTIME_OBSERVATION_RATE_REMAINING_INVALID');
  }
  if (input.rateResetAt !== null && !Number.isFinite(Date.parse(input.rateResetAt))) {
    throw new Error('PROVIDER_RUNTIME_OBSERVATION_RATE_RESET_INVALID');
  }

  const observation = Object.freeze({
    ...input,
    version: PROVIDER_RUNTIME_OBSERVABILITY_VERSION,
    providerId,
    capability,
    durationMs: Number(input.durationMs.toFixed(2)),
  });
  ledger.push(observation);
  if (ledger.length > DEFAULT_LEDGER_LIMIT) ledger.shift();
  return observation;
}

export function getProviderRuntimeObservations(filter: Readonly<{
  providerId?: string;
  capability?: string;
}> = {}): ProviderRuntimeObservation[] {
  const providerId = filter.providerId?.trim();
  const capability = filter.capability?.trim();
  return ledger
    .filter(item => (!providerId || item.providerId === providerId) && (!capability || item.capability === capability))
    .map(item => ({ ...item }));
}

export function summarizeProviderRuntime(providerIdInput: string, capabilityInput: string): ProviderRuntimeSummary {
  const providerId = providerIdInput.trim();
  const capability = capabilityInput.trim();
  const samples = ledger.filter(item => item.providerId === providerId && item.capability === capability);
  const attempted = samples.filter(item => item.requestAttempted);
  const last = samples.at(-1) ?? null;
  const ready = samples.filter(item => item.outcome === 'READY').length;
  const errors = samples.filter(item => item.outcome !== 'READY').length;
  return Object.freeze({
    version: PROVIDER_RUNTIME_OBSERVABILITY_VERSION,
    providerId,
    capability,
    sampleCount: samples.length,
    requestAttemptCount: attempted.length,
    availabilityRate: ratio(ready, samples.length),
    errorRate: ratio(errors, samples.length),
    p95LatencyMs: percentile95(attempted.map(item => item.durationMs)),
    rateLimitedEvents: samples.filter(item => item.outcome === 'RATE_LIMITED').length,
    circuitOpenEvents: samples.filter(item => item.outcome === 'CIRCUIT_OPEN').length,
    currentCircuitState: last?.circuitState ?? null,
    lastObservedAt: last?.observedAt ?? null,
    rateRemaining: last?.rateRemaining ?? null,
    rateResetAt: last?.rateResetAt ?? null,
  });
}

export function resetProviderRuntimeObservability(): void {
  ledger.length = 0;
}
