import { describe, expect, it, vi } from 'vitest';
import { CoinAPIMarketDataProvider } from '../../src/platform/MarketData/providers/CoinAPIMarketDataProvider';

describe('CoinAPIMarketDataProvider', () => {
  it('normalisiert eine Exchange-Rate-Antwort in den kanonischen Vertrag', async () => {
    const provider = new CoinAPIMarketDataProvider({
      apiKey: 'test-key',
      nowMs: () => Date.parse('2026-08-16T00:01:00Z'),
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({
        rate: 61234.5, time: '2026-08-16T00:00:30Z',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })) as unknown as typeof fetch,
    });
    const snapshot = await provider.getSnapshot({
      symbol: 'BTC', assetClass: 'crypto', correlationId: 'corr-coinapi',
    });
    expect(snapshot).toMatchObject({
      provider: 'CoinAPI',
      providerFeed: 'exchangerate',
      symbol: 'BTC',
      currency: 'USD',
      price: 61234.5,
      sourceTimestamp: '2026-08-16T00:00:30.000Z',
      qualityState: 'LIVE',
      isRealtime: true,
      isDelayed: false,
      correlationId: 'corr-coinapi',
    });
    expect(snapshot.evidenceId).toContain('quote:coinapi:BTC:USD');
  });

  it('lehnt nicht-Crypto-Anfragen fail-closed ab', async () => {
    const provider = new CoinAPIMarketDataProvider({ apiKey: 'test-key' });
    const snapshot = await provider.getSnapshot({
      symbol: 'AAPL', assetClass: 'stock', correlationId: 'corr-wrong-class',
    });
    expect(snapshot.qualityState).toBe('UNAVAILABLE');
    expect(snapshot.price).toBeNull();
    expect(snapshot.reason).toMatch(/does not support assetClass=stock/);
  });

  it('schlägt bei fehlendem Secret ohne synthetischen Preis fehl', async () => {
    const previous = process.env.COIN_API_KEY;
    delete process.env.COIN_API_KEY;
    try {
      const snapshot = await new CoinAPIMarketDataProvider({ apiKey: '' }).getSnapshot({
        symbol: 'BTC', assetClass: 'crypto', correlationId: 'corr-missing',
      });
      expect(snapshot.qualityState).toBe('UNAVAILABLE');
      expect(snapshot.price).toBeNull();
      expect(snapshot.reason).toMatch(/not configured/);
    } finally {
      if (previous === undefined) delete process.env.COIN_API_KEY;
      else process.env.COIN_API_KEY = previous;
    }
  });

  it('schlägt bei ungültiger Rate ohne synthetischen Preis fehl', async () => {
    const provider = new CoinAPIMarketDataProvider({
      apiKey: 'test-key',
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({ rate: 0, time: '2026-08-16T00:00:30Z' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      })) as unknown as typeof fetch,
    });
    const snapshot = await provider.getSnapshot({
      symbol: 'BTC', assetClass: 'crypto', correlationId: 'corr-invalid-rate',
    });
    expect(snapshot.qualityState).toBe('UNAVAILABLE');
    expect(snapshot.price).toBeNull();
    expect(snapshot.reason).toMatch(/no valid USD rate/);
  });

  it('erfindet bei fehlender Provider-Zeit keinen sourceTimestamp', async () => {
    const provider = new CoinAPIMarketDataProvider({
      apiKey: 'test-key',
      nowMs: () => Date.parse('2026-08-16T00:01:00Z'),
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({ rate: 61234.5 }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      })) as unknown as typeof fetch,
    });
    const snapshot = await provider.getSnapshot({
      symbol: 'BTC', assetClass: 'crypto', correlationId: 'corr-missing-time',
    });
    expect(snapshot).toMatchObject({
      qualityState: 'UNAVAILABLE',
      price: null,
      sourceTimestamp: null,
      evidenceId: null,
    });
    expect(snapshot.reason).toMatch(/no valid source timestamp/);
  });
});
