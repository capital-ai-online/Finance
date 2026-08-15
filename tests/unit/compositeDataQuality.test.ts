import { describe, it, expect } from 'vitest';
import {
  computeCompositeDataQuality,
  computeUnifiedConfidence,
  compositeLevelToRankingDqPoints,
  COMPOSITE_DATA_QUALITY_VERSION,
} from '../../src/platform/MarketData/CompositeDataQuality';

describe('CompositeDataQuality (SC-3)', () => {
  it('exposes stable contract version', () => {
    expect(COMPOSITE_DATA_QUALITY_VERSION).toBe('composite-data-quality/1.0.0');
  });

  it('returns unknown when no factors are available', () => {
    const result = computeCompositeDataQuality({});
    expect(result.score).toBeNull();
    expect(result.level).toBe('unknown');
    expect(result.rankingImpactEnabled).toBe(false);
  });

  it('computes high composite for strong coverage, freshness, breadth', () => {
    const result = computeCompositeDataQuality({
      sourceCoverage: 1,
      freshnessMs: 5_000,
      maxAgeMs: 90_000,
      providerCount: 3,
      supplyTransparency: 1,
      outlierDetected: false,
      snapshotState: 'LIVE',
    });
    expect(result.score).not.toBeNull();
    expect(result.score!).toBeGreaterThanOrEqual(75);
    expect(result.level).toBe('high');
    expect(result.rankingImpactEnabled).toBe(false);
  });

  it('redistributes weights when optional factors are missing', () => {
    const result = computeCompositeDataQuality({
      sourceCoverage: 0.8,
      freshnessMs: 10_000,
      maxAgeMs: 90_000,
      providerCount: 2,
    });
    expect(result.missingFactors).toEqual(expect.arrayContaining(['supplyTransparency', 'outlierStability']));
    expect(result.score).not.toBeNull();
    const weightSum = Object.values(result.weightsUsed).reduce((a, b) => a + b, 0);
    expect(weightSum).toBeCloseTo(1, 3);
  });

  it('caps score for INVALID snapshot state', () => {
    const result = computeCompositeDataQuality({
      sourceCoverage: 1,
      freshnessMs: 0,
      providerCount: 3,
      supplyTransparency: 1,
      outlierDetected: false,
      snapshotState: 'INVALID',
    });
    expect(result.score).not.toBeNull();
    expect(result.score!).toBeLessThanOrEqual(20);
  });

  it('unified confidence never enables score impact', () => {
    const composite = computeCompositeDataQuality({
      sourceCoverage: 1,
      freshnessMs: 1000,
      providerCount: 2,
      outlierDetected: false,
    });
    const conf = computeUnifiedConfidence({
      baseConfidence: 0.9,
      composite,
      providerCount: 2,
      freshnessMs: 1000,
    });
    expect(conf.scoreImpactEnabled).toBe(false);
    expect(conf.recommendationImpactEnabled).toBe(false);
    expect(conf.confidence).toBeGreaterThan(0);
    expect(conf.confidence).toBeLessThanOrEqual(1);
  });

  it('maps composite levels to legacy ranking DQ points without changing formula ownership', () => {
    expect(compositeLevelToRankingDqPoints('high')).toBe(100);
    expect(compositeLevelToRankingDqPoints('medium')).toBe(70);
    expect(compositeLevelToRankingDqPoints('low')).toBe(40);
    expect(compositeLevelToRankingDqPoints('unknown')).toBe(50);
  });
});
