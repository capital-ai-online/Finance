import {
  MARKET_DATA_CONTRACT_VERSION,
  type CanonicalMarketDataSnapshot,
  type MarketDataProvider,
  type MarketDataProviderDescriptor,
  type SnapshotRequest,
} from '../contracts';

// Explicit venue mappings: symbol concatenation must never guess whether a Spot pair exists.
export const BINANCE_SPOT_USDT_MARKETS: Readonly<Record<string, string>> = Object.freeze({
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  SOL: 'SOLUSDT',
  ADA: 'ADAUSDT',
  XRP: 'XRPUSDT',
  DOT: 'DOTUSDT',
  AVAX: 'AVAXUSDT',
  LINK: 'LINKUSDT',
  BNB: 'BNBUSDT',
  DOGE: 'DOGEUSDT',
  SHIB: 'SHIBUSDT',
});

interface Trade {
  price: number;
  observedMs: number;
  tradeId: number;
}

interface StreamState {
  socket: WebSocket;
  trade: Trade | null;
  waiters: Set<() => void>;
}

export interface BinanceSpotWebSocketProviderOptions {
  webSocketFactory?: (url: string) => WebSocket;
  nowMs?: () => number;
  firstTickTimeoutMs?: number;
  maxTickAgeMs?: number;
}

/** On-demand, keyless Spot trade observations. No trading or account channel is used. */
export class BinanceSpotWebSocketProvider implements MarketDataProvider {
  readonly descriptor: MarketDataProviderDescriptor = {
    id: 'binance-spot-stream',
    role: 'primary',
    capabilities: ['snapshot', 'quote'],
    assetClasses: ['crypto'],
    enabled: true,
    priority: 20,
  };

  private readonly streams = new Map<string, StreamState>();
  private readonly nowMs: () => number;

  constructor(private readonly options: BinanceSpotWebSocketProviderOptions = {}) {
    this.nowMs = options.nowMs ?? Date.now;
  }

  async getSnapshot(request: SnapshotRequest): Promise<CanonicalMarketDataSnapshot> {
    const symbol = request.symbol.toUpperCase().trim();
    const market = BINANCE_SPOT_USDT_MARKETS[symbol];
    if (request.assetClass !== 'crypto' || !market) {
      return this.unavailable(request, 'No approved Binance Spot USDT market mapping for this asset.');
    }

    let state = this.streams.get(market);
    if (!state) {
      try {
        const factory = this.options.webSocketFactory ?? ((url: string) => new WebSocket(url));
        const socket = factory(`wss://data-stream.binance.vision/ws/${market.toLowerCase()}@trade`);
        state = { socket, trade: null, waiters: new Set() };
        this.streams.set(market, state);
        const current = state;
        socket.addEventListener('message', (event) => {
          try {
            const row: unknown = JSON.parse(String(event.data));
            if (!row || typeof row !== 'object') return;
            const tick = row as Record<string, unknown>;
            const observedMs = tick.T;
            const tradeId = tick.t;
            const price = Number(tick.p);
            if (tick.e !== 'trade' || tick.s !== market
              || typeof observedMs !== 'number' || !Number.isSafeInteger(observedMs)
              || observedMs > this.nowMs() + 5_000
              || typeof tradeId !== 'number' || !Number.isSafeInteger(tradeId)
              || !Number.isFinite(price) || price <= 0
              || (current.trade && observedMs <= current.trade.observedMs)) return;
            current.trade = { price, observedMs, tradeId };
            for (const wake of current.waiters) wake();
          } catch {
            // Malformed upstream frames cannot become price evidence.
          }
        });
        const disconnect = () => {
          if (this.streams.get(market) !== current) return;
          this.streams.delete(market);
          current.trade = null;
          for (const wake of current.waiters) wake();
        };
        socket.addEventListener('close', disconnect);
        socket.addEventListener('error', disconnect);
      } catch {
        return this.unavailable(request, 'Binance Spot stream connection failed.');
      }
    }

    const active = state;
    if (!active.trade) {
      await new Promise<void>((resolve) => {
        let timeout: ReturnType<typeof setTimeout>;
        const wake = () => {
          clearTimeout(timeout);
          active.waiters.delete(wake);
          resolve();
        };
        active.waiters.add(wake);
        timeout = setTimeout(wake, this.options.firstTickTimeoutMs ?? 1_500);
      });
    }

    const trade = active.trade;
    const ageMs = trade ? this.nowMs() - trade.observedMs : Number.POSITIVE_INFINITY;
    if (!trade || ageMs < -5_000 || ageMs > (this.options.maxTickAgeMs ?? 90_000)
      || this.streams.get(market) !== active) {
      return this.unavailable(request, 'Binance Spot stream has no fresh attested trade.');
    }
    const receivedAt = new Date(this.nowMs()).toISOString();
    const observedAt = new Date(trade.observedMs).toISOString();
    return {
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: 'Binance',
      providerFeed: `spot/${market.toLowerCase()}@trade`,
      symbol,
      assetClass: 'crypto',
      currency: 'USDT',
      sourceTimestamp: observedAt,
      ingestedAt: receivedAt,
      receivedAt,
      freshnessMs: Math.max(0, ageMs),
      qualityState: 'LIVE',
      isRealtime: true,
      isDelayed: false,
      correlationId: request.correlationId,
      price: trade.price,
      evidenceId: `trade:binance:${market}:${trade.tradeId}:${observedAt}`,
    };
  }

  /** Stop all streams when their owning runtime is shut down. */
  close(): void {
    for (const state of this.streams.values()) {
      state.trade = null;
      for (const wake of state.waiters) wake();
      state.socket.close();
    }
    this.streams.clear();
  }

  private unavailable(request: SnapshotRequest, reason: string): CanonicalMarketDataSnapshot {
    const receivedAt = new Date(this.nowMs()).toISOString();
    return {
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: 'Binance',
      providerFeed: 'spot/trade',
      symbol: request.symbol.toUpperCase().trim(),
      assetClass: request.assetClass,
      currency: 'USDT',
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
