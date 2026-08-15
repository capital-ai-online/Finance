import {
  MARKET_DATA_CONTRACT_VERSION,
  type CanonicalMarketDataSnapshot,
  type MarketDataProvider,
  type MarketDataProviderDescriptor,
  type SnapshotRequest,
} from '../contracts';

export interface FmpIndexQuoteObservation {
  price: number;
  fetchedAt: number;
}

export type FmpIndexQuoteLoader = (symbol: string) => Promise<FmpIndexQuoteObservation | null>;

export class FmpIndexMarketDataProvider implements MarketDataProvider {
  readonly descriptor: MarketDataProviderDescriptor = {
    id: 'fmp-index',
    role: 'primary',
    capabilities: ['snapshot', 'quote'],
    assetClasses: ['index'],
    enabled: true,
    priority: 20,
  };

  constructor(
    private readonly loadQuote: FmpIndexQuoteLoader,
    private readonly nowMs: () => number = Date.now,
  ) {}

  async getSnapshot(request: SnapshotRequest): Promise<CanonicalMarketDataSnapshot> {
    const receivedAt = new Date(this.nowMs()).toISOString();
    try {
      const quote = await this.loadQuote(request.symbol.toUpperCase().trim());
      if (!quote || !Number.isFinite(quote.price) || quote.price <= 0 || !Number.isFinite(quote.fetchedAt)) {
        return this.unavailable(request, receivedAt, 'No usable FMP index quote is available.');
      }
      const sourceTimestamp = new Date(quote.fetchedAt).toISOString();
      return {
        contractVersion: MARKET_DATA_CONTRACT_VERSION,
        provider: 'FMP',
        providerFeed: 'stable/quote',
        symbol: request.symbol.toUpperCase().trim(),
        assetClass: 'index',
        currency: null,
        sourceTimestamp,
        ingestedAt: receivedAt,
        receivedAt,
        freshnessMs: Math.max(0, this.nowMs() - quote.fetchedAt),
        qualityState: 'DELAYED',
        isRealtime: false,
        isDelayed: true,
        correlationId: request.correlationId,
        price: quote.price,
        evidenceId: `quote:fmp:${request.symbol.toUpperCase().trim()}:${sourceTimestamp}`,
      };
    } catch {
      return this.unavailable(request, receivedAt, 'FMP index quote loader failed.');
    }
  }

  private unavailable(request: SnapshotRequest, receivedAt: string, reason: string): CanonicalMarketDataSnapshot {
    return {
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: 'FMP',
      providerFeed: 'stable/quote',
      symbol: request.symbol.toUpperCase().trim(),
      assetClass: 'index',
      currency: null,
      sourceTimestamp: null,
      ingestedAt: receivedAt,
      receivedAt,
      freshnessMs: null,
      qualityState: 'UNAVAILABLE',
      isRealtime: false,
      isDelayed: false,
      correlationId: request.correlationId,
      price: null,
      evidenceId: null,
      reason,
    };
  }
}
