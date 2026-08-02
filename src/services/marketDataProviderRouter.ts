export type MarketDataAssetClass = 'crypto' | 'stock' | 'forex' | 'index' | 'bond' | 'macro';
export type MarketDataCapability = 'history' | 'snapshot' | 'fundamentals' | 'quotes' | 'orderbook' | 'macro-series';

export interface MarketDataProviderDescriptor {
  id: string;
  assetClasses: MarketDataAssetClass[];
  capabilities: MarketDataCapability[];
  basePriority: number;
  enabled: boolean;
  requiresApiKey?: boolean;
}

export interface ProviderRoutingTelemetry {
  provider: string;
  successes: number;
  failures: number;
  consecutiveFailures: number;
  ewmaLatencyMs?: number;
  cooldownUntilMs: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
}

export interface RankedProvider<T extends MarketDataProviderDescriptor = MarketDataProviderDescriptor> {
  provider: T;
  score: number;
  telemetry: ProviderRoutingTelemetry;
}

const telemetry = new Map<string, ProviderRoutingTelemetry>();
const EWMA_ALPHA = 0.25;

function stateFor(provider: string): ProviderRoutingTelemetry {
  const existing = telemetry.get(provider);
  if (existing) return existing;
  const created: ProviderRoutingTelemetry = {
    provider,
    successes: 0,
    failures: 0,
    consecutiveFailures: 0,
    cooldownUntilMs: 0,
  };
  telemetry.set(provider, created);
  return created;
}

export function recordMarketDataProviderOutcome(input: {
  provider: string;
  success: boolean;
  latencyMs?: number;
  nowMs?: number;
  failureCooldownMs?: number;
}): ProviderRoutingTelemetry {
  const nowMs = input.nowMs ?? Date.now();
  const state = stateFor(input.provider);

  if (input.success) {
    state.successes += 1;
    state.consecutiveFailures = 0;
    state.cooldownUntilMs = 0;
    state.lastSuccessAt = new Date(nowMs).toISOString();
    if (typeof input.latencyMs === 'number' && Number.isFinite(input.latencyMs) && input.latencyMs >= 0) {
      state.ewmaLatencyMs = state.ewmaLatencyMs === undefined
        ? input.latencyMs
        : EWMA_ALPHA * input.latencyMs + (1 - EWMA_ALPHA) * state.ewmaLatencyMs;
    }
  } else {
    state.failures += 1;
    state.consecutiveFailures += 1;
    state.lastFailureAt = new Date(nowMs).toISOString();
    const cooldown = input.failureCooldownMs ?? Math.min(120_000, 5_000 * 2 ** Math.min(state.consecutiveFailures - 1, 5));
    state.cooldownUntilMs = Math.max(state.cooldownUntilMs, nowMs + cooldown);
  }

  return { ...state };
}

/**
 * Adaptive provider ranking for financial data. Lower scores are preferred.
 * Base priority expresses data-governance preference; runtime penalties reduce dependence on a
 * failing/slow source without silently promoting an unapproved source.
 */
export function rankMarketDataProviders<T extends MarketDataProviderDescriptor>(
  providers: T[],
  options: { nowMs?: number; assetClass?: MarketDataAssetClass; capability?: MarketDataCapability } = {},
): RankedProvider<T>[] {
  const nowMs = options.nowMs ?? Date.now();
  return providers
    .filter(provider => provider.enabled)
    .filter(provider => !options.assetClass || provider.assetClasses.includes(options.assetClass))
    .filter(provider => !options.capability || provider.capabilities.includes(options.capability))
    .map(provider => {
      const state = stateFor(provider.id);
      const total = state.successes + state.failures;
      const failureRate = total > 0 ? state.failures / total : 0;
      const cooldownPenalty = state.cooldownUntilMs > nowMs ? 10_000 : 0;
      const consecutiveFailurePenalty = state.consecutiveFailures * 500;
      const failureRatePenalty = failureRate * 750;
      const latencyPenalty = state.ewmaLatencyMs === undefined ? 0 : Math.min(500, state.ewmaLatencyMs / 10);
      return {
        provider,
        telemetry: { ...state },
        score: provider.basePriority * 1_000 + cooldownPenalty + consecutiveFailurePenalty + failureRatePenalty + latencyPenalty,
      };
    })
    .sort((a, b) => a.score - b.score || a.provider.id.localeCompare(b.provider.id));
}

export function getMarketDataProviderTelemetry(): ProviderRoutingTelemetry[] {
  return [...telemetry.values()].map(item => ({ ...item }));
}

export function resetMarketDataProviderTelemetry(): void {
  telemetry.clear();
}
