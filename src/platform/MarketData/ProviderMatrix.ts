/**
 * SC-4 / SC-5 Provider Matrix (SC-MD-SPT-0001).
 *
 * Canonical inventory of market-data and bounded research-evidence providers.
 * Evidence suppliers extend this single registry; they do not create a second
 * gateway, scoring or execution authority.
 */

import type {
  MarketDataAssetClass,
  ProviderCapability,
  ProviderRole,
} from './contracts';

export const PROVIDER_MATRIX_VERSION = 'provider-matrix/1.8.0' as const;

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
    notes: 'Traditional stock/forex quotes via traditionalQuoteEvidence → MarketDataGateway. SC-5 Phase D: TwelveDataMarketDataProvider also accepts assetClass=crypto (X/USD via /quote); registered for a future gateway-hardened quorum, not yet consumed by cryptoQuoteEvidence.',
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
    notes: 'SC-5 Phase A–C: coins/{id} market_data via CoinGeckoMarketDataProvider → CanonicalMarketDataSnapshot (price + optional marketCap/supply). cryptoQuoteEvidence + multi-field cryptoSnapshotProvider share matrix RL/CB. executionPriceEligible still false.',
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
    notes: 'SC-5 Phase D: CoinAPIMarketDataProvider registered (matrix RL/CB) for a future gateway-hardened crypto quorum. Still consumed directly by cryptoSpotConsensus; cryptoQuoteEvidence still pins allowedProviderIds to [coingecko]. executionPriceEligible unchanged.',
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
    notes: 'SC-5 Phase D: EODHDMarketDataProvider registered (matrix RL/CB), snapshot labelled HISTORICAL (EOD close, never LIVE/DELAYED) so it cannot masquerade as a current execution price.',
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
    notes: 'ADR-0100: free-tier DeFi protocol evidence. Evidence-only; does not feed ScoringDispatcher and does not change any existing score.',
  },
  {
    id: 'binance-public',
    displayName: 'Binance Public Market Analytics',
    role: 'primary',
    capabilities: ['snapshot', 'quote', 'bars', 'derivatives'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 40,
    rateLimit: { capacity: 24, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Primary keyless crypto evidence supplier alongside Kraken. Public Binance Spot/Futures data only; no account, order, custody or execution authority.',
  },
  {
    id: 'kraken-futures-public',
    displayName: 'Kraken Futures Public Analytics',
    role: 'primary',
    capabilities: ['derivatives', 'bars', 'quote'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 45,
    rateLimit: { capacity: 12, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Primary keyless crypto evidence supplier alongside Binance: open interest, funding, liquidation, liquidity and slippage for governed markets. No trading/execution authority.',
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
    notes: 'Evidence-only token-security provider. Canonical CAPITAL-AI use is restricted to the documented free/public baseline. Optional paid/x402 modes are prohibited.',
  },
  {
    id: 'dexscreener',
    displayName: 'DEX Screener Public API',
    role: 'secondary',
    capabilities: ['snapshot', 'quote', 'onchain'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 75,
    rateLimit: { capacity: 60, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Keyless DEX market-structure evidence for governed token addresses. Not canonical execution-price authority.',
  },
  {
    id: 'sourcify',
    displayName: 'Sourcify API v2',
    role: 'secondary',
    capabilities: ['security', 'onchain'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 80,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Open-source contract source/bytecode verification lookup. A Sourcify match is verification evidence only and MUST NOT be interpreted as formal verification, audit completion or security PASS.',
  },
  {
    id: 'gdelt',
    displayName: 'GDELT DOC 2.0',
    role: 'secondary',
    capabilities: ['news'],
    assetClasses: ['crypto', 'stock', 'forex', 'commodity', 'index', 'bond', 'macro'],
    enabled: true,
    priority: 90,
    rateLimit: { capacity: 12, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Keyless article-discovery/provenance source. CAPITAL-AI stores/projects metadata and source links only; publisher content rights remain with publishers.',
  },
  {
    id: 'dune',
    displayName: 'Dune Governed Read Results',
    role: 'secondary',
    capabilities: ['onchain', 'governance'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 95,
    rateLimit: { capacity: 6, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 90_000 },
    gatewayStatus: 'not_wired',
    notes: 'Owner-keyed evidence source. FREE_TIER and explicitly attested 14-day full-data trial are bounded access modes. Query allowlist, schema/row limits and no-execute/no-overage rules remain mandatory.',
  },
] as const;

export function getProviderMatrixEntry(id: string): ProviderMatrixEntry | undefined {
  return PROVIDER_MATRIX.find((entry) => entry.id === id);
}

export function rateLimitOverridesFromMatrix(): Record<string, ProviderRateLimitPolicy> {
  const out: Record<string, ProviderRateLimitPolicy> = {};
  for (const entry of PROVIDER_MATRIX) {
    if (
      entry.gatewayStatus === 'behind_gateway'
      || entry.gatewayStatus === 'shadow_only'
      || entry.gatewayStatus === 'history_gateway_only'
    ) {
      out[entry.id] = { ...entry.rateLimit };
    }
  }
  return out;
}

export function providersBehindGateway(): ProviderMatrixEntry[] {
  return PROVIDER_MATRIX.filter((entry) => entry.gatewayStatus === 'behind_gateway');
}

export function providersLegacyOffGateway(): ProviderMatrixEntry[] {
  return PROVIDER_MATRIX.filter((entry) => entry.gatewayStatus === 'legacy_off_gateway');
}
