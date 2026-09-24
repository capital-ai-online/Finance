import { describe, expect, it, vi } from 'vitest';
import { MarketTickGate, type MarketTick } from '../../src/platform/MarketData/MarketTickGate';
import { MarketDataGateway } from '../../src/platform/MarketData/MarketDataGateway';
import { ProviderRegistry } from '../../src/platform/MarketData/ProviderRegistry';
import { RateLimitBudget } from '../../src/platform/MarketData/RateLimitBudget';

const now = Date.parse('2026-09-24T12:00:00.000Z');
function trade(i: number, overrides: Partial<MarketTick> = {}): MarketTick {
  return {
    providerId: 'binance-public', providerFeed: 'spot/trade', assetClass: 'crypto',
    symbol: 'BTC', currency: 'USDT', correlationId: 'correlation-1', evidenceId: `trade-${i}`,
    observedAt: new Date(now - 1_000 + i).toISOString(),
    receivedAt: new Date(now - 100).toISOString(), kind: 'trade', price: 100, quantity: 1,
    ...overrides,
  };
}
function book(i: number, overrides: Partial<MarketTick> = {}): MarketTick {
  return {
    ...trade(i), kind: 'bbo', providerFeed: 'spot/bookTicker', evidenceId: `book-${i}`,
    price: undefined, quantity: undefined, bid: 99.9, ask: 100.1, bidQuantity: 1, askQuantity: 2,
    ...overrides,
  };
}

describe('FINTECH Tier-2 market tick gate', () => {
  it('drops 3σ spikes without poisoning the baseline or VWAP evidence', () => {
    const gate = new MarketTickGate({ nowMs: () => now });
    for (let i = 0; i < 20; i++) expect(gate.ingest(trade(i)).status).toBe('WARMUP');
    expect(gate.ingest(trade(20, { price: 100.1, quantity: 3 })).status).toBe('ACCEPTED');
    expect(gate.ingest(trade(21, { price: 1_000 }))).toMatchObject({
      status: 'REJECTED', reason: 'three_sigma_spike', vwap: null, evidenceRefs: [],
    });
    const accepted = gate.ingest(trade(22, { price: 100.1, quantity: 2 }));
    expect(accepted.status).toBe('ACCEPTED');
    expect(accepted.vwap).toBeCloseTo((20 * 100 + 5 * 100.1) / 25);
    expect(accepted.evidenceRefs).not.toContain('trade-21');
  });

  it('rejects stale, reordered, malformed and crossed observations', () => {
    const gate = new MarketTickGate({ nowMs: () => now });
    expect(gate.ingest(trade(0, { evidenceId: '' })).reason).toBe('invalid_evidence');
    expect(gate.ingest(trade(0, { price: Number.NaN })).reason).toBe('invalid_market');
    expect(gate.ingest(book(0, { bid: 101, ask: 100 })).reason).toBe('invalid_market');
    expect(gate.ingest(trade(0, { observedAt: new Date(now - 20_000).toISOString() })).reason).toBe('stale_or_future');
    expect(gate.ingest(trade(0)).status).toBe('WARMUP');
    expect(gate.ingest(trade(0)).reason).toBe('out_of_order');
  });

  it('derives BBO only from same-feed bid/ask and keeps source baselines isolated', () => {
    const gate = new MarketTickGate({ nowMs: () => now });
    for (let i = 0; i < 20; i++) expect(gate.ingest(book(i)).status).toBe('WARMUP');
    expect(gate.ingest(book(20))).toMatchObject({
      status: 'ACCEPTED', vwap: null, bbo: { bid: 99.9, ask: 100.1, mid: 100 },
      evidenceRefs: ['book-20'],
    });
    expect(gate.ingest(book(21, { ask: 1_000 })).reason).toBe('three_sigma_spike');
    expect(gate.ingest(trade(21, { providerId: 'twelvedata' })).status).toBe('WARMUP');
  });

  it('refills token buckets continuously and isolates provider capability budgets', () => {
    let clock = 0;
    const budget = new RateLimitBudget({ capacity: 2, windowMs: 1_000, nowMs: () => clock });
    expect(budget.tryConsume('binance-public').allowed).toBe(true);
    expect(budget.tryConsume('binance-public').allowed).toBe(true);
    expect(budget.tryConsume('binance-public').allowed).toBe(false);
    clock = 499;
    expect(budget.tryConsume('binance-public').allowed).toBe(false);
    clock = 500;
    expect(budget.tryConsume('binance-public').allowed).toBe(true);
    expect(budget.tryConsume('twelvedata').allowed).toBe(true);
    expect(budget.tryConsume('binance-public', 'quote').allowed).toBe(true);
  });

  it('binds ingestion to the registered provider and denies shadow, unknown and over-budget ticks', () => {
    const registry = new ProviderRegistry();
    registry.register({
      descriptor: { id: 'binance-public', role: 'primary', enabled: true, priority: 1,
        capabilities: ['trade', 'quote'], assetClasses: ['crypto'] },
      getSnapshot: vi.fn(async () => { throw new Error('snapshot not used'); }),
    });
    const budget = new RateLimitBudget({ capacity: 1, windowMs: 1_000, nowMs: () => now });
    const gateway = new MarketDataGateway(registry, { nowMs: () => now, tickIngressBudget: budget, recordHealth: false });
    expect(gateway.ingestTick(trade(0, { providerId: 'unknown' })).reason).toBe('provider_not_approved');
    expect(gateway.ingestTick(trade(0)).status).toBe('WARMUP');
    expect(gateway.ingestTick(trade(1)).reason).toBe('rate_budget_exhausted');
    registry.register({
      descriptor: { id: 'shadow', role: 'shadow', enabled: true, priority: 2,
        capabilities: ['trade'], assetClasses: ['crypto'] },
      getSnapshot: vi.fn(async () => { throw new Error('snapshot not used'); }),
    });
    expect(gateway.ingestTick(trade(2, { providerId: 'shadow' })).reason).toBe('provider_not_approved');
  });
});
