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

export const PROVIDER_MATRIX_VERSION = 'provider-matrix/1.11.0' as const;

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
    capabilities: ['snapshot', 'quote', 'history'],
    assetClasses: ['stock', 'forex', 'crypto', 'commodity', 'index'],
    enabled: true,
    priority: 10,
    rateLimit: { capacity: 30, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 45_000 },
    gatewayStatus: 'behind_gateway',
    notes: 'Traditional stock/forex/crypto quotes use MarketDataGateway. Commodity daily history is mapped through TwelveDataCommodityHistoryProvider -> MarketDataHistoryGateway. Stock/forex/index/crypto history also exists on the compatibility adapter and remains off the canonical history gateway until migrated; no direct scoring-route HTTP access is authorized by this matrix.',
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
    capabilities: ['snapshot', 'quote', 'history'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 10,
    rateLimit: { capacity: 25, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 30_000 },
    gatewayStatus: 'behind_gateway',
    notes: 'SC-5 Phase A–C: coins/{id} market_data via CoinGeckoMarketDataProvider → CanonicalMarketDataSnapshot (price + optional marketCap/supply). cryptoQuoteEvidence + multi-field cryptoSnapshotProvider share matrix RL/CB. A separate compatibility history path still performs direct CoinGecko market_chart reads; that history capability is inventoried here but is not promoted to MarketDataHistoryGateway by metadata alone. executionPriceEligible still false.',
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
    capabilities: ['snapshot', 'quote', 'history', 'orderbook'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 20,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 30_000 },
    gatewayStatus: 'behind_gateway',
    notes: 'SC-5 Phase D: CoinAPIMarketDataProvider registered (matrix RL/CB) for a future gateway-hardened crypto quorum. Compatibility history and historical order-book metadata remain direct/off-gateway; cryptoSpotConsensus also consumes CoinAPI directly. cryptoQuoteEvidence still pins allowedProviderIds to [coingecko]. executionPriceEligible unchanged.',
  },
  {
    id: 'eodhd',
    displayName: 'EODHD',
    role: 'secondary',
    capabilities: ['snapshot', 'history'],
    assetClasses: ['crypto', 'stock', 'forex', 'bond'],
    enabled: true,
    priority: 40,
    rateLimit: { capacity: 15, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 45_000 },
    gatewayStatus: 'behind_gateway',
    notes: 'SC-5 Phase D: EODHDMarketDataProvider registers crypto snapshots behind MarketDataGateway. Direct compatibility history adapters also serve crypto/stock/forex plus explicit *.GBOND sovereign-yield evidence. Those direct history lanes remain off the canonical history gateway and EOD observations must never masquerade as current execution prices.',
  },
  {
    id: 'stooq',
    displayName: 'Stooq',
    role: 'secondary',
    capabilities: ['snapshot', 'history'],
    assetClasses: ['stock', 'forex', 'index'],
    enabled: false,
    priority: 50,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 30_000 },
    gatewayStatus: 'not_wired',
    notes: 'Productive direct Stooq network access is retired. Future use requires an explicit canonical MarketDataGateway adapter and governed re-authorization.',
  },
  {
    id: 'alpha-vantage',
    displayName: 'Alpha Vantage',
    role: 'primary',
    capabilities: ['fundamentals', 'history', 'quote'],
    assetClasses: ['stock'],
    enabled: true,
    priority: 20,
    rateLimit: { capacity: 3, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'legacy_off_gateway',
    notes: 'Existing server-side stock fundamentals/history/quote compatibility provider. OVERVIEW fundamentals are primary in stockFundamentals; ALPHA_VANTAGE_API_KEY remains the sole credential identity. This entry records existing runtime truth and does not authorize a new gateway path.',
  },
  {
    id: 'fmp-traditional',
    displayName: 'FMP Traditional Fundamentals',
    role: 'secondary',
    capabilities: ['fundamentals'],
    assetClasses: ['stock'],
    enabled: true,
    priority: 20,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'legacy_off_gateway',
    notes: 'Existing FMP ratios-ttm fallback/enrichment for stock fundamentals. Index quote/history lanes remain represented separately by fmp-index and fmp-index-history.',
  },
  {
    id: 'finnhub',
    displayName: 'Finnhub',
    role: 'secondary',
    capabilities: ['snapshot', 'quote', 'history', 'fundamentals'],
    assetClasses: ['stock', 'forex', 'index', 'crypto'],
    enabled: false,
    priority: 40,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Candidate only. Adapter and licensing approval are required before activation; matrix presence is inventory, not authorization.',
  },
  {
    id: 'massive',
    displayName: 'Massive',
    role: 'secondary',
    capabilities: ['snapshot', 'quote', 'history'],
    assetClasses: ['stock', 'forex', 'index', 'crypto'],
    enabled: false,
    priority: 40,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Candidate only. Adapter, exchange entitlements and redistribution licensing remain prerequisites before activation.',
  },
  {
    id: 'fred',
    displayName: 'FRED',
    role: 'primary',
    capabilities: ['macro-series'],
    assetClasses: ['macro', 'bond'],
    enabled: true,
    priority: 10,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'legacy_off_gateway',
    notes: 'Existing allow-listed macro/rate evidence adapter. FRED observations are context/rate evidence only and never execution-price eligible.',
  },
  {
    id: 'ecb',
    displayName: 'ECB Data API',
    role: 'secondary',
    capabilities: ['macro-series'],
    assetClasses: ['macro', 'forex', 'bond'],
    enabled: true,
    priority: 10,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'legacy_off_gateway',
    notes: 'Existing keyless ECB reference-rate evidence path. Reference FX/rate observations are informational and never execution-price eligible.',
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
    id: 'eia',
    displayName: 'U.S. Energy Information Administration API v2',
    role: 'primary',
    capabilities: ['fundamentals'],
    assetClasses: ['commodity'],
    enabled: true,
    priority: 30,
    rateLimit: { capacity: 30, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Official Energy evidence for governed EIA series bindings. Consumed only through ResearchEvidenceProviderHttp; research/challenger evidence, no quote or scoring authority.',
  },
  {
    id: 'usda-fas-psd',
    displayName: 'USDA FAS Production, Supply and Distribution',
    role: 'primary',
    capabilities: ['fundamentals'],
    assetClasses: ['commodity'],
    enabled: true,
    priority: 30,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Official agriculture balance-sheet evidence with data-release/revision lineage. ResearchEvidenceProviderHttp only; no scoring authority.',
  },
  {
    id: 'cftc-cot',
    displayName: 'CFTC Commitments of Traders Public Reporting',
    role: 'secondary',
    capabilities: ['derivatives'],
    assetClasses: ['commodity'],
    enabled: true,
    priority: 40,
    rateLimit: { capacity: 20, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Official public Disaggregated Futures Only positioning evidence. Context/challenger evidence only; cannot independently grant trade-ready or execution eligibility.',
  },
  {
    id: 'usgs-mcs',
    displayName: 'USGS Mineral Commodity Summaries',
    role: 'primary',
    capabilities: ['fundamentals'],
    assetClasses: ['commodity'],
    enabled: true,
    priority: 30,
    rateLimit: { capacity: 12, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Public-domain MCS production/trade/reliance/recycling evidence normalized from governed USGS data-release rows; no benchmark-price or scoring authority.',
  },
  {
    id: 'eu-crma',
    displayName: 'EU Critical Raw Materials Act evidence',
    role: 'secondary',
    capabilities: ['fundamentals'],
    assetClasses: ['commodity'],
    enabled: true,
    priority: 50,
    rateLimit: { capacity: 10, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 60_000 },
    gatewayStatus: 'not_wired',
    notes: 'Governed EUR-Lex/JRC-derived criticality evidence. Economic Importance and Supply Risk remain separate context dimensions and are never silently added to benchmark market score.',
  },
  {
    id: 'binance-public',
    displayName: 'Binance Public Market Analytics',
    role: 'primary',
    capabilities: ['snapshot', 'quote', 'history', 'bars', 'derivatives', 'orderbook'],
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
    capabilities: ['derivatives', 'history', 'bars', 'quote', 'orderbook'],
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
    id: 'free-crypto-news',
    displayName: 'cryptocurrency.cv Public News',
    role: 'primary',
    capabilities: ['news'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 20,
    rateLimit: { capacity: 30, windowMs: 60_000 },
    circuitBreaker: { failureThreshold: 3, cooldownMs: 45_000 },
    gatewayStatus: 'not_wired',
    notes: 'Public keyless cryptocurrency.cv article-metadata API. Upstream software is currently proprietary; CAPITAL-AI consumes the public REST data surface only. The token-protected source catalog is not a credential dependency: filter sources are derived from recent public article evidence. Metadata + publisher URL only; no body scrape, no scoring authority.',
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
    notes: 'Keyless article-discovery/provenance source. CAPITAL-AI stores/projects metadata and source links only; publisher content rights remain with publishers. Fallback for non-crypto or when free-crypto-news is unavailable.',
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


export type ProviderCompatibilityActivation = 'active' | 'candidate' | 'reference-only';

export interface ProviderCompatibilityBinding {
  readonly legacyId: string;
  readonly matrixEntryIds: readonly string[];
  readonly basePriority: number;
  readonly activation: ProviderCompatibilityActivation;
  readonly environmentVariable?: string;
  readonly requiresApiKey?: boolean;
  readonly purpose: string;
  readonly governanceNotes: string;
}

/**
 * Compatibility projection for the older adaptive provider router.
 *
 * All market-data capabilities, asset classes and enabled state are materialized from
 * PROVIDER_MATRIX. These bindings retain only legacy identity/credential/purpose metadata
 * needed by existing callers while those callers migrate to the canonical gateways.
 */
export const LEGACY_PROVIDER_COMPATIBILITY_BINDINGS: readonly ProviderCompatibilityBinding[] = Object.freeze([
  {
    legacyId: 'CoinGecko',
    matrixEntryIds: ['coingecko'],
    basePriority: 1,
    activation: 'active',
    purpose: 'Crypto history and market snapshot',
    governanceNotes: 'Compatibility history remains direct; canonical quote/snapshot paths stay behind MarketDataGateway.',
  },
  {
    legacyId: 'Binance',
    matrixEntryIds: ['binance-public'],
    basePriority: 2,
    activation: 'active',
    purpose: 'Crypto venue history and market-structure evidence',
    governanceNotes: 'Venue-specific evidence must retain Binance identity and must not be represented as consolidated market truth.',
  },
  {
    legacyId: 'Kraken',
    matrixEntryIds: ['kraken-futures-public'],
    basePriority: 3,
    activation: 'active',
    purpose: 'Crypto venue history and market-structure evidence',
    governanceNotes: 'Venue-specific provenance is mandatory; compatibility history does not promote Kraken into canonical consolidated-price authority.',
  },
  {
    legacyId: 'CoinAPI',
    matrixEntryIds: ['coinapi'],
    basePriority: 2,
    activation: 'active',
    environmentVariable: 'COIN_API_KEY',
    requiresApiKey: true,
    purpose: 'Normalized multi-exchange crypto redundancy',
    governanceNotes: 'Server-side keyed compatibility history/consensus paths remain bounded by provenance and licensing/redistribution terms.',
  },
  {
    legacyId: 'TwelveData',
    matrixEntryIds: ['twelvedata'],
    basePriority: 3,
    activation: 'active',
    environmentVariable: 'TWELVEDATA_API_KEY',
    requiresApiKey: true,
    purpose: 'Global multi-asset quote/history redundancy',
    governanceNotes: 'Canonical quote and commodity-history gateways coexist with compatibility history paths; null/rate-limit responses remain fail-closed.',
  },
  {
    legacyId: 'EODHD',
    matrixEntryIds: ['eodhd'],
    basePriority: 4,
    activation: 'active',
    environmentVariable: 'EODHD_API_KEY',
    requiresApiKey: true,
    purpose: 'EOD/historical multi-asset redundancy and explicit government-bond evidence',
    governanceNotes: 'Sovereign mappings remain explicit and EOD observations never become current execution prices.',
  },
  {
    legacyId: 'Stooq',
    matrixEntryIds: ['stooq'],
    basePriority: 2,
    activation: 'reference-only',
    purpose: 'Retired legacy traditional-market reference source',
    governanceNotes: 'Productive direct network access remains disabled; reintroduction requires explicit canonical adapter authorization.',
  },
  {
    legacyId: 'AlphaVantage',
    matrixEntryIds: ['alpha-vantage'],
    basePriority: 2,
    activation: 'active',
    environmentVariable: 'ALPHA_VANTAGE_API_KEY',
    requiresApiKey: true,
    purpose: 'Stock fundamentals and compatibility market data',
    governanceNotes: 'Existing keyed provider; provenance, rate-limit and freshness metadata remain mandatory.',
  },
  {
    legacyId: 'FMP',
    matrixEntryIds: ['fmp-index', 'fmp-index-history', 'fmp-traditional'],
    basePriority: 2,
    activation: 'active',
    environmentVariable: 'FMP_API_KEY',
    requiresApiKey: true,
    purpose: 'Approved index mappings plus stock-fundamentals fallback',
    governanceNotes: 'Index and stock-fundamental lanes remain semantically separate; customer-facing redistribution remains licensing-dependent.',
  },
  {
    legacyId: 'Finnhub',
    matrixEntryIds: ['finnhub'],
    basePriority: 4,
    activation: 'candidate',
    environmentVariable: 'FINNHUB_API_KEY',
    requiresApiKey: true,
    purpose: 'Candidate global market/fundamental redundancy',
    governanceNotes: 'Disabled until adapter and licensing gates are satisfied.',
  },
  {
    legacyId: 'Massive',
    matrixEntryIds: ['massive'],
    basePriority: 4,
    activation: 'candidate',
    environmentVariable: 'MASSIVE_API_KEY',
    requiresApiKey: true,
    purpose: 'Candidate low-latency market-data redundancy',
    governanceNotes: 'Disabled until adapter, exchange-entitlement and redistribution gates are satisfied.',
  },
  {
    legacyId: 'FRED',
    matrixEntryIds: ['fred'],
    basePriority: 1,
    activation: 'active',
    environmentVariable: 'FRED_API_KEY',
    requiresApiKey: true,
    purpose: 'Macroeconomic and interest-rate evidence',
    governanceNotes: 'Allow-listed series only; fail closed without FRED_API_KEY and never treat macro observations as execution prices.',
  },
  {
    legacyId: 'ECB',
    matrixEntryIds: ['ecb'],
    basePriority: 1,
    activation: 'reference-only',
    purpose: 'Official EUR reference FX and euro-area reference evidence',
    governanceNotes: 'Keyless reference evidence only; never execution-price eligible.',
  },
]);

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
