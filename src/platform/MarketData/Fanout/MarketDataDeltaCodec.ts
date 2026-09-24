import type { MarketDataFanoutTick } from './contracts';

const DELTA_FIELDS = [
  'price',
  'bid',
  'ask',
  'sourceTimestamp',
  'receivedAt',
  'freshnessMs',
  'qualityState',
  'provider',
  'providerFeed',
  'evidenceId',
  'correlationId',
] as const;

type DeltaField = (typeof DELTA_FIELDS)[number];

export type MarketDataFullFrame = ['f', number, number, MarketDataFanoutTick];
export type MarketDataDeltaFrame = ['d', number, number, number, number, ...unknown[]];
export type MarketDataWireFrame = MarketDataFullFrame | MarketDataDeltaFrame;

export interface EncodedMarketDataFrame {
  kind: 'full' | 'delta';
  roomId: number;
  sequence: number;
  payload: string;
  bytes: number;
  fullTickBytes: number;
  payloadReductionPct: number;
}

function bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function cloneTick(tick: MarketDataFanoutTick): MarketDataFanoutTick {
  return { ...tick };
}

function encodeDeltaValue(field: DeltaField, value: MarketDataFanoutTick[DeltaField]): unknown {
  if ((field === 'sourceTimestamp' || field === 'receivedAt') && typeof value === 'string') {
    return Date.parse(value);
  }
  if (field === 'qualityState') {
    if (value === 'LIVE') return 0;
    if (value === 'DELAYED') return 1;
    if (value === 'STALE') return 2;
  }
  return value;
}

function decodeDeltaValue(field: DeltaField, value: unknown): unknown {
  if (field === 'sourceTimestamp' || field === 'receivedAt') {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('MARKET_DATA_DELTA_INVALID_TIMESTAMP');
    }
    return new Date(value).toISOString();
  }
  if (field === 'qualityState') {
    if (value === 0) return 'LIVE';
    if (value === 1) return 'DELAYED';
    if (value === 2) return 'STALE';
    throw new Error('MARKET_DATA_DELTA_INVALID_QUALITY_STATE');
  }
  return value;
}

export class MarketDataDeltaCodec {
  private readonly previousByRoom = new Map<number, { sequence: number; tick: MarketDataFanoutTick }>();

  encode(roomId: number, tick: MarketDataFanoutTick): EncodedMarketDataFrame {
    const previous = this.previousByRoom.get(roomId);
    const sequence = (previous?.sequence ?? 0) + 1;
    const fullTickBytes = bytes(JSON.stringify(tick));

    if (!previous || previous.tick.topic !== tick.topic) {
      const frame: MarketDataFullFrame = ['f', roomId, sequence, cloneTick(tick)];
      const payload = JSON.stringify(frame);
      this.previousByRoom.set(roomId, { sequence, tick: cloneTick(tick) });
      return {
        kind: 'full',
        roomId,
        sequence,
        payload,
        bytes: bytes(payload),
        fullTickBytes,
        payloadReductionPct: 0,
      };
    }

    let mask = 0;
    const changed: unknown[] = [];
    for (let index = 0; index < DELTA_FIELDS.length; index += 1) {
      const field = DELTA_FIELDS[index];
      if (previous.tick[field] !== tick[field]) {
        mask |= (1 << index);
        changed.push(encodeDeltaValue(field, tick[field]));
      }
    }

    const frame: MarketDataDeltaFrame = ['d', roomId, sequence, previous.sequence, mask, ...changed];
    const payload = JSON.stringify(frame);
    const payloadBytes = bytes(payload);
    const reduction = fullTickBytes === 0
      ? 0
      : Math.max(0, (1 - payloadBytes / fullTickBytes) * 100);

    this.previousByRoom.set(roomId, { sequence, tick: cloneTick(tick) });
    return {
      kind: 'delta',
      roomId,
      sequence,
      payload,
      bytes: payloadBytes,
      fullTickBytes,
      payloadReductionPct: Number(reduction.toFixed(2)),
    };
  }

  reset(roomId?: number): void {
    if (roomId === undefined) this.previousByRoom.clear();
    else this.previousByRoom.delete(roomId);
  }
}

export function decodeMarketDataFrame(
  previous: MarketDataFanoutTick | null,
  frame: MarketDataWireFrame,
): MarketDataFanoutTick {
  if (frame[0] === 'f') return cloneTick(frame[3]);
  if (!previous) throw new Error('MARKET_DATA_DELTA_BASELINE_REQUIRED');

  const [, , , , mask, ...values] = frame;
  const next = { ...previous } as Record<string, unknown>;
  let cursor = 0;
  for (let index = 0; index < DELTA_FIELDS.length; index += 1) {
    if ((mask & (1 << index)) === 0) continue;
    const field: DeltaField = DELTA_FIELDS[index];
    next[field] = decodeDeltaValue(field, values[cursor]);
    cursor += 1;
  }
  if (cursor !== values.length) throw new Error('MARKET_DATA_DELTA_FIELD_COUNT_MISMATCH');
  return next as unknown as MarketDataFanoutTick;
}
