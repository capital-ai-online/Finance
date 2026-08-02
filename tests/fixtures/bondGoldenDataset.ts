import type { BondFeatureCandidate } from '../../src/services/bondFeatureContract';

/**
 * Test-only Golden Dataset. These fixtures are synthetic validation cases and MUST NOT be used as
 * production market evidence or exposed through customer-facing scoring APIs.
 */
export const BOND_GOLDEN_DATASET: Array<{
  name: string;
  candidate: BondFeatureCandidate;
  expectedStatus: 'READY_FOR_MODEL_VALIDATION' | 'BOND_EVIDENCE_INCOMPLETE' | 'STALE_EVIDENCE' | 'SOURCE_CONFLICT';
}> = [
  {
    name: 'complete evidence candidate reaches model-validation gate only',
    candidate: {
      identity: {
        providerSymbol: 'TEST10Y.GBOND',
        isin: 'TEST00000001',
        currency: 'USD',
        maturityDate: '2036-08-02',
        couponRatePct: 4.25,
      },
      priceHistoryPoints: 30,
      yieldHistoryPoints: 30,
      modifiedDuration: 7.4,
      yieldToMaturityPct: 4.1,
      treasury2yPct: 3.8,
      treasury10yPct: 4.2,
      evidence: [
        { field: 'priceHistory', provider: 'EODHD', evidenceId: 'test:eodhd:price', observedAt: '2026-08-01T00:00:00.000Z', retrievedAt: '2026-08-02T08:00:00.000Z', value: 99.2, unit: 'USD' },
        { field: 'yieldHistory', provider: 'EODHD', evidenceId: 'test:eodhd:yield', observedAt: '2026-08-01T00:00:00.000Z', retrievedAt: '2026-08-02T08:00:00.000Z', value: 4.1, unit: 'PERCENT' },
        { field: 'treasury2yPct', provider: 'FRED', evidenceId: 'test:fred:DGS2', observedAt: '2026-08-01T00:00:00.000Z', retrievedAt: '2026-08-02T08:00:00.000Z', value: 3.8, unit: 'PERCENT' },
        { field: 'treasury10yPct', provider: 'FRED', evidenceId: 'test:fred:DGS10', observedAt: '2026-08-01T00:00:00.000Z', retrievedAt: '2026-08-02T08:00:00.000Z', value: 4.2, unit: 'PERCENT' },
      ],
    },
    expectedStatus: 'READY_FOR_MODEL_VALIDATION',
  },
  {
    name: 'missing duration remains fail-closed',
    candidate: {
      identity: { providerSymbol: 'TEST5Y.GBOND', currency: 'EUR', maturityDate: '2031-08-02', couponRatePct: 2.5 },
      priceHistoryPoints: 30,
      yieldHistoryPoints: 30,
      yieldToMaturityPct: 2.9,
      treasury2yPct: 3.0,
      treasury10yPct: 3.4,
      evidence: [
        { field: 'priceHistory', provider: 'EODHD', evidenceId: 'test:eodhd:price2', observedAt: '2026-08-01T00:00:00.000Z', retrievedAt: '2026-08-02T08:00:00.000Z', value: 101.1, unit: 'EUR' },
      ],
    },
    expectedStatus: 'BOND_EVIDENCE_INCOMPLETE',
  },
  {
    name: 'source conflict prevents canonical feature set',
    candidate: {
      identity: { providerSymbol: 'TEST2Y.GBOND', currency: 'USD', maturityDate: '2028-08-02', couponRatePct: 3.5 },
      priceHistoryPoints: 30,
      yieldHistoryPoints: 30,
      modifiedDuration: 1.8,
      yieldToMaturityPct: 3.7,
      treasury2yPct: 3.8,
      treasury10yPct: 4.2,
      sourceConflict: true,
      evidence: [
        { field: 'priceHistory', provider: 'EODHD', evidenceId: 'test:eodhd:conflict', observedAt: '2026-08-01T00:00:00.000Z', retrievedAt: '2026-08-02T08:00:00.000Z', value: 100.2, unit: 'USD' },
      ],
    },
    expectedStatus: 'SOURCE_CONFLICT',
  },
];
