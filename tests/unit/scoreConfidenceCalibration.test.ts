import { describe, expect, it } from 'vitest';
import { calibrateScoreConfidence } from '../../src/services/scoreConfidenceCalibration';

describe('score confidence calibration', () => {
  it('refuses to fabricate confidence below the minimum sample', () => {
    const result = calibrateScoreConfidence({ sampleSize: 12, hitRatePct: 83.3, falsePositiveRatePct: 16.7, insufficientData: false }, 30);
    expect(result.state).toBe('INSUFFICIENT_DATA');
    expect(result.confidencePct).toBeNull();
    expect(result.scoreImpactEnabled).toBe(false);
    expect(result.recommendationImpactEnabled).toBe(false);
  });

  it('uses empirical hit rate only after sufficient validation evidence', () => {
    const result = calibrateScoreConfidence({ sampleSize: 80, hitRatePct: 67.45, falsePositiveRatePct: 32.55, insufficientData: false }, 30);
    expect(result.state).toBe('CALIBRATED');
    expect(result.confidencePct).toBe(67.5);
    expect(result.methodology).toBe('empirical-hit-rate');
    expect(result.scoreImpactEnabled).toBe(false);
  });

  it('returns insufficient data when hit-rate evidence is unavailable', () => {
    const result = calibrateScoreConfidence({ sampleSize: 80, insufficientData: false }, 30);
    expect(result.state).toBe('INSUFFICIENT_DATA');
    expect(result.confidencePct).toBeNull();
  });
});
