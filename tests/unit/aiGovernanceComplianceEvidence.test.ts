import { beforeEach, describe, expect, it } from 'vitest';
import { buildAiGovernanceEvidenceScanner } from '../../src/platform/Compliance/aiGovernanceEvidence';
import { recordAiEvaluation, resetAiEvaluations } from '../../src/services/aiGovernance';

describe('AI governance compliance evidence', () => {
  beforeEach(() => resetAiEvaluations());

  it('does not invent an AI runtime score before any evaluation exists', () => {
    expect(buildAiGovernanceEvidenceScanner()).toBeNull();
  });

  it('converts PASS/WARN/FAIL evaluations into auditable runtime evidence', () => {
    recordAiEvaluation({
      promptId: 'chat-assistant',
      promptVersion: '1.0.0',
      modelProvider: 'anthropic',
      model: 'test-model',
      checks: { grounded: true },
      outcome: 'PASS',
    });
    recordAiEvaluation({
      promptId: 'chat-assistant',
      promptVersion: '1.0.0',
      modelProvider: 'openai',
      model: 'test-model',
      checks: { grounded: false },
      outcome: 'WARN',
    });
    recordAiEvaluation({
      promptId: 'chat-assistant',
      promptVersion: '1.0.0',
      modelProvider: 'gemini',
      model: 'test-model',
      checks: { grounded: false },
      outcome: 'FAIL',
    });

    const result = buildAiGovernanceEvidenceScanner();
    expect(result?.id).toBe('RUNTIME-AI-01');
    expect(result?.evidence).toContain('1 PASS');
    expect(result?.evidence).toContain('1 WARN');
    expect(result?.evidence).toContain('1 FAIL');
    expect(result?.findings.map(finding => finding.severity)).toEqual(expect.arrayContaining(['MEDIUM', 'HIGH']));
    expect(result?.complianceScore).toBeLessThan(100);
  });
});
