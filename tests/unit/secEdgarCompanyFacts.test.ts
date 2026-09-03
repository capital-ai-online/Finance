import { describe, expect, it, vi } from 'vitest';
import { SecEdgarCompanyFactsAdapter } from '../../server/secEdgarCompanyFacts';

const baseNow = Date.parse('2026-08-28T12:00:00.000Z');

function response(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}

function fixture() {
  return {
    entityName: 'Example Corp',
    facts: {
      'us-gaap': {
        RevenueFromContractWithCustomerExcludingAssessedTax: {
          units: {
            USD: [
              { start: '2025-01-01', end: '2025-12-31', val: 888, accn: '0000a', form: '10-K/A', filed: '2026-08-10' },
              { start: '2026-01-01', end: '2026-06-30', val: 999, accn: '0001', form: '10-Q', filed: '2026-08-05' },
              { start: '2026-04-01', end: '2026-06-30', val: 120, accn: '0001', form: '10-Q', filed: '2026-08-05' },
              { start: '2026-07-01', end: '2026-09-30', val: 140, accn: '0002', form: '10-Q', filed: '2026-11-05' },
            ],
          },
        },
        AssetsCurrent: { units: { USD: [{ end: '2026-06-30', val: 300, accn: '0001', form: '10-Q', filed: '2026-08-05' }] } },
        LiabilitiesCurrent: { units: { USD: [{ end: '2026-06-30', val: 150, accn: '0001', form: '10-Q', filed: '2026-08-05' }] } },
        StockholdersEquity: { units: { USD: [{ end: '2026-06-30', val: 500, accn: '0001', form: '10-Q', filed: '2026-08-05' }] } },
        NetCashProvidedByUsedInOperatingActivities: { units: { USD: [{ start: '2026-01-01', end: '2026-06-30', val: 80, accn: '0001', form: '10-Q', filed: '2026-08-05' }] } },
      },
      dei: {},
    },
  };
}

describe('SEC EDGAR CompanyFacts P1-B adapter', () => {
  it('fails closed without a responsible Fair-Access User-Agent', async () => {
    const fetchImpl = vi.fn();
    const adapter = new SecEdgarCompanyFactsAdapter({ fetchImpl: fetchImpl as typeof fetch, userAgent: '', nowMs: () => baseNow });
    const result = await adapter.fetchEvidence({ symbol: 'AAPL', asOf: '2026-08-28T12:00:00.000Z' });
    expect(result.status).toBe('SOURCE_UNAVAILABLE');
    expect(result.reason).toBe('SEC_EDGAR_USER_AGENT_NOT_CONFIGURED');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('enforces PIT/context gates and prefers the newest reporting period over a later old-period amendment', async () => {
    let now = baseNow;
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('company_tickers')) return response({ 0: { cik_str: 320193, ticker: 'AAPL', title: 'Apple Inc.' } });
      return response(fixture());
    });
    const adapter = new SecEdgarCompanyFactsAdapter({
      fetchImpl: fetchImpl as typeof fetch,
      userAgent: 'CAPITAL-AI support@capital-ai.online',
      nowMs: () => (now += 250),
    });
    const result = await adapter.fetchEvidence({ symbol: 'AAPL', asOf: '2026-08-28T12:00:00.000Z' });
    expect(result.facts.revenue?.value).toBe(120);
    expect(result.facts.revenue?.filedAt).toBe('2026-08-05T00:00:00.000Z');
    expect(result.facts.revenue?.periodStart).toBe('2026-04-01T00:00:00.000Z');
    expect(result.facts.revenue?.periodEnd).toBe('2026-06-30T00:00:00.000Z');
    expect(result.facts.revenue?.evidence.assetId).toBe('stock:AAPL');
    expect(result.facts.revenue?.evidence.qualityStatus).toBe('VERIFIED');
  });

  it('rejects invalid and future as-of timestamps without provider access', async () => {
    const fetchImpl = vi.fn();
    const adapter = new SecEdgarCompanyFactsAdapter({
      fetchImpl: fetchImpl as typeof fetch,
      userAgent: 'CAPITAL-AI support@capital-ai.online',
      nowMs: () => baseNow,
    });
    expect((await adapter.fetchEvidence({ symbol: 'AAPL', asOf: 'not-a-date' })).reason).toBe('SEC_EDGAR_INVALID_ASOF');
    expect((await adapter.fetchEvidence({ symbol: 'AAPL', asOf: '2027-01-01T00:00:00.000Z' })).reason).toBe('SEC_EDGAR_FUTURE_ASOF_REJECTED');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
