import { describe, expect, it } from 'vitest';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import type { SecEdgarCompanyFactsResult, SecEdgarRawField } from '../../server/secEdgarCompanyFacts';
import { bridgeSecCompanyFactsToEquityFilingEvidence } from '../../server/equitySecEvidenceBridge';
import {
  bridgeSecComparableEvidence,
  buildPriorComparableAsOf,
} from '../../server/equitySecComparableEvidence';

const assetId = 'stock:MSFT';

function evidence(field: string, year: number): MarketEvidenceQualityRecord {
  const filed = `${year}-07-25T00:00:00.000Z`;
  return {
    assetId,
    providerId: 'sec-edgar',
    capability: 'companyfacts',
    field,
    observedAt: filed,
    retrievedAt: '2026-08-23T14:00:00.000Z',
    freshness: { ageMs: 1_000, maxAgeMs: 190 * 24 * 60 * 60 * 1000, evaluatedAt: filed },
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    qualityStatus: 'VERIFIED',
    evidenceRef: `sec:${field}:${year}`,
  };
}

function secFact(field: SecEdgarRawField, value: number, year: number, context: 'instant' | 'periodic' | 'ytd') {
  return {
    field,
    value,
    unit: field === 'sharesOutstanding' ? 'shares' : field === 'dilutedEps' ? 'USD/shares' : 'USD',
    taxonomy: field === 'sharesOutstanding' ? 'dei' : 'us-gaap',
    tag: field,
    context,
    periodStart: context === 'instant' ? null : context === 'periodic'
      ? `${year}-04-01T00:00:00.000Z`
      : `${year}-01-01T00:00:00.000Z`,
    periodEnd: `${year}-06-30T00:00:00.000Z`,
    filedAt: `${year}-07-25T00:00:00.000Z`,
    form: '10-Q',
    accession: `${year}-q2`,
    frame: null,
    evidence: evidence(field, year),
  } as const;
}

function secResult(year: 2025 | 2026): SecEdgarCompanyFactsResult {
  const current = year === 2026;
  return {
    contractVersion: 'sec-edgar-companyfacts-evidence/0.1.0',
    status: 'PARTIAL',
    symbol: 'MSFT',
    cik: '0000789019',
    entityName: 'Microsoft Corp',
    evaluatedAt: `${year}-10-01T00:00:00.000Z`,
    retrievedAt: '2026-08-23T14:00:00.000Z',
    facts: {
      revenue: secFact('revenue', current ? 120 : 100, year, 'periodic'),
      dilutedEps: secFact('dilutedEps', current ? 5 : 4, year, 'periodic'),
      sharesOutstanding: secFact('sharesOutstanding', current ? 100 : 105, year, 'instant'),
      operatingCashFlow: secFact('operatingCashFlow', current ? 100 : 80, year, 'ytd'),
      capitalExpenditure: secFact('capitalExpenditure', current ? 20 : 15, year, 'ytd'),
    },
    missingFields: [],
    staleFields: [],
    scoreEligible: false,
    executionEligible: false,
  };
}

describe('Equity SEC comparable evidence', () => {
  it('berechnet ein begrenztes historisches asOf für dieselbe Vorjahresperiode', () => {
    const result = buildPriorComparableAsOf(secResult(2026));

    expect(result?.targetPriorPeriodEnd).toBe('2025-06-30T00:00:00.000Z');
    expect(result?.priorAsOf).toBe('2025-10-03T00:00:00.000Z');
  });

  it('verbindet aktuelle und Vorjahres-SEC-Evidence zu providerneutralen vergleichbaren Metriken', () => {
    const current = secResult(2026);
    const prior = secResult(2025);
    const currentBridge = bridgeSecCompanyFactsToEquityFilingEvidence(current, assetId);
    const priorBridge = bridgeSecCompanyFactsToEquityFilingEvidence(prior, assetId);
    const spec = buildPriorComparableAsOf(current)!;
    const result = bridgeSecComparableEvidence({
      assetId,
      currentSec: current,
      priorSec: prior,
      currentBridge,
      priorBridge,
      targetPriorPeriodEnd: spec.targetPriorPeriodEnd,
      priorAsOf: spec.priorAsOf,
    });

    expect(result.mappedCurrentFields).toEqual(expect.arrayContaining(['revenue', 'dilutedEps', 'sharesOutstanding']));
    expect(result.mappedPriorFields).toEqual(expect.arrayContaining(['revenue', 'dilutedEps', 'sharesOutstanding']));
    expect(result.metrics.metrics.revenueGrowthYoYPct?.valuePct).toBe(20);
    expect(result.metrics.metrics.dilutedEpsGrowthYoYPct?.valuePct).toBe(25);
    expect(result.metrics.metrics.shareCountChangeYoYPct?.valuePct).toBeCloseTo(((100 / 105) - 1) * 100, 6);
    expect(result.metrics.metrics.freeCashFlowGrowthYoYPct).toBeDefined();
    expect(result.scoreEligible).toBe(false);
  });

  it('verwirft Vorperioden außerhalb der erlaubten Fiskalkalender-Toleranz', () => {
    const current = secResult(2026);
    const prior = secResult(2025);
    const badRevenue = {
      ...prior.facts.revenue!,
      periodEnd: '2025-05-15T00:00:00.000Z',
    };
    const shifted: SecEdgarCompanyFactsResult = {
      ...prior,
      facts: { ...prior.facts, revenue: badRevenue },
    };
    const currentBridge = bridgeSecCompanyFactsToEquityFilingEvidence(current, assetId);
    const priorBridge = bridgeSecCompanyFactsToEquityFilingEvidence(shifted, assetId);
    const spec = buildPriorComparableAsOf(current)!;
    const result = bridgeSecComparableEvidence({
      assetId,
      currentSec: current,
      priorSec: shifted,
      currentBridge,
      priorBridge,
      targetPriorPeriodEnd: spec.targetPriorPeriodEnd,
      priorAsOf: spec.priorAsOf,
    });

    expect(result.rejectedPriorFields).toContain('revenue');
    expect(result.metrics.metrics.revenueGrowthYoYPct).toBeUndefined();
  });
});
