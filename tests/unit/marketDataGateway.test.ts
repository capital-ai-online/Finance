import { describe, expect, it, vi } from 'vitest';
import { MARKET_DATA_CONTRACT_VERSION, type MarketDataProvider, type SnapshotRequest } from '../../src/platform/MarketData/contracts';
import { assessMarketDataSnapshot } from '../../src/platform/MarketData/DataQualityService';
import { MarketDataGateway } from '../../src/platform/MarketData/MarketDataGateway';
import { ProviderRegistry } from '../../src/platform/MarketData/ProviderRegistry';

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

describe('P1 MarketDataGateway', () => {
  it('schließt Shadow-Provider standardmäßig technisch aus', async () => {
    const registry = new ProviderRegistry();
    const shadow = provider('shadow');
    registry.register(shadow);
    const result = await new MarketDataGateway(registry).getSnapshot(request);
    expect(result.snapshot.qualityState).toBe('UNAVAILABLE');
    expect(result.attemptedProviders).toEqual([]);
    expect(shadow.getSnapshot).not.toHaveBeenCalled();
  });

  it('nutzt nur explizit registrierte Provider und behält Provenance', async () => {
    const registry = new ProviderRegistry();
    const primary = provider('primary');
    registry.register(primary);
    const result = await new MarketDataGateway(registry).getSnapshot(request);
    expect(result.snapshot).toMatchObject({
      provider: 'primary-provider',
      symbol: 'AAPL',
      qualityState: 'LIVE',
      correlationId: 'corr-1',
      evidenceId: 'evidence-1',
    });
    expect(result.attemptedProviders).toEqual(['primary-provider']);
  });

  it('erlaubt Shadow nur nach explizitem includeShadow', async () => {
    const registry = new ProviderRegistry();
    registry.register(provider('shadow'));
    const result = await new MarketDataGateway(registry).getSnapshot({ ...request, includeShadow: true });
    expect(result.snapshot.provider).toBe('shadow-provider');
    expect(result.attemptedProviders).toEqual(['shadow-provider']);
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
