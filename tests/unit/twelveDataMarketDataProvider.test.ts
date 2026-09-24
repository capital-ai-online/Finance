import { describe, expect, it, vi } from 'vitest';
import { TwelveDataMarketDataProvider } from '../../src/platform/MarketData/providers/TwelveDataMarketDataProvider';

describe('TwelveDataMarketDataProvider', () => {
  it('normalisiert Quotes in den kanonischen Vertrag ohne Realtime-Entitlement anzunehmen', async () => {
    const provider = new TwelveDataMarketDataProvider({
      apiKey: 'test-key',
      nowMs: () => Date.parse('2026-08-15T00:01:00Z'),
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({
        close: '213.42', currency: 'USD', datetime: '2026-08-15T00:00:00Z', exchange: 'NASDAQ',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })) as unknown as typeof fetch,
    });
    const snapshot = await provider.getSnapshot({
      symbol: 'AAPL', assetClass: 'stock', correlationId: 'corr-twelve',
    });
    expect(snapshot).toMatchObject({
      provider: 'TwelveData',
      providerFeed: 'NASDAQ',
      price: 213.42,
      sourceTimestamp: '2026-08-15T00:00:00.000Z',
      qualityState: 'DELAYED',
      isRealtime: false,
      isDelayed: true,
      correlationId: 'corr-twelve',
    });
    expect(snapshot.evidenceId).toContain('quote:twelvedata:AAPL');
  });

  it('formatiert Crypto-Symbole als X/USD-Paar und meldet DELAYED (SC-5 Phase D)', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      close: '61234.50', currency: 'USD', datetime: '2026-08-16T00:00:00Z', exchange: 'Crypto',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const provider = new TwelveDataMarketDataProvider({
      apiKey: 'test-key',
      nowMs: () => Date.parse('2026-08-16T00:01:00Z'),
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const snapshot = await provider.getSnapshot({
      symbol: 'BTC', assetClass: 'crypto', correlationId: 'corr-twelve-crypto',
    });
    expect(snapshot).toMatchObject({
      provider: 'TwelveData',
      price: 61234.5,
      currency: 'USD',
      qualityState: 'DELAYED',
      isRealtime: false,
      isDelayed: true,
      correlationId: 'corr-twelve-crypto',
    });
    const [requestedUrlArg] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const requestedUrl = String(requestedUrlArg ?? '');
    expect(requestedUrl).toContain(encodeURIComponent('BTC/USD'));
  });

  it('weist eine abweichende Crypto-Quotewährung fail-closed zurück', async () => {
    const provider = new TwelveDataMarketDataProvider({
      apiKey: 'test-key',
      nowMs: () => Date.parse('2026-09-24T12:00:01Z'),
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({
        close: '65000', currency: 'USDT', datetime: '2026-09-24T12:00:00Z',
      }), { status: 200 })) as unknown as typeof fetch,
    });
    const result = await provider.getSnapshot({
      symbol: 'BTC', assetClass: 'crypto', correlationId: 'wrong-currency',
    });
    expect(result).toMatchObject({
      qualityState: 'UNAVAILABLE', price: null, evidenceId: null,
    });
  });

  it('schlägt bei fehlendem Secret ohne synthetischen Preis fehl', async () => {
    const previous = process.env.TWELVEDATA_API_KEY;
    delete process.env.TWELVEDATA_API_KEY;
    try {
      const snapshot = await new TwelveDataMarketDataProvider({ apiKey: '' }).getSnapshot({
        symbol: 'AAPL', assetClass: 'stock', correlationId: 'corr-missing',
      });
      expect(snapshot.qualityState).toBe('UNAVAILABLE');
      expect(snapshot.price).toBeNull();
      expect(snapshot.reason).toMatch(/not configured/);
    } finally {
      if (previous === undefined) delete process.env.TWELVEDATA_API_KEY;
      else process.env.TWELVEDATA_API_KEY = previous;
    }
  });

  it('erfindet bei fehlender Provider-Zeit keinen sourceTimestamp', async () => {
    const provider = new TwelveDataMarketDataProvider({
      apiKey: 'test-key',
      nowMs: () => Date.parse('2026-08-15T00:01:00Z'),
      fetchImpl: vi.fn(async () => new Response(JSON.stringify({
        close: '213.42', currency: 'USD', exchange: 'NASDAQ',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })) as unknown as typeof fetch,
    });
    const snapshot = await provider.getSnapshot({
      symbol: 'AAPL', assetClass: 'stock', correlationId: 'corr-missing-time',
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
