import { describe, expect, it, vi } from 'vitest';
import { AlpacaMarketDataProvider } from '../../src/platform/MarketData/providers/AlpacaMarketDataProvider';

const now = Date.parse('2026-08-14T12:00:00.000Z');

describe('P1 AlpacaMarketDataProvider', () => {
  it('normalisiert einen Alpaca-Trade in den kanonischen Snapshot-Vertrag', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ trade: { p: 101.25, t: '2026-08-14T11:59:30.000Z' } }),
    } as Response));
    const provider = new AlpacaMarketDataProvider({
      fetchImpl: fetchImpl as any,
      apiKeyId: 'key-id',
      apiSecretKey: 'secret-value',
      nowMs: () => now,
    });
    const result = await provider.getSnapshot({
      symbol: 'aapl.us',
      assetClass: 'stock',
      correlationId: 'corr-alpaca',
    });
    expect(result).toMatchObject({
      provider: 'Alpaca',
      providerFeed: 'iex',
      symbol: 'AAPL',
      assetClass: 'stock',
      currency: 'USD',
      qualityState: 'LIVE',
      price: 101.25,
      correlationId: 'corr-alpaca',
    });
    expect(result.evidenceId).toContain('quote:alpaca:iex:AAPL:');
    expect(JSON.stringify(result)).not.toContain('secret-value');
  });

  it('liefert ohne Credentials UNAVAILABLE und keine erfundenen Daten', async () => {
    const fetchImpl = vi.fn();
    const provider = new AlpacaMarketDataProvider({
      fetchImpl,
      apiKeyId: '',
      apiSecretKey: '',
      nowMs: () => now,
    });
    const result = await provider.getSnapshot({
      symbol: 'AAPL',
      assetClass: 'stock',
      correlationId: 'corr-missing',
    });
    expect(result).toMatchObject({
      qualityState: 'UNAVAILABLE',
      price: null,
      evidenceId: null,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('bleibt als Shadow-Provider registriert', () => {
    const provider = new AlpacaMarketDataProvider();
    expect(provider.descriptor.role).toBe('shadow');
    expect(provider.descriptor.capabilities).toContain('snapshot');
  });
});
