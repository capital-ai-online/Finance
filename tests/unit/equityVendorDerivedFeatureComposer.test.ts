import { describe, expect, it } from 'vitest';
import {
  EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  type EquityClassification,
} from '../../src/platform/Scoring/EquityModelContracts';
import type { FinancialFieldProvenance } from '../../src/types/financialProvenance';
import type {
  EquityFeatureCompositionResult,
  EquityFundamentalSnapshot,
  EquityHistorySnapshot,
} from '../../src/platform/Scoring/EquityFeatureComposer';
import { augmentEquityResearchWithVendorDerivedFeatures } from '../../src/platform/Scoring/EquityVendorDerivedFeatureComposer';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';

const evaluatedAt = '2026-08-23T15:00:00.000Z';
const observedAt = '2026-06-30T00:00:00.000Z';
const assetId = 'stock:MSFT';

const classification: EquityClassification = {
  contractVersion: EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  industry: { scheme: 'internal', sector: 'Information Technology', source: 'test' },
  sizeBucket: 'mega',
  styleTags: ['quality', 'value'],
  primaryProfile: 'compounder',
  classificationSource: 'governed-rule',
};

function baseEvidence(field: string): MarketEvidenceQualityRecord {
  return {
    assetId,
    providerId: 'alphavantage',
    capability: 'stock-fundamentals',
    field,
    observedAt,
    retrievedAt: '2026-08-23T14:00:00.000Z',
    freshness: {
      ageMs: Date.parse(evaluatedAt) - Date.parse(observedAt),
      maxAgeMs: 140 * 24 * 60 * 60 * 1000,
      evaluatedAt,
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: 'VERIFIED',
    evidenceRef: `base:${field}`,
  };
}

function base(): EquityFeatureCompositionResult {
  return {
    input: {
      classification,
      families: {
        quality: {
          score: 0.8,
          componentKeys: ['quality.profitability'],
          evidence: [baseEvidence('quality')],
        },
        valuation: {
          score: 0.6,
          componentKeys: ['valuation.earningsYield', 'valuation.bookToPrice'],
          evidence: [baseEvidence('valuation')],
        },
      },
    },
    diagnostics: {
      compositionVersion: 'equity-feature-composition/0.1.0',
      normalizationPolicy: 'research-bounded-absolute/0.1.0',
      composedFamilies: ['quality', 'valuation'],
      missingRawFields: [],
      rejectedEvidenceFields: [],
      warnings: [],
      promotionReady: false,
    },
  };
}

function provenance(
  field: string,
  value: number,
  provider: FinancialFieldProvenance['provider'] = 'FMP',
  date: string | undefined = observedAt,
): FinancialFieldProvenance {
  return {
    field,
    provider,
    sourcePath: `https://example.test/${provider}/${field}`,
    retrievedAt: '2026-08-23T14:00:00.000Z',
    observedAt: date,
    value,
  };
}

function fundamentals(
  epsProvider: FinancialFieldProvenance['provider'] = 'FMP',
  fcfObservedAt: string | undefined = observedAt,
): EquityFundamentalSnapshot {
  return {
    epsTtm: 10,
    freeCashFlowPerShare: 8,
    provenance: [
      provenance('epsTtm', 10, epsProvider),
      provenance('freeCashFlowPerShare', 8, 'FMP', fcfObservedAt),
    ],
  };
}

function history(lastDate = '2026-08-22'): EquityHistorySnapshot {
  return {
    provider: 'TwelveData',
    sourcePath: 'https://api.twelvedata.com/time_series',
    retrievedAt: '2026-08-23T14:00:00.000Z',
    points: [
      { date: '2026-08-21', close: 198 },
      { date: lastDate, close: 200 },
    ],
  };
}

describe('Equity vendor-derived feature composition', () => {
  it('verdichtet FCF conversion und FCF yield innerhalb bestehender Quality/Valuation Familien', () => {
    const result = augmentEquityResearchWithVendorDerivedFeatures({
      base: base(),
      assetId,
      fundamentals: fundamentals(),
      history: history(),
      evaluatedAt,
    });

    expect(result.diagnostics.usedFeatureKeys).toEqual([
      'quality.freeCashFlowConversion',
      'valuation.freeCashFlowYield',
    ]);
    expect(result.diagnostics.enrichedFamilies).toEqual(['quality', 'valuation']);
    expect(result.input.families.quality?.componentKeys).toContain('quality.freeCashFlowConversion');
    expect(result.input.families.valuation?.componentKeys).toContain('valuation.freeCashFlowYield');
    expect(result.input.families.quality?.score).toBeCloseTo((0.8 + (0.8 / 1.5)) / 2, 8);
    expect(result.input.families.valuation?.score).toBeCloseTo((0.6 + 0.5) / 2, 8);
    expect(result.input.families.valuation?.evidence.some((record) => record.providerId === 'twelvedata')).toBe(true);
  });

  it('verwirft FCF conversion bei providerinkonsistenten TTM-Basen statt Cross-Provider-Perioden zu mischen', () => {
    const result = augmentEquityResearchWithVendorDerivedFeatures({
      base: base(),
      assetId,
      fundamentals: fundamentals('AlphaVantage'),
      history: history(),
      evaluatedAt,
    });

    expect(result.input.families.quality?.componentKeys).not.toContain('quality.freeCashFlowConversion');
    expect(result.diagnostics.warnings).toContain(
      'FCF_CONVERSION_NOT_COMPOSABLE_FROM_ALIGNED_VERIFIED_TTM_EVIDENCE',
    );
    expect(result.input.families.valuation?.componentKeys).toContain('valuation.freeCashFlowYield');
  });

  it('verwirft FCF yield bei stale Marktpreis-Evidence', () => {
    const result = augmentEquityResearchWithVendorDerivedFeatures({
      base: base(),
      assetId,
      fundamentals: fundamentals(),
      history: history('2026-08-01'),
      evaluatedAt,
    });

    expect(result.input.families.valuation?.componentKeys).not.toContain('valuation.freeCashFlowYield');
    expect(result.diagnostics.warnings).toContain(
      'FCF_YIELD_NOT_COMPOSABLE_WITHOUT_VERIFIED_FCF_AND_FRESH_MARKET_CLOSE',
    );
  });

  it('erzeugt aus einem einzelnen Derived Signal keine neue Family-Coverage', () => {
    const stripped = base();
    const noFamilies: EquityFeatureCompositionResult = {
      ...stripped,
      input: { classification, families: {} },
      diagnostics: { ...stripped.diagnostics, composedFamilies: [] },
    };
    const result = augmentEquityResearchWithVendorDerivedFeatures({
      base: noFamilies,
      assetId,
      fundamentals: fundamentals(),
      history: history(),
      evaluatedAt,
    });

    expect(result.input.families.quality).toBeUndefined();
    expect(result.input.families.valuation).toBeUndefined();
    expect(result.diagnostics.warnings).toEqual(expect.arrayContaining([
      'FCF_CONVERSION_DEFERRED_WITHOUT_BASE_QUALITY_FAMILY',
      'FCF_YIELD_DEFERRED_WITHOUT_BASE_VALUATION_FAMILY',
    ]));
  });
});
