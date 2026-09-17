// Audit ARCH-AUDIT-0002 (H1): Testabdeckung fuer den Alpha-Vantage-Fundamentaldaten-Cache
// (Cooldown, TTL, Rate-Limit-Behandlung). global.fetch wird gestubbt, kein echter Netzwerkzugriff.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../server/env', () => ({
  getCleanEnv: vi.fn((key: string) => (key === 'ALPHA_VANTAGE_KEY' ? 'test-key' : '')),
}));

describe('stockFundamentals', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('cached ein erfolgreiches OVERVIEW-Ergebnis und liefert es ueber getCachedFundamentals', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ PERatio: '25.5', DividendYield: '0.015', ProfitMargin: '0.22' }),
    });
    const { ensureFundamentalsFresh, getCachedFundamentals } = await import('../../server/stockFundamentals');

    expect(getCachedFundamentals('AAPL')).toBeUndefined();
    await ensureFundamentalsFresh('AAPL');
    const cached = getCachedFundamentals('AAPL');
    expect(cached?.peRatio).toBe(25.5);
    expect(cached?.dividendYieldPct).toBeCloseTo(1.5, 5);
    expect(cached?.profitMarginPct).toBeCloseTo(22, 5);
  });

  it('ignoriert eine Alpha-Vantage-Ratenlimit-Antwort ("Note") und cached nichts', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ Note: 'Thank you for using Alpha Vantage! ... rate limit ...' }),
    });
    const { ensureFundamentalsFresh, getCachedFundamentals } = await import('../../server/stockFundamentals');

    await ensureFundamentalsFresh('AAPL');
    expect(getCachedFundamentals('AAPL')).toBeUndefined();
  });

  it('ruft Alpha Vantage innerhalb des Cooldowns kein zweites Mal auf', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ PERatio: '18', DividendYield: '0.02', ProfitMargin: '0.1' }),
    });
    const { ensureFundamentalsFresh } = await import('../../server/stockFundamentals');

    await ensureFundamentalsFresh('AAPL');
    await ensureFundamentalsFresh('MSFT'); // anderes Symbol, aber Cooldown ist global
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('macht nichts ohne konfigurierten ALPHA_VANTAGE_KEY', async () => {
    vi.doMock('../../server/env', () => ({ getCleanEnv: vi.fn(() => '') }));
    const { ensureFundamentalsFresh, getCachedFundamentals } = await import('../../server/stockFundamentals');

    await ensureFundamentalsFresh('AAPL');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getCachedFundamentals('AAPL')).toBeUndefined();
  });
});
