import {
  QUALITY_SCORE_AXES,
  type QualityScoreAxis,
  type QualityScoreMeasurement,
  type QualityScoreSnapshot,
} from '../Contracts/QualityCenterContract';

export const QUALITY_SCORE_CALCULATOR_VERSION = 'quality-score-calculator/1.0.0' as const;

function assertMeasurement(measurement: QualityScoreMeasurement): void {
  if (!QUALITY_SCORE_AXES.includes(measurement.axis)) {
    throw new Error(`[QualityScoreCalculator] unsupported score axis ${measurement.axis}.`);
  }
  if (!Number.isFinite(measurement.value) || measurement.value < 0 || measurement.value > 100) {
    throw new Error(`[QualityScoreCalculator] ${measurement.axis} score must be between 0 and 100.`);
  }
  if (!measurement.source.trim()) {
    throw new Error(`[QualityScoreCalculator] ${measurement.axis} score requires a source.`);
  }
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

export class QualityScoreCalculator {
  calculate(input: readonly QualityScoreMeasurement[]): QualityScoreSnapshot {
    const byAxis = new Map<QualityScoreAxis, QualityScoreMeasurement>();

    for (const measurement of input) {
      assertMeasurement(measurement);
      if (byAxis.has(measurement.axis)) {
        throw new Error(`[QualityScoreCalculator] duplicate score measurement for ${measurement.axis}.`);
      }
      byAxis.set(measurement.axis, Object.freeze({
        ...measurement,
        authorityRefs: Object.freeze([...measurement.authorityRefs]),
      }));
    }

    const measurements = QUALITY_SCORE_AXES
      .map((axis) => byAxis.get(axis))
      .filter((measurement): measurement is QualityScoreMeasurement => Boolean(measurement));
    const missingAxes = QUALITY_SCORE_AXES.filter((axis) => !byAxis.has(axis));
    const status: QualityScoreSnapshot['status'] = measurements.length === 0
      ? 'NOT_AVAILABLE'
      : missingAxes.length === 0
        ? 'COMPLETE'
        : 'PARTIAL';

    // ESS-0001-CONTRACTS defines the seven mandatory 0..100 axes but no weighting model.
    // To avoid inventing weighted policy, an overall score is emitted only when all axes exist;
    // the neutral aggregation is the unweighted arithmetic mean.
    const overallScore = status === 'COMPLETE'
      ? roundScore(measurements.reduce((sum, measurement) => sum + measurement.value, 0) / measurements.length)
      : null;

    return Object.freeze({
      schemaVersion: 'quality-score/1.0.0' as const,
      status,
      overallScore,
      measurements: Object.freeze(measurements),
      missingAxes: Object.freeze([...missingAxes]),
    });
  }
}
