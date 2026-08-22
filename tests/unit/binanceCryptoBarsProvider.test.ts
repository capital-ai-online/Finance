import { describe, expect, it, vi } from 'vitest';
import { BinanceCryptoBarsProvider } from '../../src/platform/MarketData/providers/BinanceCryptoBarsProvider';

describe('BinanceCryptoBarsProvider', () => {
  it('maps verified Binance Spot 4h klines into the canonical history contract', async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      expect(String(input)).toContain('symbol=BTCUSDT');
      expect(String(input)).toContain('interval=4h');
      expect(String(input)).toContain('limit=3');
      return new Response(JSON.stringify([
        [1_774_000_000_000, '1', '2', '0.5', '64000'],
        [1_774_014_400_000, '1', '2', '0.5', '64500'],
        [1_774_028_800_000, '1', '2', '0.5', '65000'],
      ]), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as unknown as typeof fetch;

    const provider = new BinanceCryptoBarsProvider({ fetchImpl, nowMs: () => 1_774_030_000_000 });
    const result = await provider.getHistory({
      symbol: 'btc',
      assetClass: 'crypto',
      correlationId: 'corr-4h',
      barInterval: '4h',
      maxPoints: 3,
    });

    expect(result.qualityState).toBe('HISTORICAL');
    expect(result.provider).toBe('Binance');
    expect(result.providerFeed).toBe('spot/klines/4h');
    expect(result.barInterval).toBe('4h');
    expect(result.points.map(point => point.close)).toEqual([64000, 64500, 65000]);
    expect(result.evidenceId).toContain('history:binance:BTCUSDT:4h:');
  });

  it('fails closed for non-crypto requests instead of substituting synthetic bars', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const provider = new BinanceCryptoBarsProvider({ fetchImpl });
    const result = await provider.getHistory({
      symbol: 'AAPL',
      assetClass: 'stock',
      correlationId: 'corr-stock',
      barInterval: '4h',
    });

    expect(result.qualityState).toBe('UNAVAILABLE');
    expect(result.points).toEqual([]);
    expect(result.evidenceId).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
