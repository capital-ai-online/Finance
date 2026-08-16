/**
 * SC-4 Provider Matrix (SC-MD-SPT-0001).
 *
 * Canonical inventory of market-data providers with rate-limit / circuit-breaker
 * defaults and gateway adoption status. Does NOT promote providers or change
 * scoring. Live crypto paths still marked legacy_off_gateway (SC-5).
 */

import type {
  MarketDataAssetClass,
  ProviderCapability,
  ProviderRole,
} from './contracts';

export const PROVIDER_MATRIX_VERSION = 'provider-matrix/1.0.0' as const;

export type ProviderGatewayStatus =
  | 'behind_gateway'
  | 'shadow_only'
  | 'legacy_off_gateway'
  | 'history_gateway_only'
  | 'not_wired';

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
 * Authoritative provider matrix for SC-4 documentation + runtime budget wiring.
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
    // Free/paid tiers vary; keep tight server-side budget independent of upstream quota.
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
    id: 'coingecko',
    displayName: 'CoinGecko',
    role: 'primary',
    capabilities: ['snapshot', 'history'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 10,
    rateLimit: { capacity: 25, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 30_000 },
    gatewayStatus: 'legacy_off_gateway',
    notes: 'SC-5 target: migrate crypto live paths behind MarketDataGateway.',
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
    notes: 'Legacy fallback paths; migrate under SC-5.',
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
