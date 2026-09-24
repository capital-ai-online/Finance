import type {
  CanonicalMarketDataSnapshot,
  MarketDataAssetClass,
  MarketDataQualityState,
} from '../contracts';

export const MARKET_DATA_FANOUT_CONTRACT_VERSION = 'market-data-fanout/1.0.0' as const;
export const MARKET_DATA_FANOUT_RING_SIZE = 200 as const;

export type MarketDataFanoutQualityState = Extract<
  MarketDataQualityState,
  'LIVE' | 'DELAYED' | 'STALE'
>;

export interface MarketDataFanoutTick {
  contractVersion: typeof MARKET_DATA_FANOUT_CONTRACT_VERSION;
  topic: string;
  symbol: string;
  assetClass: MarketDataAssetClass;
  provider: string;
  providerFeed: string | null;
  sourceTimestamp: string;
  receivedAt: string;
  freshnessMs: number | null;
  qualityState: MarketDataFanoutQualityState;
  eventKind: 'snapshot' | 'trade' | 'bbo';
  correlationId: string;
  evidenceId: string;
  price: number;
  bid: number | null;
  ask: number | null;
  vwap: number | null;
}

export interface MarketDataFanoutSink {
  publish(snapshot: CanonicalMarketDataSnapshot): void | Promise<void>;
}

const FANOUT_QUALITY = new Set<MarketDataFanoutQualityState>(['LIVE', 'DELAYED', 'STALE']);
const SYMBOL = /^[A-Z0-9][A-Z0-9._:-]{0,31}$/;
const TOPIC = /^asset:(crypto|stock|forex|commodity|index|bond|macro):([A-Z0-9][A-Z0-9._:-]{0,31})$/;

export function marketDataFanoutTopic(assetClass: MarketDataAssetClass, symbolInput: string): string {
  const symbol = symbolInput.toUpperCase().trim();
  if (!SYMBOL.test(symbol)) throw new Error('MARKET_DATA_FANOUT_INVALID_SYMBOL');
  return 'asset:' + assetClass + ':' + symbol;
}

export function parseMarketDataFanoutTopic(topic: string): {
  assetClass: MarketDataAssetClass;
  symbol: string;
} | null {
  const match = TOPIC.exec(topic);
  if (!match) return null;
  return {
    assetClass: match[1] as MarketDataAssetClass,
    symbol: match[2],
  };
}

export function fanoutTickFromSnapshot(
  snapshot: CanonicalMarketDataSnapshot,
): MarketDataFanoutTick | null {
  if (
    snapshot.price === null
    || !Number.isFinite(snapshot.price)
    || !FANOUT_QUALITY.has(snapshot.qualityState as MarketDataFanoutQualityState)
    || !snapshot.sourceTimestamp
    || !snapshot.evidenceId
    || !snapshot.correlationId.trim()
    || !snapshot.provider.trim()
  ) {
    return null;
  }

  return {
    contractVersion: MARKET_DATA_FANOUT_CONTRACT_VERSION,
    topic: marketDataFanoutTopic(snapshot.assetClass, snapshot.symbol),
    symbol: snapshot.symbol.toUpperCase().trim(),
    assetClass: snapshot.assetClass,
    provider: snapshot.provider,
    providerFeed: snapshot.providerFeed,
    sourceTimestamp: snapshot.sourceTimestamp,
    receivedAt: snapshot.receivedAt,
    freshnessMs: snapshot.freshnessMs,
    qualityState: snapshot.qualityState as MarketDataFanoutQualityState,
    eventKind: 'snapshot',
    correlationId: snapshot.correlationId,
    evidenceId: snapshot.evidenceId,
    price: snapshot.price,
    bid: snapshot.bid ?? null,
    ask: snapshot.ask ?? null,
    vwap: null,
  };
}

export function isMarketDataFanoutTick(value: unknown): value is MarketDataFanoutTick {
  if (!value || typeof value !== 'object') return false;
  const tick = value as Record<string, unknown>;
  const topic = typeof tick.topic === 'string' ? parseMarketDataFanoutTopic(tick.topic) : null;
  if (!topic) return false;
  return tick.contractVersion === MARKET_DATA_FANOUT_CONTRACT_VERSION
    && tick.symbol === topic.symbol
    && tick.assetClass === topic.assetClass
    && typeof tick.provider === 'string'
    && tick.provider.length > 0
    && (typeof tick.providerFeed === 'string' || tick.providerFeed === null)
    && typeof tick.sourceTimestamp === 'string'
    && Number.isFinite(Date.parse(tick.sourceTimestamp))
    && typeof tick.receivedAt === 'string'
    && Number.isFinite(Date.parse(tick.receivedAt))
    && (typeof tick.freshnessMs === 'number' || tick.freshnessMs === null)
    && FANOUT_QUALITY.has(tick.qualityState as MarketDataFanoutQualityState)
    && (tick.eventKind === 'snapshot' || tick.eventKind === 'trade' || tick.eventKind === 'bbo')
    && typeof tick.correlationId === 'string'
    && tick.correlationId.length > 0
    && typeof tick.evidenceId === 'string'
    && tick.evidenceId.length > 0
    && typeof tick.price === 'number'
    && Number.isFinite(tick.price)
    && (typeof tick.bid === 'number' || tick.bid === null)
    && (typeof tick.ask === 'number' || tick.ask === null)
    && (typeof tick.vwap === 'number' || tick.vwap === null);
}

export function marketDataFanoutEventId(tick: MarketDataFanoutTick): string {
  return [
    tick.topic,
    tick.evidenceId,
    tick.correlationId,
    tick.sourceTimestamp,
    String(tick.price),
    String(tick.bid),
    String(tick.ask),
  ].join('|');
}
