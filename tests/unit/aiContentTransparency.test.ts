import { describe, expect, it } from 'vitest';
import { createAiContentTransparencyEnvelope } from '../../src/services/aiContentTransparency';

describe('AI Content Transparency', () => {
  it('marks AI output without asserting legal compliance or financial authority', () => {
    const result = createAiContentTransparencyEnvelope({
      provider: 'openai',
      model: 'model-x',
      promptId: 'chat-assistant',
      promptVersion: '1.0.0',
    });

    expect(result.origin).toBe('ai-generated');
    expect(result.legalComplianceAssertion).toBe('not-asserted');
    expect(result.financialDecisionAuthority).toBe(false);
    expect(result.humanReview).toBe('not-reviewed');
  });

  it('does not convert retrieved evidence into verified grounding or citation completeness', () => {
    const result = createAiContentTransparencyEnvelope({
      provider: 'anthropic',
      model: 'model-y',
      promptId: 'chat-assistant',
      promptVersion: '1.0.0',
      retrievalId: 'retrieval-1',
      evidenceIds: ['EV-2', 'EV-1', 'EV-1'],
    });

    expect(result.retrieval.status).toBe('evidence-retrieved');
    expect(result.retrieval.evidenceIds).toEqual(['EV-1', 'EV-2']);
    expect(result.grounding.status).toBe('not-verified');
    expect(result.citations.completeness).toBe('not-verified');
  });

  it('surfaces no-evidence explicitly', () => {
    const result = createAiContentTransparencyEnvelope({
      provider: 'openai',
      model: 'model-z',
      promptId: 'chat-assistant',
      promptVersion: '1.0.0',
      evidenceIds: [],
    });

    expect(result.retrieval.status).toBe('no-evidence');
  });
});
