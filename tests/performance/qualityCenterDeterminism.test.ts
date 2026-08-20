import { describe, expect, it } from 'vitest';
import { QualityScoreCalculator } from '../../src/platform/Quality/Scoring/QualityScoreCalculator';
import type { QualityScoreMeasurement } from '../../src/platform/Quality/Contracts/QualityCenterContract';

const measurements: QualityScoreMeasurement[] = [
  { axis: 'documentation', value: 90, source: 'test', authorityRefs: ['ESS-0005'] },
  { axis: 'test', value: 80, source: 'test', authorityRefs: ['ESS-0005'] },
  { axis: 'architecture', value: 85, source: 'test', authorityRefs: ['ESS-0005'] },
  { axis: 'security', value: 95, source: 'test', authorityRefs: ['ESS-0005'] },
  { axis: 'knowledge', value: 70, source: 'test', authorityRefs: ['ESS-0005'] },
  { axis: 'metadata', value: 88, source: 'test', authorityRefs: ['ESS-0005'] },
  { axis: 'twin', value: 75, source: 'test', authorityRefs: ['ESS-0005'] },
];

describe('Quality Center deterministic performance', () => {
  it('produces stable scoring output under repeated execution', () => {
    const calculator = new QualityScoreCalculator();
    const expected = calculator.calculate(measurements);
    const startedAt = performance.now();

    for (let index = 0; index < 1_000; index += 1) {
      expect(calculator.calculate(measurements)).toEqual(expected);
    }

    expect(performance.now() - startedAt).toBeLessThan(3_000);
  });
});
