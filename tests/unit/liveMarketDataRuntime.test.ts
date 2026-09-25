import { describe, expect, it } from 'vitest';
import { MarketTickGate } from '../../src/platform/MarketData/MarketTickGate';
import {
  buildBinanceBookTickerUrl,
  createLiveMarketDataRuntime,
  normalizeLiveMarketSymbols,
  parseBinanceBookTicker,
} from '../../server/marketData/liveMarketDataRuntime';

const BASE_MS = Date.parse('2026-09-25T02:40:00.000Z');

function bookTicker(index: number) {
  return JSON.stringify({
    stream: 'btcusdt@bookTicker',
    data: {
      e: 'bookTicker',
      E: BASE_MS + index,
      u: 1000 + index,
      s: 'BTCUSDT',
      b: '100.00',
      B: '2.00',
      a: '100.02',
      A: '3.00',
    },
  });
}

describe('FINTECH live market-data runtime', () => {
  it('normalizes a bounded symbol set and builds one combined public Binance stream', () => {
    expect(normalizeLiveMarketSymbols([' btc ', 'ETH', 'btc', '../bad', 'SOL'])).toEqual(['BTC', 'ETH', 'SOL']);
    expect(buildBinanceBookTickerUrl(['BTC', 'ETH'])).toBe(
      'wss://data-stream.binance.vision/stream?streams=btcusdt%40bookTicker%2Fethusdt%40bookTicker',
    );
  });

  it('parses only allow-listed positive BBO evidence with provider event time', () => {
    const receivedAt = new Date(BASE_MS + 50).toISOString();
    const tick = parseBinanceBookTicker(bookTicker(1), new Set(['BTC']), receivedAt);
    expect(tick).toMatchObject({
      providerId: 'binance-public',
      providerFeed: 'spot/bookTicker',
      assetClass: 'crypto',
      symbol: 'BTC',
      currency: 'USDT',
      kind: 'bbo',
      bid: 100,
      ask: 100.02,
      bidQuantity: 2,
      askQuantity: 3,
      observedAt: new Date(BASE_MS + 1).toISOString(),
    });
    expect(tick?.evidenceId).toContain('BTCUSDT:1001');

    expect(parseBinanceBookTicker(bookTicker(2), new Set(['ETH']), receivedAt)).toBeNull();
    expect(parseBinanceBookTicker('{"data":{"s":"BTCUSDT","u":1,"b":"101","B":"1","a":"100","A":"1"}}', new Set(['BTC']), receivedAt)).toBeNull();
  });

  it('admits BBO through MarketDataGateway/MarketTickGate before publishing to the Tier-3 asset room', () => {
    const nowMs = () => BASE_MS + 1_000;
    const runtime = createLiveMarketDataRuntime({
      nowMs,
      tickGate: new MarketTickGate({
        nowMs,
        minimumBaseline: 20,
        windowSize: 60,
        maxAgeMs: 10_000,
      }),
    });
    const allowed = new Set(['BTC']);

    for (let index = 1; index <= 20; index += 1) {
      expect(runtime.ingestBinanceBookTicker(bookTicker(index), allowed)?.status).toBe('WARMUP');
    }
    const accepted = runtime.ingestBinanceBookTicker(bookTicker(21), allowed);
    expect(accepted?.status).toBe('ACCEPTED');

    const replay = runtime.fanoutHub.ringBuffer.recent('asset:crypto:BTC', 10);
    expect(replay).toHaveLength(1);
    expect(replay[0]).toMatchObject({
      contractVersion: 'market-data-fanout/1.0.0',
      topic: 'asset:crypto:BTC',
      provider: 'binance-public',
      eventKind: 'bbo',
      bid: 100,
      ask: 100.02,
    });
    expect(replay[0].price).toBeCloseTo(100.01, 10);
  });

  it('fails closed for malformed or out-of-order upstream evidence', () => {
    const nowMs = () => BASE_MS + 1_000;
    const runtime = createLiveMarketDataRuntime({ nowMs });
    const allowed = new Set(['BTC']);

    expect(runtime.ingestBinanceBookTicker('not-json', allowed)).toBeNull();
    const first = runtime.ingestBinanceBookTicker(bookTicker(1), allowed);
    expect(first?.status).toBe('WARMUP');
    const duplicate = runtime.ingestBinanceBookTicker(bookTicker(1), allowed);
    expect(duplicate?.status).toBe('REJECTED');
    expect(duplicate?.reason).toBe('out_of_order');
    expect(runtime.fanoutHub.ringBuffer.recent('asset:crypto:BTC', 10)).toHaveLength(0);
  });
});
