import { MarketDataDeltaCodec } from './MarketDataDeltaCodec';
import {
  MARKET_DATA_FANOUT_CONTRACT_VERSION,
  parseMarketDataFanoutTopic,
  type MarketDataFanoutTick,
} from './contracts';

export interface WebSocketFanoutClient {
  readonly readyState: number;
  readonly bufferedAmount: number;
  send(payload: string): void;
  close?(code?: number, reason?: string): void;
}

export interface MarketDataRoomMultiplexerOptions {
  maxRoomsPerClient?: number;
  maxBufferedBytes?: number;
  maxSlowSkips?: number;
}

interface ClientState {
  rooms: Map<string, number>;
  nextRoomId: number;
  codec: MarketDataDeltaCodec;
  slowSkips: number;
}

export interface MarketDataRoomPublishResult {
  delivered: number;
  backpressured: number;
  disconnected: number;
  deltaFrames: number;
  fullFrames: number;
}

const OPEN = 1;

export class MarketDataWebSocketRoomMultiplexer {
  private readonly clients = new Map<WebSocketFanoutClient, ClientState>();
  private readonly maxRoomsPerClient: number;
  private readonly maxBufferedBytes: number;
  private readonly maxSlowSkips: number;

  constructor(options: MarketDataRoomMultiplexerOptions = {}) {
    this.maxRoomsPerClient = Math.max(1, Math.floor(options.maxRoomsPerClient ?? 64));
    this.maxBufferedBytes = Math.max(1024, Math.floor(options.maxBufferedBytes ?? 256 * 1024));
    this.maxSlowSkips = Math.max(1, Math.floor(options.maxSlowSkips ?? 3));
  }

  register(client: WebSocketFanoutClient): void {
    if (!this.clients.has(client)) {
      this.clients.set(client, {
        rooms: new Map(),
        nextRoomId: 1,
        codec: new MarketDataDeltaCodec(),
        slowSkips: 0,
      });
    }
  }

  unregister(client: WebSocketFanoutClient): void {
    this.clients.delete(client);
  }

  subscribe(
    client: WebSocketFanoutClient,
    topic: string,
    replay: readonly MarketDataFanoutTick[] = [],
  ): number {
    const parsed = parseMarketDataFanoutTopic(topic);
    if (!parsed) throw new Error('MARKET_DATA_FANOUT_INVALID_TOPIC');
    this.register(client);
    const state = this.clients.get(client)!;
    const existing = state.rooms.get(topic);
    if (existing) return existing;
    if (state.rooms.size >= this.maxRoomsPerClient) {
      throw new Error('MARKET_DATA_FANOUT_ROOM_LIMIT');
    }

    const roomId = state.nextRoomId++;
    state.rooms.set(topic, roomId);
    client.send(JSON.stringify(['sub', roomId, topic, MARKET_DATA_FANOUT_CONTRACT_VERSION]));

    for (const tick of replay) {
      if (tick.topic !== topic) continue;
      if (client.readyState !== OPEN || client.bufferedAmount > this.maxBufferedBytes) break;
      client.send(state.codec.encode(roomId, tick).payload);
    }
    return roomId;
  }

  unsubscribe(client: WebSocketFanoutClient, topic: string): void {
    const state = this.clients.get(client);
    const roomId = state?.rooms.get(topic);
    if (!state || roomId === undefined) return;
    state.rooms.delete(topic);
    state.codec.reset(roomId);
    if (client.readyState === OPEN) client.send(JSON.stringify(['unsub', roomId]));
  }

  publish(tick: MarketDataFanoutTick): MarketDataRoomPublishResult {
    const result: MarketDataRoomPublishResult = {
      delivered: 0,
      backpressured: 0,
      disconnected: 0,
      deltaFrames: 0,
      fullFrames: 0,
    };

    for (const [client, state] of this.clients) {
      const roomId = state.rooms.get(tick.topic);
      if (roomId === undefined) continue;
      if (client.readyState !== OPEN) {
        this.clients.delete(client);
        result.disconnected += 1;
        continue;
      }
      if (client.bufferedAmount > this.maxBufferedBytes) {
        state.slowSkips += 1;
        result.backpressured += 1;
        if (state.slowSkips >= this.maxSlowSkips) {
          client.close?.(1013, 'market-data-backpressure');
          this.clients.delete(client);
          result.disconnected += 1;
        }
        continue;
      }

      state.slowSkips = 0;
      const encoded = state.codec.encode(roomId, tick);
      client.send(encoded.payload);
      result.delivered += 1;
      if (encoded.kind === 'delta') result.deltaFrames += 1;
      else result.fullFrames += 1;
    }
    return result;
  }

  clientCount(): number {
    return this.clients.size;
  }

  subscriberCount(topic: string): number {
    let count = 0;
    for (const state of this.clients.values()) {
      if (state.rooms.has(topic)) count += 1;
    }
    return count;
  }
}
