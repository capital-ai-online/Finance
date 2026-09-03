import { describe, expect, it, vi } from 'vitest';
import { MARKET_EVIDENCE_DQ_CONTRACT_VERSION } from '../../src/platform/MarketData/evidenceQualityContracts';
import { composeEquityResearchFeatureSnapshot } from '../../src/platform/Scoring/EquityFeatureComposer';
import { createUnclassifiedEquityClassification } from '../../src/platform/Scoring/EquityModelContracts';
import { buildEquityP1bResearchFoundation } from '../../server/equityP1bResearchRuntime';
import { SEC_EDGAR_EVIDENCE_VERSION, type SecEdgarCompanyFactsResult } from '../../server/secEdgarCompanyFacts';

const assetId = 'stock:AAPL';

function secResult(year: 2025 | 2026): SecEdgarCompanyFactsResult {
  const evaluatedAt = `${year}-08-28T12:00:00.000Z`;
  const filedAt = `${year}-08-05T00:00:00.000Z`;
  const periodEnd = `${year}-06-30T00:00:00.000Z`;
  const periodStart = `${year}-04-01T00:00:00.000Z`;
  const value = year === 2026 ? 110 : 100;
  return {
    contractVersion: SEC_EDGAR_EVIDENCE_VERSION,
    status: 'PARTIAL',
    symbol: 'AAPL',
    cik: '0000320193',
    entityName: 'Apple Inc.',
    evaluatedAt,
    retrievedAt: evaluatedAt,
    facts: {
      revenue: {
        field: 'revenue', value, unit: 'USD', taxonomy: 'us-gaap', tag: 'Revenues', context: 'periodic', periodStart, periodEnd,
        filedAt, form: '10-Q', accession: `${year}-q2`, frame: null,
        evidence: {
          assetId, providerId: 'sec-edgar', capability: 'companyfacts', field: 'revenue', observedAt: filedAt, retrievedAt: evaluatedAt,
          freshness: { ageMs: 23 * 86_400_000, maxAgeMs: 190 * 86_400_000, evaluatedAt },
          contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION, qualityStatus: 'VERIFIED', evidenceRef: `sec:revenue:${year}`,
        },
      },
    },
    missingFields: [], staleFields: [], canonical: false, scoreEligible: false, executionEligible: false,
  };
}

describe('Equity P1-B research runtime', () => {
  it('uses symmetric prior information time and remains non-authorizing', async () => {
    const baseSnapshot = composeEquityResearchFeatureSnapshot({
      assetId,
      classification: createUnclassifiedEquityClassification(),
      evaluatedAt: '2026-08-28T12:00:00.000Z',
    });
    const buildBaseFoundation = vi.fn().mockResolvedValue({
      runtimeVersion: 'equity-research-runtime/0.1.0', symbol: 'AAPL', snapshot: baseSnapshot,
      canonical: false, scoreEligible: false, executionEligible: false, publicRouteExposed: false,
      authority: 'RESEARCH_ONLY_EXISTING_SCORING_AUTHORITY_UNCHANGED',
    });
    const fetchSecEvidence = vi.fn(async ({ asOf }: { symbol: string; asOf?: string }) => asOf?.startsWith('2025') ? secResult(2025) : secResult(2026));

    const result = await buildEquityP1bResearchFoundation({ symbol: 'AAPL', evaluatedAt: '2026-08-28T12:00:00.000Z' }, {
      buildBaseFoundation,
      fetchSecEvidence,
    });

    expect(fetchSecEvidence).toHaveBeenCalledTimes(2);
    expect(fetchSecEvidence).toHaveBeenNthCalledWith(2, { symbol: 'AAPL', asOf: '2025-08-28T12:00:00.000Z' });
    expect(result.comparable?.metrics.metrics.revenueGrowthYoYPct?.valuePct).toBe(10);
    expect(result.snapshot.validFeatures).toContain('growth.revenueGrowthYoYPct');
    expect(result.snapshot.researchCompositeScore).toBeNull();
    expect(result.publicRouteExposed).toBe(false);
    expect(result.canonical).toBe(false);
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
  });
});
