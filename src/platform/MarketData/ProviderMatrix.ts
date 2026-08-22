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

export const PROVIDER_MATRIX_VERSION = 'provider-matrix/1.7.0' as const;

export type ProviderGatewayStatus =
  | 'behind_gateway'
  | 'shadow_only'
  | 'legacy_off_gateway'
  | 'history_gateway_only'
  | 'not_wired'
  | 'consensus_only';

export interface ProviderRateLimitPolicy {
  capacity: number;
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

export const DEFAULT_RATE_LIMIT: ProviderRateLimitPolicy = {
  capacity: 60,
  windowMs: 60_000,
};

export const DEFAULT_CIRCUIT_BREAKER: ProviderCircuitBreakerPolicy = {
  failureThreshold: 3,
  cooldownMs: 30_000,
};

export const PROVIDER_MATRIX: readonly ProviderMatrixEntry[] = [
  {
    id: 'twelvedata', displayName: 'TwelveData', role: 'primary', capabilities: ['snapshot', 'quote'], assetClasses: ['stock', 'forex', 'crypto'], enabled: true, priority: 10,
    rateLimit: { capacity: 30, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 45_000 }, gatewayStatus: 'behind_gateway',
    notes: 'Traditional stock/forex quotes via traditionalQuoteEvidence → MarketDataGateway. Crypto registration is reserved for future gateway-hardened quorum usage.',
  },
  {
    id: 'fmp-index', displayName: 'FMP', role: 'primary', capabilities: ['snapshot', 'quote'], assetClasses: ['index'], enabled: true, priority: 20,
    rateLimit: { capacity: 40, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 30_000 }, gatewayStatus: 'behind_gateway',
    notes: 'Index quotes via injected loader; server FMP cache/cooldown remains composition boundary.',
  },
  {
    id: 'coingecko', displayName: 'CoinGecko', role: 'primary', capabilities: ['snapshot', 'quote'], assetClasses: ['crypto'], enabled: true, priority: 10,
    rateLimit: { capacity: 25, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 30_000 }, gatewayStatus: 'behind_gateway',
    notes: 'Canonical crypto snapshot/quote and optional market-cap/supply evidence; executionPriceEligible remains false.',
  },
  {
    id: 'alpaca', displayName: 'Alpaca', role: 'shadow', capabilities: ['snapshot', 'trade'], assetClasses: ['stock'], enabled: true, priority: 100,
    rateLimit: { capacity: 20, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 2, cooldownMs: 60_000 }, gatewayStatus: 'shadow_only',
    notes: 'ADR-0041 shadow until Owner promotion and evidence gate.',
  },
  {
    id: 'fmp-index-history', displayName: 'FMP History', role: 'primary', capabilities: ['history'], assetClasses: ['index'], enabled: true, priority: 20,
    rateLimit: { capacity: 10, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 }, gatewayStatus: 'history_gateway_only',
    notes: 'P3C history contract; not wired into scoring consumers yet.',
  },
  {
    id: 'coinapi', displayName: 'CoinAPI', role: 'secondary', capabilities: ['snapshot', 'quote'], assetClasses: ['crypto'], enabled: true, priority: 20,
    rateLimit: { capacity: 20, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 30_000 }, gatewayStatus: 'behind_gateway',
    notes: 'Registered for future gateway-hardened crypto quorum; current canonical quote route remains explicitly governed.',
  },
  {
    id: 'eodhd', displayName: 'EODHD', role: 'secondary', capabilities: ['snapshot', 'history'], assetClasses: ['crypto'], enabled: true, priority: 40,
    rateLimit: { capacity: 15, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 45_000 }, gatewayStatus: 'behind_gateway',
    notes: 'Historical-labelled crypto snapshot/history; cannot masquerade as current execution price.',
  },
  {
    id: 'stooq', displayName: 'Stooq', role: 'secondary', capabilities: ['snapshot', 'history'], assetClasses: ['stock', 'index'], enabled: true, priority: 50,
    rateLimit: { capacity: 20, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 30_000 }, gatewayStatus: 'legacy_off_gateway',
    notes: 'Legacy fallback paths; optional later migration.',
  },
  {
    id: 'defillama', displayName: 'DeFiLlama', role: 'secondary', capabilities: ['fundamentals'], assetClasses: ['crypto'], enabled: true, priority: 90,
    rateLimit: { capacity: 30, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 }, gatewayStatus: 'not_wired',
    notes: 'ADR-0100 free TVL/fees/revenue evidence only. Pro-only hacks/oracles/treasuries are not enabled by this matrix.',
  },
  {
    id: 'goplus', displayName: 'GoPlus Security', role: 'secondary', capabilities: ['security', 'onchain'], assetClasses: ['crypto'], enabled: true, priority: 60,
    rateLimit: { capacity: 30, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 }, gatewayStatus: 'not_wired',
    notes: 'Token-security facts for source/proxy/mint/blacklist/tax/honeypot/holder/liquidity lock. Evidence-only; never an automatic PASS.',
  },
  {
    id: 'coinglass', displayName: 'CoinGlass', role: 'secondary', capabilities: ['derivatives', 'bars', 'quote'], assetClasses: ['crypto'], enabled: true, priority: 70,
    rateLimit: { capacity: 20, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 }, gatewayStatus: 'not_wired',
    notes: 'Open interest, funding, liquidations, orderbook/order-flow, timeframes and unlock research evidence; not execution-price authority.',
  },
  {
    id: 'lunarcrush', displayName: 'LunarCrush', role: 'secondary', capabilities: ['sentiment'], assetClasses: ['crypto', 'stock'], enabled: true, priority: 80,
    rateLimit: { capacity: 10, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 }, gatewayStatus: 'not_wired',
    notes: 'Social sentiment/mentions/interactions/creator/spam evidence. Provider market prices and proprietary mixed scores are deliberately ignored.',
  },
  {
    id: 'messari', displayName: 'Messari', role: 'secondary', capabilities: ['fundamentals', 'onchain', 'governance'], assetClasses: ['crypto'], enabled: true, priority: 85,
    rateLimit: { capacity: 20, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 }, gatewayStatus: 'not_wired',
    notes: 'Standardized protocol/network usage and governance evidence. DeFiLlama retains TVL/fees/revenue authority; overlapping Messari fields are diagnostic only.',
  },
  {
    id: 'dune', displayName: 'Dune', role: 'secondary', capabilities: ['onchain', 'governance'], assetClasses: ['crypto'], enabled: true, priority: 95,
    rateLimit: { capacity: 10, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 90_000 }, gatewayStatus: 'not_wired',
    notes: 'Read-only saved-query fallback for protocol-specific evidence. Only allowlisted query IDs/output schemas; no arbitrary SQL.',
  },
  {
    id: 'newsapi', displayName: 'NewsAPI', role: 'secondary', capabilities: ['news'], assetClasses: ['crypto', 'stock', 'forex', 'commodity', 'index', 'bond'], enabled: true, priority: 90,
    rateLimit: { capacity: 10, windowMs: 60_000 }, circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 }, gatewayStatus: 'not_wired',
    notes: 'Raw article evidence using X-Api-Key header. Existing keyword sentiment remains explicitly heuristic and is not model/NLP evidence.',
  },
] as const;

export function getProviderMatrixEntry(id: string): ProviderMatrixEntry | undefined {
  return PROVIDER_MATRIX.find((entry) => entry.id === id);
}

export function rateLimitOverridesFromMatrix(): Record<string, ProviderRateLimitPolicy> {
  const out: Record<string, ProviderRateLimitPolicy> = {};
  for (const entry of PROVIDER_MATRIX) {
    if (entry.gatewayStatus === 'behind_gateway' || entry.gatewayStatus === 'shadow_only' || entry.gatewayStatus === 'history_gateway_only') {
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
