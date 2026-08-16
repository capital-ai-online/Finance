import { describe, expect, it, vi } from 'vitest';
import { EODHDMarketDataProvider } from '../../src/platform/MarketData/providers/EODHDMarketDataProvider';

describe('EODHDMarketDataProvider', () => {
  it('normalisiert den letzten EOD-Close als HISTORICAL, nie als LIVE/DELAYED', async () => {
    const provider = new EODHDMarketDataProvider({
      apiKey: 'test-key',
      nowMs: () => Date.parse('2026-08-16T10:00:00Z'),
      fetchImpl: vi.fn(async () => new Response(JSON.stringify([
        { date: '2026-08-15', close: 61000, adjusted_close: 61010 },
      ]), { status: 200, headers: { 'Content-Type': 'application/json' } })) as unknown as typeof fetch,
    });
    const snapshot = await provider.getSnapshot({
      symbol: 'BTC', assetClass: 'crypto', correlationId: 'corr-eodhd',
    });
    expect(snapshot).toMatchObject({
      provider: 'EODHD',
      providerFeed: 'eod',
      symbol: 'BTC',
      currency: 'USD',
      price: 61010,
      qualityState: 'HISTORICAL',
      isRealtime: false,
      isDelayed: false,
      correlationId: 'corr-eodhd',
    });
    expect(snapshot.sourceTimestamp).toBe('2026-08-15T23:59:59.000Z');
    expect(snapshot.evidenceId).toContain('quote:eodhd:BTC:USD');
  });

  it('lehnt nicht-Crypto-Anfragen fail-closed ab', async () => {
    const provider = new EODHDMarketDataProvider({ apiKey: 'test-key' });
    const snapshot = await provider.getSnapshot({
      symbol: 'AAPL', assetClass: 'stock', correlationId: 'corr-wrong-class',
    });
    expect(snapshot.qualityState).toBe('UNAVAILABLE');
    expect(snapshot.price).toBeNull();
    expect(snapshot.reason).toMatch(/does not support assetClass=stock/);
  });

  it('schlägt bei fehlendem Secret ohne synthetischen Preis fehl', async () => {
    const previous = process.env.EODHD_API_KEY;
    delete process.env.EODHD_API_KEY;
    try {
      const snapshot = await new EODHDMarketDataProvider({ apiKey: '' }).getSnapshot({
        symbol: 'BTC', assetClass: 'crypto', correlationId: 'corr-missing',
      });
      expect(snapshot.qualityState).toBe('UNAVAILABLE');
      expect(snapshot.price).toBeNull();
      expect(snapshot.reason).toMatch(/not configured/);
    } finally {
      if (previous === undefined) delete process.env.EODHD_API_KEY;
      else process.env.EODHD_API_KEY = previous;
    }
  });

  it('schlägt bei leerer EOD-Antwort ohne synthetischen Preis fehl', async () => {
    const provider = new EODHDMarketDataProvider({
      apiKey: 'test-key',
      fetchImpl: vi.fn(async () => new Response(JSON.stringify([]), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      })) as unknown as typeof fetch,
    });
    const snapshot = await provider.getSnapshot({
      symbol: 'BTC', assetClass: 'crypto', correlationId: 'corr-empty',
    });
    expect(snapshot.qualityState).toBe('UNAVAILABLE');
    expect(snapshot.price).toBeNull();
    expect(snapshot.reason).toMatch(/no valid latest EOD close/);
  });
});
