import { beforeEach, describe, expect, it, vi } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: { quote: { price: 7489.72, change24h: 0.7, fetchedAt: Date.parse('2026-08-15T00:04:00Z') } as any },
}));

vi.mock('../../server/fmpIndices', () => ({
  INDEX_FMP_TICKERS: { GSPC: '^GSPC' },
  ensureIndexQuoteFresh: vi.fn(async () => undefined),
  getCachedIndexQuote: vi.fn(() => state.quote),
}));

describe('traditional index quote gateway compatibility', () => {
  beforeEach(() => {
    vi.resetModules();
    state.quote = { price: 7489.72, change24h: 0.7, fetchedAt: Date.parse('2026-08-15T00:04:00Z') };
  });

  it('liefert den bestehenden Traditional-Quote-Vertrag über den Gateway', async () => {
    const { fetchVerifiedTraditionalQuote } = await import('../../src/services/traditionalQuoteEvidence');
    const quote = await fetchVerifiedTraditionalQuote('GSPC', 'index', {
      nowMs: () => Date.parse('2026-08-15T00:05:00Z'),
    });
    expect(quote).toMatchObject({
      status: 'READY',
      symbol: 'GSPC',
      assetClass: 'index',
      price: 7489.72,
      provider: 'FMP',
      providers: ['FMP'],
      alertEligible: true,
      executionPriceEligible: false,
    });
    expect(quote.evidenceIds[0]).toContain('quote:fmp:GSPC');
  });

  it('bleibt bei fehlender FMP-Evidence fail-closed', async () => {
    state.quote = null;
    const { fetchVerifiedTraditionalQuote } = await import('../../src/services/traditionalQuoteEvidence');
    const quote = await fetchVerifiedTraditionalQuote('GSPC', 'index');
    expect(quote.status).toBe('SOURCE_UNAVAILABLE');
    expect(quote.price).toBeNull();
    expect(quote.alertEligible).toBe(false);
    expect(quote.evidenceIds).toEqual([]);
  });
});
