import { describe, expect, it } from 'vitest';
import {
  ANALYSIS_COMPONENT_RESULT_CONTRACT_VERSION,
  type AnalysisComponentResult,
} from '../../src/platform/MarketIntelligence/contracts';
import { validateAnalysisComponentResult } from '../../src/platform/MarketIntelligence/runtimeValidation';

function result(overrides: Partial<AnalysisComponentResult<number>> = {}): AnalysisComponentResult<number> {
  return {
    contractVersion: ANALYSIS_COMPONENT_RESULT_CONTRACT_VERSION,
    componentId: 'market_integrity_gate',
    calculationVersion: '1.0.0',
    assetId: 'crypto:BTC',
    correlationId: 'corr-test-1',
    evaluatedAt: '2026-09-28T15:30:00.000Z',
    status: 'READY',
    sourceMode: 'DERIVED',
    value: 1,
    confidence: { value: 1, semantics: 'DATA_SUFFICIENCY' },
    evidenceRefs: ['evidence:test'],
    featureRefs: ['feature:test'],
    reasonCodes: [],
    risk: { state: 'PASS', reasonCodes: [] },
    eligibility: { scoreEligible: false, rankingEligible: false, alertEligible: false },
    ...overrides,
  };
}

describe('FIN-MI-01 runtime validation', () => {
  it('accepts a bounded active derived result', () => {
    expect(validateAnalysisComponentResult(result())).toEqual([]);
  });

  it('rejects demo READY results and productive demo eligibility', () => {
    const errors = validateAnalysisComponentResult(result({
      sourceMode: 'DEMO',
      eligibility: { scoreEligible: true, rankingEligible: true, alertEligible: true },
    }));
    expect(errors).toContain('demo-result-cannot-be-ready');
    expect(errors).toContain('eligibility-violates-lifecycle-or-source-mode');
  });

  it('rejects blocked risk that is hidden by eligibility', () => {
    expect(validateAnalysisComponentResult(result({
      risk: { state: 'BLOCK', reasonCodes: ['LIQ_MARKET_UNAVAILABLE'] },
      eligibility: { scoreEligible: true, rankingEligible: true, alertEligible: true },
    }))).toContain('risk-block-cannot-be-eligible');
  });

  it('rejects a non-computable result carrying a numeric value', () => {
    expect(validateAnalysisComponentResult(result({
      status: 'NOT_COMPUTABLE',
      value: 50,
    }))).toContain('noncomputable-result-must-have-null-value');
  });

  it('treats confidence only as bounded data sufficiency', () => {
    expect(validateAnalysisComponentResult(result({
      confidence: { value: 1.1, semantics: 'DATA_SUFFICIENCY' },
    }))).toContain('confidence-invalid');
  });
});
