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
 * This module is the canonical exported projection and appends evidence-only providers without
 * changing any existing gateway role, priority, rate-limit policy or routing semantics.
 */
export const PROVIDER_MATRIX_VERSION = 'provider-matrix/1.6.0' as const;

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
    notes: 'Evidence-only token-security provider. Public baseline is keyless within documented limits; authenticated higher-quota mode is optional. Never a score or automatic PASS authority.',
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
    notes: 'Evidence-only derivatives/microstructure provider for OI, funding, liquidations, orderbook and unlock research. Not an execution-price authority.',
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
    notes: 'Evidence-only social provider. Sentiment/mentions/interactions/creator/spam evidence remains independent from market confirmation and cannot authorize a score.',
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
    notes: 'Evidence-only standardized protocol/network usage source. ADR-0100 DeFiLlama remains authoritative for existing TVL/fees/revenue fields. x402/pay-per-request is policy-blocked.',
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
    notes: 'Evidence-only saved-query provider. Only pre-approved query IDs and output schemas are permitted; arbitrary SQL/model-generated queries are forbidden.',
  },
  {
    id: 'newsapi',
    displayName: 'NewsAPI',
    role: 'secondary',
    capabilities: ['news'],
    assetClasses: ['crypto', 'stock', 'forex', 'commodity', 'index', 'bond', 'macro'],
    enabled: true,
    priority: 90,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Raw external article/provenance evidence for landing page and AI Newsfeed Viewer. Developer plan is not production-authorized; production entitlement is an Owner cost/licensing gate.',
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
