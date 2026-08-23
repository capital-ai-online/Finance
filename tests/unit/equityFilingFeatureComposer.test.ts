import { describe, expect, it } from 'vitest';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import {
  EQUITY_CLASSIFICATION_CONTRACT_VERSION,
  type EquityClassification,
} from '../../src/platform/Scoring/EquityModelContracts';
import type { EquityFeatureCompositionResult } from '../../src/platform/Scoring/EquityFeatureComposer';
import {
  deriveEquityFilingMetrics,
  type EquityFilingEvidenceSnapshot,
  type EquityFilingFactContext,
  type EquityFilingRawField,
} from '../../src/platform/Scoring/EquityFilingDerivedMetrics';
import { augmentEquityResearchWithFilingEvidence } from '../../src/platform/Scoring/EquityFilingFeatureComposer';

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

function evidence(field: string): MarketEvidenceQualityRecord {
  return {
    assetId,
    providerId: 'sec-edgar',
    capability: 'companyfacts',
    field,
    observedAt: filedAt,
    retrievedAt: '2026-08-23T14:00:00.000Z',
    freshness: {
      ageMs: Date.parse(evaluatedAt) - Date.parse(filedAt),
      maxAgeMs: 190 * 24 * 60 * 60 * 1000,
      evaluatedAt,
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: 'VERIFIED',
    evidenceRef: `sec:${field}:1`,
  };
}

function fact(
  field: EquityFilingRawField,
  value: number,
  context: EquityFilingFactContext,
  periodStart: string | null,
  periodEnd: string,
) {
  return {
    field,
    value,
    unit: 'USD',
    context,
    periodStart,
    periodEnd,
    filedAt,
    accession: '0000000000-26-000001',
    evidence: evidence(field),
  } as const;
}

function snapshot(includeFinancialStrength = true, includeCapitalAllocation = false): EquityFilingEvidenceSnapshot {
  const facts: EquityFilingEvidenceSnapshot['facts'] = includeFinancialStrength
    ? {
      currentAssets: fact('currentAssets', 150, 'instant', null, '2026-06-30T00:00:00.000Z'),
      currentLiabilities: fact('currentLiabilities', 100, 'instant', null, '2026-06-30T00:00:00.000Z'),
      shareholdersEquity: fact('shareholdersEquity', 100, 'instant', null, '2026-06-30T00:00:00.000Z'),
      longTermDebtCurrent: fact('longTermDebtCurrent', 10, 'instant', null, '2026-06-30T00:00:00.000Z'),
      longTermDebtNoncurrent: fact('longTermDebtNoncurrent', 50, 'instant', null, '2026-06-30T00:00:00.000Z'),
      operatingIncome: fact('operatingIncome', 80, 'periodic', '2026-04-01T00:00:00.000Z', '2026-06-30T00:00:00.000Z'),
      interestExpense: fact('interestExpense', 10, 'periodic', '2026-04-01T00:00:00.000Z', '2026-06-30T00:00:00.000Z'),
    }
    : {
      currentAssets: fact('currentAssets', 150, 'instant', null, '2026-06-30T00:00:00.000Z'),
      currentLiabilities: fact('currentLiabilities', 100, 'instant', null, '2026-06-30T00:00:00.000Z'),
    };

  if (includeCapitalAllocation) {
    Object.assign(facts, {
      operatingCashFlow: fact('operatingCashFlow', 100, 'ytd', '2026-01-01T00:00:00.000Z', '2026-06-30T00:00:00.000Z'),
      capitalExpenditure: fact('capitalExpenditure', 20, 'ytd', '2026-01-01T00:00:00.000Z', '2026-06-30T00:00:00.000Z'),
      dividendsPaid: fact('dividendsPaid', 10, 'ytd', '2026-01-01T00:00:00.000Z', '2026-06-30T00:00:00.000Z'),
      shareRepurchases: fact('shareRepurchases', 10, 'ytd', '2026-01-01T00:00:00.000Z', '2026-06-30T00:00:00.000Z'),
    });
  }

  return { assetId, facts };
}

function base(): EquityFeatureCompositionResult {
  const vendorEvidence = { ...evidence('debtToEquity'), providerId: 'fmp', evidenceRef: 'fmp:debtToEquity' };
  return {
    input: {
      classification,
      families: {
        financialStrength: {
          score: 0.2,
          componentKeys: ['financialStrength.debtToEquityQuality'],
          evidence: [vendorEvidence],
        },
      },
    },
    diagnostics: {
      compositionVersion: 'equity-feature-composition/0.1.0',
      normalizationPolicy: 'research-bounded-absolute/0.1.0',
      composedFamilies: ['financialStrength'],
      missingRawFields: [],
      rejectedEvidenceFields: [],
      warnings: [],
      promotionReady: false,
    },
  };
}

describe('Equity SEC filing feature composition', () => {
  it('ersetzt Vendor-Leverage durch ausreichend belegte SEC Financial-Strength-Komponenten statt sie zu stapeln', () => {
    const filing = snapshot(true, false);
    const derived = deriveEquityFilingMetrics(filing);
    const result = augmentEquityResearchWithFilingEvidence({ base: base(), snapshot: filing, derived });

    expect(result.diagnostics.overriddenFamilies).toEqual(['financialStrength']);
    expect(result.diagnostics.usedMetricIds).toEqual(expect.arrayContaining([
      'currentRatio',
      'totalLongTermDebtToEquity',
      'interestCoverage',
    ]));
    expect(result.input.families.financialStrength?.componentKeys).toEqual([
      'financialStrength.currentRatioQuality',
      'financialStrength.debtToEquityQuality',
      'financialStrength.interestCoverageQuality',
    ]);
    expect(result.input.families.financialStrength?.score).toBeCloseTo((0.6 + 0.76 + 1) / 3, 8);
    expect(result.input.families.financialStrength?.evidence.every((item) => item.providerId === 'sec-edgar')).toBe(true);
  });

  it('behält den vorhandenen Vendor-Fallback, wenn SEC nur eine unzureichende Komponente belegen kann', () => {
    const filing = snapshot(false, false);
    const derived = deriveEquityFilingMetrics(filing);
    const result = augmentEquityResearchWithFilingEvidence({ base: base(), snapshot: filing, derived });

    expect(result.diagnostics.overriddenFamilies).toEqual([]);
    expect(result.input.families.financialStrength?.score).toBe(0.2);
    expect(result.input.families.financialStrength?.evidence[0].providerId).toBe('fmp');
    expect(result.diagnostics.warnings).toContain('SEC_FILING_FINANCIAL_STRENGTH_INSUFFICIENT_COMPONENT_COVERAGE');
  });

  it('hält Cash-Allocation-Metriken research-only zurück statt daraus einen synthetischen Capital-Allocation-Score zu erzeugen', () => {
    const filing = snapshot(true, true);
    const derived = deriveEquityFilingMetrics(filing);
    const result = augmentEquityResearchWithFilingEvidence({ base: base(), snapshot: filing, derived });

    expect(derived.metrics.distributionCoverageYtd?.value).toBe(4);
    expect(derived.metrics.reinvestmentIntensityYtd?.value).toBe(0.2);
    expect(result.input.families.capitalAllocation).toBeUndefined();
    expect(result.diagnostics.deferredMetricIds).toEqual(expect.arrayContaining([
      'freeCashFlowYtd',
      'shareholderDistributionsYtd',
      'distributionCoverageYtd',
      'reinvestmentIntensityYtd',
    ]));
    expect(result.diagnostics.warnings).toContain(
      'SEC_CAPITAL_ALLOCATION_METRICS_DEFERRED_PENDING_INDEPENDENT_SHARE_COUNT_OR_PEER_NORMALIZATION',
    );
  });
});
