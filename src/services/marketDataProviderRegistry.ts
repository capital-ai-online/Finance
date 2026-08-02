import type { MarketDataProviderDescriptor } from './marketDataProviderRouter';

export type ProviderActivation = 'active' | 'candidate' | 'reference-only';

export interface MarketDataProviderRegistryEntry extends MarketDataProviderDescriptor {
  activation: ProviderActivation;
  environmentVariable?: string;
  purpose: string;
  governanceNotes: string;
}

/**
 * Governance registry only. Candidate entries are NOT contacted until an explicit adapter is
 * implemented, licensing is approved and the required secret is configured in production.
 */
export const MARKET_DATA_PROVIDER_REGISTRY: MarketDataProviderRegistryEntry[] = [
  {
    id: 'CoinGecko', assetClasses: ['crypto'], capabilities: ['history', 'snapshot'], basePriority: 1,
    enabled: true, activation: 'active', purpose: 'Crypto history and market snapshot',
    governanceNotes: 'Existing verified source. Downstream freshness/provenance gates remain mandatory.',
  },
  {
    id: 'Binance', assetClasses: ['crypto'], capabilities: ['history', 'quotes', 'orderbook'], basePriority: 2,
    enabled: true, activation: 'active', purpose: 'Crypto venue history fallback',
    governanceNotes: 'Existing public venue fallback; venue-specific data must not be represented as consolidated market truth.',
  },
  {
    id: 'Kraken', assetClasses: ['crypto'], capabilities: ['history', 'quotes', 'orderbook'], basePriority: 3,
    enabled: true, activation: 'active', purpose: 'Crypto venue history fallback',
    governanceNotes: 'Existing public venue fallback; venue-specific provenance must be preserved.',
  },
  {
    id: 'Stooq', assetClasses: ['stock', 'forex'], capabilities: ['history'], basePriority: 2,
    enabled: true, activation: 'active', purpose: 'Traditional market history',
    governanceNotes: 'Existing source. Keep fail-closed behavior when simulated/bootstrap history is detected.',
  },
  {
    id: 'AlphaVantage', assetClasses: ['stock'], capabilities: ['fundamentals', 'history', 'quotes'], basePriority: 2,
    enabled: true, activation: 'active', environmentVariable: 'ALPHA_VANTAGE_API_KEY', purpose: 'Stock fundamentals and market data',
    governanceNotes: 'Existing keyed source. Rate-limit and freshness metadata must be captured.',
  },
  {
    id: 'FMP', assetClasses: ['stock', 'index'], capabilities: ['history', 'snapshot', 'fundamentals'], basePriority: 2,
    enabled: true, activation: 'active', environmentVariable: 'FMP_API_KEY', purpose: 'Index and traditional-asset market data',
    governanceNotes: 'Existing keyed source. Licensing/redistribution rules must be validated for customer-facing use.',
  },
  {
    id: 'TwelveData', assetClasses: ['stock', 'forex', 'index', 'crypto'], capabilities: ['history', 'snapshot', 'quotes'], basePriority: 3,
    enabled: false, activation: 'candidate', environmentVariable: 'TWELVE_DATA_API_KEY', purpose: 'Global multi-asset redundancy',
    governanceNotes: 'Adapter pending. Evaluate commercial redistribution rights, entitlements, rate limits and WebSocket plan before activation.',
  },
  {
    id: 'Finnhub', assetClasses: ['stock', 'forex', 'index', 'crypto'], capabilities: ['history', 'snapshot', 'quotes', 'fundamentals'], basePriority: 3,
    enabled: false, activation: 'candidate', environmentVariable: 'FINNHUB_API_KEY', purpose: 'Global market/fundamental redundancy',
    governanceNotes: 'Adapter pending. Particularly useful as a second fundamentals/estimates source; licensing approval required.',
  },
  {
    id: 'Massive', assetClasses: ['stock', 'forex', 'index', 'crypto'], capabilities: ['history', 'snapshot', 'quotes'], basePriority: 3,
    enabled: false, activation: 'candidate', environmentVariable: 'MASSIVE_API_KEY', purpose: 'Low-latency US/multi-asset market data and future options coverage',
    governanceNotes: 'Adapter pending. Business market-data licensing and exchange entitlements must be approved before redistribution.',
  },
  {
    id: 'CoinAPI', assetClasses: ['crypto'], capabilities: ['history', 'snapshot', 'quotes', 'orderbook'], basePriority: 3,
    enabled: false, activation: 'candidate', environmentVariable: 'COINAPI_KEY', purpose: 'Normalized multi-exchange crypto redundancy',
    governanceNotes: 'Adapter pending. Useful for consolidated exchange coverage and order-book evidence; commercial plan/licensing required.',
  },
  {
    id: 'FRED', assetClasses: ['macro', 'bond'], capabilities: ['macro-series'], basePriority: 1,
    enabled: false, activation: 'candidate', environmentVariable: 'FRED_API_KEY', purpose: 'Macroeconomic and interest-rate evidence',
    governanceNotes: 'Suitable for macro/rate context and selected public series, not as a tradable-price execution feed.',
  },
  {
    id: 'ECB', assetClasses: ['macro', 'forex', 'bond'], capabilities: ['macro-series'], basePriority: 1,
    enabled: false, activation: 'reference-only', purpose: 'Official EUR reference FX and euro-area macro/rate evidence',
    governanceNotes: 'Reference rates are informational and should not be treated as executable transaction prices.',
  },
];

export function getMarketDataProviderRegistry(): MarketDataProviderRegistryEntry[] {
  return MARKET_DATA_PROVIDER_REGISTRY.map(entry => ({
    ...entry,
    assetClasses: [...entry.assetClasses],
    capabilities: [...entry.capabilities],
  }));
}
