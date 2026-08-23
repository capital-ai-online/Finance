import { describe, expect, it } from 'vitest';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import {
  deriveEquityFilingMetrics,
  type EquityFilingFactInput,
  type EquityFilingRawField,
} from '../../src/platform/Scoring/EquityFilingDerivedMetrics';

const assetId = 'stock:MSFT';
const evaluatedAt = '2026-08-23T15:00:00.000Z';
const retrievedAt = '2026-08-23T14:00:00.000Z';
const filedAt = '2026-08-01T00:00:00.000Z';

function evidence(field: string, qualityStatus: MarketEvidenceQualityRecord['qualityStatus'] = 'VERIFIED'): MarketEvidenceQualityRecord {
  return {
    assetId,
    providerId: 'sec-edgar',
    capability: 'companyfacts',
    field,
    observedAt: filedAt,
    retrievedAt,
    freshness: {
      ageMs: 22 * 24 * 60 * 60 * 1000,
      maxAgeMs: 190 * 24 * 60 * 60 * 1000,
      evaluatedAt,
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus,
    evidenceRef: `sec-edgar:0000789019:accn:${field}`,
  };
}

function instant(field: EquityFilingRawField, value: number): EquityFilingFactInput {
  return {
    field,
    value,
    unit: 'USD',
    context: 'instant',
    periodStart: null,
    periodEnd: '2026-06-30T00:00:00.000Z',
    filedAt,
    accession: '0000789019-26-000002',
    evidence: evidence(field),
  };
}

function periodic(field: EquityFilingRawField, value: number, start = '2026-04-01T00:00:00.000Z'): EquityFilingFactInput {
  return {
    field,
    value,
    unit: 'USD',
    context: 'periodic',
    periodStart: start,
    periodEnd: '2026-06-30T00:00:00.000Z',
    filedAt,
    accession: '0000789019-26-000002',
    evidence: evidence(field),
  };
}

function ytd(field: EquityFilingRawField, value: number, start = '2026-01-01T00:00:00.000Z'): EquityFilingFactInput {
  return {
    field,
    value,
    unit: 'USD',
    context: 'ytd',
    periodStart: start,
    periodEnd: '2026-06-30T00:00:00.000Z',
    filedAt,
    accession: '0000789019-26-000002',
    evidence: evidence(field),
  };
}

describe('Equity filing derived metrics', () => {
  it('leitet periodenkompatible Financial-Strength- und Cash-Allocation-Metriken ohne Score ab', () => {
    const result = deriveEquityFilingMetrics({
      assetId,
      facts: {
        currentAssets: instant('currentAssets', 200),
        currentLiabilities: instant('currentLiabilities', 100),
        shareholdersEquity: instant('shareholdersEquity', 200),
        longTermDebtCurrent: instant('longTermDebtCurrent', 20),
        longTermDebtNoncurrent: instant('longTermDebtNoncurrent', 100),
        operatingIncome: periodic('operatingIncome', 50),
        interestExpense: periodic('interestExpense', 10),
        operatingCashFlow: ytd('operatingCashFlow', 100),
        capitalExpenditure: ytd('capitalExpenditure', 20),
        dividendsPaid: ytd('dividendsPaid', 20),
        shareRepurchases: ytd('shareRepurchases', 20),
      },
    });

    expect(result.metrics.currentRatio?.value).toBe(2);
    expect(result.metrics.noncurrentLongTermDebtToEquity?.value).toBe(0.5);
    expect(result.metrics.totalLongTermDebtToEquity?.value).toBe(0.6);
    expect(result.metrics.interestCoverage?.value).toBe(5);
    expect(result.metrics.freeCashFlowYtd?.value).toBe(80);
    expect(result.metrics.shareholderDistributionsYtd?.value).toBe(40);
    expect(result.metrics.distributionCoverageYtd?.value).toBe(2);
    expect(result.metrics.reinvestmentIntensityYtd?.value).toBe(0.2);
    expect(result.periodMismatches).toEqual([]);
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
    expect(result.normalizationRequired).toBe(true);
    expect(result.metrics.distributionCoverageYtd?.evidenceRefs).toHaveLength(4);
  });

  it('verhindert Cross-Period Interest Coverage statt inkompatible Quartale zu dividieren', () => {
    const result = deriveEquityFilingMetrics({
      assetId,
      facts: {
        operatingIncome: periodic('operatingIncome', 50, '2026-04-01T00:00:00.000Z'),
        interestExpense: periodic('interestExpense', 10, '2026-01-01T00:00:00.000Z'),
      },
    });

    expect(result.metrics.interestCoverage).toBeUndefined();
    expect(result.periodMismatches).toContain('interestCoverage');
  });

  it('interpretiert fehlende Current-Debt-Evidence nicht als Null', () => {
    const result = deriveEquityFilingMetrics({
      assetId,
      facts: {
        shareholdersEquity: instant('shareholdersEquity', 200),
        longTermDebtNoncurrent: instant('longTermDebtNoncurrent', 100),
      },
    });

    expect(result.metrics.noncurrentLongTermDebtToEquity?.value).toBe(0.5);
    expect(result.metrics.totalLongTermDebtToEquity).toBeUndefined();
    expect(result.missingInputs).toContain('longTermDebtCurrent');
  });

  it('verwirft nicht-admissible Evidence vollständig aus Derived Metrics', () => {
    const staleAssets = instant('currentAssets', 200);
    const staleEvidence = { ...staleAssets.evidence, qualityStatus: 'STALE' as const };
    const result = deriveEquityFilingMetrics({
      assetId,
      facts: {
        currentAssets: { ...staleAssets, evidence: staleEvidence },
        currentLiabilities: instant('currentLiabilities', 100),
      },
    });

    expect(result.metrics.currentRatio).toBeUndefined();
    expect(result.rejectedEvidence).toContain('currentAssets');
  });

  it('verhindert Distribution Coverage bei nicht deckungsgleichen YTD-Perioden', () => {
    const result = deriveEquityFilingMetrics({
      assetId,
      facts: {
        operatingCashFlow: ytd('operatingCashFlow', 100, '2026-01-01T00:00:00.000Z'),
        capitalExpenditure: ytd('capitalExpenditure', 20, '2026-01-01T00:00:00.000Z'),
        dividendsPaid: ytd('dividendsPaid', 20, '2026-04-01T00:00:00.000Z'),
        shareRepurchases: ytd('shareRepurchases', 20, '2026-04-01T00:00:00.000Z'),
      },
    });

    expect(result.metrics.freeCashFlowYtd?.value).toBe(80);
    expect(result.metrics.shareholderDistributionsYtd?.value).toBe(40);
    expect(result.metrics.distributionCoverageYtd).toBeUndefined();
    expect(result.periodMismatches).toContain('distributionCoverageYtd');
  });
});
