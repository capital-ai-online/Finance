/**
 * SC-4 / SC-5 Provider Matrix (SC-MD-SPT-0001).
 *
 * Canonical inventory of market-data and evidence providers with rate-limit / circuit-breaker
 * defaults and gateway adoption status. Evidence-only providers remain outside MarketDataGateway
 * unless their payload has canonical quote/snapshot semantics and a later governance decision
 * explicitly promotes that route.
 */

import type {
  MarketDataAssetClass,
  ProviderCapability,
  ProviderRole,
} from './contracts';

export const PROVIDER_MATRIX_VERSION = 'provider-matrix/1.6.0' as const;

export type ProviderGatewayStatus =
  | 'behind_gateway'
  | 'shadow_only'
  | 'legacy_off_gateway'
  | 'history_gateway_only'
  | 'not_wired'
  | 'consensus_only';

export interface ProviderRateLimitPolicy {
  /** Max consumes per window for snapshot/evidence capability keys. */
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
    assetClasses: ['stock', 'forex', 'crypto'],
    enabled: true,
    priority: 10,
    rateLimit: { capacity: 30, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 45_000 },
    gatewayStatus: 'behind_gateway',
    notes:
      'Traditional stock/forex quotes via traditionalQuoteEvidence → MarketDataGateway. ' +
      'SC-5 Phase D: TwelveDataMarketDataProvider also accepts assetClass=crypto (X/USD via /quote); ' +
      'registered for a future gateway-hardened quorum, not yet consumed by cryptoQuoteEvidence.',
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
    gatewayStatus: 'behind_gateway',
    notes:
      'SC-5 Phase D: CoinAPIMarketDataProvider registered (matrix RL/CB) for a future gateway-hardened crypto quorum. Still consumed directly by cryptoSpotConsensus; cryptoQuoteEvidence still pins allowedProviderIds to [coingecko].',
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
    gatewayStatus: 'behind_gateway',
    notes:
      'SC-5 Phase D: EODHDMarketDataProvider registered (matrix RL/CB), snapshot labelled HISTORICAL so it cannot masquerade as a current execution price.',
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
  {
    id: 'defillama',
    displayName: 'DeFiLlama',
    role: 'secondary',
    capabilities: ['fundamentals'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 90,
    rateLimit: { capacity: 30, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes:
      'ADR-0100: DeFi protocol TVL/fees/revenue evidence via DefiLlamaProtocolProvider + defiProtocolEvidence.ts. Evidence-only; not a quote, score, ranking, dispatcher or execution authority.',
  },
  {
    id: 'goplus',
    displayName: 'GoPlus Security',
    role: 'secondary',
    capabilities: ['security', 'onchain'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 60,
    rateLimit: { capacity: 30, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes:
      'Token-security evidence for contract source/proxy/mint/blacklist/tax/honeypot/holder/liquidity-lock properties. Evidence-only and fail-closed on unknown fields; never an automatic PASS or score authority.',
  },
  {
    id: 'coinglass',
    displayName: 'CoinGlass',
    role: 'secondary',
    capabilities: ['derivatives', 'bars', 'quote'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 70,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes:
      'Derivatives/microstructure research evidence: open interest, funding, liquidations, orderbook/order-flow and multi-timeframe bars. Not an execution-price authority and intentionally outside MarketDataGateway.',
  },
  {
    id: 'lunarcrush',
    displayName: 'LunarCrush',
    role: 'secondary',
    capabilities: ['sentiment'],
    assetClasses: ['crypto', 'stock'],
    enabled: true,
    priority: 80,
    rateLimit: { capacity: 10, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes:
      'Social evidence for sentiment, mentions, interactions, contributors/creators and spam/bot signals. Paid-plan availability is runtime configuration; social evidence never substitutes price/volume confirmation.',
  },
  {
    id: 'messari',
    displayName: 'Messari',
    role: 'secondary',
    capabilities: ['fundamentals', 'onchain', 'governance'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 85,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes:
      'Standardized protocol/network usage and governance evidence. Existing ADR-0100 DeFiLlama fields remain authoritative for TVL/fees/revenue; Messari may supply non-overlapping usage evidence or explicit diagnostic cross-checks only.',
  },
  {
    id: 'dune',
    displayName: 'Dune',
    role: 'secondary',
    capabilities: ['onchain', 'governance'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 95,
    rateLimit: { capacity: 10, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 90_000 },
    gatewayStatus: 'not_wired',
    notes:
      'Governed saved-query evidence for protocol-specific features that are not standardized by existing providers. Only pre-registered query IDs/output schemas are allowed; arbitrary model/user SQL is forbidden.',
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
