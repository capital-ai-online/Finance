import {
  MARKET_DATA_HISTORY_CONTRACT_VERSION,
  type CanonicalMarketDataHistory,
  type HistoryRequest,
  type MarketDataHistoryProvider,
  type MarketDataProviderDescriptor,
} from '../contracts';

export interface FmpIndexHistoryObservation {
  points: Array<{ date: string; close: number }>;
}

export type FmpIndexHistoryLoader = (symbol: string) => Promise<FmpIndexHistoryObservation | null>;

export class FmpIndexHistoryProvider implements MarketDataHistoryProvider {
  readonly descriptor: MarketDataProviderDescriptor = {
    id: 'fmp-index-history',
    role: 'primary',
    capabilities: ['history'],
    assetClasses: ['index'],
    enabled: true,
    priority: 20,
  };

  constructor(
    private readonly loadHistory: FmpIndexHistoryLoader,
    private readonly nowMs: () => number = Date.now,
  ) {}

  async getHistory(request: HistoryRequest): Promise<CanonicalMarketDataHistory> {
    const receivedAt = new Date(this.nowMs()).toISOString();
    const symbol = request.symbol.toUpperCase().trim();
    try {
      const observation = await this.loadHistory(symbol);
      const points = (observation?.points ?? [])
        .filter(point => typeof point.date === 'string' && Number.isFinite(point.close) && point.close > 0)
        .map(point => ({ timestamp: point.date, close: point.close }))
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      if (points.length === 0) return this.unavailable(request, receivedAt, 'No usable FMP index history is available.');
      return {
        contractVersion: MARKET_DATA_HISTORY_CONTRACT_VERSION,
        provider: 'FMP',
        providerFeed: 'stable/historical-price-eod/light',
        symbol,
        assetClass: 'index',
        currency: null,
        receivedAt,
        qualityState: 'HISTORICAL',
        correlationId: request.correlationId,
        points,
        evidenceId: `history:fmp:${symbol}:${points[0].timestamp}:${points.at(-1)?.timestamp}`,
      };
    } catch {
      return this.unavailable(request, receivedAt, 'FMP index history loader failed.');
    }
  }

  private unavailable(request: HistoryRequest, receivedAt: string, reason: string): CanonicalMarketDataHistory {
    return {
      contractVersion: MARKET_DATA_HISTORY_CONTRACT_VERSION,
      provider: 'FMP',
      providerFeed: 'stable/historical-price-eod/light',
      symbol: request.symbol.toUpperCase().trim(),
      assetClass: 'index',
      currency: null,
      receivedAt,
      qualityState: 'UNAVAILABLE',
      correlationId: request.correlationId,
      points: [],
      evidenceId: null,
      reason,
    };
  }
}
