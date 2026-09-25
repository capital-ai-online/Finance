import { MarketDataGateway } from '../../src/platform/MarketData/MarketDataGateway';
import { MarketTickGate, type MarketTick, type MarketTickDecision } from '../../src/platform/MarketData/MarketTickGate';
import { ProviderRegistry } from '../../src/platform/MarketData/ProviderRegistry';
import { RateLimitBudget } from '../../src/platform/MarketData/RateLimitBudget';
import { getProviderMatrixEntry } from '../../src/platform/MarketData/ProviderMatrix';
import {
  MarketDataFanoutHub,
  type MarketDataFanoutHubOptions,
} from '../../src/platform/MarketData/Fanout/MarketDataFanoutHub';
import { UpstashRedisRestFanout } from '../../src/platform/MarketData/Fanout/UpstashRedisRestFanout';
import {
  MARKET_DATA_FANOUT_CONTRACT_VERSION,
  marketDataFanoutTopic,
  type MarketDataFanoutTick,
} from '../../src/platform/MarketData/Fanout/contracts';
import type { MarketDataProvider } from '../../src/platform/MarketData/contracts';

export const LIVE_MARKET_DATA_RUNTIME_VERSION = 'live-market-data-runtime/1.0.0' as const;
export const BINANCE_PUBLIC_BOOK_TICKER_FEED = 'spot/bookTicker' as const;
export const BINANCE_PUBLIC_MARKET_DATA_BASE_URL = 'wss://data-stream.binance.vision:443' as const;

const DEFAULT_TICK_BUDGET_PER_SECOND = 1_500;
const MAX_LIVE_SYMBOLS = 32;
const MAX_RECONNECT_DELAY_MS = 30_000;

export interface LiveMarketDataRuntimeOptions {
  nowMs?: () => number;
  fanoutHub?: MarketDataFanoutHub;
  fanoutOptions?: MarketDataFanoutHubOptions;
  tickBudgetPerSecond?: number;
  tickGate?: MarketTickGate;
}

export interface BinanceBookTickerIngressOptions {
  enabled: boolean;
  symbols: readonly string[];
  WebSocketCtor?: typeof WebSocket;
  nowMs?: () => number;
  baseUrl?: string;
  reconnectBaseMs?: number;
  onState?: (state: 'CONNECTING' | 'LIVE' | 'RECONNECTING' | 'STOPPED', detail?: string) => void;
  onError?: (error: unknown) => void;
}

export interface BinanceBookTickerIngress {
  readonly url: string | null;
  start(): boolean;
  stop(): void;
  state(): 'DISABLED' | 'CONNECTING' | 'LIVE' | 'RECONNECTING' | 'STOPPED';
}

function positive(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function safeInteger(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function normalizeLiveMarketSymbols(symbols: readonly string[]): string[] {
  return [...new Set(symbols.map(value => value.trim().toUpperCase()).filter(value => /^[A-Z0-9]{2,15}$/.test(value)))]
    .slice(0, MAX_LIVE_SYMBOLS);
}

export function buildBinanceBookTickerUrl(
  symbols: readonly string[],
  baseUrl: string = BINANCE_PUBLIC_MARKET_DATA_BASE_URL,
): string | null {
  const normalized = normalizeLiveMarketSymbols(symbols);
  if (normalized.length === 0) return null;
  const url = new URL('/stream', baseUrl);
  url.searchParams.set(
    'streams',
    normalized.map(symbol => `${symbol.toLowerCase()}usdt@bookTicker`).join('/'),
  );
  return url.toString();
}

function createBinanceDescriptorOnlyProvider(): MarketDataProvider {
  const entry = getProviderMatrixEntry('binance-public');
  if (!entry || !entry.enabled || !entry.capabilities.includes('quote') || !entry.assetClasses.includes('crypto')) {
    throw new Error('BINANCE_PUBLIC_PROVIDER_NOT_APPROVED_FOR_LIVE_QUOTES');
  }
  return {
    descriptor: {
      id: entry.id,
      role: entry.role,
      capabilities: [...entry.capabilities],
      assetClasses: [...entry.assetClasses],
      enabled: entry.enabled,
      priority: entry.priority,
    },
    async getSnapshot() {
      throw new Error('BINANCE_PUBLIC_STREAM_PROVIDER_HAS_NO_SNAPSHOT_AUTHORITY');
    },
  };
}

function optionalRedisFanoutFromEnv(): UpstashRedisRestFanout | undefined {
  const url = process.env.MARKET_DATA_FANOUT_UPSTASH_URL?.trim();
  const token = process.env.MARKET_DATA_FANOUT_UPSTASH_TOKEN?.trim();
  if (!url || !token) return undefined;
  return new UpstashRedisRestFanout({ url, token });
}

export function parseBinanceBookTicker(
  payloadText: string,
  allowedBaseSymbols: ReadonlySet<string>,
  receivedAt: string,
): MarketTick | null {
  let envelope: unknown;
  try {
    envelope = JSON.parse(payloadText);
  } catch {
    return null;
  }
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) return null;
  const root = envelope as Record<string, unknown>;
  const candidate = root.data && typeof root.data === 'object' && !Array.isArray(root.data)
    ? root.data as Record<string, unknown>
    : root;

  const marketSymbol = typeof candidate.s === 'string' ? candidate.s.trim().toUpperCase() : '';
  if (!marketSymbol.endsWith('USDT')) return null;
  const symbol = marketSymbol.slice(0, -4);
  if (!allowedBaseSymbols.has(symbol)) return null;

  const bid = positive(candidate.b);
  const bidQuantity = positive(candidate.B);
  const ask = positive(candidate.a);
  const askQuantity = positive(candidate.A);
  const updateId = safeInteger(candidate.u);
  if (bid === null || bidQuantity === null || ask === null || askQuantity === null || updateId === null || bid >= ask) {
    return null;
  }

  const eventMs = safeInteger(candidate.E) ?? safeInteger(candidate.T);
  const observedAt = eventMs === null ? receivedAt : new Date(eventMs).toISOString();
  if (!Number.isFinite(Date.parse(observedAt)) || !Number.isFinite(Date.parse(receivedAt))) return null;

  const evidenceId = `binance-public:bookTicker:${marketSymbol}:${updateId}`;
  return {
    providerId: 'binance-public',
    providerFeed: BINANCE_PUBLIC_BOOK_TICKER_FEED,
    assetClass: 'crypto',
    symbol,
    currency: 'USDT',
    correlationId: `binance-public:${marketSymbol}:${updateId}`,
    evidenceId,
    observedAt,
    receivedAt,
    kind: 'bbo',
    bid,
    ask,
    bidQuantity,
    askQuantity,
  };
}

function fanoutTickFromAcceptedBbo(tick: MarketTick, decision: MarketTickDecision): MarketDataFanoutTick | null {
  if (decision.status !== 'ACCEPTED' || !decision.bbo) return null;
  const observedMs = Date.parse(tick.observedAt);
  const receivedMs = Date.parse(tick.receivedAt);
  const freshnessMs = Number.isFinite(observedMs) && Number.isFinite(receivedMs)
    ? Math.max(0, receivedMs - observedMs)
    : null;
  return {
    contractVersion: MARKET_DATA_FANOUT_CONTRACT_VERSION,
    topic: marketDataFanoutTopic('crypto', tick.symbol),
    symbol: tick.symbol.toUpperCase(),
    assetClass: 'crypto',
    provider: tick.providerId,
    providerFeed: tick.providerFeed,
    sourceTimestamp: tick.observedAt,
    receivedAt: tick.receivedAt,
    freshnessMs,
    qualityState: 'LIVE',
    eventKind: 'bbo',
    correlationId: tick.correlationId,
    evidenceId: tick.evidenceId,
    price: decision.bbo.mid,
    bid: decision.bbo.bid,
    ask: decision.bbo.ask,
    vwap: null,
  };
}

export function createLiveMarketDataRuntime(options: LiveMarketDataRuntimeOptions = {}) {
  const nowMs = options.nowMs ?? Date.now;
  const registry = new ProviderRegistry();
  registry.register(createBinanceDescriptorOnlyProvider());
  const tickBudgetPerSecond = Math.max(
    1,
    Math.min(10_000, Math.floor(options.tickBudgetPerSecond ?? DEFAULT_TICK_BUDGET_PER_SECOND)),
  );
  const gateway = new MarketDataGateway(registry, {
    nowMs,
    tickIngressBudget: new RateLimitBudget({
      capacity: tickBudgetPerSecond,
      windowMs: 1_000,
      nowMs,
    }),
    tickGate: options.tickGate,
  });
  const redis = options.fanoutOptions?.redis ?? optionalRedisFanoutFromEnv();
  const fanoutHub = options.fanoutHub ?? new MarketDataFanoutHub({
    ...options.fanoutOptions,
    redis,
  });

  const ingestBinanceBookTicker = (payloadText: string, allowedSymbols: ReadonlySet<string>): MarketTickDecision | null => {
    const receivedAt = new Date(nowMs()).toISOString();
    const tick = parseBinanceBookTicker(payloadText, allowedSymbols, receivedAt);
    if (!tick) return null;
    const decision = gateway.ingestTick(tick);
    const fanoutTick = fanoutTickFromAcceptedBbo(tick, decision);
    if (fanoutTick) fanoutHub.publishTick(fanoutTick);
    return decision;
  };

  return {
    version: LIVE_MARKET_DATA_RUNTIME_VERSION,
    gateway,
    fanoutHub,
    ingestBinanceBookTicker,
  };
}

function messageDataToText(data: unknown): Promise<string | null> | string | null {
  if (typeof data === 'string') return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8');
  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8');
  }
  if (typeof Blob !== 'undefined' && data instanceof Blob) return data.text();
  return null;
}

export function createBinanceBookTickerIngress(
  runtime: ReturnType<typeof createLiveMarketDataRuntime>,
  options: BinanceBookTickerIngressOptions,
): BinanceBookTickerIngress {
  const symbols = normalizeLiveMarketSymbols(options.symbols);
  const allowedSymbols = new Set(symbols);
  const url = buildBinanceBookTickerUrl(symbols, options.baseUrl);
  const WebSocketCtor = options.WebSocketCtor ?? globalThis.WebSocket;
  const reconnectBaseMs = Math.max(250, Math.floor(options.reconnectBaseMs ?? 1_000));
  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let reconnectAttempt = 0;
  let currentState: ReturnType<BinanceBookTickerIngress['state']> =
    options.enabled && url ? 'CONNECTING' : 'DISABLED';

  const setState = (state: 'CONNECTING' | 'LIVE' | 'RECONNECTING' | 'STOPPED', detail?: string) => {
    currentState = state;
    options.onState?.(state, detail);
  };

  const clearReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (stopped || !options.enabled || !url) return;
    clearReconnect();
    reconnectAttempt += 1;
    const delay = Math.min(MAX_RECONNECT_DELAY_MS, reconnectBaseMs * 2 ** Math.min(reconnectAttempt - 1, 5));
    setState('RECONNECTING', `retry-in-${delay}ms`);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
    reconnectTimer.unref?.();
  };

  const connect = () => {
    if (stopped || !options.enabled || !url) return;
    setState(reconnectAttempt > 0 ? 'RECONNECTING' : 'CONNECTING');
    try {
      socket = new WebSocketCtor(url);
    } catch (error) {
      options.onError?.(error);
      scheduleReconnect();
      return;
    }

    socket.addEventListener('open', () => {
      reconnectAttempt = 0;
      setState('LIVE');
    });
    socket.addEventListener('message', event => {
      const text = messageDataToText(event.data);
      if (typeof text === 'string') {
        runtime.ingestBinanceBookTicker(text, allowedSymbols);
        return;
      }
      if (text) {
        void text.then(value => {
          if (value !== null) runtime.ingestBinanceBookTicker(value, allowedSymbols);
        }).catch(options.onError);
      }
    });
    socket.addEventListener('error', event => {
      options.onError?.(event);
    });
    socket.addEventListener('close', event => {
      socket = null;
      if (!stopped) scheduleReconnect();
      else setState('STOPPED', `close-${event.code}`);
    });
  };

  return {
    url,
    start() {
      if (!options.enabled || !url || stopped || typeof WebSocketCtor !== 'function') return false;
      if (socket && socket.readyState < 2) return true;
      connect();
      return true;
    },
    stop() {
      stopped = true;
      clearReconnect();
      const current = socket;
      socket = null;
      if (current && current.readyState < 2) current.close(1000, 'capital-ai-shutdown');
      setState('STOPPED');
    },
    state() {
      return currentState;
    },
  };
}

export function createBinanceBookTickerIngressFromEnv(
  runtime: ReturnType<typeof createLiveMarketDataRuntime>,
  onState?: BinanceBookTickerIngressOptions['onState'],
  onError?: BinanceBookTickerIngressOptions['onError'],
): BinanceBookTickerIngress {
  const enabled = process.env.MARKET_DATA_LIVE_INGRESS_ENABLED?.trim().toLowerCase() === 'true';
  const symbols = (process.env.MARKET_DATA_LIVE_SYMBOLS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  return createBinanceBookTickerIngress(runtime, {
    enabled,
    symbols,
    onState,
    onError,
  });
}
