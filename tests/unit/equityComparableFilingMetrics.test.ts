import { describe, expect, it } from 'vitest';
import { MARKET_EVIDENCE_DQ_CONTRACT_VERSION } from '../../src/platform/MarketData/evidenceQualityContracts';
import { deriveEquityFilingMetrics } from '../../src/platform/Scoring/EquityFilingDerivedMetrics';
import {
  deriveEquityComparableFilingMetrics,
  type EquityComparableFactInput,
  type EquityComparableRawField,
} from '../../src/platform/Scoring/EquityComparableFilingMetrics';

const assetId = 'stock:AAPL';
const evaluatedAt = '2026-08-28T12:00:00.000Z';

function comparableFact(
  field: EquityComparableRawField,
  value: number,
  periodStart: string | null,
  periodEnd: string,
  context: EquityComparableFactInput['context'],
): EquityComparableFactInput {
  const observedAt = periodEnd.startsWith('2026') ? '2026-08-05T00:00:00.000Z' : '2025-08-05T00:00:00.000Z';
  return {
    field,
    value,
    unit: field === 'sharesOutstanding' ? 'shares' : field === 'dilutedEps' ? 'USD/shares' : 'USD',
    context,
    periodStart,
    periodEnd,
    filedAt: observedAt,
    accession: `${field}:${periodEnd}`,
    evidence: {
      assetId,
      providerId: 'sec-edgar',
      capability: 'companyfacts',
      field,
      observedAt,
      retrievedAt: '2026-08-28T08:00:00.000Z',
      freshness: { ageMs: 10, maxAgeMs: 430 * 86_400_000, evaluatedAt },
      contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
      qualityStatus: 'VERIFIED',
      evidenceRef: `sec:${field}:${periodEnd}`,
    },
  };
}

describe('Equity comparable filing metrics', () => {
  it('derives YoY metrics only from comparable point-in-time periods', () => {
    const current = {
      assetId,
      facts: {
        revenue: comparableFact('revenue', 110, '2026-04-01T00:00:00.000Z', '2026-06-30T00:00:00.000Z', 'periodic'),
        dilutedEps: comparableFact('dilutedEps', 2.2, '2026-04-01T00:00:00.000Z', '2026-06-30T00:00:00.000Z', 'periodic'),
        sharesOutstanding: comparableFact('sharesOutstanding', 98, null, '2026-06-30T00:00:00.000Z', 'instant'),
      },
    } as const;
    const prior = {
      assetId,
      facts: {
        revenue: comparableFact('revenue', 100, '2025-04-01T00:00:00.000Z', '2025-06-30T00:00:00.000Z', 'periodic'),
        dilutedEps: comparableFact('dilutedEps', 2, '2025-04-01T00:00:00.000Z', '2025-06-30T00:00:00.000Z', 'periodic'),
        sharesOutstanding: comparableFact('sharesOutstanding', 100, null, '2025-06-30T00:00:00.000Z', 'instant'),
      },
    } as const;
    const currentFiling = { assetId, facts: {} } as const;
    const priorFiling = { assetId, facts: {} } as const;
    const result = deriveEquityComparableFilingMetrics({
      current,
      prior,
      currentFiling,
      priorFiling,
      currentDerived: deriveEquityFilingMetrics(currentFiling),
      priorDerived: deriveEquityFilingMetrics(priorFiling),
    });

    expect(result.metrics.revenueGrowthYoYPct?.valuePct).toBe(10);
    expect(result.metrics.dilutedEpsGrowthYoYPct?.valuePct).toBe(10);
    expect(result.metrics.shareCountChangeYoYPct?.valuePct).toBe(-2);
    expect(result.scoreEligible).toBe(false);
  });

  it('fails closed when fiscal periods are not approximately one year apart', () => {
    const current = { assetId, facts: { revenue: comparableFact('revenue', 110, '2026-04-01T00:00:00.000Z', '2026-06-30T00:00:00.000Z', 'periodic') } } as const;
    const prior = { assetId, facts: { revenue: comparableFact('revenue', 100, '2025-01-01T00:00:00.000Z', '2025-03-31T00:00:00.000Z', 'periodic') } } as const;
    const currentFiling = { assetId, facts: {} } as const;
    const priorFiling = { assetId, facts: {} } as const;
    const result = deriveEquityComparableFilingMetrics({
      current,
      prior,
      currentFiling,
      priorFiling,
      currentDerived: deriveEquityFilingMetrics(currentFiling),
      priorDerived: deriveEquityFilingMetrics(priorFiling),
    });
    expect(result.metrics.revenueGrowthYoYPct).toBeUndefined();
    expect(result.periodMismatches).toContain('revenueGrowthYoYPct');
  });
});
