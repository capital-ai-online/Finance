import { beforeEach, describe, expect, it } from 'vitest';
import {
  getAiEvaluations,
  getAiGovernanceInventory,
  recordAiEvaluation,
  resetAiEvaluations,
  validateAiInvocation,
} from '../../src/services/aiGovernance';

describe('AI model/prompt/evaluation governance', () => {
  beforeEach(() => resetAiEvaluations());

  it('accepts only registered prompt and provider combinations', () => {
    expect(validateAiInvocation({ promptId: 'chat-assistant', provider: 'anthropic:configured-model' }).valid).toBe(true);
    const invalidPrompt = validateAiInvocation({ promptId: 'unknown-prompt', provider: 'anthropic:model' });
    expect(invalidPrompt.valid).toBe(false);
    expect(invalidPrompt.reasons[0]).toContain('not registered');
    const invalidProvider = validateAiInvocation({ promptId: 'chat-assistant', provider: 'unknown:model' });
    expect(invalidProvider.valid).toBe(false);
  });

  it('records PASS evaluation with prompt/model/evidence attribution', () => {
    const record = recordAiEvaluation({
      evaluationId: 'eval-1',
      timestamp: '2026-08-02T07:00:00.000Z',
      promptId: 'chat-assistant',
      promptVersion: '1.0.0',
      modelProvider: 'anthropic',
      model: 'configured-runtime-model',
      requestId: 'req-1',
      evidenceIds: ['rag:ret-1:chunk-1'],
      checks: { grounded: true, citationComplete: true },
    });
    expect(record.outcome).toBe('PASS');
    expect(record.evidenceIds).toEqual(['rag:ret-1:chunk-1']);
    expect(getAiEvaluations(1)[0].requestId).toBe('req-1');
  });

  it('fails an evaluation when a required quality check is explicitly false', () => {
    const record = recordAiEvaluation({
      promptId: 'server-portfolio-review',
      promptVersion: '1.0.0',
      modelProvider: 'openai',
      model: 'configured-runtime-model',
      checks: { schemaValid: false },
    });
    expect(record.outcome).toBe('FAIL');
  });

  it('exposes a machine-readable inventory of registered prompts and model roles', () => {
    const inventory = getAiGovernanceInventory();
    expect(inventory.models.some(model => model.provider === 'anthropic')).toBe(true);
    expect(inventory.models.some(model => model.provider === 'openai')).toBe(true);
    expect(inventory.models.some(model => model.provider === 'gemini')).toBe(true);
    expect(inventory.prompts.some(prompt => prompt.id === 'rag-retrieval-query')).toBe(true);
  });
});
