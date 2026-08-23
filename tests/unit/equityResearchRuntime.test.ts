import { describe, expect, it } from 'vitest';
import {
  EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  type EquityClassification,
} from '../../src/platform/Scoring/EquityModelContracts';
import type { FinancialFieldProvenance } from '../../src/types/financialProvenance';
import type { HistoryResult } from '../../src/lib/assetRegistry';
import type { StockFundamentals } from '../../server/stockFundamentals';
import {
  EQUITY_RESEARCH_HISTORY_WINDOW_DAYS,
  runEquityResearchChallenger,
  type EquityResearchRuntimeDependencies,
} from '../../server/equityResearchRuntime';

const evaluatedAt = '2026-08-23T15:00:00.000Z';
const observedAt = '2026-06-30T00:00:00.000Z';
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

function liveHistory(): HistoryResult {
  const start = Date.parse('2025-12-06T00:00:00.000Z');
  return {
    source: 'live',
    points: Array.from({ length: 260 }, (_, index) => {
      const date = new Date(start + index * 24 * 60 * 60 * 1000);
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const yy = String(date.getUTCFullYear()).slice(-2);
      return { date: `${dd}.${mm}.${yy}`, close: 100 + index * 0.5 };
    }),
  };
}

function deps(history: HistoryResult, cached: StockFundamentals | undefined = fundamentals()): EquityResearchRuntimeDependencies {
  return {
    ensureFundamentalsFresh: async () => undefined,
    getCachedFundamentals: () => cached,
    getHistory: async (_symbol, limit) => {
      expect(limit).toBe(EQUITY_RESEARCH_HISTORY_WINDOW_DAYS);
      return history;
    },
    now: () => evaluatedAt,
  };
}

describe('Equity research runtime', () => {
  it('bindet bestehende reale Evidence an den research-only Challenger ohne öffentliche oder produktive Authority', async () => {
    const result = await runEquityResearchChallenger(
      { symbol: 'msft', classification },
      deps(liveHistory()),
    );

    expect(result.symbol).toBe('MSFT');
    expect(result.historySource).toBe('live');
    expect(result.composition.diagnostics.composedFamilies).toContain('momentum');
    expect(result.orchestration.status).toBe('READY');
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
    expect(result.publicRouteExposed).toBe(false);
    expect(result.orchestration.canonicalPromotionRequired).toBe(true);
  });

  it('verwirft simulierte AssetRegistry-Historie vollständig aus der Momentum-Familie', async () => {
    const simulated: HistoryResult = {
      source: 'simulated',
      points: liveHistory().points,
    };
    const result = await runEquityResearchChallenger(
      { symbol: 'MSFT', classification },
      deps(simulated),
    );

    expect(result.historySource).toBe('simulated');
    expect(result.composition.input.families.momentum).toBeUndefined();
    expect(result.composition.diagnostics.composedFamilies).not.toContain('momentum');
    expect(result.scoreEligible).toBe(false);
    expect(result.publicRouteExposed).toBe(false);
  });

  it('erfindet bei fehlenden Fundamentals keine Ersatzwerte und bleibt nicht scorefähig', async () => {
    const result = await runEquityResearchChallenger(
      { symbol: 'MSFT', classification },
      deps({ source: 'simulated', points: [] }, undefined),
    );

    expect(result.composition.diagnostics.composedFamilies).toEqual([]);
    expect(result.orchestration.status).toBe('NOT_COMPUTABLE');
    expect(result.orchestration.assessment.researchCompositeScore).toBeNull();
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });
});
