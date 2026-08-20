import { describe, expect, it } from 'vitest';
import {
  QUALITY_CENTER_CONTRACT_VERSION,
  QUALITY_CENTER_EVENT_NAMES,
  QUALITY_CENTER_NON_AUTHORIZING_STATEMENT,
  QUALITY_CENTER_REPORT_SCHEMA,
  QUALITY_GATE_IDS,
  QUALITY_SCORE_AXES,
  QUALITY_TEST_AREAS,
} from '../../src/platform/Quality/Contracts/QualityCenterContract';

describe('Quality Center contract', () => {
  it('keeps the ESS-0005 contract surface complete and non-authorizing', () => {
    expect(QUALITY_CENTER_CONTRACT_VERSION).toBe('quality-center-contract/1.2.0');
    expect(QUALITY_CENTER_REPORT_SCHEMA).toBe('quality-center-report/1.2.0');
    expect(QUALITY_GATE_IDS).toHaveLength(8);
    expect(QUALITY_SCORE_AXES).toHaveLength(7);
    expect(QUALITY_TEST_AREAS).toEqual([
      'unit', 'integration', 'contract', 'architecture', 'security', 'performance', 'e2e',
    ]);
    expect(QUALITY_CENTER_EVENT_NAMES).toEqual([
      'ValidationStartedEvent',
      'ValidationCompletedEvent',
      'ValidationFailedEvent',
      'QualityGatePassedEvent',
      'QualityGateFailedEvent',
      'QualityScoreChangedEvent',
      'TechnicalDebtDetectedEvent',
      'TechnicalDebtResolvedEvent',
      'CoverageCalculatedEvent',
    ]);
    expect(QUALITY_CENTER_NON_AUTHORIZING_STATEMENT).toContain('cannot authorize merge');
    expect(QUALITY_CENTER_NON_AUTHORIZING_STATEMENT).toContain('production mutation');
  });
});
