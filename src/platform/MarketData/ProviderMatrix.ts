import type {
  ProviderCircuitBreakerPolicy,
  ProviderGatewayStatus,
  ProviderMatrixEntry,
  ProviderRateLimitPolicy,
} from './ProviderMatrixBase';
import {
  DEFAULT_CIRCUIT_BREAKER,
  DEFAULT_RATE_LIMIT,
  PROVIDER_MATRIX as BASE_PROVIDER_MATRIX,
} from './ProviderMatrixBase';

export type {
  ProviderCircuitBreakerPolicy,
  ProviderGatewayStatus,
  ProviderMatrixEntry,
  ProviderRateLimitPolicy,
} from './ProviderMatrixBase';
export { DEFAULT_CIRCUIT_BREAKER, DEFAULT_RATE_LIMIT } from './ProviderMatrixBase';

/**
 * SC-4 evidence-provider additive supersession.
 *
 * The historical market-data provider inventory remains byte-identical in ProviderMatrixBase.
 * This canonical projection appends only free/keyless or explicitly free-tier-governed evidence
 * sources. Paid CoinGlass, LunarCrush and NewsAPI integrations are intentionally absent.
 */
export const PROVIDER_MATRIX_VERSION = 'provider-matrix/1.7.0' as const;

const EVIDENCE_PROVIDER_ENTRIES: readonly ProviderMatrixEntry[] = Object.freeze([
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
    notes: 'Evidence-only token-security provider. Canonical CAPITAL-AI use is restricted to the documented free/public baseline (30 calls/minute). Optional paid/x402 modes are prohibited.',
  },
  {
    id: 'kraken-futures-public',
    displayName: 'Kraken Futures Public Analytics',
    role: 'secondary',
    capabilities: ['derivatives', 'bars', 'quote'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 70,
    rateLimit: { capacity: 12, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Keyless read-only Kraken Futures Charts analytics for governed Kraken market symbols: open interest, funding, liquidation, liquidity and slippage. No trading/execution authority.',
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
    notes: 'Keyless DEX market-structure evidence for governed token addresses. Local limit remains below documented 300 rpm token/pair API limit. Not canonical execution-price authority.',
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
    id: 'dune',
    displayName: 'Dune Free-Tier Read Results',
    role: 'secondary',
    capabilities: ['onchain', 'governance'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 95,
    rateLimit: { capacity: 6, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 90_000 },
    gatewayStatus: 'not_wired',
    notes: 'Free-tier-only evidence. Only Owner-allowlisted saved query IDs and bounded latest-result reads are permitted. Query execution, arbitrary SQL, large exports and credit-limit bypass are forbidden.',
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
    notes: 'Keyless article-discovery/provenance source for Landing Page and AI Newsfeed Viewer. CAPITAL-AI stores/projects metadata and source links only; publisher content rights remain with the publishers.',
  },
]);

export const PROVIDER_MATRIX: readonly ProviderMatrixEntry[] = Object.freeze([
  ...BASE_PROVIDER_MATRIX,
  ...EVIDENCE_PROVIDER_ENTRIES,
]);

export function getProviderMatrixEntry(id: string): ProviderMatrixEntry | undefined {
  return PROVIDER_MATRIX.find((entry) => entry.id === id);
}

/** Build RateLimitBudget.perProvider map only for gateway-relevant providers. */
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
