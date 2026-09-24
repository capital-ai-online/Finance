import { describe, expect, it, vi } from 'vitest';
import {
  MARKET_DATA_CONTRACT_VERSION,
  type CanonicalMarketDataSnapshot,
  type MarketDataProvider,
  type SnapshotRequest,
} from '../../src/platform/MarketData/contracts';
import { MarketDataGateway } from '../../src/platform/MarketData/MarketDataGateway';
import { ProviderRegistry } from '../../src/platform/MarketData/ProviderRegistry';
import {
  MARKET_DATA_FANOUT_CONTRACT_VERSION,
  type MarketDataFanoutTick,
} from '../../src/platform/MarketData/Fanout/contracts';
import { MarketDataRingBuffer } from '../../src/platform/MarketData/Fanout/MarketDataRingBuffer';
import {
  MarketDataDeltaCodec,
  decodeMarketDataFrame,
  type MarketDataWireFrame,
} from '../../src/platform/MarketData/Fanout/MarketDataDeltaCodec';
import {
  MarketDataWebSocketRoomMultiplexer,
  type WebSocketFanoutClient,
} from '../../src/platform/MarketData/Fanout/MarketDataWebSocketRoomMultiplexer';
import { UpstashRedisRestFanout } from '../../src/platform/MarketData/Fanout/UpstashRedisRestFanout';
import { MarketDataFanoutHub } from '../../src/platform/MarketData/Fanout/MarketDataFanoutHub';

const NOW = '2026-09-25T00:32:00.123Z';

function tick(index = 0): MarketDataFanoutTick {
  return {
    contractVersion: MARKET_DATA_FANOUT_CONTRACT_VERSION,
    topic: 'market:crypto:BTC',
    symbol: 'BTC',
    assetClass: 'crypto',
    provider: 'binance-public',
    providerFeed: 'bookTicker',
    sourceTimestamp: new Date(Date.parse(NOW) + index * 100).toISOString(),
    receivedAt: new Date(Date.parse(NOW) + index * 100 + 6).toISOString(),
    freshnessMs: 6,
    qualityState: 'LIVE',
    correlationId: 'tier1:btc:stable-correlation',
    evidenceId: 'binance:BTCUSDT:stable-evidence',
    price: 112345.67 + index / 100,
    bid: 112345.66 + index / 100,
    ask: 112345.68 + index / 100,
  };
}

function snapshot(overrides: Partial<CanonicalMarketDataSnapshot> = {}): CanonicalMarketDataSnapshot {
  return {
    contractVersion: MARKET_DATA_CONTRACT_VERSION,
    provider: 'binance-public',
    providerFeed: 'bookTicker',
    symbol: 'BTC',
    assetClass: 'crypto',
    currency: 'USD',
    sourceTimestamp: NOW,
    ingestedAt: NOW,
    receivedAt: NOW,
    freshnessMs: 0,
    qualityState: 'LIVE',
    isRealtime: true,
    isDelayed: false,
    correlationId: 'corr-tier3',
    price: 112345.67,
    bid: 112345.66,
    ask: 112345.68,
    evidenceId: 'evidence-tier3',
    ...overrides,
  };
}

describe('Tier 3 market-data cache and fan-out', () => {
  it('behält je Topic exakt höchstens 200 Ticks und liefert chronologisches Replay', () => {
    const ring = new MarketDataRingBuffer();
    for (let index = 0; index < 250; index += 1) ring.append(tick(index));

    expect(ring.size('market:crypto:BTC')).toBe(200);
    const replay = ring.recent('market:crypto:BTC', 200);
    expect(replay).toHaveLength(200);
    expect(replay[0].price).toBe(tick(50).price);
    expect(replay.at(-1)?.price).toBe(tick(249).price);
  });

  it('erzeugt reversible Delta-Frames und erreicht im repräsentativen Hot Path mindestens 78 Prozent Payload-Reduktion', () => {
    const codec = new MarketDataDeltaCodec();
    const first = tick(0);
    const second = tick(1);

    const baseline = codec.encode(1, first);
    const delta = codec.encode(1, second);
    const decoded = decodeMarketDataFrame(first, JSON.parse(delta.payload) as MarketDataWireFrame);

    expect(baseline.kind).toBe('full');
    expect(delta.kind).toBe('delta');
    expect(decoded).toEqual(second);
    expect(delta.payloadReductionPct).toBeGreaterThanOrEqual(78);
  });

  it('multiplexiert nur abonnierte Rooms und trennt wiederholt langsame Clients per Backpressure', () => {
    const sent: string[] = [];
    let closed = 0;
    const client: WebSocketFanoutClient = {
      readyState: 1,
      bufferedAmount: 0,
      send: payload => sent.push(payload),
      close: () => { closed += 1; },
    };
    const mux = new MarketDataWebSocketRoomMultiplexer({ maxBufferedBytes: 1024, maxSlowSkips: 2 });
    mux.subscribe(client, 'market:crypto:BTC', [tick(0)]);
    const before = sent.length;
    mux.publish({ ...tick(1), topic: 'market:stock:AAPL', symbol: 'AAPL', assetClass: 'stock' });
    expect(sent).toHaveLength(before);

    mux.publish(tick(1));
    expect(sent).toHaveLength(before + 1);
    expect(JSON.parse(sent.at(-1) ?? '[]')[0]).toBe('d');

    const slow = client as { bufferedAmount: number };
    slow.bufferedAmount = 2048;
    mux.publish(tick(2));
    mux.publish(tick(3));
    expect(closed).toBe(1);
    expect(mux.clientCount()).toBe(0);
  });

  it('spiegelt Ring und Pub/Sub in einer einzelnen Upstash-REST-Pipeline ohne Token im Payload', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(input), init });
      return new Response(JSON.stringify([
        { result: 1 },
        { result: 'OK' },
        { result: 1 },
        { result: 1 },
      ]), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    const redis = new UpstashRedisRestFanout({
      url: 'https://capital-ai-test.upstash.io',
      token: 'server-secret-token',
      fetchImpl,
    });
    await redis.writeAndPublish(tick(0));

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://capital-ai-test.upstash.io/pipeline');
    const body = JSON.parse(String(calls[0].init?.body));
    expect(body.map((command: unknown[]) => command[0])).toEqual(['LPUSH', 'LTRIM', 'EXPIRE', 'PUBLISH']);
    expect(body[1].slice(-2)).toEqual([0, 199]);
    expect(String(calls[0].init?.body)).not.toContain('server-secret-token');
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe('Bearer server-secret-token');
  });

  it('bindet Fan-out ausschließlich an akzeptierte Provider-Evidence und isoliert Fan-out-Fehler vom Gateway', async () => {
    const request: SnapshotRequest = {
      symbol: 'BTC',
      assetClass: 'crypto',
      correlationId: 'corr-tier3',
      maxAgeMs: 10_000,
    };
    const provider: MarketDataProvider = {
      descriptor: {
        id: 'test-primary',
        role: 'primary',
        capabilities: ['snapshot'],
        assetClasses: ['crypto'],
        enabled: true,
        priority: 1,
      },
      getSnapshot: vi.fn(async input => snapshot({
        provider: 'test-primary',
        symbol: input.symbol,
        assetClass: input.assetClass,
        correlationId: input.correlationId,
      })),
    };
    const registry = new ProviderRegistry();
    registry.register(provider);
    const sink = { publish: vi.fn(() => Promise.reject(new Error('redis unavailable'))) };
    const onFanoutFailure = vi.fn();
    const gateway = new MarketDataGateway(registry, { fanoutSink: sink, onFanoutFailure });

    const result = await gateway.getSnapshot(request);
    await Promise.resolve();

    expect(result.snapshot.qualityState).toBe('LIVE');
    expect(sink.publish).toHaveBeenCalledTimes(1);
    expect(onFanoutFailure).toHaveBeenCalledTimes(1);

    const hub = new MarketDataFanoutHub();
    hub.publish(snapshot({ evidenceId: null }));
    expect(hub.ringBuffer.size('market:crypto:BTC')).toBe(0);
    hub.publish(snapshot());
    expect(hub.ringBuffer.size('market:crypto:BTC')).toBe(1);
  });
});
