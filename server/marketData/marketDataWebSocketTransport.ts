import { createHash } from 'node:crypto';
import type { IncomingMessage, Server as HttpServer } from 'node:http';
import type { Socket } from 'node:net';
import type { Request } from 'express';
import { resolveVerifiedBackendAuth } from '../auth/backendAuth';
import { isOriginAllowed } from '../middleware/cors';
import type { MarketDataFanoutHub } from '../../src/platform/MarketData/Fanout/MarketDataFanoutHub';
import type { WebSocketFanoutClient } from '../../src/platform/MarketData/Fanout/MarketDataWebSocketRoomMultiplexer';

export const MARKET_DATA_WEBSOCKET_TRANSPORT_VERSION = 'market-data-websocket-transport/1.0.0' as const;
export const MARKET_DATA_WEBSOCKET_PROTOCOL = 'capital-ai.market-data.v1' as const;
export const MARKET_DATA_WEBSOCKET_PATH = '/api/market-data/live' as const;

const WEBSOCKET_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const OPEN = 1;
const CLOSED = 3;
const DEFAULT_MAX_CLIENT_PAYLOAD_BYTES = 8 * 1024;
const DEFAULT_HEARTBEAT_MS = 20_000;
const DEFAULT_PONG_TIMEOUT_MS = 60_000;

export interface DecodedClientWebSocketFrame {
  opcode: 0x1 | 0x8 | 0x9 | 0xA;
  payload: Buffer;
}

export class ClientWebSocketFrameParser {
  private buffer = Buffer.alloc(0);

  constructor(private readonly maxPayloadBytes = DEFAULT_MAX_CLIENT_PAYLOAD_BYTES) {}

  push(chunk: Buffer): DecodedClientWebSocketFrame[] {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const frames: DecodedClientWebSocketFrame[] = [];

    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      const second = this.buffer[1];
      const fin = (first & 0x80) !== 0;
      const rsv = first & 0x70;
      const opcode = first & 0x0f;
      const masked = (second & 0x80) !== 0;
      let payloadLength = second & 0x7f;
      let offset = 2;

      if (!fin || rsv !== 0) throw new Error('MARKET_DATA_WS_FRAGMENT_OR_EXTENSION_NOT_ALLOWED');
      if (![0x1, 0x8, 0x9, 0xA].includes(opcode)) throw new Error('MARKET_DATA_WS_OPCODE_NOT_ALLOWED');
      if (!masked) throw new Error('MARKET_DATA_WS_CLIENT_FRAME_MUST_BE_MASKED');

      if (payloadLength === 126) {
        if (this.buffer.length < 4) break;
        payloadLength = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLength === 127) {
        if (this.buffer.length < 10) break;
        const high = this.buffer.readUInt32BE(2);
        const low = this.buffer.readUInt32BE(6);
        if (high !== 0) throw new Error('MARKET_DATA_WS_PAYLOAD_TOO_LARGE');
        payloadLength = low;
        offset = 10;
      }

      if (payloadLength > this.maxPayloadBytes) throw new Error('MARKET_DATA_WS_PAYLOAD_TOO_LARGE');
      if ((opcode === 0x8 || opcode === 0x9 || opcode === 0xA) && payloadLength > 125) {
        throw new Error('MARKET_DATA_WS_CONTROL_FRAME_TOO_LARGE');
      }

      const frameLength = offset + 4 + payloadLength;
      if (this.buffer.length < frameLength) break;
      const mask = this.buffer.subarray(offset, offset + 4);
      const payloadStart = offset + 4;
      const payload = Buffer.allocUnsafe(payloadLength);
      for (let index = 0; index < payloadLength; index += 1) {
        payload[index] = this.buffer[payloadStart + index] ^ mask[index % 4];
      }
      frames.push({ opcode: opcode as DecodedClientWebSocketFrame['opcode'], payload });
      this.buffer = this.buffer.subarray(frameLength);
    }

    return frames;
  }
}

function encodeFramePayload(payload: Buffer, opcode: number): Buffer {
  const length = payload.length;
  let header: Buffer;
  if (length < 126) {
    header = Buffer.from([0x80 | opcode, length]);
  } else if (length <= 0xffff) {
    header = Buffer.allocUnsafe(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.allocUnsafe(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeUInt32BE(0, 2);
    header.writeUInt32BE(length, 6);
  }
  return Buffer.concat([header, payload]);
}

export function encodeServerWebSocketText(payload: string): Buffer {
  return encodeFramePayload(Buffer.from(payload, 'utf8'), 0x1);
}

function encodeServerWebSocketControl(
  opcode: 0x8 | 0x9 | 0xA,
  payload: Uint8Array = new Uint8Array(),
): Buffer {
  if (payload.byteLength > 125) throw new Error('MARKET_DATA_WS_CONTROL_FRAME_TOO_LARGE');
  return encodeFramePayload(Buffer.from(payload), opcode);
}

export function encodeMaskedClientWebSocketTextForTest(payload: string, mask = Buffer.from([1, 2, 3, 4])): Buffer {
  if (mask.length !== 4) throw new Error('MASK_MUST_BE_FOUR_BYTES');
  const body = Buffer.from(payload, 'utf8');
  const header = body.length < 126
    ? Buffer.from([0x81, 0x80 | body.length])
    : (() => {
        const value = Buffer.allocUnsafe(4);
        value[0] = 0x81;
        value[1] = 0x80 | 126;
        value.writeUInt16BE(body.length, 2);
        return value;
      })();
  const masked = Buffer.allocUnsafe(body.length);
  for (let index = 0; index < body.length; index += 1) masked[index] = body[index] ^ mask[index % 4];
  return Buffer.concat([header, mask, masked]);
}

function rejectUpgrade(socket: Socket, status: 400 | 404 | 401 | 403 | 426 | 429 | 503): void {
  const reason = {
    400: 'Bad Request',
    404: 'Not Found',
    401: 'Unauthorized',
    403: 'Forbidden',
    426: 'Upgrade Required',
    429: 'Too Many Requests',
    503: 'Service Unavailable',
  }[status];
  if (!socket.destroyed) {
    socket.end(
      `HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\nCache-Control: no-store\r\nContent-Length: 0\r\n\r\n`,
    );
  }
}

function headerValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join(',');
  return value ?? '';
}

function validWebSocketKey(value: string): boolean {
  try {
    const decoded = Buffer.from(value, 'base64');
    return decoded.length === 16 && decoded.toString('base64') === value;
  } catch {
    return false;
  }
}

function acceptedProtocol(header: string): boolean {
  return header.split(',').map(value => value.trim()).includes(MARKET_DATA_WEBSOCKET_PROTOCOL);
}

function handshake(socket: Socket, key: string): void {
  const accept = createHash('sha1').update(key + WEBSOCKET_GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n'
      + 'Upgrade: websocket\r\n'
      + 'Connection: Upgrade\r\n'
      + `Sec-WebSocket-Accept: ${accept}\r\n`
      + `Sec-WebSocket-Protocol: ${MARKET_DATA_WEBSOCKET_PROTOCOL}\r\n`
      + 'Cache-Control: no-store\r\n'
      + '\r\n',
  );
}

class SocketFanoutClient implements WebSocketFanoutClient {
  constructor(private readonly socket: Socket) {}

  get readyState(): number {
    return this.socket.destroyed ? CLOSED : OPEN;
  }

  get bufferedAmount(): number {
    return this.socket.writableLength;
  }

  send(payload: string): void {
    if (!this.socket.destroyed) this.socket.write(encodeServerWebSocketText(payload));
  }

  sendPong(payload: Buffer): void {
    if (!this.socket.destroyed) this.socket.write(encodeServerWebSocketControl(0xA, payload));
  }

  sendPing(): void {
    if (!this.socket.destroyed) this.socket.write(encodeServerWebSocketControl(0x9));
  }

  close(code = 1000, reason = ''): void {
    if (this.socket.destroyed) return;
    const reasonBuffer = Buffer.from(reason, 'utf8').subarray(0, 123);
    const payload = Buffer.allocUnsafe(2 + reasonBuffer.length);
    payload.writeUInt16BE(code, 0);
    reasonBuffer.copy(payload, 2);
    this.socket.write(encodeServerWebSocketControl(0x8, payload));
    this.socket.end();
  }
}

interface ConnectionState {
  client: SocketFanoutClient;
  userId: string;
  lastPongAt: number;
  parser: ClientWebSocketFrameParser;
}

export interface MarketDataWebSocketTransportOptions {
  enabled: boolean;
  isProduction: boolean;
  path?: string;
  maxConnectionsPerUser?: number;
  heartbeatMs?: number;
  pongTimeoutMs?: number;
  maxClientPayloadBytes?: number;
  nowMs?: () => number;
  authenticate?: (request: IncomingMessage) => Promise<{ userId: string } | null>;
  onError?: (error: unknown) => void;
}

export interface MarketDataWebSocketTransport {
  close(): void;
  clientCount(): number;
}

function replayLimit(value: unknown): number {
  if (!Number.isSafeInteger(value)) return 50;
  return Math.max(0, Math.min(200, Number(value)));
}

export function attachMarketDataWebSocketTransport(
  server: HttpServer,
  hub: MarketDataFanoutHub,
  options: MarketDataWebSocketTransportOptions,
): MarketDataWebSocketTransport {
  const routePath = options.path ?? MARKET_DATA_WEBSOCKET_PATH;
  const maxConnectionsPerUser = Math.max(1, Math.floor(options.maxConnectionsPerUser ?? 2));
  const heartbeatMs = Math.max(5_000, Math.floor(options.heartbeatMs ?? DEFAULT_HEARTBEAT_MS));
  const pongTimeoutMs = Math.max(heartbeatMs * 2, Math.floor(options.pongTimeoutMs ?? DEFAULT_PONG_TIMEOUT_MS));
  const nowMs = options.nowMs ?? Date.now;
  const connections = new Map<Socket, ConnectionState>();
  const userConnections = new Map<string, number>();

  const authenticate = options.authenticate ?? (async (request: IncomingMessage) => {
    const verified = await resolveVerifiedBackendAuth(request as unknown as Request);
    return verified ? { userId: verified.user.id } : null;
  });

  const cleanup = (socket: Socket) => {
    const state = connections.get(socket);
    if (!state) return;
    hub.unregisterClient(state.client);
    connections.delete(socket);
    const next = Math.max(0, (userConnections.get(state.userId) ?? 1) - 1);
    if (next === 0) userConnections.delete(state.userId);
    else userConnections.set(state.userId, next);
  };

  const closeForProtocol = (socket: Socket, code: number, reason: string) => {
    const state = connections.get(socket);
    if (state) state.client.close(code, reason);
    else socket.destroy();
  };

  const handleText = async (socket: Socket, payload: Buffer) => {
    const state = connections.get(socket);
    if (!state) return;
    let message: unknown;
    try {
      message = JSON.parse(payload.toString('utf8'));
    } catch {
      closeForProtocol(socket, 1007, 'invalid-json');
      return;
    }
    if (!message || typeof message !== 'object' || Array.isArray(message)) {
      closeForProtocol(socket, 1008, 'invalid-command');
      return;
    }
    const command = message as Record<string, unknown>;
    const action = command.action;
    const topic = typeof command.topic === 'string' ? command.topic.trim() : '';

    try {
      if (action === 'subscribe' && topic) {
        await hub.subscribeClient(state.client, topic, replayLimit(command.replayLimit));
        return;
      }
      if (action === 'unsubscribe' && topic) {
        hub.unsubscribeClient(state.client, topic);
        return;
      }
      closeForProtocol(socket, 1008, 'unsupported-command');
    } catch (error) {
      options.onError?.(error);
      closeForProtocol(socket, 1008, 'subscription-rejected');
    }
  };

  const consume = (socket: Socket, chunk: Buffer) => {
    const state = connections.get(socket);
    if (!state) return;
    let frames: DecodedClientWebSocketFrame[];
    try {
      frames = state.parser.push(chunk);
    } catch (error) {
      options.onError?.(error);
      closeForProtocol(socket, 1002, 'protocol-error');
      return;
    }

    for (const frame of frames) {
      if (frame.opcode === 0x8) {
        state.client.close(1000, 'client-close');
        return;
      }
      if (frame.opcode === 0x9) {
        state.client.sendPong(frame.payload);
        continue;
      }
      if (frame.opcode === 0xA) {
        state.lastPongAt = nowMs();
        continue;
      }
      void handleText(socket, frame.payload).catch(error => {
        options.onError?.(error);
        closeForProtocol(socket, 1011, 'command-error');
      });
    }
  };

  const upgradeHandler = (request: IncomingMessage, socket: Socket, head: Buffer) => {
    let pathname = '';
    try {
      pathname = new URL(request.url ?? '/', 'http://capital-ai.invalid').pathname;
    } catch {
      return;
    }
    if (pathname !== routePath) {
      rejectUpgrade(socket, 404);
      return;
    }

    void (async () => {
      if (!options.enabled) {
        rejectUpgrade(socket, 503);
        return;
      }
      const origin = headerValue(request.headers.origin);
      if (!origin || !isOriginAllowed(origin, options.isProduction)) {
        rejectUpgrade(socket, 403);
        return;
      }
      if (request.method !== 'GET'
        || headerValue(request.headers.upgrade).toLowerCase() !== 'websocket'
        || !headerValue(request.headers.connection).toLowerCase().split(',').map(value => value.trim()).includes('upgrade')) {
        rejectUpgrade(socket, 426);
        return;
      }
      if (headerValue(request.headers['sec-websocket-version']) !== '13') {
        rejectUpgrade(socket, 426);
        return;
      }
      const key = headerValue(request.headers['sec-websocket-key']);
      if (!validWebSocketKey(key) || !acceptedProtocol(headerValue(request.headers['sec-websocket-protocol']))) {
        rejectUpgrade(socket, 400);
        return;
      }

      let identity: { userId: string } | null = null;
      try {
        identity = await authenticate(request);
      } catch (error) {
        options.onError?.(error);
      }
      if (!identity?.userId) {
        rejectUpgrade(socket, 401);
        return;
      }
      const existing = userConnections.get(identity.userId) ?? 0;
      if (existing >= maxConnectionsPerUser) {
        rejectUpgrade(socket, 429);
        return;
      }

      handshake(socket, key);
      socket.setNoDelay(true);
      const client = new SocketFanoutClient(socket);
      connections.set(socket, {
        client,
        userId: identity.userId,
        lastPongAt: nowMs(),
        parser: new ClientWebSocketFrameParser(options.maxClientPayloadBytes),
      });
      userConnections.set(identity.userId, existing + 1);

      socket.on('data', chunk => consume(socket, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      socket.once('close', () => cleanup(socket));
      socket.once('error', error => {
        options.onError?.(error);
        cleanup(socket);
      });
      if (head.length > 0) consume(socket, head);
    })().catch(error => {
      options.onError?.(error);
      if (!socket.destroyed) rejectUpgrade(socket, 503);
    });
  };

  server.on('upgrade', upgradeHandler);

  const heartbeat = setInterval(() => {
    const now = nowMs();
    for (const [socket, state] of connections) {
      if (socket.destroyed) {
        cleanup(socket);
        continue;
      }
      if (now - state.lastPongAt > pongTimeoutMs) {
        state.client.close(1001, 'heartbeat-timeout');
        cleanup(socket);
        continue;
      }
      state.client.sendPing();
    }
  }, heartbeatMs);
  heartbeat.unref?.();

  return {
    close() {
      clearInterval(heartbeat);
      server.removeListener('upgrade', upgradeHandler);
      for (const [socket, state] of connections) {
        state.client.close(1001, 'server-shutdown');
        cleanup(socket);
      }
    },
    clientCount() {
      return connections.size;
    },
  };
}
