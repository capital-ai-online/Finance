// Audit ARCH-AUDIT-0002 (J1-Folge): Testabdeckung fuer den FMP-Index-Cache (Cooldown, TTL,
// Symbol-Zuordnung). global.fetch wird gestubbt, kein echter Netzwerkzugriff.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { fmpKeyState } = vi.hoisted(() => ({ fmpKeyState: { value: 'test-key' } }));

vi.mock('../../server/env', () => ({
  getCleanEnv: (key: string) => (key === 'FMP_API_KEY' ? fmpKeyState.value : ''),
}));

describe('fmpIndices', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    fmpKeyState.value = 'test-key';
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('bildet die bestehenden Index-Symbole auf FMP-Ticker ab', async () => {
    const { INDEX_FMP_TICKERS } = await import('../../server/fmpIndices');
    expect(INDEX_FMP_TICKERS.GSPC).toBe('^GSPC');
    expect(INDEX_FMP_TICKERS.VIX).toBe('^VIX');
    expect(Object.keys(INDEX_FMP_TICKERS).length).toBeGreaterThan(20);
  });

  it('liefert undefined fuer ein unbekanntes Symbol ohne FMP aufzurufen', async () => {
    const { ensureIndexQuoteFresh, getCachedIndexQuote } = await import('../../server/fmpIndices');
    await ensureIndexQuoteFresh('NOTAREALINDEX');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getCachedIndexQuote('NOTAREALINDEX')).toBeUndefined();
  });

  it('cached ein erfolgreiches Quote-Ergebnis fuer ein bekanntes Index-Symbol', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ symbol: '^GSPC', price: 7489.72, changePercentage: 0.7 }],
    });
    const { ensureIndexQuoteFresh, getCachedIndexQuote } = await import('../../server/fmpIndices');

    expect(getCachedIndexQuote('GSPC')).toBeUndefined();
    await ensureIndexQuoteFresh('GSPC');
    const quote = getCachedIndexQuote('GSPC');
    expect(quote?.price).toBe(7489.72);
    expect(quote?.change24h).toBe(0.7);
  });

  it('ruft FMP innerhalb des globalen Cooldowns kein zweites Mal auf', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ symbol: '^GSPC', price: 100, changePercentage: 1 }],
    });
    const { ensureIndexQuoteFresh } = await import('../../server/fmpIndices');

    await ensureIndexQuoteFresh('GSPC');
    await ensureIndexQuoteFresh('IXIC'); // anderes Symbol, aber Cooldown ist global
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('macht nichts ohne konfigurierten FMP_API_KEY', async () => {
    fmpKeyState.value = '';
    const { ensureIndexQuoteFresh, getCachedIndexQuote } = await import('../../server/fmpIndices');

    await ensureIndexQuoteFresh('GSPC');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getCachedIndexQuote('GSPC')).toBeUndefined();
  });

  it('cached eine erfolgreiche Historie-Antwort, sortiert nach Datum', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        { symbol: '^GSPC', date: '2026-07-31', price: 7489.72 },
        { symbol: '^GSPC', date: '2026-07-29', price: 7316.15 },
        { symbol: '^GSPC', date: '2026-07-30', price: 7437.63 },
      ],
    });
    const { ensureIndexHistoryFresh, getCachedIndexHistory } = await import('../../server/fmpIndices');

    await ensureIndexHistoryFresh('GSPC');
    const points = getCachedIndexHistory('GSPC');
    expect(points?.map(p => p.date)).toEqual(['2026-07-29', '2026-07-30', '2026-07-31']);
    expect(points?.[2].close).toBe(7489.72);
  });
});
