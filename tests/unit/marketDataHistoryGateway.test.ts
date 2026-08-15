import { describe, expect, it } from 'vitest';
import { HistoryProviderRegistry } from '../../src/platform/MarketData/HistoryProviderRegistry';
import { MarketDataHistoryGateway } from '../../src/platform/MarketData/MarketDataHistoryGateway';
import { FmpIndexHistoryProvider } from '../../src/platform/MarketData/providers/FmpIndexHistoryProvider';

function gateway(points: Array<{ date: string; close: number }>) {
  const registry = new HistoryProviderRegistry();
  registry.register(new FmpIndexHistoryProvider(async () => ({ points })));
  return new MarketDataHistoryGateway(registry);
}

describe('MarketDataHistoryGateway', () => {
  it('routet nur freigegebene History-Provider und begrenzt die Serie', async () => {
    const result = await gateway([
      { date: '2026-08-12', close: 7400 },
      { date: '2026-08-13', close: 7480 },
      { date: '2026-08-14', close: 7500 },
    ]).getHistory({
      symbol: 'GSPC',
      assetClass: 'index',
      correlationId: 'corr-limited',
      maxPoints: 2,
      allowedProviderIds: ['fmp-index-history'],
    });

    expect(result.attemptedProviders).toEqual(['fmp-index-history']);
    expect(result.history.qualityState).toBe('HISTORICAL');
    expect(result.history.points).toEqual([
      { timestamp: '2026-08-13', close: 7480 },
      { timestamp: '2026-08-14', close: 7500 },
    ]);
  });

  it('schließt Shadow-Provider standardmäßig aus', async () => {
    const provider = new FmpIndexHistoryProvider(async () => ({
      points: [{ date: '2026-08-14', close: 7500 }],
    }));
    Object.assign(provider.descriptor, { id: 'shadow-history', role: 'shadow' });
    const registry = new HistoryProviderRegistry();
    registry.register(provider);
    const result = await new MarketDataHistoryGateway(registry).getHistory({
      symbol: 'GSPC', assetClass: 'index', correlationId: 'corr-shadow',
    });
    expect(result.attemptedProviders).toEqual([]);
    expect(result.history.qualityState).toBe('UNAVAILABLE');
  });

  it('weist ungültige Requests und gemischte ungültige Serien fail-closed zurück', async () => {
    const invalidRequest = await gateway([]).getHistory({
      symbol: '', assetClass: 'index', correlationId: 'corr-invalid', maxPoints: 0,
    });
    expect(invalidRequest.history.qualityState).toBe('UNAVAILABLE');

    const mixed = await gateway([
      { date: '2026-08-13', close: 7480 },
      { date: 'not-a-date', close: 7500 },
    ]).getHistory({
      symbol: 'GSPC', assetClass: 'index', correlationId: 'corr-mixed',
    });
    expect(mixed.history.qualityState).toBe('UNAVAILABLE');
    expect(mixed.history.points).toEqual([]);
  });
});
