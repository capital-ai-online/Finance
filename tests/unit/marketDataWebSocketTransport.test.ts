import { createServer } from 'node:http';
import net from 'node:net';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ClientWebSocketFrameParser,
  MARKET_DATA_WEBSOCKET_PROTOCOL,
  attachMarketDataWebSocketTransport,
  encodeMaskedClientWebSocketTextForTest,
  encodeServerWebSocketText,
} from '../../server/marketData/marketDataWebSocketTransport';
import type { MarketDataFanoutHub } from '../../src/platform/MarketData/Fanout/MarketDataFanoutHub';

const servers: ReturnType<typeof createServer>[] = [];
const sockets: net.Socket[] = [];

afterEach(async () => {
  for (const socket of sockets.splice(0)) socket.destroy();
  for (const server of servers.splice(0)) {
    server.close();
    await once(server, 'close').catch(() => undefined);
  }
});

function decodeServerTextFrame(frame: Buffer): string {
  const lengthCode = frame[1] & 0x7f;
  if (lengthCode < 126) return frame.subarray(2, 2 + lengthCode).toString('utf8');
  const length = frame.readUInt16BE(2);
  return frame.subarray(4, 4 + length).toString('utf8');
}

async function openRawUpgrade(port: number): Promise<{ socket: net.Socket; first: Buffer }> {
  const socket = net.createConnection({ host: '127.0.0.1', port });
  sockets.push(socket);
  await once(socket, 'connect');
  const key = Buffer.alloc(16, 7).toString('base64');
  socket.write(
    'GET /api/market-data/live HTTP/1.1\r\n'
      + `Host: 127.0.0.1:${port}\r\n`
      + `Origin: http://localhost:${port}\r\n`
      + 'Upgrade: websocket\r\n'
      + 'Connection: Upgrade\r\n'
      + 'Sec-WebSocket-Version: 13\r\n'
      + `Sec-WebSocket-Key: ${key}\r\n`
      + `Sec-WebSocket-Protocol: ${MARKET_DATA_WEBSOCKET_PROTOCOL}\r\n\r\n`,
  );
  const [first] = await once(socket, 'data') as [Buffer];
  return { socket, first };
}

describe('market-data WebSocket transport', () => {
  it('decodes masked client text frames and rejects unmasked frames', () => {
    const parser = new ClientWebSocketFrameParser();
    const frames = parser.push(encodeMaskedClientWebSocketTextForTest('{"action":"subscribe"}'));
    expect(frames).toHaveLength(1);
    expect(frames[0].opcode).toBe(0x1);
    expect(frames[0].payload.toString('utf8')).toBe('{"action":"subscribe"}');

    const unmasked = encodeServerWebSocketText('bad-client-frame');
    expect(() => parser.push(unmasked)).toThrow('MARKET_DATA_WS_CLIENT_FRAME_MUST_BE_MASKED');
  });

  it('upgrades only an authenticated canonical-origin client and delegates room subscription to Tier 3', async () => {
    const subscribeClient = vi.fn(async (client: any, topic: string, replayLimit: number) => {
      client.send(JSON.stringify(['sub-test', topic, replayLimit]));
      return 1;
    });
    const unregisterClient = vi.fn();
    const hub = {
      subscribeClient,
      unsubscribeClient: vi.fn(),
      unregisterClient,
    } as unknown as MarketDataFanoutHub;

    const server = createServer();
    servers.push(server);
    const transport = attachMarketDataWebSocketTransport(server, hub, {
      enabled: true,
      isProduction: false,
      authenticate: async () => ({ userId: 'user-1' }),
      heartbeatMs: 60_000,
      pongTimeoutMs: 120_000,
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const port = (server.address() as AddressInfo).port;

    const { socket, first } = await openRawUpgrade(port);
    expect(first.toString('utf8')).toContain('101 Switching Protocols');
    expect(first.toString('utf8')).toContain(`Sec-WebSocket-Protocol: ${MARKET_DATA_WEBSOCKET_PROTOCOL}`);

    const messagePromise = once(socket, 'data') as Promise<[Buffer]>;
    socket.write(encodeMaskedClientWebSocketTextForTest(JSON.stringify({
      action: 'subscribe',
      topic: 'asset:crypto:BTC',
      replayLimit: 25,
    })));
    const [frame] = await messagePromise;

    expect(subscribeClient).toHaveBeenCalledWith(expect.anything(), 'asset:crypto:BTC', 25);
    expect(JSON.parse(decodeServerTextFrame(frame))).toEqual(['sub-test', 'asset:crypto:BTC', 25]);

    transport.close();
    expect(unregisterClient).toHaveBeenCalled();
  });

  it('keeps the endpoint fail-closed when browser redistribution is not activated', async () => {
    const hub = {
      subscribeClient: vi.fn(),
      unsubscribeClient: vi.fn(),
      unregisterClient: vi.fn(),
    } as unknown as MarketDataFanoutHub;
    const server = createServer();
    servers.push(server);
    const transport = attachMarketDataWebSocketTransport(server, hub, {
      enabled: false,
      isProduction: false,
      authenticate: async () => ({ userId: 'user-1' }),
      heartbeatMs: 60_000,
      pongTimeoutMs: 120_000,
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const port = (server.address() as AddressInfo).port;

    const { first } = await openRawUpgrade(port);
    expect(first.toString('utf8')).toContain('503 Service Unavailable');
    transport.close();
  });
});
