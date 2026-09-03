import { describe, expect, it } from 'vitest';
import { MARKET_EVIDENCE_DQ_CONTRACT_VERSION } from '../../src/platform/MarketData/evidenceQualityContracts';
import { composeEquityResearchFeatureSnapshot } from '../../src/platform/Scoring/EquityFeatureComposer';
import { createUnclassifiedEquityClassification } from '../../src/platform/Scoring/EquityModelContracts';
import { deriveEquityFilingMetrics, type EquityFilingFactInput, type EquityFilingRawField } from '../../src/platform/Scoring/EquityFilingDerivedMetrics';
import { EQUITY_COMPARABLE_FILING_METRICS_VERSION, type EquityComparableFilingMetricsResult } from '../../src/platform/Scoring/EquityComparableFilingMetrics';
import { augmentEquityResearchSnapshotWithFilingEvidence } from '../../src/platform/Scoring/EquityFilingFeatureComposer';

const assetId = 'stock:AAPL';
const evaluatedAt = '2026-08-28T12:00:00.000Z';
const observedAt = '2026-08-05T00:00:00.000Z';

function evidence(field: string) {
  return {
    assetId,
    providerId: 'sec-edgar',
    capability: 'companyfacts',
    field,
    observedAt,
    retrievedAt: '2026-08-28T08:00:00.000Z',
    freshness: { ageMs: 23 * 86_400_000, maxAgeMs: 190 * 86_400_000, evaluatedAt },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: 'VERIFIED' as const,
    evidenceRef: `sec:${field}`,
  };
}

function filingFact(field: EquityFilingRawField, value: number, context: EquityFilingFactInput['context'], start: string | null): EquityFilingFactInput {
  return {
    field,
    value,
    unit: 'USD',
    context,
    periodStart: start,
    periodEnd: '2026-06-30T00:00:00.000Z',
    filedAt: observedAt,
    accession: '0001',
    evidence: evidence(field),
  };
}

describe('Equity P1-B filing feature augmentation', () => {
  it('supersedes vendor leverage and adds PIT Growth/Capital Allocation without creating a score', () => {
    const base = composeEquityResearchFeatureSnapshot({
      assetId,
      classification: createUnclassifiedEquityClassification(),
      fundamentals: {
        debtToEquity: 1.8,
        provenance: [{
          field: 'debtToEquity', provider: 'FMP', sourcePath: 'fmp://ratios', retrievedAt: '2026-08-28T08:00:00.000Z', observedAt: '2026-06-30T00:00:00.000Z', value: 1.8,
        }],
      },
      evaluatedAt,
    });

    const filing = deriveEquityFilingMetrics({
      assetId,
      facts: {
        currentAssets: filingFact('currentAssets', 300, 'instant', null),
        currentLiabilities: filingFact('currentLiabilities', 150, 'instant', null),
        shareholdersEquity: filingFact('shareholdersEquity', 500, 'instant', null),
        longTermDebtCurrent: filingFact('longTermDebtCurrent', 50, 'instant', null),
        longTermDebtNoncurrent: filingFact('longTermDebtNoncurrent', 200, 'instant', null),
        operatingCashFlow: filingFact('operatingCashFlow', 100, 'ytd', '2026-01-01T00:00:00.000Z'),
        capitalExpenditure: filingFact('capitalExpenditure', 30, 'ytd', '2026-01-01T00:00:00.000Z'),
        dividendsPaid: filingFact('dividendsPaid', 20, 'ytd', '2026-01-01T00:00:00.000Z'),
        shareRepurchases: filingFact('shareRepurchases', 10, 'ytd', '2026-01-01T00:00:00.000Z'),
      },
    });

    const comparableEvidence = [evidence('revenue-current'), evidence('revenue-prior')];
    const comparable: EquityComparableFilingMetricsResult = {
      contractVersion: EQUITY_COMPARABLE_FILING_METRICS_VERSION,
      assetId,
      metrics: {
        revenueGrowthYoYPct: {
          id: 'revenueGrowthYoYPct', valuePct: 12, currentPeriodEnd: '2026-06-30T00:00:00.000Z', priorPeriodEnd: '2025-06-30T00:00:00.000Z', availableAt: observedAt,
          sourceFields: ['revenue'], evidence: comparableEvidence, correlationGroup: 'equity-growth', basisStatus: 'VERIFIED_COMPARABLE_PERIODS',
        },
        shareCountChangeYoYPct: {
          id: 'shareCountChangeYoYPct', valuePct: -2, currentPeriodEnd: '2026-06-30T00:00:00.000Z', priorPeriodEnd: '2025-06-30T00:00:00.000Z', availableAt: observedAt,
          sourceFields: ['sharesOutstanding'], evidence: [evidence('shares-current'), evidence('shares-prior')], correlationGroup: 'equity-capital-allocation', basisStatus: 'VERIFIED_COMPARABLE_PERIODS',
        },
      },
      missingInputs: [], rejectedEvidence: [], periodMismatches: [], canonical: false, scoreEligible: false, executionEligible: false, normalizationRequired: true,
    };

    const result = augmentEquityResearchSnapshotWithFilingEvidence({ base, filing, comparable });
    const leverage = result.snapshot.features.find(feature => feature.key === 'financialStrength.debtToEquity');
    expect(leverage?.rawValue).toBe(0.5);
    expect(leverage?.evidence.every(item => item.providerId === 'sec-edgar')).toBe(true);
    expect(result.diagnostics.supersededFeatureKeys).toContain('financialStrength.debtToEquity');
    expect(result.snapshot.validFeatures).toContain('growth.revenueGrowthYoYPct');
    expect(result.snapshot.validFeatures).toContain('capitalAllocation.shareCountChangeYoYPct');
    expect(result.snapshot.validFeatures).toContain('capitalAllocation.distributionCoverageYtd');
    expect(result.snapshot.researchCompositeScore).toBeNull();
    expect(result.snapshot.lineage.weightFingerprintSemantic).toBe('NON_EXECUTABLE_ZERO_WEIGHT');
    expect(result.snapshot.scoreEligible).toBe(false);
  });
});
