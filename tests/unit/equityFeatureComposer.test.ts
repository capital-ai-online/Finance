import { describe, expect, it } from 'vitest';
import {
  EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  type EquityClassification,
} from '../../src/platform/Scoring/EquityModelContracts';
import {
  composeEquityResearchInput,
  type EquityFundamentalSnapshot,
  type EquityHistoryPoint,
} from '../../src/platform/Scoring/EquityFeatureComposer';
import { evaluateEquityResearchScore } from '../../src/platform/Scoring/EquityResearchScoring';
import type { FinancialFieldProvenance } from '../../src/types/financialProvenance';

const assetId = 'stock:MSFT';
const evaluatedAt = '2026-08-23T15:00:00.000Z';
const observedAt = '2026-06-30T00:00:00.000Z';
const retrievedAt = '2026-08-23T14:00:00.000Z';

function classification(primaryProfile: EquityClassification['primaryProfile'] = 'quality-growth'): EquityClassification {
  return {
    contractVersion: EQUITY_CLASSIFICATION_CONTRACT_VERSION,
    industry: {
      scheme: 'internal',
      sector: 'Information Technology',
      industry: 'Software',
      source: 'governed-rule:test',
    },
    sizeBucket: 'mega',
    styleTags: ['quality', 'growth'],
    primaryProfile,
    classificationSource: 'governed-rule',
  };
}

function provenance(
  field: string,
  value: number,
  provider: FinancialFieldProvenance['provider'] = 'AlphaVantage',
  observed = observedAt,
): FinancialFieldProvenance {
  return {
    field,
    provider,
    sourcePath: `https://example.test/${provider}/${field}`,
    retrievedAt,
    observedAt: observed,
    unit: field.toLowerCase().includes('pct') ? 'percent' : 'ratio',
    value,
  };
}

function fundamentals(observed = observedAt): EquityFundamentalSnapshot {
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
    provenance: [
      provenance('peRatio', values.peRatio, 'AlphaVantage', observed),
      provenance('priceToBookRatio', values.priceToBookRatio, 'AlphaVantage', observed),
      provenance('dividendYieldPct', values.dividendYieldPct, 'AlphaVantage', observed),
      provenance('profitMarginPct', values.profitMarginPct, 'AlphaVantage', observed),
      provenance('operatingMarginPct', values.operatingMarginPct, 'AlphaVantage', observed),
      provenance('returnOnEquityPct', values.returnOnEquityPct, 'AlphaVantage', observed),
      provenance('quarterlyRevenueGrowthPct', values.quarterlyRevenueGrowthPct, 'AlphaVantage', observed),
      provenance('quarterlyEarningsGrowthPct', values.quarterlyEarningsGrowthPct, 'AlphaVantage', observed),
      provenance('debtToEquity', values.debtToEquity, 'FMP', observed),
      provenance('epsTtm', values.epsTtm, 'AlphaVantage', observed),
      provenance('freeCashFlowPerShare', values.freeCashFlowPerShare, 'FMP', observed),
    ],
  };
}

function history(): EquityHistoryPoint[] {
  const start = Date.parse('2025-12-06T00:00:00.000Z');
  return Array.from({ length: 260 }, (_, index) => {
    const date = new Date(start + index * 24 * 60 * 60 * 1000);
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const yy = String(date.getUTCFullYear()).slice(-2);
    return { date: `${dd}.${mm}.${yy}`, close: 100 + index * 0.5 };
  });
}

describe('Equity P1 feature composition', () => {
  it('komponiert verifizierte Fundamentals und 12-1/6-1 Historie in genau die vorhandenen Faktor-Familien', () => {
    const composed = composeEquityResearchInput({
      assetId,
      classification: classification(),
      fundamentals: fundamentals(),
      history: {
        provider: 'Stooq',
        sourcePath: 'https://stooq.com/q/d/l/?s=msft.us&i=d',
        retrievedAt,
        points: history(),
      },
      evaluatedAt,
    });

    expect(composed.diagnostics.composedFamilies).toEqual([
      'quality',
      'valuation',
      'growth',
      'momentum',
      'financialStrength',
    ]);
    expect(composed.input.families.capitalAllocation).toBeUndefined();
    expect(composed.diagnostics.promotionReady).toBe(false);
    expect(composed.diagnostics.warnings).toContain(
      'CAPITAL_ALLOCATION_NOT_COMPOSED_WITHOUT_COVERAGE_BUYBACK_REINVESTMENT_EVIDENCE',
    );

    const score = evaluateEquityResearchScore(composed.input);
    expect(score.status).toBe('READY');
    expect(score.familyCoverageCount).toBe(5);
    expect(score.nominalWeightCoverage).toBe(0.95);
    expect(score.missingRequiredFamilies).toEqual([]);
    expect(score.scoreEligible).toBe(false);
  });

  it('weist zu alte Fundamental-Evidence zurück statt die Familie mit Neutralwerten zu füllen', () => {
    const composed = composeEquityResearchInput({
      assetId,
      classification: classification(),
      fundamentals: fundamentals('2025-12-31T00:00:00.000Z'),
      evaluatedAt,
    });

    expect(composed.diagnostics.composedFamilies).toEqual([]);
    expect(composed.diagnostics.rejectedEvidenceFields.some((entry) => entry.endsWith(':STALE'))).toBe(true);
    const score = evaluateEquityResearchScore(composed.input);
    expect(score.status).toBe('NOT_COMPUTABLE');
    expect(score.researchCompositeScore).toBeNull();
  });

  it('blockiert das Income-Profil trotz nominell 70 Prozent Coverage solange Capital Allocation fehlt', () => {
    const composed = composeEquityResearchInput({
      assetId,
      classification: classification('income'),
      fundamentals: fundamentals(),
      history: {
        provider: 'Stooq',
        sourcePath: 'https://stooq.com/q/d/l/?s=msft.us&i=d',
        retrievedAt,
        points: history(),
      },
      evaluatedAt,
    });

    const score = evaluateEquityResearchScore(composed.input);
    expect(score.nominalWeightCoverage).toBe(0.70);
    expect(score.missingRequiredFamilies).toContain('capitalAllocation');
    expect(score.status).toBe('NOT_COMPUTABLE');
    expect(score.warnings).toContain('EQUITY_PROFILE_REQUIRED_FAMILIES_MISSING:capitalAllocation');
  });
});
