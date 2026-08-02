import { describe, expect, it } from 'vitest';
import {
  SOVEREIGN_BENCHMARK_SCORING_CONTRACT,
  scoreSovereignBenchmarkEvidence,
} from '../../src/services/sovereignBenchmarkEvidenceScoring';
import type { BondEvidenceResult } from '../../src/services/eodhdBondEvidence';

function evidence(lastDate = '2026-08-01', includeNegative = false): BondEvidenceResult {
  const last = new Date(`${lastDate}T00:00:00.000Z`);
  const points = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(last.getTime() - (29 - index) * 86_400_000).toISOString().slice(0, 10);
    const base = includeNegative ? -0.25 : 3.5;
    return { date, value: base + index * 0.025 + Math.sin(index / 4) * 0.05 };
  });
  return {
    provider: 'EODHD',
    providerSymbol: 'DE10Y.GBOND',
    points,
    retrievedAt: `${lastDate}T23:59:59.000Z`,
    sourcePath: 'https://eodhd.com/api/eod/DE10Y.GBOND',
    evidenceIds: points.map(point => `bond:eodhd:DE10Y.GBOND:${point.date}`),
  };
}

describe('sovereign benchmark yield evidence scoring', () => {
  it('is approved only for sovereign benchmark yield-state semantics', () => {
    expect(SOVEREIGN_BENCHMARK_SCORING_CONTRACT.status).toBe('approved');
    expect(SOVEREIGN_BENCHMARK_SCORING_CONTRACT.scoringEnabled).toBe(true);
    expect(SOVEREIGN_BENCHMARK_SCORING_CONTRACT.semanticScope).toContain('not an individual-bond');
  });

  it('returns READY for complete fresh EODHD benchmark evidence while keeping individual bonds locked', () => {
    const result = scoreSovereignBenchmarkEvidence('GB_DE_10Y', evidence(), Date.parse('2026-08-02T12:00:00.000Z'));
    expect(result.canonical.status).toBe('READY');
    expect(result.canonical.final_score).toBeTypeOf('number');
    expect(result.providers).toEqual(['EODHD']);
    expect(result.individualBondScoringEligible).toBe(false);
    expect(result.evidenceIds).toHaveLength(30);
  });

  it('preserves negative sovereign yields as valid finite evidence', () => {
    const result = scoreSovereignBenchmarkEvidence('GB_DE_10Y', evidence('2026-08-01', true), Date.parse('2026-08-02T12:00:00.000Z'));
    expect(result.canonical.status).toBe('READY');
    expect(result.canonical.final_score).toBeTypeOf('number');
  });

  it('fails closed for stale benchmark evidence', () => {
    const result = scoreSovereignBenchmarkEvidence('GB_DE_10Y', evidence('2026-06-01'), Date.parse('2026-08-02T12:00:00.000Z'));
    expect(result.canonical.status).toBe('STALE_DATA');
    expect(result.canonical.final_score).toBeNull();
  });
});
