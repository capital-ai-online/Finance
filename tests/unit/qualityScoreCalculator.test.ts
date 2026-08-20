import { describe, expect, it } from 'vitest';
import { QUALITY_SCORE_AXES } from '../../src/platform/Quality/Contracts/QualityCenterContract';
import { QualityScoreCalculator } from '../../src/platform/Quality/Scoring/QualityScoreCalculator';

describe('QualityScoreCalculator', () => {
  it('does not invent an overall score while mandatory measurements are missing', () => {
    const result = new QualityScoreCalculator().calculate([
      { axis: 'documentation', value: 90, source: 'test', authorityRefs: ['ESS-0005'] },
    ]);
    expect(result).toMatchObject({ status: 'PARTIAL', overallScore: null });
    expect(result.missingAxes).toContain('security');
  });

  it('calculates a deterministic unweighted score only from all seven measured axes', () => {
    const measurements = QUALITY_SCORE_AXES.map((axis, index) => ({
      axis,
      value: 70 + index,
      source: `test:${axis}`,
      authorityRefs: ['ESS-0001-CONTRACTS Chapter 12'],
    }));
    const result = new QualityScoreCalculator().calculate(measurements);
    expect(result.status).toBe('COMPLETE');
    expect(result.overallScore).toBe(73);
  });

  it('rejects invalid or duplicate measurements', () => {
    const calculator = new QualityScoreCalculator();
    expect(() => calculator.calculate([{ axis: 'security', value: 101, source: 'test', authorityRefs: [] }])).toThrow(/between 0 and 100/);
    expect(() => calculator.calculate([
      { axis: 'security', value: 80, source: 'a', authorityRefs: [] },
      { axis: 'security', value: 81, source: 'b', authorityRefs: [] },
    ])).toThrow(/duplicate score measurement/);
  });
});
