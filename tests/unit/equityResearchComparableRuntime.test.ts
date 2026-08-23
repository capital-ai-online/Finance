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
import type { StockFundamentals } from '../../server/stockFundamentals';
import type { SecEdgarCompanyFactsResult, SecEdgarRawField } from '../../server/secEdgarCompanyFacts';
import {
  runEquityResearchChallenger,
  type EquityResearchRuntimeDependencies,
} from '../../server/equityResearchRuntime';

const evaluatedAt = '2026-08-23T15:00:00.000Z';
const currentFiledAt = '2026-07-25T00:00:00.000Z';

const classification: EquityClassification = {
  contractVersion: EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  industry: { scheme: 'internal', sector: 'Consumer Staples', source: 'test' },
  sizeBucket: 'large',
  styleTags: ['quality', 'income'],
  primaryProfile: 'income',
  classificationSource: 'governed-rule',
};

function provenance(field: string, value: number, provider: FinancialFieldProvenance['provider'] = 'AlphaVantage'): FinancialFieldProvenance {
  return {
    field,
    provider,
    sourcePath: `https://example.test/${provider}/${field}`,
    retrievedAt: '2026-08-23T14:00:00.000Z',
    observedAt: '2026-06-30T00:00:00.000Z',
    value,
  };
}

function fundamentals(): StockFundamentals {
  return {
    peRatio: 20,
    priceToBookRatio: 3,
    dividendYieldPct: 2,
    profitMarginPct: 20,
    operatingMarginPct: 22,
    returnOnEquityPct: 25,
    quarterlyRevenueGrowthPct: 8,
    quarterlyEarningsGrowthPct: 10,
    debtToEquity: 0.8,
    epsTtm: 6,
    freeCashFlowPerShare: 5,
    fetchedAt: Date.parse('2026-08-23T14:00:00.000Z'),
    provenance: [
      provenance('peRatio', 20),
      provenance('priceToBookRatio', 3),
      provenance('dividendYieldPct', 2),
      provenance('profitMarginPct', 20),
      provenance('operatingMarginPct', 22),
      provenance('returnOnEquityPct', 25),
      provenance('quarterlyRevenueGrowthPct', 8),
      provenance('quarterlyEarningsGrowthPct', 10),
      provenance('debtToEquity', 0.8, 'FMP'),
      provenance('epsTtm', 6),
      provenance('freeCashFlowPerShare', 5, 'FMP'),
    ],
  };
}

function secEvidence(field: string, year: 2025 | 2026): MarketEvidenceQualityRecord {
  const filedAt = `${year}-07-25T00:00:00.000Z`;
  return {
    assetId: 'stock:MSFT',
    providerId: 'sec-edgar',
    capability: 'companyfacts',
    field,
    observedAt: filedAt,
    retrievedAt: '2026-08-23T14:00:00.000Z',
    freshness: {
      ageMs: 1_000,
      maxAgeMs: 190 * 24 * 60 * 60 * 1000,
      evaluatedAt: filedAt,
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: 'VERIFIED',
    evidenceRef: `sec:${field}:${year}`,
  };
}

function secFact(
  field: SecEdgarRawField,
  value: number,
  year: 2025 | 2026,
  context: 'instant' | 'periodic' | 'ytd',
) {
  return {
    field,
    value,
    unit: field === 'sharesOutstanding' ? 'shares' : field === 'dilutedEps' ? 'USD/shares' : 'USD',
    taxonomy: field === 'sharesOutstanding' ? 'dei' : 'us-gaap',
    tag: field,
    context,
    periodStart: context === 'instant' ? null : context === 'periodic'
      ? `${year}-04-01T00:00:00.000Z`
      : `${year}-01-01T00:00:00.000Z`,
    periodEnd: `${year}-06-30T00:00:00.000Z`,
    filedAt: `${year}-07-25T00:00:00.000Z`,
    form: '10-Q',
    accession: `${year}-q2`,
    frame: null,
    evidence: secEvidence(field, year),
  } as const;
}

function secResult(year: 2025 | 2026): SecEdgarCompanyFactsResult {
  const current = year === 2026;
  return {
    contractVersion: 'sec-edgar-companyfacts-evidence/0.1.0',
    status: 'READY',
    symbol: 'MSFT',
    cik: '0000789019',
    entityName: 'Microsoft Corp',
    evaluatedAt: current ? evaluatedAt : '2025-10-03T00:00:00.000Z',
    retrievedAt: '2026-08-23T14:00:00.000Z',
    facts: {
      revenue: secFact('revenue', current ? 120 : 100, year, 'periodic'),
      netIncome: secFact('netIncome', current ? 30 : 25, year, 'periodic'),
      dilutedEps: secFact('dilutedEps', current ? 5 : 4, year, 'periodic'),
      sharesOutstanding: secFact('sharesOutstanding', current ? 100 : 105, year, 'instant'),
      currentAssets: secFact('currentAssets', current ? 150 : 140, year, 'instant'),
      currentLiabilities: secFact('currentLiabilities', current ? 100 : 95, year, 'instant'),
      shareholdersEquity: secFact('shareholdersEquity', current ? 100 : 95, year, 'instant'),
      longTermDebtCurrent: secFact('longTermDebtCurrent', current ? 10 : 12, year, 'instant'),
      longTermDebtNoncurrent: secFact('longTermDebtNoncurrent', current ? 50 : 55, year, 'instant'),
      operatingIncome: secFact('operatingIncome', current ? 80 : 70, year, 'periodic'),
      interestExpense: secFact('interestExpense', current ? 10 : 10, year, 'periodic'),
      operatingCashFlow: secFact('operatingCashFlow', current ? 100 : 80, year, 'ytd'),
      capitalExpenditure: secFact('capitalExpenditure', current ? 20 : 15, year, 'ytd'),
      dividendsPaid: secFact('dividendsPaid', current ? 10 : 9, year, 'ytd'),
      shareRepurchases: secFact('shareRepurchases', current ? 10 : 6, year, 'ytd'),
    },
    missingFields: [],
    staleFields: [],
    scoreEligible: false,
    executionEligible: false,
  };
}

function dependencies(): EquityResearchRuntimeDependencies {
  return {
    ensureFundamentalsFresh: async () => undefined,
    getCachedFundamentals: () => fundamentals(),
    getVerifiedHistory: async () => null,
    fetchSecEvidence: async (_symbol, asOf) => asOf.startsWith('2025-') ? secResult(2025) : secResult(2026),
    now: () => evaluatedAt,
  };
}

describe('Equity comparable SEC research runtime', () => {
  it('nutzt denselben SEC-Adaptervertrag für Vorperioden und aktiviert Income-Capital-Allocation research-only', async () => {
    const result = await runEquityResearchChallenger(
      { symbol: 'MSFT', classification },
      dependencies(),
    );

    expect(result.runtimeVersion).toBe('equity-research-runtime/0.3.0');
    expect(result.secStatus).toBe('READY');
    expect(result.priorSecStatus).toBe('READY');
    expect(result.priorSecAsOf).toBe('2025-10-03T00:00:00.000Z');
    expect(result.comparableEvidence?.metrics.metrics.revenueGrowthYoYPct?.valuePct).toBe(20);
    expect(result.comparableEvidence?.metrics.metrics.shareCountChangeYoYPct?.valuePct)
      .toBeCloseTo(((100 / 105) - 1) * 100, 6);
    expect(result.comparableComposition?.diagnostics.overriddenFamilies).toEqual(
      expect.arrayContaining(['growth', 'capitalAllocation']),
    );
    expect(result.composition.input.families.capitalAllocation?.componentKeys).toEqual([
      'capitalAllocation.shareCountChangeQuality',
      'capitalAllocation.distributionCoverage',
    ]);
    expect(result.composition.input.families.growth?.componentKeys).toEqual([
      'growth.revenueGrowth',
      'growth.epsGrowth',
      'growth.freeCashFlowGrowth',
    ]);
    expect(result.orchestration.status).toBe('READY');
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
    expect(result.publicRouteExposed).toBe(false);
    expect(result.orchestration.canonicalPromotionRequired).toBe(true);
  });
});
