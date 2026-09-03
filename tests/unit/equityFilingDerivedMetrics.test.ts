import { describe, expect, it } from 'vitest';
import { MARKET_EVIDENCE_DQ_CONTRACT_VERSION } from '../../src/platform/MarketData/evidenceQualityContracts';
import {
  deriveEquityFilingMetrics,
  type EquityFilingFactInput,
  type EquityFilingRawField,
} from '../../src/platform/Scoring/EquityFilingDerivedMetrics';

const assetId = 'stock:AAPL';
const evaluatedAt = '2026-08-28T12:00:00.000Z';

function fact(
  field: EquityFilingRawField,
  value: number,
  context: EquityFilingFactInput['context'],
  periodStart: string | null,
  periodEnd = '2026-06-30T00:00:00.000Z',
): EquityFilingFactInput {
  return {
    field,
    value,
    unit: 'USD',
    context,
    periodStart,
    periodEnd,
    filedAt: '2026-08-05T00:00:00.000Z',
    accession: '0001',
    evidence: {
      assetId,
      providerId: 'sec-edgar',
      capability: 'companyfacts',
      field,
      observedAt: '2026-08-05T00:00:00.000Z',
      retrievedAt: '2026-08-28T08:00:00.000Z',
      freshness: { ageMs: 23 * 86_400_000, maxAgeMs: 190 * 86_400_000, evaluatedAt },
      contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
      qualityStatus: 'VERIFIED',
      evidenceRef: `sec:${field}`,
    },
  };
}

describe('Equity filing-derived metrics', () => {
  it('derives balance-sheet and cash-allocation metrics only from compatible periods', () => {
    const result = deriveEquityFilingMetrics({
      assetId,
      facts: {
        currentAssets: fact('currentAssets', 300, 'instant', null),
        currentLiabilities: fact('currentLiabilities', 150, 'instant', null),
        shareholdersEquity: fact('shareholdersEquity', 500, 'instant', null),
        longTermDebtCurrent: fact('longTermDebtCurrent', 50, 'instant', null),
        longTermDebtNoncurrent: fact('longTermDebtNoncurrent', 200, 'instant', null),
        operatingCashFlow: fact('operatingCashFlow', 100, 'ytd', '2026-01-01T00:00:00.000Z'),
        capitalExpenditure: fact('capitalExpenditure', 30, 'ytd', '2026-01-01T00:00:00.000Z'),
        dividendsPaid: fact('dividendsPaid', 20, 'ytd', '2026-01-01T00:00:00.000Z'),
        shareRepurchases: fact('shareRepurchases', 10, 'ytd', '2026-01-01T00:00:00.000Z'),
      },
    });
    expect(result.metrics.currentRatio?.value).toBe(2);
    expect(result.metrics.totalLongTermDebtToEquity?.value).toBe(0.5);
    expect(result.metrics.freeCashFlowYtd?.value).toBe(70);
    expect(result.metrics.distributionCoverageYtd?.value).toBeCloseTo(70 / 30, 6);
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });

  it('does not derive across incompatible dates or missing facts', () => {
    const result = deriveEquityFilingMetrics({
      assetId,
      facts: {
        currentAssets: fact('currentAssets', 300, 'instant', null, '2026-06-30T00:00:00.000Z'),
        currentLiabilities: fact('currentLiabilities', 150, 'instant', null, '2026-03-31T00:00:00.000Z'),
        operatingCashFlow: fact('operatingCashFlow', 100, 'ytd', '2026-01-01T00:00:00.000Z'),
      },
    });
    expect(result.metrics.currentRatio).toBeUndefined();
    expect(result.periodMismatches).toContain('currentRatio');
    expect(result.metrics.freeCashFlowYtd).toBeUndefined();
    expect(result.missingInputs).toContain('capitalExpenditure');
  });
});
