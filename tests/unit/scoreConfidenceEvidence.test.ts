import { beforeEach, describe, expect, it } from 'vitest';
import { calibrateScoreConfidence } from '../../src/services/scoreConfidenceCalibration';
import {
  getLatestScoreConfidenceEvidence,
  getRecentScoreConfidenceEvidence,
  recordScoreConfidenceEvidence,
  resetScoreConfidenceEvidence,
} from '../../src/services/scoreConfidenceEvidence';

describe('scoreConfidenceEvidence', () => {
  beforeEach(() => resetScoreConfidenceEvidence());

  it('records insufficient validation without inventing confidence', () => {
    const calibration = calibrateScoreConfidence({ sampleSize: 4, hitRatePct: 75, insufficientData: true }, 30);
    const record = recordScoreConfidenceEvidence({ calibration, horizonDays: 30, threshold: 6.5 });
    expect(record.state).toBe('INSUFFICIENT_DATA');
    expect(record.confidencePct).toBeNull();
    expect(record.scoreImpactEnabled).toBe(false);
    expect(record.executionProbability).toBe(false);
  });

  it('records calibrated empirical confidence as observability evidence only', () => {
    const calibration = calibrateScoreConfidence({ sampleSize: 50, hitRatePct: 68.4, insufficientData: false }, 30);
    recordScoreConfidenceEvidence({ calibration, horizonDays: 30, threshold: 6.5, scoreBasis: 'market-data' });
    const latest = getLatestScoreConfidenceEvidence();
    expect(latest?.confidencePct).toBe(68.4);
    expect(latest?.scoreBasis).toBe('market-data');
    expect(latest?.recommendationImpactEnabled).toBe(false);
  });

  it('returns recent evidence newest first', () => {
    const calibration = calibrateScoreConfidence({ sampleSize: 40, hitRatePct: 60, insufficientData: false }, 30);
    recordScoreConfidenceEvidence({ calibration, horizonDays: 30, threshold: 6.5, observedAt: '2026-08-01T00:00:00.000Z' });
    recordScoreConfidenceEvidence({ calibration, horizonDays: 60, threshold: 7, observedAt: '2026-08-02T00:00:00.000Z' });
    expect(getRecentScoreConfidenceEvidence(2).map(item => item.horizonDays)).toEqual([60, 30]);
  });
});
