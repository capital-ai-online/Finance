import { describe, expect, it } from 'vitest';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import {
  EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  type EquityClassification,
} from '../../src/platform/Scoring/EquityModelContracts';
import type { EquityFilingFeatureCompositionResult } from '../../src/platform/Scoring/EquityFilingFeatureComposer';
import {
  deriveEquityFilingMetrics,
  type EquityFilingEvidenceSnapshot,
  type EquityFilingFactInput,
  type EquityFilingRawField,
} from '../../src/platform/Scoring/EquityFilingDerivedMetrics';
import type {
  EquityComparableFilingMetricsResult,
  EquityComparableMetric,
  EquityComparableMetricId,
} from '../../src/platform/Scoring/EquityComparableFilingMetrics';
import { augmentEquityResearchWithComparableFilings } from '../../src/platform/Scoring/EquityComparableFilingFeatureComposer';

const assetId = 'stock:MSFT';
const evaluatedAt = '2026-08-23T15:00:00.000Z';
const filedAt = '2026-07-25T00:00:00.000Z';

const classification: EquityClassification = {
  contractVersion: EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  industry: { scheme: 'internal', sector: 'Information Technology', source: 'test' },
  sizeBucket: 'mega',
  styleTags: ['quality', 'growth'],
  primaryProfile: 'quality-growth',
  classificationSource: 'governed-rule',
};

function evidence(field: string, suffix = 'current'): MarketEvidenceQualityRecord {
  return {
    assetId,
    providerId: 'sec-edgar',
    capability: 'companyfacts',
    field,
    observedAt: filedAt,
    retrievedAt: '2026-08-23T14:00:00.000Z',
    freshness: { ageMs: 1_000, maxAgeMs: 190 * 24 * 60 * 60 * 1000, evaluatedAt },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: 'VERIFIED',
    evidenceRef: `sec:${field}:${suffix}`,
  };
}

function metric(id: EquityComparableMetricId, valuePct: number, field: string): EquityComparableMetric {
  return {
    id,
    valuePct,
    currentPeriodEnd: '2026-06-30T00:00:00.000Z',
    priorPeriodEnd: '2025-06-30T00:00:00.000Z',
    availableAt: filedAt,
    sourceFields: [field],
    evidence: [evidence(field), evidence(field, 'prior')],
    correlationGroup: id === 'shareCountChangeYoYPct' ? 'share-count-change' : 'filing-growth',
    basisStatus: 'VERIFIED_COMPARABLE_PERIODS',
  };
}

function currentFiling(): EquityFilingEvidenceSnapshot {
  const facts: Partial<Record<EquityFilingRawField, EquityFilingFactInput>> = {};
  const values = {
    operatingCashFlow: 100,
    capitalExpenditure: 20,
    dividendsPaid: 10,
    shareRepurchases: 10,
  } as const;
  for (const field of Object.keys(values) as Array<keyof typeof values>) {
    facts[field] = {
      field,
      value: values[field],
      unit: 'USD',
      context: 'ytd',
      periodStart: '2026-01-01T00:00:00.000Z',
      periodEnd: '2026-06-30T00:00:00.000Z',
      filedAt,
      accession: '2026-q2',
      evidence: evidence(field),
    };
  }
  return { assetId, facts };
}

function base(): EquityFilingFeatureCompositionResult {
  return {
    input: {
      classification,
      families: {
        growth: {
          score: 0.3,
          componentKeys: ['growth.vendorQuarterly'],
          evidence: [{ ...evidence('vendorGrowth'), providerId: 'alphavantage' }],
        },
      },
    },
    diagnostics: {
      compositionVersion: 'equity-filing-feature-composition/0.1.0',
      usedMetricIds: [],
      deferredMetricIds: [],
      overriddenFamilies: [],
      warnings: [],
      sourcePriority: 'PRIMARY_FILING_EVIDENCE_OVER_VENDOR_DERIVED_FOR_SAME_CORRELATION_GROUP',
      promotionReady: false,
    },
  };
}

function comparable(includeShareCount = true): EquityComparableFilingMetricsResult {
  return {
    contractVersion: 'equity-comparable-filing-metrics/0.1.0',
    assetId,
    metrics: {
      revenueGrowthYoYPct: metric('revenueGrowthYoYPct', 20, 'revenue'),
      dilutedEpsGrowthYoYPct: metric('dilutedEpsGrowthYoYPct', 25, 'dilutedEps'),
      freeCashFlowGrowthYoYPct: metric('freeCashFlowGrowthYoYPct', 15, 'freeCashFlow'),
      ...(includeShareCount ? { shareCountChangeYoYPct: metric('shareCountChangeYoYPct', -4, 'sharesOutstanding') } : {}),
    },
    missingInputs: [],
    rejectedEvidence: [],
    periodMismatches: [],
    scoreEligible: false,
    executionEligible: false,
    normalizationRequired: true,
  };
}

describe('Equity comparable filing feature composition', () => {
  it('ersetzt Vendor-Quartalswachstum mit mehrfach belegtem SEC-YoY-Growth statt beide zu stapeln', () => {
    const filing = currentFiling();
    const result = augmentEquityResearchWithComparableFilings({
      base: base(),
      comparable: comparable(),
      currentFiling: filing,
      currentDerived: deriveEquityFilingMetrics(filing),
    });

    expect(result.diagnostics.overriddenFamilies).toContain('growth');
    expect(result.input.families.growth?.componentKeys).toEqual([
      'growth.revenueGrowth',
      'growth.epsGrowth',
      'growth.freeCashFlowGrowth',
    ]);
    expect(result.input.families.growth?.evidence.every((item) => item.providerId === 'sec-edgar')).toBe(true);
    expect(result.input.families.growth?.score).toBeCloseTo((2 / 3 + 0.6875 + 0.55) / 3, 8);
  });

  it('aktiviert Capital Allocation erst aus Share-Count-Change plus Distribution Coverage', () => {
    const filing = currentFiling();
    const result = augmentEquityResearchWithComparableFilings({
      base: base(),
      comparable: comparable(true),
      currentFiling: filing,
      currentDerived: deriveEquityFilingMetrics(filing),
    });

    expect(result.input.families.capitalAllocation?.componentKeys).toEqual([
      'capitalAllocation.shareCountChangeQuality',
      'capitalAllocation.distributionCoverage',
    ]);
    expect(result.input.families.capitalAllocation?.score).toBeCloseTo((0.9 + 1) / 2, 8);
    expect(result.diagnostics.usedComparableMetricIds).toContain('shareCountChangeYoYPct');
    expect(result.diagnostics.warnings).toContain(
      'SEC_COMPARABLE_CAPITAL_ALLOCATION_ENABLED:shareCountChange+distributionCoverage',
    );
  });

  it('lässt Capital Allocation fehlen wenn Share-Count-Change als unabhängige Evidence fehlt', () => {
    const filing = currentFiling();
    const result = augmentEquityResearchWithComparableFilings({
      base: base(),
      comparable: comparable(false),
      currentFiling: filing,
      currentDerived: deriveEquityFilingMetrics(filing),
    });

    expect(result.input.families.capitalAllocation).toBeUndefined();
    expect(result.diagnostics.warnings).toContain(
      'SEC_COMPARABLE_CAPITAL_ALLOCATION_INSUFFICIENT_INDEPENDENT_EVIDENCE',
    );
  });
});
