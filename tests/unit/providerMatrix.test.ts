import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PROVIDER_MATRIX,
  PROVIDER_MATRIX_VERSION,
  getProviderMatrixEntry,
  providersBehindGateway,
  providersLegacyOffGateway,
  rateLimitOverridesFromMatrix,
} from '../../src/platform/MarketData/ProviderMatrix';
import { RateLimitBudget } from '../../src/platform/MarketData/RateLimitBudget';
import { CircuitBreaker } from '../../src/platform/MarketData/CircuitBreaker';
import { MarketDataGateway } from '../../src/platform/MarketData/MarketDataGateway';
import { ProviderRegistry } from '../../src/platform/MarketData/ProviderRegistry';
import { MARKET_DATA_CONTRACT_VERSION, type MarketDataProvider, type SnapshotRequest } from '../../src/platform/MarketData/contracts';
import { getProviderHealth, resetProviderHealth } from '../../src/platform/Supervisor/providerHealth';

beforeEach(() => resetProviderHealth());

const request: SnapshotRequest = { symbol: 'AAPL', assetClass: 'stock', correlationId: 'sc4-test', maxAgeMs: 90_000 };

function mockProvider(id: string, state: 'LIVE' | 'UNAVAILABLE' = 'LIVE'): MarketDataProvider {
  return {
    descriptor: { id, role: 'primary', capabilities: ['snapshot'], assetClasses: ['stock'], enabled: true, priority: 1 },
    getSnapshot: vi.fn(async (input) => ({
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: id,
      providerFeed: 'test',
      symbol: input.symbol,
      assetClass: input.assetClass,
      currency: 'USD',
      sourceTimestamp: new Date().toISOString(),
      ingestedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      freshnessMs: 0,
      qualityState: state,
      isRealtime: state === 'LIVE',
      isDelayed: false,
      correlationId: input.correlationId,
      price: state === 'LIVE' ? 100 : null,
      evidenceId: state === 'LIVE' ? 'ev-1' : null,
    })),
  };
}

describe('SC-4/SC-5 ProviderMatrix', () => {
  it('has stable contract version and required gateway providers', () => {
    expect(PROVIDER_MATRIX_VERSION).toBe('provider-matrix/1.7.0');
    expect(getProviderMatrixEntry('twelvedata')?.gatewayStatus).toBe('behind_gateway');
    expect(getProviderMatrixEntry('fmp-index')?.gatewayStatus).toBe('behind_gateway');
    expect(getProviderMatrixEntry('coingecko')?.gatewayStatus).toBe('behind_gateway');
    expect(getProviderMatrixEntry('alpaca')?.gatewayStatus).toBe('shadow_only');
    expect(getProviderMatrixEntry('coinapi')?.gatewayStatus).toBe('behind_gateway');
    expect(getProviderMatrixEntry('eodhd')?.gatewayStatus).toBe('behind_gateway');
    expect(getProviderMatrixEntry('twelvedata')?.assetClasses).toContain('crypto');
    expect(providersBehindGateway().map((e) => e.id)).toEqual(expect.arrayContaining(['twelvedata', 'fmp-index', 'coingecko', 'coinapi', 'eodhd']));
    expect(providersLegacyOffGateway().some((e) => e.id === 'stooq')).toBe(true);
  });

  it('exposes rate-limit overrides only for gateway-relevant providers', () => {
    const overrides = rateLimitOverridesFromMatrix();
    expect(overrides.twelvedata?.capacity).toBe(30);
    expect(overrides['fmp-index']?.capacity).toBe(40);
    expect(overrides.alpaca?.capacity).toBe(20);
    expect(overrides.coingecko?.capacity).toBe(25);
    expect(overrides.coinapi?.capacity).toBe(20);
    expect(overrides.eodhd?.capacity).toBe(15);
    expect(overrides.stooq).toBeUndefined();
    for (const id of ['defillama', 'goplus', 'kraken-futures-public', 'dexscreener', 'sourcify', 'dune', 'gdelt']) {
      expect(overrides[id]).toBeUndefined();
    }
  });

  it('RateLimitBudget applies per-provider capacity from matrix overrides', () => {
    const budget = new RateLimitBudget({ capacity: 100, windowMs: 60_000, perProvider: { twelvedata: { capacity: 2, windowMs: 60_000 } } });
    expect(budget.tryConsume('twelvedata').allowed).toBe(true);
    expect(budget.tryConsume('twelvedata').allowed).toBe(true);
    expect(budget.tryConsume('twelvedata').allowed).toBe(false);
    expect(budget.tryConsume('other').allowed).toBe(true);
  });

  it('CircuitBreaker exposes openedUntilIso when OPEN', () => {
    let now = Date.parse('2026-08-16T00:00:00.000Z');
    const breaker = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 30_000, nowMs: () => now });
    breaker.failure('twelvedata');
    expect(breaker.state('twelvedata')).toBe('OPEN');
    expect(breaker.openedUntilIso('twelvedata')).toBe('2026-08-16T00:00:30.000Z');
    breaker.success('twelvedata');
    expect(breaker.openedUntilIso('twelvedata')).toBeNull();
  });

  it('MarketDataGateway records Supervisor health on success and rate-limit skip', async () => {
    const registry = new ProviderRegistry();
    registry.register(mockProvider('twelvedata'));
    const budget = new RateLimitBudget({ capacity: 1, windowMs: 60_000, perProvider: { twelvedata: { capacity: 1, windowMs: 60_000 } } });
    const gateway = new MarketDataGateway(registry, { rateLimitBudget: budget, cacheTtlMs: 0 });

    const ok = await gateway.getSnapshot(request);
    expect(ok.snapshot.qualityState).toBe('LIVE');
    expect(getProviderHealth().find((h) => h.provider === 'twelvedata' && h.capability === 'snapshot')?.state).toBe('healthy');

    const blocked = await gateway.getSnapshot(request);
    expect(blocked.skippedProviders[0]?.reason).toBe('rate_limit_budget_exhausted');
    const afterSkip = getProviderHealth().find((h) => h.provider === 'twelvedata' && h.capability === 'snapshot');
    expect(afterSkip?.state).toBe('degraded');
    expect(afterSkip?.diagnosticCode).toBe('rate_limited');
  });

  it('registers DeFiLlama as a not_wired evidence-only entry that stays out of gateway routing', () => {
    const entry = getProviderMatrixEntry('defillama');
    expect(entry?.gatewayStatus).toBe('not_wired');
    expect(entry?.capabilities).toEqual(['fundamentals']);
    expect(entry?.assetClasses).toEqual(['crypto']);
    expect(rateLimitOverridesFromMatrix().defillama).toBeUndefined();
  });

  it('keeps all free evidence specialists outside MarketDataGateway authority', () => {
    const expected = {
      goplus: ['security', 'onchain'],
      'kraken-futures-public': ['derivatives', 'bars', 'quote'],
      dexscreener: ['snapshot', 'quote', 'onchain'],
      sourcify: ['security', 'onchain'],
      dune: ['onchain', 'governance'],
      gdelt: ['news'],
    } as const;

    for (const [id, capabilities] of Object.entries(expected)) {
      const entry = getProviderMatrixEntry(id);
      expect(entry?.gatewayStatus).toBe('not_wired');
      expect(entry?.capabilities).toEqual(capabilities);
      expect(providersBehindGateway().some((candidate) => candidate.id === id)).toBe(false);
      expect(rateLimitOverridesFromMatrix()[id]).toBeUndefined();
    }
  });

  it('does not retain excluded paid evidence-provider entries', () => {
    for (const id of ['newsapi', 'coinglass', 'lunarcrush', 'messari']) expect(getProviderMatrixEntry(id)).toBeUndefined();
  });

  it('matrix entries have positive rate-limit and circuit policies', () => {
    for (const entry of PROVIDER_MATRIX) {
      expect(entry.rateLimit.capacity).toBeGreaterThan(0);
      expect(entry.rateLimit.windowMs).toBeGreaterThan(0);
      expect(entry.circuitBreaker.failureThreshold).toBeGreaterThan(0);
      expect(entry.circuitBreaker.cooldownMs).toBeGreaterThan(0);
    }
  });
});
