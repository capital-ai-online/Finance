import type { CanonicalMarketDataSnapshot } from '../contracts';
import { MarketDataRingBuffer } from './MarketDataRingBuffer';
import {
  fanoutTickFromSnapshot,
  marketDataFanoutEventId,
  parseMarketDataFanoutTopic,
  type MarketDataFanoutSink,
  type MarketDataFanoutTick,
} from './contracts';
import {
  MarketDataWebSocketRoomMultiplexer,
  type MarketDataRoomMultiplexerOptions,
  type WebSocketFanoutClient,
} from './MarketDataWebSocketRoomMultiplexer';
import { UpstashRedisRestFanout } from './UpstashRedisRestFanout';

export interface MarketDataFanoutHubOptions {
  redis?: UpstashRedisRestFanout;
  ringBuffer?: MarketDataRingBuffer;
  multiplexer?: MarketDataWebSocketRoomMultiplexer;
  multiplexerOptions?: MarketDataRoomMultiplexerOptions;
  onFanoutError?: (stage: 'redis-write' | 'redis-read' | 'redis-subscribe', error: unknown) => void;
  dedupeCapacity?: number;
}

export class MarketDataFanoutHub implements MarketDataFanoutSink {
  readonly ringBuffer: MarketDataRingBuffer;
  readonly multiplexer: MarketDataWebSocketRoomMultiplexer;
  private readonly redis?: UpstashRedisRestFanout;
  private readonly onFanoutError?: MarketDataFanoutHubOptions['onFanoutError'];
  private readonly dedupeCapacity: number;
  private readonly seen = new Set<string>();

  constructor(options: MarketDataFanoutHubOptions = {}) {
    this.redis = options.redis;
    this.ringBuffer = options.ringBuffer ?? new MarketDataRingBuffer();
    this.multiplexer = options.multiplexer
      ?? new MarketDataWebSocketRoomMultiplexer(options.multiplexerOptions);
    this.onFanoutError = options.onFanoutError;
    this.dedupeCapacity = Math.max(64, Math.floor(options.dedupeCapacity ?? 4096));
  }

  publish(snapshot: CanonicalMarketDataSnapshot): void {
    const tick = fanoutTickFromSnapshot(snapshot);
    if (!tick) return;
    if (!this.acceptTick(tick)) return;

    if (this.redis) {
      void this.redis.writeAndPublish(tick).catch(error => {
        this.onFanoutError?.('redis-write', error);
      });
    }
  }

  acceptRemoteTick(tick: MarketDataFanoutTick): boolean {
    return this.acceptTick(tick);
  }

  private acceptTick(tick: MarketDataFanoutTick): boolean {
    const eventId = marketDataFanoutEventId(tick);
    if (this.seen.has(eventId)) return false;
    this.seen.add(eventId);
    if (this.seen.size > this.dedupeCapacity) {
      const oldest = this.seen.values().next().value as string | undefined;
      if (oldest) this.seen.delete(oldest);
    }

    this.ringBuffer.append(tick);
    this.multiplexer.publish(tick);
    return true;
  }

  async subscribeClient(
    client: WebSocketFanoutClient,
    topic: string,
    replayLimit = 50,
  ): Promise<number> {
    if (!parseMarketDataFanoutTopic(topic)) throw new Error('MARKET_DATA_FANOUT_INVALID_TOPIC');

    let replay = this.ringBuffer.recent(topic, replayLimit);
    if (replay.length === 0 && this.redis) {
      try {
        replay = await this.redis.loadRecent(topic, replayLimit);
        if (replay.length > 0) this.ringBuffer.replace(topic, replay);
      } catch (error) {
        this.onFanoutError?.('redis-read', error);
      }
    }
    return this.multiplexer.subscribe(client, topic, replay);
  }

  unsubscribeClient(client: WebSocketFanoutClient, topic: string): void {
    this.multiplexer.unsubscribe(client, topic);
  }

  unregisterClient(client: WebSocketFanoutClient): void {
    this.multiplexer.unregister(client);
  }

  async bridgeRedisTopic(topic: string, signal?: AbortSignal): Promise<void> {
    if (!this.redis) throw new Error('MARKET_DATA_FANOUT_REDIS_NOT_CONFIGURED');
    if (!parseMarketDataFanoutTopic(topic)) throw new Error('MARKET_DATA_FANOUT_INVALID_TOPIC');
    try {
      await this.redis.subscribe(topic, tick => {
        this.acceptRemoteTick(tick);
      }, signal);
    } catch (error) {
      this.onFanoutError?.('redis-subscribe', error);
      throw error;
    }
  }
}
