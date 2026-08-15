import { describe, expect, it } from 'vitest';
import { FmpIndexMarketDataProvider } from '../../src/platform/MarketData/providers/FmpIndexMarketDataProvider';

describe('FmpIndexMarketDataProvider', () => {
  it('normalisiert eine injizierte Indexquote ohne Realtime-Annahme', async () => {
    const now = Date.parse('2026-08-15T00:05:00Z');
    const provider = new FmpIndexMarketDataProvider(
      async () => ({ price: 7489.72, fetchedAt: now - 60_000 }),
      () => now,
    );
    const snapshot = await provider.getSnapshot({
      symbol: 'GSPC', assetClass: 'index', correlationId: 'corr-index',
    });
    expect(snapshot).toMatchObject({
      provider: 'FMP',
      providerFeed: 'stable/quote',
      price: 7489.72,
      qualityState: 'DELAYED',
      isRealtime: false,
      isDelayed: true,
      correlationId: 'corr-index',
    });
    expect(snapshot.evidenceId).toContain('quote:fmp:GSPC');
  });

  it('weist fehlende oder ungültige Loader-Daten ohne Ersatzpreis zurück', async () => {
    const missing = await new FmpIndexMarketDataProvider(async () => null).getSnapshot({
      symbol: 'GSPC', assetClass: 'index', correlationId: 'corr-missing',
    });
    expect(missing.qualityState).toBe('UNAVAILABLE');
    expect(missing.price).toBeNull();

    const invalid = await new FmpIndexMarketDataProvider(async () => ({ price: 0, fetchedAt: Date.now() })).getSnapshot({
      symbol: 'GSPC', assetClass: 'index', correlationId: 'corr-invalid',
    });
    expect(invalid.qualityState).toBe('UNAVAILABLE');
    expect(invalid.price).toBeNull();
  });
});
