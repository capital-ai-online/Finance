import { describe, expect, it } from 'vitest';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import {
  deriveEquityComparableFilingMetrics,
  type EquityComparableFactSnapshot,
} from '../../src/platform/Scoring/EquityComparableFilingMetrics';
import {
  deriveEquityFilingMetrics,
  type EquityFilingEvidenceSnapshot,
  type EquityFilingFactInput,
  type EquityFilingRawField,
} from '../../src/platform/Scoring/EquityFilingDerivedMetrics';

const assetId = 'stock:MSFT';
const evaluatedAt = '2026-08-23T15:00:00.000Z';

function evidence(field: string, observedAt: string, refSuffix: string): MarketEvidenceQualityRecord {
  return {
    assetId,
    providerId: 'sec-edgar',
    capability: 'companyfacts',
    field,
    observedAt,
    retrievedAt: '2026-08-23T14:00:00.000Z',
    freshness: {
      ageMs: 1_000,
      maxAgeMs: 190 * 24 * 60 * 60 * 1000,
      evaluatedAt,
    },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: 'VERIFIED',
    evidenceRef: `sec:${field}:${refSuffix}`,
  };
}

function comparableSnapshot(year: 2025 | 2026): EquityComparableFactSnapshot {
  const current = year === 2026;
  const end = `${year}-06-30T00:00:00.000Z`;
  const start = `${year}-04-01T00:00:00.000Z`;
  const filed = `${year}-07-25T00:00:00.000Z`;
  const values = current
    ? { revenue: 120, dilutedEps: 5, sharesOutstanding: 100 }
    : { revenue: 100, dilutedEps: 4, sharesOutstanding: 105 };
  return {
    assetId,
    facts: {
      revenue: {
        field: 'revenue', value: values.revenue, unit: 'USD', context: 'periodic', periodStart: start,
        periodEnd: end, filedAt: filed, accession: `${year}-q2`, evidence: evidence('revenue', filed, String(year)),
      },
      dilutedEps: {
        field: 'dilutedEps', value: values.dilutedEps, unit: 'USD/shares', context: 'periodic', periodStart: start,
        periodEnd: end, filedAt: filed, accession: `${year}-q2`, evidence: evidence('dilutedEps', filed, String(year)),
      },
      sharesOutstanding: {
        field: 'sharesOutstanding', value: values.sharesOutstanding, unit: 'shares', context: 'instant', periodStart: null,
        periodEnd: end, filedAt: filed, accession: `${year}-q2`, evidence: evidence('sharesOutstanding', filed, String(year)),
      },
    },
  };
}

function filingSnapshot(year: 2025 | 2026): EquityFilingEvidenceSnapshot {
  const current = year === 2026;
  const start = `${year}-01-01T00:00:00.000Z`;
  const end = `${year}-06-30T00:00:00.000Z`;
  const filed = `${year}-07-25T00:00:00.000Z`;
  const values = current
    ? { operatingCashFlow: 100, capitalExpenditure: 20 }
    : { operatingCashFlow: 80, capitalExpenditure: 15 };
  const facts: Partial<Record<EquityFilingRawField, EquityFilingFactInput>> = {};
  for (const field of ['operatingCashFlow', 'capitalExpenditure'] as const) {
    facts[field] = {
      field,
      value: values[field],
      unit: 'USD',
      context: 'ytd',
      periodStart: start,
      periodEnd: end,
      filedAt: filed,
      accession: `${year}-q2`,
      evidence: evidence(field, filed, String(year)),
    };
  }
  return { assetId, facts };
}

describe('Equity comparable filing metrics', () => {
  it('berechnet YoY Revenue/EPS/FCF und Share-Count-Change nur aus vergleichbaren VERIFIED Perioden', () => {
    const currentFiling = filingSnapshot(2026);
    const priorFiling = filingSnapshot(2025);
    const result = deriveEquityComparableFilingMetrics({
      current: comparableSnapshot(2026),
      prior: comparableSnapshot(2025),
      currentFiling,
      priorFiling,
      currentDerived: deriveEquityFilingMetrics(currentFiling),
      priorDerived: deriveEquityFilingMetrics(priorFiling),
    });

    expect(result.metrics.revenueGrowthYoYPct?.valuePct).toBe(20);
    expect(result.metrics.dilutedEpsGrowthYoYPct?.valuePct).toBe(25);
    expect(result.metrics.freeCashFlowGrowthYoYPct?.valuePct).toBeCloseTo(((80 / 65) - 1) * 100, 6);
    expect(result.metrics.shareCountChangeYoYPct?.valuePct).toBeCloseTo(((100 / 105) - 1) * 100, 6);
    expect(result.metrics.revenueGrowthYoYPct?.evidence).toHaveLength(2);
    expect(result.metrics.freeCashFlowGrowthYoYPct?.evidence).toHaveLength(4);
    expect(result.periodMismatches).toEqual([]);
    expect(result.scoreEligible).toBe(false);
    expect(result.normalizationRequired).toBe(true);
  });

  it('verwirft periodische YoY-Vergleiche bei inkompatibler Periodenlänge', () => {
    const current = comparableSnapshot(2026);
    const priorBase = comparableSnapshot(2025);
    const prior: EquityComparableFactSnapshot = {
      ...priorBase,
      facts: {
        ...priorBase.facts,
        revenue: {
          ...priorBase.facts.revenue!,
          periodStart: '2025-01-01T00:00:00.000Z',
        },
      },
    };
    const currentFiling = filingSnapshot(2026);
    const priorFiling = filingSnapshot(2025);
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
    expect(result.metrics.dilutedEpsGrowthYoYPct?.valuePct).toBe(25);
  });
});
