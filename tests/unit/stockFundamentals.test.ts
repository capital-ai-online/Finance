// Audit ARCH-AUDIT-0002 (H1): Testabdeckung fuer den Alpha-Vantage-Fundamentaldaten-Cache
// (Cooldown, TTL, Rate-Limit-Behandlung). global.fetch wird gestubbt, kein echter Netzwerkzugriff.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../server/env', () => ({
  // FMP remains intentionally absent in these tests so Alpha credential semantics are isolated.
  getCleanEnv: vi.fn(() => ''),
}));

const ORIGINAL_CANONICAL = process.env.ALPHA_VANTAGE_API_KEY;
const ORIGINAL_LEGACY = process.env.ALPHA_VANTAGE_KEY;

function restoreEnv(name: 'ALPHA_VANTAGE_API_KEY' | 'ALPHA_VANTAGE_KEY', value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

describe('stockFundamentals', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.ALPHA_VANTAGE_API_KEY;
    delete process.env.ALPHA_VANTAGE_KEY;
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T12:00:00Z'));
  });

  afterEach(() => {
    restoreEnv('ALPHA_VANTAGE_API_KEY', ORIGINAL_CANONICAL);
    restoreEnv('ALPHA_VANTAGE_KEY', ORIGINAL_LEGACY);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('caches an OVERVIEW result when only the canonical credential is configured', async () => {
    process.env.ALPHA_VANTAGE_API_KEY = 'canonical-only-test-key';
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
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('apikey=canonical-only-test-key');
  });

  it('ignores an Alpha Vantage rate-limit response and caches no evidence', async () => {
    process.env.ALPHA_VANTAGE_API_KEY = 'canonical-rate-limit-test-key';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ Note: 'Thank you for using Alpha Vantage! ... rate limit ...' }),
    });
    const { ensureFundamentalsFresh, getCachedFundamentals } = await import('../../server/stockFundamentals');

    await ensureFundamentalsFresh('AAPL');
    expect(getCachedFundamentals('AAPL')).toBeUndefined();
  });

  it('does not call Alpha Vantage a second time inside the global cooldown', async () => {
    process.env.ALPHA_VANTAGE_API_KEY = 'canonical-cooldown-test-key';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ PERatio: '18', DividendYield: '0.02', ProfitMargin: '0.1' }),
    });
    const { ensureFundamentalsFresh } = await import('../../server/stockFundamentals');

    await ensureFundamentalsFresh('AAPL');
    await ensureFundamentalsFresh('MSFT');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps Alpha Vantage unavailable when only the legacy credential is configured', async () => {
    process.env.ALPHA_VANTAGE_KEY = 'legacy-only-test-key';
    const { ensureFundamentalsFresh, getCachedFundamentals } = await import('../../server/stockFundamentals');
    const { getProviderHealth } = await import('../../src/platform/Supervisor/providerHealth');

    await ensureFundamentalsFresh('AAPL');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getCachedFundamentals('AAPL')).toBeUndefined();
    expect(getProviderHealth()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        provider: 'AlphaVantage',
        capability: 'stock-fundamentals',
        state: 'unavailable',
        message: 'ALPHA_VANTAGE_API_KEY is not configured.',
      }),
    ]));
  });

  it('keeps Alpha Vantage unavailable when both credential names are absent', async () => {
    const { ensureFundamentalsFresh, getCachedFundamentals } = await import('../../server/stockFundamentals');
    const { getProviderHealth } = await import('../../src/platform/Supervisor/providerHealth');

    await ensureFundamentalsFresh('AAPL');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getCachedFundamentals('AAPL')).toBeUndefined();
    expect(getProviderHealth()).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: 'AlphaVantage', state: 'unavailable' }),
    ]));
  });

  it('consumes only the canonical credential when canonical and legacy names are both set', async () => {
    process.env.ALPHA_VANTAGE_API_KEY = 'canonical-wins-test-key';
    process.env.ALPHA_VANTAGE_KEY = 'legacy-must-not-be-used';
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ PERatio: '21', DividendYield: '0.01', ProfitMargin: '0.19' }),
    });
    const { ensureFundamentalsFresh } = await import('../../server/stockFundamentals');

    await ensureFundamentalsFresh('AAPL');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(requestUrl).toContain('apikey=canonical-wins-test-key');
    expect(requestUrl).not.toContain('legacy-must-not-be-used');
  });

  it('redacts canonical credentials from provider-health diagnostics on transport failure', async () => {
    const credential = 'canonical-diagnostic-test-key';
    process.env.ALPHA_VANTAGE_API_KEY = credential;
    fetchMock.mockRejectedValue(new Error(`transport failure https://www.alphavantage.co/query?apikey=${credential}`));
    const { ensureFundamentalsFresh, getCachedFundamentals } = await import('../../server/stockFundamentals');
    const { getProviderHealth } = await import('../../src/platform/Supervisor/providerHealth');

    await ensureFundamentalsFresh('AAPL');

    expect(getCachedFundamentals('AAPL')).toBeUndefined();
    const healthJson = JSON.stringify(getProviderHealth());
    expect(healthJson).not.toContain(credential);
    expect(healthJson).toContain('apikey=[REDACTED]');
  });
});
