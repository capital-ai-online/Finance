import { describe, expect, it } from 'vitest';
import { composeEquityResearchFeatureSnapshot } from '../../src/platform/Scoring/EquityFeatureComposer';
import { createUnclassifiedEquityClassification } from '../../src/platform/Scoring/EquityModelContracts';
import type { FinancialFieldProvenance } from '../../src/types/financialProvenance';

const evaluatedAt = '2026-08-28T12:00:00.000Z';
const observedAt = '2026-08-27T00:00:00.000Z';
const retrievedAt = '2026-08-28T08:00:00.000Z';

function provenance(
  field: string,
  value: number,
  provider: FinancialFieldProvenance['provider'] = 'AlphaVantage',
  observed = observedAt,
): FinancialFieldProvenance {
  return {
    field,
    provider,
    sourcePath: `${provider.toLowerCase()}://${field}`,
    retrievedAt,
    observedAt: observed,
    value,
  };
}

describe('Equity P1-A feature composer', () => {
  it('composes repository-native verified evidence without a composite score', () => {
    const technical = [
      ['trend', 0.8],
      ['momentum', 0.7],
      ['breakout_quality', 0.75],
      ['volatility_quality', 0.6],
      ['relative_strength', 0.65],
    ] as const;
    const snapshot = composeEquityResearchFeatureSnapshot({
      assetId: 'AAPL',
      classification: createUnclassifiedEquityClassification(),
      fundamentals: {
        peRatio: 25,
        profitMarginPct: 22,
        dividendYieldPct: 0.5,
        provenance: [
          provenance('peRatio', 25),
          provenance('profitMarginPct', 22),
          provenance('dividendYieldPct', 0.5),
        ],
      },
      traditional: {
        trend: 0.8,
        momentum: 0.7,
        breakout_quality: 0.75,
        volatility_quality: 0.6,
        relative_strength: 0.65,
        provenance: technical.map(([field, value]) => ({
          ...provenance(field, value, 'Stooq'),
          unit: 'normalized-0-1',
          derivedFrom: ['close-history'],
        })),
      },
      evaluatedAt,
    });

    expect(snapshot.researchCompositeScore).toBeNull();
    expect(snapshot.scoreEligible).toBe(false);
    expect(snapshot.executionEligible).toBe(false);
    expect(snapshot.promotionReady).toBe(false);
    expect(snapshot.validFeatures).toEqual(expect.arrayContaining([
      'quality.profitMarginPct',
      'valuation.peRatio',
      'momentum.trend',
      'momentum.momentum',
      'momentum.breakoutQuality',
      'momentum.volatilityQuality',
      'momentum.relativeStrength',
    ]));
    expect(snapshot.lineage.weightFingerprintSemantic).toBe('NON_EXECUTABLE_ZERO_WEIGHT');
  });

  it('keeps all technical observations inside one price-path correlation group', () => {
    const technical = [
      ['trend', 0.8],
      ['momentum', 0.7],
      ['breakout_quality', 0.75],
      ['volatility_quality', 0.6],
      ['relative_strength', 0.65],
    ] as const;
    const snapshot = composeEquityResearchFeatureSnapshot({
      assetId: 'MSFT',
      classification: createUnclassifiedEquityClassification(),
      traditional: {
        trend: 0.8,
        momentum: 0.7,
        breakout_quality: 0.75,
        volatility_quality: 0.6,
        relative_strength: 0.65,
        provenance: technical.map(([field, value]) => ({
          ...provenance(field, value, 'TwelveData'),
          unit: 'normalized-0-1',
          derivedFrom: ['close-history'],
        })),
      },
      evaluatedAt,
    });

    const momentumFeatures = snapshot.features.filter(feature => feature.family === 'momentum');
    expect(momentumFeatures).toHaveLength(5);
    expect(momentumFeatures.every(feature => feature.correlationGroup === 'equity-price-path')).toBe(true);
  });

  it('does not manufacture Capital Allocation from dividend yield', () => {
    const snapshot = composeEquityResearchFeatureSnapshot({
      assetId: 'KO',
      classification: createUnclassifiedEquityClassification(),
      fundamentals: {
        dividendYieldPct: 3.1,
        provenance: [provenance('dividendYieldPct', 3.1)],
      },
      evaluatedAt,
    });

    expect(snapshot.features.some(feature => feature.family === 'capitalAllocation' && feature.status === 'VALID')).toBe(false);
    expect(snapshot.context.find(item => item.field === 'dividendYieldPct')?.scoreImpact).toBe(false);
  });

  it('rejects cross-provider FCF/EPS conversion instead of mixing merged display values', () => {
    const snapshot = composeEquityResearchFeatureSnapshot({
      assetId: 'AAPL',
      classification: createUnclassifiedEquityClassification(),
      fundamentals: {
        epsTtm: 6,
        freeCashFlowPerShare: 5,
        provenance: [
          provenance('epsTtm', 6, 'AlphaVantage'),
          provenance('freeCashFlowPerShare', 5, 'FMP'),
        ],
      },
      evaluatedAt,
    });

    const feature = snapshot.features.find(item => item.key === 'quality.freeCashFlowConversion');
    expect(feature?.status).toBe('INVALID');
    expect(feature?.reason).toBe('FCF_EPS_PROVIDER_OR_PERIOD_MISMATCH');
  });

  it('fails closed when observedAt is missing', () => {
    const snapshot = composeEquityResearchFeatureSnapshot({
      assetId: 'AAPL',
      classification: createUnclassifiedEquityClassification(),
      fundamentals: {
        peRatio: 25,
        provenance: [{
          field: 'peRatio',
          provider: 'FMP',
          sourcePath: 'fmp://ratios-ttm',
          retrievedAt,
          value: 25,
        }],
      },
      evaluatedAt,
    });

    const feature = snapshot.features.find(item => item.key === 'valuation.peRatio');
    expect(feature?.status).toBe('MISSING');
    expect(feature?.evidence[0]?.qualityStatus).toBe('UNAVAILABLE');
  });
});
