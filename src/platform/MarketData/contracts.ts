export const MARKET_DATA_CONTRACT_VERSION = 'market-data/1.0.0' as const;

export type MarketDataAssetClass = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond' | 'macro';
export type ProviderCapability = 'snapshot' | 'quote' | 'trade' | 'history' | 'bars' | 'fundamentals';
export type ProviderRole = 'primary' | 'secondary' | 'shadow';
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
