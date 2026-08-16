/**
 * SC-4 / SC-5 Provider Matrix (SC-MD-SPT-0001).
 *
 * Canonical inventory of market-data providers with rate-limit / circuit-breaker
 * defaults and gateway adoption status. Does NOT promote Alpaca or flip scoreImpact.
 */

import type {
  MarketDataAssetClass,
  ProviderCapability,
  ProviderRole,
} from './contracts';

export const PROVIDER_MATRIX_VERSION = 'provider-matrix/1.3.0' as const;

export type ProviderGatewayStatus =
  | 'behind_gateway'
  | 'shadow_only'
  | 'legacy_off_gateway'
  | 'history_gateway_only'
  | 'not_wired'
  | 'consensus_only';

export interface ProviderRateLimitPolicy {
  /** Max consumes per window for snapshot (and shared capability keys). */
  capacity: number;
  /** Sliding window length in ms. */
  windowMs: number;
}

export interface ProviderCircuitBreakerPolicy {
  failureThreshold: number;
  cooldownMs: number;
}

export interface ProviderMatrixEntry {
  id: string;
  displayName: string;
  role: ProviderRole;
  capabilities: ProviderCapability[];
  assetClasses: MarketDataAssetClass[];
  enabled: boolean;
  priority: number;
  rateLimit: ProviderRateLimitPolicy;
  circuitBreaker: ProviderCircuitBreakerPolicy;
  gatewayStatus: ProviderGatewayStatus;
  notes?: string;
}

/**
 * Default global budget when a provider is not listed or has no override.
 * Conservative SaaS-safe floor; matrix entries should override for known quotas.
 */
export const DEFAULT_RATE_LIMIT: ProviderRateLimitPolicy = {
  capacity: 60,
  windowMs: 60_000,
};

export const DEFAULT_CIRCUIT_BREAKER: ProviderCircuitBreakerPolicy = {
  failureThreshold: 3,
  cooldownMs: 30_000,
};

/**
 * Authoritative provider matrix for SC-4/SC-5 documentation + runtime budget wiring.
 * Update this table when registering or migrating a provider.
 */
export const PROVIDER_MATRIX: readonly ProviderMatrixEntry[] = [
  {
    id: 'twelvedata',
    displayName: 'TwelveData',
    role: 'primary',
    capabilities: ['snapshot', 'quote'],
    assetClasses: ['stock', 'forex'],
    enabled: true,
    priority: 10,
    rateLimit: { capacity: 30, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 45_000 },
    gatewayStatus: 'behind_gateway',
    notes: 'Traditional stock/forex quotes via traditionalQuoteEvidence → MarketDataGateway.',
  },
  {
    id: 'fmp-index',
    displayName: 'FMP',
    role: 'primary',
    capabilities: ['snapshot', 'quote'],
    assetClasses: ['index'],
    enabled: true,
    priority: 20,
    rateLimit: { capacity: 40, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 30_000 },
    gatewayStatus: 'behind_gateway',
    notes: 'Index quotes via injected loader; server FMP cache/cooldown remains composition boundary.',
  },
  {
    id: 'coingecko',
    displayName: 'CoinGecko',
    role: 'primary',
    capabilities: ['snapshot', 'quote'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 10,
    rateLimit: { capacity: 25, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 30_000 },
    gatewayStatus: 'behind_gateway',
    notes:
      'SC-5 Phase A–C: coins/{id} market_data via CoinGeckoMarketDataProvider → CanonicalMarketDataSnapshot (price + optional marketCap/supply). cryptoQuoteEvidence + multi-field cryptoSnapshotProvider share matrix RL/CB. executionPriceEligible still false.',
  },
  {
    id: 'alpaca',
    displayName: 'Alpaca',
    role: 'shadow',
    capabilities: ['snapshot', 'trade'],
    assetClasses: ['stock'],
    enabled: true,
    priority: 100,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 2, cooldownMs: 60_000 },
    gatewayStatus: 'shadow_only',
    notes: 'ADR-0041: shadow until Owner promotion + 14-day evidence gate. Excluded unless includeShadow.',
  },
  {
    id: 'fmp-index-history',
    displayName: 'FMP History',
    role: 'primary',
    capabilities: ['history'],
    assetClasses: ['index'],
    enabled: true,
    priority: 20,
    rateLimit: { capacity: 10, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'history_gateway_only',
    notes: 'P3C history contract; not wired into scoring consumers yet.',
  },
  {
    id: 'coinapi',
    displayName: 'CoinAPI',
    role: 'secondary',
    capabilities: ['snapshot', 'quote'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 20,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 30_000 },
    gatewayStatus: 'consensus_only',
    notes: 'Used by cryptoSpotConsensus only; gateway adapter not yet registered.',
  },
  {
    id: 'eodhd',
    displayName: 'EODHD',
    role: 'secondary',
    capabilities: ['snapshot', 'history'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 40,
    rateLimit: { capacity: 15, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 45_000 },
    gatewayStatus: 'consensus_only',
    notes: 'EOD reference observation in cryptoSpotConsensus; cannot form tight realtime quorum alone.',
  },
  {
    id: 'stooq',
    displayName: 'Stooq',
    role: 'secondary',
    capabilities: ['snapshot', 'history'],
    assetClasses: ['stock', 'index'],
    enabled: true,
    priority: 50,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 30_000 },
    gatewayStatus: 'legacy_off_gateway',
    notes: 'Legacy fallback paths; optional SC-5 later migration.',
  },
] as const;

export function getProviderMatrixEntry(id: string): ProviderMatrixEntry | undefined {
  return PROVIDER_MATRIX.find((entry) => entry.id === id);
}

/** Build RateLimitBudget.perProvider map from matrix entries that are gateway-relevant. */
export function rateLimitOverridesFromMatrix(): Record<string, ProviderRateLimitPolicy> {
  const out: Record<string, ProviderRateLimitPolicy> = {};
  for (const entry of PROVIDER_MATRIX) {
    if (
      entry.gatewayStatus === 'behind_gateway' ||
      entry.gatewayStatus === 'shadow_only' ||
      entry.gatewayStatus === 'history_gateway_only'
    ) {
      out[entry.id] = { ...entry.rateLimit };
    }
  }
  return out;
}

export function providersBehindGateway(): ProviderMatrixEntry[] {
  return PROVIDER_MATRIX.filter((e) => e.gatewayStatus === 'behind_gateway');
}

export function providersLegacyOffGateway(): ProviderMatrixEntry[] {
  return PROVIDER_MATRIX.filter((e) => e.gatewayStatus === 'legacy_off_gateway');
}
