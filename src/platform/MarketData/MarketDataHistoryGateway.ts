import { HistoryProviderRegistry } from './HistoryProviderRegistry';
import {
  MARKET_DATA_HISTORY_CONTRACT_VERSION,
  type CanonicalMarketDataHistory,
  type HistoryRequest,
} from './contracts';

export interface MarketDataHistoryGatewayResult {
  history: CanonicalMarketDataHistory;
  attemptedProviders: string[];
}

function unavailable(request: HistoryRequest, attemptedProviders: string[], reason: string, nowMs: number): MarketDataHistoryGatewayResult {
  return {
    attemptedProviders,
    history: {
      contractVersion: MARKET_DATA_HISTORY_CONTRACT_VERSION,
      provider: attemptedProviders.at(-1) ?? 'none',
      providerFeed: null,
      symbol: request.symbol.toUpperCase().trim(),
      assetClass: request.assetClass,
      currency: null,
      receivedAt: new Date(nowMs).toISOString(),
      qualityState: 'UNAVAILABLE',
      correlationId: request.correlationId,
      points: [],
      evidenceId: null,
      reason,
    },
  };
}

export class MarketDataHistoryGateway {
  constructor(
    private readonly registry: HistoryProviderRegistry,
    private readonly nowMs: () => number = Date.now,
  ) {}

  async getHistory(request: HistoryRequest): Promise<MarketDataHistoryGatewayResult> {
    if (!request.symbol.trim() || !request.correlationId.trim()) {
      return unavailable(request, [], 'symbol and correlationId are required', this.nowMs());
    }
    if (request.maxPoints !== undefined && (!Number.isInteger(request.maxPoints) || request.maxPoints <= 0)) {
      return unavailable(request, [], 'maxPoints must be a positive integer', this.nowMs());
    }

    const attemptedProviders: string[] = [];
    for (const provider of this.registry.candidates(request)) {
      attemptedProviders.push(provider.descriptor.id);
      try {
        const history = await provider.getHistory(request);
        const points = history.points.filter(point =>
          Number.isFinite(point.close) && point.close > 0 && Number.isFinite(Date.parse(point.timestamp)),
        );
        if (history.qualityState !== 'HISTORICAL' || points.length === 0 || points.length !== history.points.length) continue;
        return {
          attemptedProviders,
          history: {
            ...history,
            symbol: request.symbol.toUpperCase().trim(),
            correlationId: request.correlationId,
            points: request.maxPoints ? points.slice(-request.maxPoints) : points,
          },
        };
      } catch {
        // Fail over without exposing provider payloads or exception details.
      }
    }
    return unavailable(request, attemptedProviders, 'All approved history providers were unavailable or returned invalid data.', this.nowMs());
  }
}
