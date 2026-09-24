/** Tier-2 market-data normalization. No score or execution authority is created here. */
import type { MarketDataAssetClass } from './contracts';
export const MARKET_TICK_GATE_VERSION = 'market-tick-gate/1.0.0' as const;

export type MarketTickKind = 'trade' | 'bbo';

export interface MarketTick {
  providerId: string;
  providerFeed: string;
  assetClass: MarketDataAssetClass;
  symbol: string;
  currency: string;
  correlationId: string;
  evidenceId: string;
  observedAt: string;
  receivedAt: string;
  kind: MarketTickKind;
  price?: number;
  quantity?: number;
  bid?: number;
  ask?: number;
  bidQuantity?: number;
  askQuantity?: number;
}

export interface MarketTickDecision {
  contractVersion: typeof MARKET_TICK_GATE_VERSION;
  status: 'ACCEPTED' | 'WARMUP' | 'REJECTED';
  reason: 'ok' | 'baseline_insufficient' | 'invalid_evidence' | 'stale_or_future' | 'out_of_order' | 'invalid_market' | 'three_sigma_spike' | 'provider_not_approved' | 'rate_budget_exhausted';
  /** Only accepted, fresh and same-source trades contribute to VWAP. */
  vwap: number | null;
  /** BBO is always a single venue's actual bid/ask, never synthesized from last price. */
  bbo: { bid: number; ask: number; mid: number; spreadBps: number } | null;
  evidenceRefs: readonly string[];
}

interface AcceptedPoint { price: number; quantity: number; observedMs: number; evidenceId: string }
interface Series { lastMs: number; prices: number[]; trades: AcceptedPoint[]; evidenceIds: string[] }

export interface MarketTickGateOptions {
  nowMs?: () => number;
  maxAgeMs?: number;
  futureSkewMs?: number;
  windowSize?: number;
  minimumBaseline?: number;
  minimumMoveBps?: number;
  maxSeries?: number;
}

function positive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function timestamp(value: string): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return Number.NaN;
  }
  return Date.parse(value);
}

/** Bounded, process-local series; callers must use a trusted provider identity from ProviderRegistry. */
export class MarketTickGate {
  private readonly series = new Map<string, Series>();
  private readonly nowMs: () => number;
  private readonly maxAgeMs: number;
  private readonly futureSkewMs: number;
  private readonly windowSize: number;
  private readonly minimumBaseline: number;
  private readonly minimumMoveBps: number;
  private readonly maxSeries: number;

  constructor(options: MarketTickGateOptions = {}) {
    this.nowMs = options.nowMs ?? Date.now;
    this.maxAgeMs = options.maxAgeMs ?? 10_000;
    this.futureSkewMs = options.futureSkewMs ?? 1_000;
    this.windowSize = options.windowSize ?? 60;
    this.minimumBaseline = options.minimumBaseline ?? 20;
    this.minimumMoveBps = options.minimumMoveBps ?? 50;
    this.maxSeries = options.maxSeries ?? 1_000;
    if (![this.maxAgeMs, this.futureSkewMs, this.windowSize, this.minimumBaseline, this.minimumMoveBps, this.maxSeries]
      .every(value => Number.isFinite(value) && value > 0)
      || !Number.isInteger(this.windowSize) || !Number.isInteger(this.minimumBaseline)
      || !Number.isInteger(this.maxSeries) || this.windowSize <= this.minimumBaseline) {
      throw new Error('Invalid market tick gate policy.');
    }
  }

  ingest(tick: MarketTick): MarketTickDecision {
    const decision = (status: MarketTickDecision['status'], reason: MarketTickDecision['reason'],
      vwap: number | null = null, bbo: MarketTickDecision['bbo'] = null,
      evidenceRefs: readonly string[] = []): MarketTickDecision =>
      ({ contractVersion: MARKET_TICK_GATE_VERSION, status, reason, vwap, bbo, evidenceRefs });

    const identity = [tick.providerId, tick.providerFeed, tick.assetClass, tick.symbol, tick.currency,
      tick.correlationId, tick.evidenceId];
    if (identity.some(value => typeof value !== 'string' || !value.trim())) return decision('REJECTED', 'invalid_evidence');
    const observedMs = timestamp(tick.observedAt);
    const receivedMs = timestamp(tick.receivedAt);
    if (!Number.isFinite(observedMs) || !Number.isFinite(receivedMs)) return decision('REJECTED', 'invalid_evidence');
    const now = this.nowMs();
    if (!Number.isFinite(now) || observedMs > receivedMs + this.futureSkewMs
      || receivedMs > now + this.futureSkewMs || now - observedMs > this.maxAgeMs) {
      return decision('REJECTED', 'stale_or_future');
    }
    const isTrade = tick.kind === 'trade';
    if (!isTrade && tick.kind !== 'bbo') return decision('REJECTED', 'invalid_market');
    if (isTrade ? !positive(tick.price) || !positive(tick.quantity)
      : !positive(tick.bid) || !positive(tick.ask) || tick.bid >= tick.ask
        || !positive(tick.bidQuantity) || !positive(tick.askQuantity)) {
      return decision('REJECTED', 'invalid_market');
    }
    const price = isTrade ? tick.price! : tick.bid! + (tick.ask! - tick.bid!) / 2;
    if (!positive(price)) return decision('REJECTED', 'invalid_market');
    const key = JSON.stringify([tick.providerId, tick.providerFeed, tick.assetClass, tick.symbol.trim().toUpperCase(),
      tick.currency.trim().toUpperCase(), tick.kind]);
    let state: Series = this.series.get(key) ?? { lastMs: -Infinity, prices: [], trades: [], evidenceIds: [] };
    if (observedMs <= state.lastMs || state.evidenceIds.includes(tick.evidenceId)) {
      return decision('REJECTED', 'out_of_order');
    }
    if (observedMs - state.lastMs > this.maxAgeMs) {
      state = { lastMs: -Infinity, prices: [], trades: [], evidenceIds: [] };
    }

    // A robust estimate of sigma from accepted log returns avoids one large jump poisoning the baseline.
    if (state.prices.length > this.minimumBaseline) {
      const returns = state.prices.slice(1).map((p, i) => Math.log(p / state.prices[i]));
      const center = median(returns);
      const sigma = 1.4826 * median(returns.map(value => Math.abs(value - center)));
      const move = Math.log(price / state.prices[state.prices.length - 1]);
      const limit = Math.max(3 * sigma, Math.log(1 + this.minimumMoveBps / 10_000));
      if (Math.abs(move - center) > limit) return decision('REJECTED', 'three_sigma_spike');
    }

    const trades = isTrade
      ? [...state.trades.filter(item => now - item.observedMs <= this.maxAgeMs),
        { price, quantity: tick.quantity!, observedMs, evidenceId: tick.evidenceId }].slice(-this.windowSize)
      : [];
    const quantity = trades.reduce((sum, item) => sum + item.quantity, 0);
    const weighted = trades.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (isTrade && (!positive(quantity) || !positive(weighted) || !Number.isFinite(weighted / quantity))) {
      return decision('REJECTED', 'invalid_market');
    }
    state.lastMs = observedMs;
    state.prices.push(price);
    if (state.prices.length > this.windowSize) state.prices.shift();
    state.evidenceIds.push(tick.evidenceId);
    if (state.evidenceIds.length > this.windowSize) state.evidenceIds.shift();
    if (isTrade) state.trades = trades;
    if (!this.series.has(key) && this.series.size >= this.maxSeries) {
      const oldest = this.series.keys().next().value;
      if (oldest !== undefined) this.series.delete(oldest);
    }
    this.series.delete(key);
    this.series.set(key, state);
    if (state.prices.length <= this.minimumBaseline) return decision('WARMUP', 'baseline_insufficient');

    if (isTrade) {
      return decision('ACCEPTED', 'ok', weighted / quantity, null, trades.map(item => item.evidenceId));
    }
    const bid = tick.bid!;
    const ask = tick.ask!;
    return decision('ACCEPTED', 'ok', null,
      { bid, ask, mid: price, spreadBps: (ask - bid) / price * 10_000 }, [tick.evidenceId]);
  }
}
