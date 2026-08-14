import { describe, expect, it, vi } from 'vitest';
import { observeAlpacaStockQuote } from '../../src/services/alpacaShadowProvider';

const now = Date.parse('2026-08-14T12:00:00.000Z');
const response = (price: number, observedAt = '2026-08-14T11:59:30.000Z', ok = true, status = 200) =>
  ({ ok, status, json: async () => ({ trade: { p: price, t: observedAt } }) }) as Response;

describe('Alpaca Shadow Provider', () => {
  it('bleibt ohne Credentials inaktiv und ruft keine API auf', async () => {
    const fetchImpl = vi.fn();
    const result = await observeAlpacaStockQuote('AAPL', undefined, { fetchImpl, apiKeyId: '', apiSecretKey: '', nowMs: () => now });
    expect(result.state).toBe('NOT_CONFIGURED');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('liest IEX read-only und liefert frische Evidenz', async () => {
    const fetchImpl = vi.fn(async () => response(100));
    const result = await observeAlpacaStockQuote('aapl.us', { price: 100.5, provider: 'Twelve Data' }, {
      fetchImpl: fetchImpl as any, apiKeyId: 'key-id', apiSecretKey: 'secret', feed: 'iex', nowMs: () => now,
    });
    expect(result).toMatchObject({ state: 'READY', symbol: 'AAPL', feed: 'iex', price: 100, canonicalProvider: 'Twelve Data' });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(url).toContain('/stocks/AAPL/trades/latest?feed=iex');
    expect(headers['APCA-API-KEY-ID']).toBe('key-id');
    expect(headers['APCA-API-SECRET-KEY']).toBe('secret');
  });

  it('markiert alte Beobachtungen als STALE', async () => {
    const result = await observeAlpacaStockQuote('AAPL', { price: 100, provider: 'Twelve Data' }, {
      fetchImpl: (async () => response(100, '2026-08-14T11:50:00.000Z')) as any,
      apiKeyId: 'id', apiSecretKey: 'secret', nowMs: () => now, maxAgeMs: 90_000,
    });
    expect(result.state).toBe('STALE');
  });

  it('markiert Abweichungen oberhalb des Schwellwerts als DEGRADED', async () => {
    const result = await observeAlpacaStockQuote('AAPL', { price: 100, provider: 'Twelve Data' }, {
      fetchImpl: (async () => response(103)) as any,
      apiKeyId: 'id', apiSecretKey: 'secret', nowMs: () => now, maxDeviationPct: 1,
    });
    expect(result.state).toBe('DEGRADED');
    expect(result.deviationPct).toBe(3);
  });

  it('gibt API-Fehler ohne Secret-Inhalt als UNAVAILABLE aus', async () => {
    const result = await observeAlpacaStockQuote('AAPL', undefined, {
      fetchImpl: (async () => response(0, '', false, 401)) as any,
      apiKeyId: 'id', apiSecretKey: 'super-secret-value', nowMs: () => now,
    });
    expect(result.state).toBe('UNAVAILABLE');
    expect(result.reason).toBe('HTTP 401');
    expect(JSON.stringify(result)).not.toContain('super-secret-value');
  });
});
