import { describe, expect, it } from 'vitest';
import {
  BinanceSpotWebSocketProvider,
} from '../../src/platform/MarketData/providers/BinanceSpotWebSocketProvider';

class FakeSocket extends EventTarget {
  closed = false;
  close(): void {
    this.closed = true;
    this.dispatchEvent(new Event('close'));
  }
  trade(row: Record<string, unknown>): void {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(row) }));
  }
}

const request = { symbol: 'BTC', assetClass: 'crypto' as const, correlationId: 'test-binance' };

describe('Binance Spot public WebSocket evidence', () => {
  it('takes only an attested mapped trade and preserves USDT currency and lineage', async () => {
    const socket = new FakeSocket();
    const urls: string[] = [];
    const observedMs = Date.parse('2026-09-24T12:00:00.000Z');
    const provider = new BinanceSpotWebSocketProvider({
      nowMs: () => observedMs + 1_000,
      webSocketFactory: (url) => { urls.push(url); return socket as unknown as WebSocket; },
      firstTickTimeoutMs: 20,
    });
    const pending = provider.getSnapshot(request);
    socket.trade({ e: 'trade', s: 'ETHUSDT', p: '1', T: observedMs, t: 1 });
    socket.trade({ e: 'trade', s: 'BTCUSDT', p: '-1', T: observedMs, t: 2 });
    socket.trade({ e: 'trade', s: 'BTCUSDT', p: '65000.5', T: observedMs, t: 42 });
    const result = await pending;
    expect(urls).toEqual(['wss://data-stream.binance.vision/ws/btcusdt@trade']);
    expect(result).toMatchObject({
      provider: 'Binance', providerFeed: 'spot/btcusdt@trade', qualityState: 'LIVE',
      currency: 'USDT', price: 65000.5, sourceTimestamp: '2026-09-24T12:00:00.000Z',
      freshnessMs: 1_000, isRealtime: true, correlationId: 'test-binance',
    });
    expect(result.evidenceId).toContain('BTCUSDT:42:');
    provider.close();
  });

  it('fails closed on unsupported symbols without opening a connection', async () => {
    const provider = new BinanceSpotWebSocketProvider({
      webSocketFactory: () => { throw new Error('unexpected socket'); },
    });
    const result = await provider.getSnapshot({ ...request, symbol: 'MATIC' });
    expect(result.qualityState).toBe('UNAVAILABLE');
    expect(result.price).toBeNull();
    expect(result.evidenceId).toBeNull();
  });

  it('rejects stale ticks and reconnects only on a later request after disconnect', async () => {
    let clock = Date.parse('2026-09-24T12:00:00.000Z');
    const sockets: FakeSocket[] = [];
    const provider = new BinanceSpotWebSocketProvider({
      nowMs: () => clock,
      firstTickTimeoutMs: 10,
      webSocketFactory: () => {
        const socket = new FakeSocket();
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
    });
    const first = provider.getSnapshot(request);
    sockets[0].trade({ e: 'trade', s: 'BTCUSDT', p: '100', T: clock, t: 1 });
    expect((await first).qualityState).toBe('LIVE');
    clock += 91_000;
    const stale = await provider.getSnapshot(request);
    expect(stale.qualityState).toBe('UNAVAILABLE');
    expect(stale.price).toBeNull();
    sockets[0].close();
    const next = provider.getSnapshot(request);
    expect(sockets).toHaveLength(2);
    sockets[1].trade({ e: 'trade', s: 'BTCUSDT', p: '101', T: clock, t: 2 });
    expect((await next).price).toBe(101);
    provider.close();
  });
});
