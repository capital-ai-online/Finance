import {
  observeAlpacaStockQuote,
  type AlpacaShadowOptions,
  type AlpacaShadowState,
} from '../../../services/alpacaShadowProvider';
import {
  MARKET_DATA_CONTRACT_VERSION,
  type CanonicalMarketDataSnapshot,
  type MarketDataProvider,
  type MarketDataProviderDescriptor,
  type MarketDataQualityState,
  type SnapshotRequest,
} from '../contracts';

function qualityState(state: AlpacaShadowState): MarketDataQualityState {
  switch (state) {
    case 'READY': return 'LIVE';
    case 'STALE': return 'STALE';
    case 'DEGRADED': return 'DEGRADED';
    case 'NOT_CONFIGURED':
    case 'UNAVAILABLE':
      return 'UNAVAILABLE';
  }
}

export class AlpacaMarketDataProvider implements MarketDataProvider {
  readonly descriptor: MarketDataProviderDescriptor = {
    id: 'alpaca',
    role: 'shadow',
    capabilities: ['snapshot', 'trade'],
    assetClasses: ['stock'],
    enabled: true,
    priority: 100,
  };

  constructor(private readonly options: AlpacaShadowOptions = {}) {}

  async getSnapshot(request: SnapshotRequest): Promise<CanonicalMarketDataSnapshot> {
    const observation = await observeAlpacaStockQuote(request.symbol, undefined, {
      ...this.options,
      maxAgeMs: request.maxAgeMs ?? this.options.maxAgeMs,
    });
    const state = qualityState(observation.state);
    return {
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: 'Alpaca',
      providerFeed: observation.feed,
      symbol: observation.symbol,
      assetClass: 'stock',
      currency: 'USD',
      sourceTimestamp: observation.observedAt,
      ingestedAt: observation.retrievedAt,
      receivedAt: observation.retrievedAt,
      freshnessMs: observation.ageMs,
      qualityState: state,
      isRealtime: state === 'LIVE',
      isDelayed: state === 'STALE',
      correlationId: request.correlationId,
      price: observation.price,
      evidenceId: observation.evidenceId,
      reason: observation.reason,
    };
  }
}
