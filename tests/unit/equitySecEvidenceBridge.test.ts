import { describe, expect, it } from 'vitest';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import type { SecEdgarCompanyFactsResult, SecEdgarRawField } from '../../server/secEdgarCompanyFacts';
import { bridgeSecCompanyFactsToEquityFilingEvidence } from '../../server/equitySecEvidenceBridge';

const evaluatedAt = '2026-08-23T15:00:00.000Z';
const filedAt = '2026-07-25T00:00:00.000Z';
const periodEnd = '2026-06-30T00:00:00.000Z';

function evidence(field: string): MarketEvidenceQualityRecord {
  return {
    assetId: 'stock:MSFT',
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
    evidenceRef: `sec:${field}`,
  };
}

function secFact(field: SecEdgarRawField, value: number, context: 'instant' | 'periodic' | 'ytd') {
  return {
    field,
    value,
    unit: field === 'sharesOutstanding' ? 'shares' : 'USD',
    taxonomy: field === 'sharesOutstanding' ? 'dei' : 'us-gaap',
    tag: field,
    context,
    periodStart: context === 'instant' ? null : context === 'periodic'
      ? '2026-04-01T00:00:00.000Z'
      : '2026-01-01T00:00:00.000Z',
    periodEnd,
    filedAt,
    form: '10-Q',
    accession: '0000789019-26-000001',
    frame: null,
    evidence: evidence(field),
  } as const;
}

function secResult(): SecEdgarCompanyFactsResult {
  return {
    contractVersion: 'sec-edgar-companyfacts-evidence/0.1.0',
    status: 'PARTIAL',
    symbol: 'MSFT',
    cik: '0000789019',
    entityName: 'Microsoft Corp',
    evaluatedAt,
    retrievedAt: '2026-08-23T14:00:00.000Z',
    facts: {
      currentAssets: secFact('currentAssets', 150, 'instant'),
      currentLiabilities: secFact('currentLiabilities', 100, 'instant'),
      operatingCashFlow: secFact('operatingCashFlow', 100, 'ytd'),
      capitalExpenditure: secFact('capitalExpenditure', 20, 'ytd'),
      sharesOutstanding: secFact('sharesOutstanding', 7_500_000_000, 'instant'),
      revenue: secFact('revenue', 60_000_000_000, 'periodic'),
    },
    missingFields: [],
    staleFields: [],
    scoreEligible: false,
    executionEligible: false,
  };
}

describe('Equity SEC evidence bridge', () => {
  it('mappt nur providerneutrale Filing-Raw-Felder und ignoriert nicht abgeleitete SEC-Felder', () => {
    const result = bridgeSecCompanyFactsToEquityFilingEvidence(secResult(), 'stock:MSFT');

    expect(result.mappedFields).toEqual(expect.arrayContaining([
      'currentAssets',
      'currentLiabilities',
      'operatingCashFlow',
      'capitalExpenditure',
    ]));
    expect(result.ignoredFields).toEqual(expect.arrayContaining(['sharesOutstanding', 'revenue']));
    expect(result.snapshot.facts.currentAssets?.evidence.providerId).toBe('sec-edgar');
    expect(result.derived.metrics.currentRatio?.value).toBe(1.5);
    expect(result.derived.metrics.freeCashFlowYtd?.value).toBe(80);
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });

  it('übernimmt keine Evidence mit falscher Asset-Identity', () => {
    const sec = secResult();
    const result = bridgeSecCompanyFactsToEquityFilingEvidence(sec, 'stock:AAPL');

    expect(result.mappedFields).toEqual([]);
    expect(result.snapshot.facts).toEqual({});
    expect(result.derived.metrics).toEqual({});
  });
});
