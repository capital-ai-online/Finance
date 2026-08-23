import { describe, expect, it } from 'vitest';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import {
  EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  type EquityClassification,
} from '../../src/platform/Scoring/EquityModelContracts';
import type { FinancialFieldProvenance } from '../../src/types/financialProvenance';
import type { VerifiedTraditionalFallbackHistory } from '../../src/services/traditionalHistoryFallback';
import type { StockFundamentals } from '../../server/stockFundamentals';
import type { SecEdgarCompanyFactsResult, SecEdgarRawField } from '../../server/secEdgarCompanyFacts';
import {
  EQUITY_RESEARCH_HISTORY_WINDOW_DAYS,
  runEquityResearchChallenger,
  type EquityResearchRuntimeDependencies,
} from '../../server/equityResearchRuntime';

const evaluatedAt = '2026-08-23T15:00:00.000Z';
const observedAt = '2026-06-30T00:00:00.000Z';
const filedAt = '2026-07-25T00:00:00.000Z';
const retrievedAt = '2026-08-23T14:00:00.000Z';

const classification: EquityClassification = {
  contractVersion: EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  industry: {
    scheme: 'internal',
    sector: 'Information Technology',
    industry: 'Software',
    source: 'governed-rule:test',
  },
  sizeBucket: 'mega',
  styleTags: ['quality', 'growth'],
  primaryProfile: 'quality-growth',
  classificationSource: 'governed-rule',
};

function provenance(field: string, value: number, provider: FinancialFieldProvenance['provider'] = 'AlphaVantage'): FinancialFieldProvenance {
  return {
    field,
    provider,
    sourcePath: `https://example.test/${provider}/${field}`,
    retrievedAt,
    observedAt,
    value,
  };
}

function fundamentals(): StockFundamentals {
  const values = {
    peRatio: 20,
    priceToBookRatio: 3,
    dividendYieldPct: 1.2,
    profitMarginPct: 20,
    operatingMarginPct: 22,
    returnOnEquityPct: 25,
    quarterlyRevenueGrowthPct: 15,
    quarterlyEarningsGrowthPct: 18,
    debtToEquity: 0.8,
    epsTtm: 10,
    freeCashFlowPerShare: 8,
  } as const;
  return {
    ...values,
    fetchedAt: Date.parse(retrievedAt),
    provenance: [
      provenance('peRatio', values.peRatio),
      provenance('priceToBookRatio', values.priceToBookRatio),
      provenance('dividendYieldPct', values.dividendYieldPct),
      provenance('profitMarginPct', values.profitMarginPct),
      provenance('operatingMarginPct', values.operatingMarginPct),
      provenance('returnOnEquityPct', values.returnOnEquityPct),
      provenance('quarterlyRevenueGrowthPct', values.quarterlyRevenueGrowthPct),
      provenance('quarterlyEarningsGrowthPct', values.quarterlyEarningsGrowthPct),
      provenance('debtToEquity', values.debtToEquity, 'FMP'),
      provenance('epsTtm', values.epsTtm),
      provenance('freeCashFlowPerShare', values.freeCashFlowPerShare, 'FMP'),
    ],
  };
}

function verifiedHistory(): VerifiedTraditionalFallbackHistory {
  const start = Date.parse('2025-12-06T00:00:00.000Z');
  const points = Array.from({ length: 260 }, (_, index) => {
    const date = new Date(start + index * 24 * 60 * 60 * 1000);
    return { date: date.toISOString().slice(0, 10), close: 100 + index * 0.5 };
  });
  return {
    provider: 'TwelveData',
    closes: points.map(point => point.close),
    points,
    sourcePath: 'https://api.twelvedata.com/time_series',
    retrievedAt,
  };
}

function secMarketEvidence(field: string): MarketEvidenceQualityRecord {
  return {
    assetId: 'stock:MSFT',
    providerId: 'sec-edgar',
    capability: 'companyfacts',
    field,
    observedAt: filedAt,
    retrievedAt,
    freshness: {
      ageMs: Date.parse(evaluatedAt) - Date.parse(filedAt),
      maxAgeMs: 190 * 24 * 60 * 60 * 1000,
      evaluatedAt,
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: 'VERIFIED',
    evidenceRef: `sec-edgar:0000789019:${field}`,
  };
}

function secEvidence(): SecEdgarCompanyFactsResult {
  const instant = (field: SecEdgarRawField, value: number) => ({
    field,
    value,
    unit: 'USD',
    taxonomy: 'us-gaap',
    tag: field,
    context: 'instant' as const,
    periodStart: null,
    periodEnd: observedAt,
    filedAt,
    form: '10-Q',
    accession: '0000789019-26-000001',
    frame: null,
    evidence: secMarketEvidence(field),
  });
  const periodic = (field: SecEdgarRawField, value: number) => ({
    field,
    value,
    unit: 'USD',
    taxonomy: 'us-gaap',
    tag: field,
    context: 'periodic' as const,
    periodStart: '2026-04-01T00:00:00.000Z',
    periodEnd: observedAt,
    filedAt,
    form: '10-Q',
    accession: '0000789019-26-000001',
    frame: null,
    evidence: secMarketEvidence(field),
  });

  return {
    contractVersion: 'sec-edgar-companyfacts-evidence/0.1.0',
    status: 'PARTIAL',
    symbol: 'MSFT',
    cik: '0000789019',
    entityName: 'Microsoft Corp',
    evaluatedAt,
    retrievedAt,
    facts: {
      currentAssets: instant('currentAssets', 150),
      currentLiabilities: instant('currentLiabilities', 100),
      shareholdersEquity: instant('shareholdersEquity', 100),
      longTermDebtCurrent: instant('longTermDebtCurrent', 10),
      longTermDebtNoncurrent: instant('longTermDebtNoncurrent', 50),
      operatingIncome: periodic('operatingIncome', 80),
      interestExpense: periodic('interestExpense', 10),
    },
    missingFields: [
      'revenue', 'netIncome', 'operatingCashFlow', 'capitalExpenditure', 'dividendsPaid',
      'shareRepurchases', 'sharesOutstanding', 'dilutedEps',
    ],
    staleFields: [],
    scoreEligible: false,
    executionEligible: false,
  };
}

function deps(
  history: VerifiedTraditionalFallbackHistory | null,
  cached: StockFundamentals | undefined = fundamentals(),
  sec?: SecEdgarCompanyFactsResult,
): EquityResearchRuntimeDependencies {
  return {
    ensureFundamentalsFresh: async () => undefined,
    getCachedFundamentals: () => cached,
    getVerifiedHistory: async (_symbol, assetClass, days) => {
      expect(assetClass).toBe('stock');
      expect(days).toBe(EQUITY_RESEARCH_HISTORY_WINDOW_DAYS);
      return history;
    },
    fetchSecEvidence: sec ? async (symbol, asOf) => {
      expect(symbol).toBe('MSFT');
      expect(asOf).toBe(evaluatedAt);
      return sec;
    } : undefined,
    now: () => evaluatedAt,
  };
}

describe('Equity research runtime', () => {
  it('bindet bestehende provenance-aware Evidence an den research-only Challenger ohne öffentliche oder produktive Authority', async () => {
    const result = await runEquityResearchChallenger(
      { symbol: 'msft', classification },
      deps(verifiedHistory()),
    );

    expect(result.symbol).toBe('MSFT');
    expect(result.historyProvider).toBe('TwelveData');
    expect(result.secStatus).toBe('NOT_REQUESTED');
    expect(result.composition.diagnostics.composedFamilies).toContain('momentum');
    expect(result.orchestration.status).toBe('READY');
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
    expect(result.publicRouteExposed).toBe(false);
    expect(result.orchestration.canonicalPromotionRequired).toBe(true);
  });

  it('integriert SEC Filing Evidence providerneutral und ersetzt korreliertes Vendor-Leverage statt es zu addieren', async () => {
    const result = await runEquityResearchChallenger(
      { symbol: 'MSFT', classification },
      deps(verifiedHistory(), fundamentals(), secEvidence()),
    );

    expect(result.secStatus).toBe('PARTIAL');
    expect(result.secCik).toBe('0000789019');
    expect(result.secBridge?.mappedFields).toEqual(expect.arrayContaining([
      'currentAssets',
      'currentLiabilities',
      'shareholdersEquity',
      'longTermDebtCurrent',
      'longTermDebtNoncurrent',
      'operatingIncome',
      'interestExpense',
    ]));
    expect(result.filingComposition?.diagnostics.overriddenFamilies).toEqual(['financialStrength']);
    expect(result.composition.input.families.financialStrength?.componentKeys).toEqual([
      'financialStrength.liquidityQuality',
      'financialStrength.debtToEquityQuality',
      'financialStrength.interestCoverageQuality',
    ]);
    expect(result.composition.input.families.financialStrength?.evidence.every((item) => item.providerId === 'sec-edgar')).toBe(true);
    expect(result.scoreEligible).toBe(false);
    expect(result.publicRouteExposed).toBe(false);
  });

  it('nimmt ohne provenance-aware History keine Momentum-Familie auf und besitzt keinen AssetRegistry-Simulationspfad', async () => {
    const result = await runEquityResearchChallenger(
      { symbol: 'MSFT', classification },
      deps(null),
    );

    expect(result.historyProvider).toBeNull();
    expect(result.composition.input.families.momentum).toBeUndefined();
    expect(result.composition.diagnostics.composedFamilies).not.toContain('momentum');
    expect(result.scoreEligible).toBe(false);
    expect(result.publicRouteExposed).toBe(false);
  });

  it('erfindet bei fehlenden Fundamentals keine Ersatzwerte und bleibt nicht scorefähig', async () => {
    const result = await runEquityResearchChallenger(
      { symbol: 'MSFT', classification },
      deps(null, undefined),
    );

    expect(result.composition.diagnostics.composedFamilies).toEqual([]);
    expect(result.orchestration.status).toBe('NOT_COMPUTABLE');
    expect(result.orchestration.assessment.researchCompositeScore).toBeNull();
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });
});
