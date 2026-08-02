import type { MarketDataProviderDescriptor } from './marketDataProviderRouter';

export type ProviderActivation = 'active' | 'candidate' | 'reference-only';

export interface MarketDataProviderRegistryEntry extends MarketDataProviderDescriptor {
  activation: ProviderActivation;
  environmentVariable?: string;
  purpose: string;
  governanceNotes: string;
}

/**
 * Governance registry. `active` means an adapter exists and the provider may participate when its
 * required server-side secret is configured. Secrets are never exposed to browser code.
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
    id: 'CoinAPI', assetClasses: ['crypto'], capabilities: ['history', 'snapshot', 'quotes', 'orderbook'], basePriority: 2,
    enabled: true, activation: 'active', environmentVariable: 'COIN_API_KEY', requiresApiKey: true,
    purpose: 'Normalized multi-exchange crypto redundancy',
    governanceNotes: 'Server-side adapter uses X-CoinAPI-Key. Venue/symbol provenance remains explicit; licensing/redistribution terms remain plan-dependent.',
  },
  {
    id: 'TwelveData', assetClasses: ['stock', 'forex', 'index', 'crypto'], capabilities: ['history', 'snapshot', 'quotes'], basePriority: 3,
    enabled: true, activation: 'active', environmentVariable: 'TWELVEDATA_API_KEY', requiresApiKey: true,
    purpose: 'Global multi-asset redundancy',
    governanceNotes: 'Server-side adapter only. Nulls/rate limits are fail-closed; exchange/timezone metadata must be retained where available.',
  },
  {
    id: 'EODHD', assetClasses: ['stock', 'forex', 'crypto', 'bond'], capabilities: ['history', 'snapshot'], basePriority: 4,
    enabled: true, activation: 'active', environmentVariable: 'EODHD_API_KEY', requiresApiKey: true,
    purpose: 'Global EOD/historical multi-asset redundancy plus explicit government-bond evidence',
    governanceNotes: 'Stock/forex/crypto adapters plus evidence-only *.GBOND history are implemented. Bond symbols are never guessed and no bond score is emitted by the evidence adapter. EOD data must not masquerade as current execution prices.',
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
    id: 'Finnhub', assetClasses: ['stock', 'forex', 'index', 'crypto'], capabilities: ['history', 'snapshot', 'quotes', 'fundamentals'], basePriority: 4,
    enabled: false, activation: 'candidate', environmentVariable: 'FINNHUB_API_KEY', purpose: 'Global market/fundamental redundancy',
    governanceNotes: 'Adapter pending. Particularly useful as a second fundamentals/estimates source; licensing approval required.',
  },
  {
    id: 'Massive', assetClasses: ['stock', 'forex', 'index', 'crypto'], capabilities: ['history', 'snapshot', 'quotes'], basePriority: 4,
    enabled: false, activation: 'candidate', environmentVariable: 'MASSIVE_API_KEY', purpose: 'Low-latency US/multi-asset market data and future options coverage',
    governanceNotes: 'Adapter pending. Business market-data licensing and exchange entitlements must be approved before redistribution.',
  },
  {
    id: 'FRED', assetClasses: ['macro', 'bond'], capabilities: ['macro-series'], basePriority: 1,
    enabled: true, activation: 'active', environmentVariable: 'FRED_API_KEY', requiresApiKey: true,
    purpose: 'Macroeconomic and interest-rate evidence',
    governanceNotes: 'Adapter implemented for an allow-list of macro/rate series. It remains fail-closed until FRED_API_KEY is configured and is never treated as an execution-price feed.',
  },
  {
    id: 'ECB', assetClasses: ['macro', 'forex', 'bond'], capabilities: ['macro-series'], basePriority: 1,
    enabled: true, activation: 'reference-only', purpose: 'Official EUR reference FX and euro-area reference evidence',
    governanceNotes: 'Keyless ECB Data API adapter is implemented for approved EUR reference FX series. Reference rates are informational and never execution-price eligible.',
  },
];

export function getMarketDataProviderRegistry(): MarketDataProviderRegistryEntry[] {
  return MARKET_DATA_PROVIDER_REGISTRY.map(entry => ({
    ...entry,
    assetClasses: [...entry.assetClasses],
    capabilities: [...entry.capabilities],
  }));
}
