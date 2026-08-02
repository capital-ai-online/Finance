import { describe, expect, it } from 'vitest';
import {
  buildReadyScore,
  buildUnavailableScore,
  evaluateDataQualityGate,
  FEATURE_VERSION,
  SCORING_INTEGRITY_VERSION,
} from '../../src/services/scoringIntegrity';
import type { ScoringEvidenceRef } from '../../src/types/scoringIntegrity';

const evidence: ScoringEvidenceRef[] = [{
  id: 'ev-test-1',
  source: 'test-provider',
  kind: 'market-snapshot',
  observedAt: '2026-08-02T05:00:00.000Z',
  retrievedAt: '2026-08-02T05:00:01.000Z',
}];

describe('scoringIntegrity fail-closed gate', () => {
  it('accepts a fresh, evidenced input with sufficient coverage', () => {
    const gate = evaluateDataQualityGate({
      assetId: 'BTC',
      providers: ['test-provider'],
      featureNames: ['trend', 'momentum'],
      values: { trend: 70, momentum: 65 },
      evidence,
      observedAt: '2026-08-02T05:00:00.000Z',
      retrievedAt: '2026-08-02T05:00:01.000Z',
      maxAgeMs: 60_000,
      nowMs: Date.parse('2026-08-02T05:00:30.000Z'),
      minimumCoverage: 1,
    });

    expect(gate.ready).toBe(true);
    expect(gate.integrity.status).toBe('READY');
    expect(gate.integrity.featureVersion).toBe(FEATURE_VERSION);
    expect(gate.integrity.scoringVersion).toBe(SCORING_INTEGRITY_VERSION);
    expect(gate.integrity.evidence).toHaveLength(1);

    const score = buildReadyScore(77.123, gate);
    expect(score.status).toBe('READY');
    expect(score.final_score).toBe(77.12);
    expect(score.score).toBe(7.7);
  });

  it('rejects numeric inputs without provenance', () => {
    const gate = evaluateDataQualityGate({
      assetId: 'BTC',
      providers: ['provider-without-evidence'],
      featureNames: ['trend'],
      values: { trend: 80 },
    });
    expect(gate.ready).toBe(false);
    expect(gate.integrity.status).toBe('SOURCE_UNAVAILABLE');
    expect(buildUnavailableScore(gate).final_score).toBeNull();
  });

  it('rejects stale observations', () => {
    const gate = evaluateDataQualityGate({
      assetId: 'BTC',
      providers: ['test-provider'],
      featureNames: ['trend'],
      values: { trend: 80 },
      evidence,
      observedAt: '2026-08-02T04:00:00.000Z',
      maxAgeMs: 60_000,
      nowMs: Date.parse('2026-08-02T05:00:00.000Z'),
    });
    expect(gate.ready).toBe(false);
    expect(gate.integrity.status).toBe('STALE_DATA');
  });

  it('rejects insufficient history before scoring', () => {
    const gate = evaluateDataQualityGate({
      assetId: 'BTC',
      providers: ['test-provider'],
      featureNames: ['volatility'],
      values: { volatility: 50 },
      evidence,
      minimumHistoryPoints: 30,
      historyPoints: 5,
    });
    expect(gate.ready).toBe(false);
    expect(gate.integrity.status).toBe('INSUFFICIENT_HISTORY');
  });

  it('rejects insufficient feature coverage', () => {
    const gate = evaluateDataQualityGate({
      assetId: 'BTC',
      providers: ['test-provider'],
      featureNames: ['trend', 'momentum', 'volatility'],
      values: { trend: 75, momentum: undefined, volatility: undefined },
      evidence,
      minimumCoverage: 0.8,
    });
    expect(gate.ready).toBe(false);
    expect(gate.integrity.status).toBe('SCORE_NOT_COMPUTABLE');
    expect(gate.integrity.coverage).toBeCloseTo(1 / 3, 8);
  });
});
