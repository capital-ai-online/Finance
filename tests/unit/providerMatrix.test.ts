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
    expect(PROVIDER_MATRIX_VERSION).toBe('provider-matrix/1.11.0');
    expect(getProviderMatrixEntry('twelvedata')?.gatewayStatus).toBe('behind_gateway');
    expect(getProviderMatrixEntry('fmp-index')?.gatewayStatus).toBe('behind_gateway');
    expect(getProviderMatrixEntry('coingecko')?.gatewayStatus).toBe('behind_gateway');
    expect(getProviderMatrixEntry('alpaca')?.gatewayStatus).toBe('shadow_only');
    expect(getProviderMatrixEntry('coinapi')?.gatewayStatus).toBe('behind_gateway');
    expect(getProviderMatrixEntry('eodhd')?.gatewayStatus).toBe('behind_gateway');
    expect(providersBehindGateway().map((e) => e.id)).toEqual(expect.arrayContaining(['twelvedata', 'fmp-index', 'coingecko', 'coinapi', 'eodhd']));
    expect(getProviderMatrixEntry('stooq')).toMatchObject({ enabled: false, gatewayStatus: 'not_wired' });
    expect(providersLegacyOffGateway().some((e) => e.id === 'stooq')).toBe(false);
  });

  it('declares Binance and Kraken as co-primary crypto evidence suppliers without gateway authority', () => {
    const binance = getProviderMatrixEntry('binance-public');
    const kraken = getProviderMatrixEntry('kraken-futures-public');
    expect(binance).toMatchObject({ role: 'primary', gatewayStatus: 'not_wired' });
    expect(kraken).toMatchObject({ role: 'primary', gatewayStatus: 'not_wired' });
    expect(binance?.assetClasses).toContain('crypto');
    expect(kraken?.assetClasses).toContain('crypto');
    expect(providersBehindGateway().some((entry) => ['binance-public', 'kraken-futures-public'].includes(entry.id))).toBe(false);
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
    for (const id of ['defillama', 'binance-public', 'goplus', 'kraken-futures-public', 'dexscreener', 'sourcify', 'dune', 'gdelt']) {
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
    expect(getProviderHealth().find((h) => h.provider === 'twelvedata' && h.capability === 'snapshot')?.diagnosticCode).toBe('rate_limited');
  });

  it('inventories existing stock-fundamental and macro/rate evidence lanes without activating candidates', () => {
    expect(getProviderMatrixEntry('alpha-vantage')).toMatchObject({
      enabled: true,
      gatewayStatus: 'legacy_off_gateway',
      assetClasses: ['stock'],
    });
    expect(getProviderMatrixEntry('alpha-vantage')?.capabilities).toEqual(
      expect.arrayContaining(['fundamentals', 'history', 'quote']),
    );

    expect(getProviderMatrixEntry('fmp-traditional')).toMatchObject({
      enabled: true,
      gatewayStatus: 'legacy_off_gateway',
      assetClasses: ['stock'],
      capabilities: ['fundamentals'],
    });

    expect(getProviderMatrixEntry('fred')).toMatchObject({
      enabled: true,
      gatewayStatus: 'legacy_off_gateway',
      assetClasses: ['macro', 'bond'],
      capabilities: ['macro-series'],
    });
    expect(getProviderMatrixEntry('ecb')?.capabilities).toEqual(['macro-series']);

    for (const id of ['finnhub', 'massive']) {
      expect(getProviderMatrixEntry(id)).toMatchObject({
        enabled: false,
        gatewayStatus: 'not_wired',
      });
    }
  });

  it('records current compatibility history coverage for crypto/traditional/bond providers', () => {
    expect(getProviderMatrixEntry('coingecko')?.capabilities).toContain('history');
    expect(getProviderMatrixEntry('coinapi')?.capabilities).toEqual(
      expect.arrayContaining(['history', 'orderbook']),
    );
    expect(getProviderMatrixEntry('twelvedata')?.assetClasses).toContain('index');
    expect(getProviderMatrixEntry('eodhd')?.assetClasses).toEqual(
      expect.arrayContaining(['crypto', 'stock', 'forex', 'bond']),
    );
    expect(getProviderMatrixEntry('binance-public')?.capabilities).toEqual(
      expect.arrayContaining(['history', 'bars', 'orderbook']),
    );
    expect(getProviderMatrixEntry('kraken-futures-public')?.capabilities).toEqual(
      expect.arrayContaining(['history', 'bars', 'orderbook']),
    );
  });

  it('registers DeFiLlama as not_wired evidence only', () => {
    const entry = getProviderMatrixEntry('defillama');
    expect(entry?.gatewayStatus).toBe('not_wired');
    expect(entry?.capabilities).toEqual(['fundamentals']);
    expect(entry?.assetClasses).toEqual(['crypto']);
  });

  it('keeps all extended evidence suppliers outside MarketDataGateway authority', () => {
    const expected = {
      'binance-public': ['snapshot', 'quote', 'bars', 'derivatives'],
      'kraken-futures-public': ['derivatives', 'bars', 'quote'],
      goplus: ['security', 'onchain'],
      dexscreener: ['snapshot', 'quote', 'onchain'],
      sourcify: ['security', 'onchain'],
      dune: ['onchain', 'governance'],
      gdelt: ['news'],
    } as const;
    for (const [id, capabilities] of Object.entries(expected)) {
      const entry = getProviderMatrixEntry(id);
      expect(entry?.gatewayStatus).toBe('not_wired');
      expect(entry?.capabilities).toEqual(capabilities);
      expect(rateLimitOverridesFromMatrix()[id]).toBeUndefined();
    }
  });

  it('does not retain excluded paid evidence-provider entries', () => {
    for (const id of ['newsapi', 'coinglass', 'lunarcrush', 'messari']) expect(getProviderMatrixEntry(id)).toBeUndefined();
  });

  it('matrix entries have positive local safety policies', () => {
    for (const entry of PROVIDER_MATRIX) {
      expect(entry.rateLimit.capacity).toBeGreaterThan(0);
      expect(entry.rateLimit.windowMs).toBeGreaterThan(0);
      expect(entry.circuitBreaker.failureThreshold).toBeGreaterThan(0);
      expect(entry.circuitBreaker.cooldownMs).toBeGreaterThan(0);
    }
  });
});
