import { describe, expect, it, vi } from 'vitest';
import { createFmpIndexProviderStage } from '../../server/marketData/fmpIndexProviderStage';

describe('fmpIndexProviderStage', () => {
  const fallbackAssets = [
    { symbol: 'GSPC', name: 'S&P 500', type: 'index', price: 5000, change24h: 0, dataSource: 'fallback' as const },
    { symbol: 'IXIC', name: 'NASDAQ', type: 'index', price: 17000, change24h: 0, dataSource: 'fallback' as const },
  ];

  it('emits only indexes with a usable cached quote', async () => {
    const stage = createFmpIndexProviderStage({
      indexSymbols: ['GSPC', 'IXIC'],
      fallbackAssets,
      ensureQuoteFresh: vi.fn(async () => undefined),
      ensureHistoryFresh: vi.fn(async () => undefined),
      getCachedQuote: (symbol) => symbol === 'GSPC' ? { price: 5525.4, change24h: 0.72 } : undefined,
    });

    const assets = await stage.load();
    expect(assets).toEqual([
      expect.objectContaining({ symbol: 'GSPC', price: 5525.4, change24h: 0.72, dataSource: 'live', status: 'Verifiziert' }),
    ]);
  });

  it('does not block quote delivery on history refresh', async () => {
    const ensureHistoryFresh = vi.fn(() => new Promise<void>(() => undefined));
    const stage = createFmpIndexProviderStage({
      indexSymbols: ['GSPC'],
      fallbackAssets,
      ensureQuoteFresh: vi.fn(async () => undefined),
      ensureHistoryFresh,
      getCachedQuote: () => ({ price: 5500, change24h: 0.1 }),
    });

    const assets = await stage.load();
    expect(assets).toHaveLength(1);
    expect(ensureHistoryFresh).toHaveBeenCalledWith('GSPC');
  });

  it('returns no live asset when cache has no usable quote', async () => {
    const stage = createFmpIndexProviderStage({
      indexSymbols: ['GSPC'],
      fallbackAssets,
      ensureQuoteFresh: vi.fn(async () => undefined),
      ensureHistoryFresh: vi.fn(async () => undefined),
      getCachedQuote: () => undefined,
    });

    await expect(stage.load()).resolves.toEqual([]);
  });
});
