import {
  MARKET_DATA_HISTORY_CONTRACT_VERSION,
  type CanonicalMarketDataHistory,
  type HistoryRequest,
  type MarketDataBarInterval,
  type MarketDataHistoryProvider,
  type MarketDataProviderDescriptor,
} from '../contracts';

const BINANCE_INTERVAL: Partial<Record<MarketDataBarInterval, string>> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
};

export interface BinanceCryptoBarsProviderOptions {
  fetchImpl?: typeof fetch;
  nowMs?: () => number;
  timeoutMs?: number;
}

/**
 * Canonical public Binance Spot kline adapter.
 *
 * It returns market-history evidence only. It does not calculate indicators or scores and cannot
 * bypass the ScoringDispatcher. The adapter is intentionally provider-specific while the consumer
 * remains bound to the generic MarketDataHistoryGateway contract.
 */
export class BinanceCryptoBarsProvider implements MarketDataHistoryProvider {
  readonly descriptor: MarketDataProviderDescriptor = {
    id: 'binance-spot-bars',
    role: 'primary',
    capabilities: ['history', 'bars'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 10,
  };

  private readonly fetchImpl: typeof fetch;
  private readonly nowMs: () => number;
  private readonly timeoutMs: number;

  constructor(options: BinanceCryptoBarsProviderOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.nowMs = options.nowMs ?? Date.now;
    this.timeoutMs = Math.max(500, options.timeoutMs ?? 5_000);
  }

  async getHistory(request: HistoryRequest): Promise<CanonicalMarketDataHistory> {
    const receivedAt = new Date(this.nowMs()).toISOString();
    const symbol = request.symbol.toUpperCase().trim();
    const barInterval = request.barInterval ?? '1d';
    const providerInterval = BINANCE_INTERVAL[barInterval];

    if (request.assetClass !== 'crypto') {
      return this.unavailable(request, receivedAt, barInterval, 'Binance Spot bars are available only for crypto assets.');
    }
    if (!/^[A-Z0-9]{2,15}$/.test(symbol)) {
      return this.unavailable(request, receivedAt, barInterval, 'Crypto symbol is invalid.');
    }
    if (!providerInterval) {
      return this.unavailable(request, receivedAt, barInterval, `Unsupported Binance bar interval: ${barInterval}.`);
    }

    const maxPoints = Math.min(Math.max(request.maxPoints ?? 90, 2), 500);
    const market = `${symbol}USDT`;
    const query = new URLSearchParams({
      symbol: market,
      interval: providerInterval,
      limit: String(maxPoints),
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`https://api.binance.com/api/v3/klines?${query.toString()}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': 'CAPITAL-AI/market-data-history' },
      });
      if (!response.ok) {
        return this.unavailable(request, receivedAt, barInterval, `Binance Spot bars unavailable (HTTP ${response.status}).`);
      }

      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) {
        return this.unavailable(request, receivedAt, barInterval, 'Binance returned no kline array.');
      }

      const points = payload
        .flatMap((row): Array<{ timestamp: string; close: number }> => {
          if (!Array.isArray(row)) return [];
          const openTime = Number(row[0]);
          const close = Number(row[4]);
          if (!Number.isFinite(openTime) || !Number.isFinite(close) || close <= 0) return [];
          const timestamp = new Date(openTime).toISOString();
          return Number.isFinite(Date.parse(timestamp)) ? [{ timestamp, close }] : [];
        })
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      if (points.length < 2) {
        return this.unavailable(request, receivedAt, barInterval, 'Binance returned insufficient valid bars.');
      }

      const first = points[0].timestamp;
      const last = points.at(-1)?.timestamp ?? first;
      return {
        contractVersion: MARKET_DATA_HISTORY_CONTRACT_VERSION,
        provider: 'Binance',
        providerFeed: `spot/klines/${providerInterval}`,
        symbol,
        assetClass: 'crypto',
        currency: 'USDT',
        receivedAt,
        qualityState: 'HISTORICAL',
        correlationId: request.correlationId,
        points,
        evidenceId: `history:binance:${market}:${providerInterval}:${first}:${last}`,
        barInterval,
      };
    } catch {
      return this.unavailable(request, receivedAt, barInterval, 'Binance Spot bar request failed.');
    } finally {
      clearTimeout(timeout);
    }
  }

  private unavailable(
    request: HistoryRequest,
    receivedAt: string,
    barInterval: MarketDataBarInterval,
    reason: string,
  ): CanonicalMarketDataHistory {
    return {
      contractVersion: MARKET_DATA_HISTORY_CONTRACT_VERSION,
      provider: 'Binance',
      providerFeed: `spot/klines/${BINANCE_INTERVAL[barInterval] ?? 'unsupported'}`,
      symbol: request.symbol.toUpperCase().trim(),
      assetClass: 'crypto',
      currency: 'USDT',
      receivedAt,
      qualityState: 'UNAVAILABLE',
      correlationId: request.correlationId,
      points: [],
      evidenceId: null,
      barInterval,
      reason,
    };
  }
}
