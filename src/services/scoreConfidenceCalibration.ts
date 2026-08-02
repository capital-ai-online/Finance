export const SCORE_CONFIDENCE_CALIBRATION_VERSION = 'score-confidence-calibration/1.0.0' as const;

export interface ValidationMeasurement {
  sampleSize: number;
  hitRatePct?: number;
  falsePositiveRatePct?: number;
  insufficientData: boolean;
}

export type ConfidenceCalibrationState = 'INSUFFICIENT_DATA' | 'CALIBRATED';

export interface ScoreConfidenceCalibration {
  contractVersion: typeof SCORE_CONFIDENCE_CALIBRATION_VERSION;
  state: ConfidenceCalibrationState;
  confidencePct: number | null;
  sampleSize: number;
  methodology: 'empirical-hit-rate';
  scoreImpactEnabled: false;
  recommendationImpactEnabled: false;
  reasons: string[];
}

export function calibrateScoreConfidence(measurement: ValidationMeasurement, minimumSample = 30): ScoreConfidenceCalibration {
  const reasons: string[] = [];
  if (measurement.insufficientData || measurement.sampleSize < minimumSample) {
    reasons.push(`minimum-sample-not-met:${measurement.sampleSize}/${minimumSample}`);
    return {
      contractVersion: SCORE_CONFIDENCE_CALIBRATION_VERSION,
      state: 'INSUFFICIENT_DATA',
      confidencePct: null,
      sampleSize: measurement.sampleSize,
      methodology: 'empirical-hit-rate',
      scoreImpactEnabled: false,
      recommendationImpactEnabled: false,
      reasons,
    };
  }

  if (measurement.hitRatePct === undefined || !Number.isFinite(measurement.hitRatePct)) {
    reasons.push('hit-rate-unavailable');
    return {
      contractVersion: SCORE_CONFIDENCE_CALIBRATION_VERSION,
      state: 'INSUFFICIENT_DATA',
      confidencePct: null,
      sampleSize: measurement.sampleSize,
      methodology: 'empirical-hit-rate',
      scoreImpactEnabled: false,
      recommendationImpactEnabled: false,
      reasons,
    };
  }

  const bounded = Math.max(0, Math.min(100, measurement.hitRatePct));
  return {
    contractVersion: SCORE_CONFIDENCE_CALIBRATION_VERSION,
    state: 'CALIBRATED',
    confidencePct: Number(bounded.toFixed(1)),
    sampleSize: measurement.sampleSize,
    methodology: 'empirical-hit-rate',
    scoreImpactEnabled: false,
    recommendationImpactEnabled: false,
    reasons,
  };
}
