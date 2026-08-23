import { describe, expect, it } from 'vitest';
import { SecEdgarCompanyFactsAdapter } from '../../server/secEdgarCompanyFacts';

const nowMs = Date.parse('2026-08-23T15:00:00.000Z');

function fact(
  val: number,
  filed: string,
  end: string,
  accn: string,
  form = '10-Q',
  start?: string,
  frame?: string,
) {
  return { val, filed, end, accn, form, fy: 2026, fp: 'Q2', start, frame };
}

function concept(tag: string, rows: any[], unit = 'USD') {
  return { label: tag, description: tag, units: { [unit]: rows } };
}

function companyFactsFixture() {
  return {
    cik: 789019,
    entityName: 'MICROSOFT CORP',
    facts: {
      'us-gaap': {
        RevenueFromContractWithCustomerExcludingAssessedTax: concept('Revenue', [
          fact(61_000_000_000, '2026-05-01', '2026-03-31', '0000789019-26-000001', '10-Q', '2026-01-01', 'CY2026Q1'),
          fact(65_000_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002', '10-Q', '2026-04-01', 'CY2026Q2'),
        ]),
        NetIncomeLoss: concept('Net income', [fact(22_000_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002', '10-Q', '2026-04-01', 'CY2026Q2')]),
        OperatingIncomeLoss: concept('Operating income', [fact(28_000_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002', '10-Q', '2026-04-01', 'CY2026Q2')]),
        AssetsCurrent: concept('Current assets', [fact(160_000_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002')]),
        LiabilitiesCurrent: concept('Current liabilities', [fact(120_000_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002')]),
        StockholdersEquity: concept('Equity', [fact(300_000_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002')]),
        NetCashProvidedByUsedInOperatingActivities: concept('OCF', [fact(34_000_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002', '10-Q', '2026-01-01')]),
        PaymentsToAcquirePropertyPlantAndEquipment: concept('Capex', [fact(9_000_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002', '10-Q', '2026-01-01')]),
        PaymentsForRepurchaseOfCommonStock: concept('Buybacks', [fact(6_000_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002', '10-Q', '2026-01-01')]),
      },
      dei: {
        EntityCommonStockSharesOutstanding: concept(
          'Shares outstanding',
          [fact(7_400_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002')],
          'shares',
        ),
      },
    },
  };
}

function fakeFetch(fixtures?: { tickers?: any; facts?: any }) {
  const calls: Array<{ url: string; userAgent: string | null }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({ url, userAgent: headers.get('User-Agent') });
    if (url.includes('company_tickers.json')) {
      return new Response(JSON.stringify(fixtures?.tickers ?? {
        0: { cik_str: 789019, ticker: 'MSFT', title: 'MICROSOFT CORP' },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('/companyfacts/')) {
      return new Response(JSON.stringify(fixtures?.facts ?? companyFactsFixture()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('{}', { status: 404 });
  };
  return { fetchImpl, calls };
}

describe('SEC EDGAR CompanyFacts Equity evidence adapter', () => {
  it('bindet aktuelle 10-Q/10-K Facts mit CIK, Filing-Date, Accession und DQ-Provenance', async () => {
    const fake = fakeFetch();
    const adapter = new SecEdgarCompanyFactsAdapter({
      fetchImpl: fake.fetchImpl,
      nowMs: () => nowMs,
      userAgent: 'CAPITAL-AI test@example.com',
      minRequestGapMs: 0,
    });

    const result = await adapter.fetchEvidence({ symbol: 'msft' });

    expect(result.status).toBe('READY');
    expect(result.symbol).toBe('MSFT');
    expect(result.cik).toBe('0000789019');
    expect(result.entityName).toBe('MICROSOFT CORP');
    expect(result.facts.revenue?.value).toBe(65_000_000_000);
    expect(result.facts.revenue?.context).toBe('periodic');
    expect(result.facts.operatingCashFlow?.context).toBe('ytd');
    expect(result.facts.currentAssets?.context).toBe('instant');
    expect(result.facts.revenue?.filedAt).toBe('2026-08-01T00:00:00.000Z');
    expect(result.facts.revenue?.periodEnd).toBe('2026-06-30T00:00:00.000Z');
    expect(result.facts.revenue?.accession).toBe('0000789019-26-000002');
    expect(result.facts.revenue?.evidence.qualityStatus).toBe('VERIFIED');
    expect(result.facts.revenue?.evidence.assetId).toBe('stock:MSFT');
    expect(result.facts.shareRepurchases?.evidence.evidenceRef).toContain('sec-edgar:0000789019:');
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
    expect(fake.calls).toHaveLength(2);
    expect(fake.calls.every(call => call.userAgent === 'CAPITAL-AI test@example.com')).toBe(true);
  });

  it('selektiert im selben 10-Q Quartalswerte für periodic und kumulative Werte für YTD deterministisch', async () => {
    const body = companyFactsFixture();
    body.facts['us-gaap'].RevenueFromContractWithCustomerExcludingAssessedTax = concept('Revenue', [
      fact(125_000_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002', '10-Q', '2026-01-01'),
      fact(65_000_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002', '10-Q', '2026-04-01', 'CY2026Q2'),
    ]);
    body.facts['us-gaap'].NetCashProvidedByUsedInOperatingActivities = concept('OCF', [
      fact(18_000_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002', '10-Q', '2026-04-01'),
      fact(34_000_000_000, '2026-08-01', '2026-06-30', '0000789019-26-000002', '10-Q', '2026-01-01'),
    ]);
    const fake = fakeFetch({ facts: body });
    const adapter = new SecEdgarCompanyFactsAdapter({
      fetchImpl: fake.fetchImpl,
      nowMs: () => nowMs,
      userAgent: 'CAPITAL-AI test@example.com',
      minRequestGapMs: 0,
    });

    const result = await adapter.fetchEvidence({ symbol: 'MSFT' });

    expect(result.facts.revenue?.value).toBe(65_000_000_000);
    expect(result.facts.revenue?.periodStart).toBe('2026-04-01T00:00:00.000Z');
    expect(result.facts.operatingCashFlow?.value).toBe(34_000_000_000);
    expect(result.facts.operatingCashFlow?.periodStart).toBe('2026-01-01T00:00:00.000Z');
  });

  it('verhindert Look-Ahead und wählt für ein historisches asOf nur bereits eingereichte Facts', async () => {
    const fake = fakeFetch();
    const adapter = new SecEdgarCompanyFactsAdapter({
      fetchImpl: fake.fetchImpl,
      nowMs: () => nowMs,
      userAgent: 'CAPITAL-AI test@example.com',
      minRequestGapMs: 0,
    });

    const result = await adapter.fetchEvidence({ symbol: 'MSFT', asOf: '2026-06-01T00:00:00.000Z' });

    expect(result.facts.revenue?.value).toBe(61_000_000_000);
    expect(result.facts.revenue?.filedAt).toBe('2026-05-01T00:00:00.000Z');
    expect(result.facts.revenue?.periodEnd).toBe('2026-03-31T00:00:00.000Z');
  });

  it('markiert alte Filing-Evidence als STALE statt sie als aktuelle Fundamentals zu deklarieren', async () => {
    const oldFacts = companyFactsFixture();
    const staleRow = fact(50_000_000_000, '2025-10-01', '2025-09-30', '0000789019-25-000099', '10-Q', '2025-07-01');
    oldFacts.facts['us-gaap'] = {
      RevenueFromContractWithCustomerExcludingAssessedTax: concept('Revenue', [staleRow]),
    } as any;
    oldFacts.facts.dei = {} as any;
    const fake = fakeFetch({ facts: oldFacts });
    const adapter = new SecEdgarCompanyFactsAdapter({
      fetchImpl: fake.fetchImpl,
      nowMs: () => nowMs,
      userAgent: 'CAPITAL-AI test@example.com',
      minRequestGapMs: 0,
    });

    const result = await adapter.fetchEvidence({ symbol: 'MSFT' });

    expect(result.status).toBe('STALE');
    expect(result.facts.revenue?.evidence.qualityStatus).toBe('STALE');
    expect(result.staleFields).toContain('revenue');
  });

  it('cached Ticker- und CompanyFacts-Antworten erzeugen keine zusätzlichen SEC Requests', async () => {
    const fake = fakeFetch();
    const adapter = new SecEdgarCompanyFactsAdapter({
      fetchImpl: fake.fetchImpl,
      nowMs: () => nowMs,
      userAgent: 'CAPITAL-AI test@example.com',
      minRequestGapMs: 0,
    });

    await adapter.fetchEvidence({ symbol: 'MSFT' });
    await adapter.fetchEvidence({ symbol: 'MSFT' });

    expect(fake.calls).toHaveLength(2);
  });

  it('arbeitet fail-closed wenn der von der SEC verlangte deklarierte User-Agent fehlt', async () => {
    const fake = fakeFetch();
    const adapter = new SecEdgarCompanyFactsAdapter({
      fetchImpl: fake.fetchImpl,
      nowMs: () => nowMs,
      userAgent: '',
      minRequestGapMs: 0,
    });

    const result = await adapter.fetchEvidence({ symbol: 'MSFT' });

    expect(result.status).toBe('SOURCE_UNAVAILABLE');
    expect(result.reason).toBe('SEC_EDGAR_USER_AGENT_NOT_CONFIGURED');
    expect(fake.calls).toHaveLength(0);
  });

  it('erfindet keine CIK-Zuordnung für nicht gemappte Ticker', async () => {
    const fake = fakeFetch({ tickers: {} });
    const adapter = new SecEdgarCompanyFactsAdapter({
      fetchImpl: fake.fetchImpl,
      nowMs: () => nowMs,
      userAgent: 'CAPITAL-AI test@example.com',
      minRequestGapMs: 0,
    });

    const result = await adapter.fetchEvidence({ symbol: 'UNKNOWN' });

    expect(result.status).toBe('SOURCE_UNAVAILABLE');
    expect(result.reason).toBe('SEC_TICKER_CIK_MAPPING_UNAVAILABLE');
    expect(result.cik).toBeNull();
  });
});
