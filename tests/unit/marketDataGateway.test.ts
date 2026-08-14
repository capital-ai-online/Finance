import { describe, expect, it, vi } from 'vitest';
import { CircuitBreaker } from '../../src/platform/MarketData/CircuitBreaker';
import { MARKET_DATA_CONTRACT_VERSION, type MarketDataProvider, type SnapshotRequest } from '../../src/platform/MarketData/contracts';
import { assessMarketDataSnapshot } from '../../src/platform/MarketData/DataQualityService';
import { MarketDataGateway, type MarketDataGatewayEvent } from '../../src/platform/MarketData/MarketDataGateway';
import { ProviderRegistry } from '../../src/platform/MarketData/ProviderRegistry';
import { RateLimitBudget } from '../../src/platform/MarketData/RateLimitBudget';

const request: SnapshotRequest = {
  symbol: 'AAPL',
  assetClass: 'stock',
  correlationId: 'corr-1',
  maxAgeMs: 90_000,
};

function provider(role: 'primary' | 'secondary' | 'shadow', state: 'LIVE' | 'UNAVAILABLE' = 'LIVE'): MarketDataProvider {
  return {
    descriptor: {
      id: `${role}-provider`,
      role,
      capabilities: ['snapshot'],
      assetClasses: ['stock'],
      enabled: true,
      priority: role === 'primary' ? 1 : role === 'secondary' ? 2 : 100,
    },
    getSnapshot: vi.fn(async input => ({
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: `${role}-provider`,
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
      evidenceId: state === 'LIVE' ? 'evidence-1' : null,
    })),
  };
}

describe('P2 MarketDataGateway', () => {
  it('schließt Shadow-Provider standardmäßig technisch aus', async () => {
    const registry = new ProviderRegistry();
    const shadow = provider('shadow');
    registry.register(shadow);
    const result = await new MarketDataGateway(registry).getSnapshot(request);
    expect(result.snapshot.qualityState).toBe('UNAVAILABLE');
    expect(result.attemptedProviders).toEqual([]);
    expect(shadow.getSnapshot).not.toHaveBeenCalled();
  });

  it('behält explizites Routing und Provenance bei', async () => {
    const registry = new ProviderRegistry();
    registry.register(provider('primary'));
    const result = await new MarketDataGateway(registry).getSnapshot(request);
    expect(result.snapshot).toMatchObject({
      provider: 'primary-provider',
      symbol: 'AAPL',
      qualityState: 'LIVE',
      correlationId: 'corr-1',
      evidenceId: 'evidence-1',
    });
    expect(result.attemptedProviders).toEqual(['primary-provider']);
    expect(result.source).toBe('provider');
  });

  it('liefert valide Snapshots aus einem bounded Cache', async () => {
    let now = Date.now();
    const registry = new ProviderRegistry();
    const primary = provider('primary');
    registry.register(primary);
    const gateway = new MarketDataGateway(registry, { nowMs: () => now, cacheTtlMs: 1_000 });
    expect((await gateway.getSnapshot(request)).source).toBe('provider');
    expect((await gateway.getSnapshot(request)).source).toBe('cache');
    expect(primary.getSnapshot).toHaveBeenCalledTimes(1);
    now += 1_001;
    await gateway.getSnapshot(request);
    expect(primary.getSnapshot).toHaveBeenCalledTimes(2);
  });

  it('coalesced identische parallele Requests', async () => {
    const registry = new ProviderRegistry();
    const primary = provider('primary');
    let release: (() => void) | undefined;
    const pending = new Promise<void>(resolve => { release = resolve; });
    vi.mocked(primary.getSnapshot).mockImplementationOnce(async input => {
      await pending;
      return {
        contractVersion: MARKET_DATA_CONTRACT_VERSION,
        provider: 'primary-provider',
        providerFeed: 'test',
        symbol: input.symbol,
        assetClass: input.assetClass,
        currency: 'USD',
        sourceTimestamp: new Date().toISOString(),
        ingestedAt: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        freshnessMs: 0,
        qualityState: 'LIVE',
        isRealtime: true,
        isDelayed: false,
        correlationId: input.correlationId,
        price: 100,
        evidenceId: 'evidence-1',
      };
    });
    registry.register(primary);
    const gateway = new MarketDataGateway(registry);
    const first = gateway.getSnapshot(request);
    const second = gateway.getSnapshot(request);
    release?.();
    await Promise.all([first, second]);
    expect(primary.getSnapshot).toHaveBeenCalledTimes(1);
  });

  it('verbraucht kein Fallback-Budget, wenn der Primary erfolgreich ist', async () => {
    const registry = new ProviderRegistry();
    const primary = provider('primary');
    const secondary = provider('secondary');
    registry.register(primary);
    registry.register(secondary);
    const budget = new RateLimitBudget({ capacity: 1, windowMs: 60_000 });
    const gateway = new MarketDataGateway(registry, { rateLimitBudget: budget, cacheTtlMs: 0 });
    await gateway.getSnapshot(request);
    vi.mocked(primary.getSnapshot).mockRejectedValueOnce(new Error('primary down'));
    const fallback = await gateway.getSnapshot(request);
    expect(fallback.snapshot.provider).toBe('secondary-provider');
    expect(secondary.getSnapshot).toHaveBeenCalledTimes(1);
  });

  it('stoppt Provider nach ausgeschöpftem Rate-Limit-Budget fail-closed', async () => {
    const registry = new ProviderRegistry();
    const primary = provider('primary');
    registry.register(primary);
    const budget = new RateLimitBudget({ capacity: 1, windowMs: 60_000 });
    const gateway = new MarketDataGateway(registry, { rateLimitBudget: budget, cacheTtlMs: 0 });
    await gateway.getSnapshot(request);
    const result = await gateway.getSnapshot(request);
    expect(result.snapshot.qualityState).toBe('UNAVAILABLE');
    expect(result.skippedProviders).toEqual([{ providerId: 'primary-provider', reason: 'rate_limit_budget_exhausted' }]);
    expect(primary.getSnapshot).toHaveBeenCalledTimes(1);
  });

  it('öffnet den Circuit Breaker und erlaubt genau einen Half-Open-Probe', async () => {
    let now = Date.now();
    const registry = new ProviderRegistry();
    const failing = provider('primary', 'UNAVAILABLE');
    registry.register(failing);
    const breaker = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1_000, nowMs: () => now });
    const gateway = new MarketDataGateway(registry, { circuitBreaker: breaker, cacheTtlMs: 0, nowMs: () => now });
    await gateway.getSnapshot(request);
    const blocked = await gateway.getSnapshot(request);
    expect(blocked.skippedProviders[0]?.reason).toBe('circuit_open');
    now += 1_001;
    await gateway.getSnapshot(request);
    expect(failing.getSnapshot).toHaveBeenCalledTimes(2);
  });

  it('emittiert strukturierte Telemetrie ohne Provider-Payloads', async () => {
    const events: MarketDataGatewayEvent[] = [];
    const registry = new ProviderRegistry();
    registry.register(provider('primary'));
    await new MarketDataGateway(registry, {
      telemetry: { record: event => events.push(event) },
    }).getSnapshot(request);
    expect(events).toEqual(expect.arrayContaining(['request', 'provider_attempt', 'provider_success']));
  });

  it('erlaubt Shadow nur nach explizitem includeShadow', async () => {
    const registry = new ProviderRegistry();
    registry.register(provider('shadow'));
    const result = await new MarketDataGateway(registry).getSnapshot({ ...request, includeShadow: true });
    expect(result.snapshot.provider).toBe('shadow-provider');
  });

  it('weist doppelte Provider-IDs zurück', () => {
    const registry = new ProviderRegistry();
    registry.register(provider('primary'));
    expect(() => registry.register(provider('primary'))).toThrow(/already registered/);
  });

  it('markiert überalterte Beobachtungen ohne synthetischen Ersatz als STALE', () => {
    const now = Date.parse('2026-08-14T12:00:00.000Z');
    const snapshot = {
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: 'test',
      providerFeed: 'test',
      symbol: 'AAPL',
      assetClass: 'stock' as const,
      currency: 'USD',
      sourceTimestamp: '2026-08-14T11:50:00.000Z',
      ingestedAt: '2026-08-14T12:00:00.000Z',
      receivedAt: '2026-08-14T12:00:00.000Z',
      freshnessMs: 600_000,
      qualityState: 'LIVE' as const,
      isRealtime: true,
      isDelayed: false,
      correlationId: 'corr-1',
      price: 100,
      evidenceId: 'evidence-1',
    };
    expect(assessMarketDataSnapshot(snapshot, { nowMs: now, maxAgeMs: 90_000 })).toMatchObject({
      accepted: false,
      state: 'STALE',
    });
  });
});
