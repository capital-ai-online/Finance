export const MARKET_DATA_CONTRACT_VERSION = 'market-data/1.0.0' as const;
export const MARKET_DATA_HISTORY_CONTRACT_VERSION = 'market-data-history/1.1.0' as const;

export type MarketDataAssetClass = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond' | 'macro';
export type ProviderCapability = 'snapshot' | 'quote' | 'trade' | 'history' | 'bars' | 'fundamentals';
export type ProviderRole = 'primary' | 'secondary' | 'shadow';
export type MarketDataBarInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
export type MarketDataQualityState =
  | 'LIVE'
  | 'DELAYED'
  | 'HISTORICAL'
  | 'STALE'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'INVALID';

export interface SnapshotRequest {
  symbol: string;
  assetClass: MarketDataAssetClass;
  correlationId: string;
  maxAgeMs?: number;
  allowStale?: boolean;
  includeShadow?: boolean;
  allowedProviderIds?: string[];
}

export interface HistoryRequest {
  symbol: string;
  assetClass: MarketDataAssetClass;
  correlationId: string;
  from?: string;
  to?: string;
  maxPoints?: number;
  /**
   * Optional canonical bar resolution. Providers that support only EOD history may ignore an
   * absent value but must fail closed when an explicitly requested interval is unsupported.
   */
  barInterval?: MarketDataBarInterval;
  includeShadow?: boolean;
  allowedProviderIds?: string[];
}

export interface CanonicalMarketDataSnapshot {
  contractVersion: typeof MARKET_DATA_CONTRACT_VERSION;
  provider: string;
  providerFeed: string | null;
  symbol: string;
  assetClass: MarketDataAssetClass;
  currency: string | null;
  sourceTimestamp: string | null;
  ingestedAt: string;
  receivedAt: string;
  freshnessMs: number | null;
  qualityState: MarketDataQualityState;
  isRealtime: boolean;
  isDelayed: boolean;
  correlationId: string;
  price: number | null;
  bid?: number | null;
  ask?: number | null;
  evidenceId: string | null;
  reason?: string;
  /**
   * SC-5 Phase C — optional extended market fields.
   * Present when the provider supplies them (e.g. CoinGecko coins/{id}).
   * Price-only providers omit these keys. Never synthetic.
   */
  marketCapUsd?: number | null;
  volume24hUsd?: number | null;
  circulatingSupply?: number | null;
  maxSupply?: number | null;
  totalSupply?: number | null;
}

export interface CanonicalMarketDataHistoryPoint {
  timestamp: string;
  close: number;
}

export interface CanonicalMarketDataHistory {
  contractVersion: typeof MARKET_DATA_HISTORY_CONTRACT_VERSION;
  provider: string;
  providerFeed: string | null;
  symbol: string;
  assetClass: MarketDataAssetClass;
  currency: string | null;
  receivedAt: string;
  qualityState: Extract<MarketDataQualityState, 'HISTORICAL' | 'UNAVAILABLE' | 'INVALID'>;
  correlationId: string;
  points: CanonicalMarketDataHistoryPoint[];
  evidenceId: string | null;
  /** Resolution of the returned bars when the provider can attest it. */
  barInterval?: MarketDataBarInterval;
  reason?: string;
}

export interface MarketDataProviderDescriptor {
  id: string;
  role: ProviderRole;
  capabilities: ProviderCapability[];
  assetClasses: MarketDataAssetClass[];
  enabled: boolean;
  priority: number;
}

export interface MarketDataProvider {
  readonly descriptor: MarketDataProviderDescriptor;
  getSnapshot(request: SnapshotRequest): Promise<CanonicalMarketDataSnapshot>;
}

export interface MarketDataHistoryProvider {
  readonly descriptor: MarketDataProviderDescriptor;
  getHistory(request: HistoryRequest): Promise<CanonicalMarketDataHistory>;
}
