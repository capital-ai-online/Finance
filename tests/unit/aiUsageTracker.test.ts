import { describe, expect, it } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import {
  PROMPT_REGISTRY,
  configureModelPricing,
  getUsageLedger,
  getUsageSummary,
  trackedAnthropicMessage,
  trackedOpenAIEmbedding,
  trackedOpenAIMessage,
} from '../../src/services/aiUsageTracker';

const anthropic = (response: any) => ({ messages: { create: async () => response } } as unknown as Anthropic);
const openai = (response: any) => ({
  chat: { completions: { create: async () => response } },
  embeddings: { create: async () => response },
} as unknown as OpenAI);

describe('aiUsageTracker', () => {
  it('erfasst Anthropic-Nutzung', async () => {
    const before = getUsageLedger().length;
    await trackedAnthropicMessage(anthropic({ content: [], usage: { input_tokens: 200, output_tokens: 40 } }), { model: 'claude-test', messages: [] } as any, { promptId: 'crypto-risk' });
    const last = getUsageLedger().at(-1)!;
    expect(getUsageLedger()).toHaveLength(before + 1);
    expect(last).toMatchObject({ promptTokens: 200, candidateTokens: 40, totalTokens: 240, model: 'claude-test' });
  });

  it('erfasst OpenAI-Chat-Nutzung und konfigurierte Kosten', async () => {
    configureModelPricing('gpt-test', { inputPerMillionUsd: 1, outputPerMillionUsd: 2 });
    await trackedOpenAIMessage(openai({ choices: [], usage: { prompt_tokens: 1_000_000, completion_tokens: 500_000, total_tokens: 1_500_000 } }), { model: 'gpt-test', messages: [] } as any, { promptId: 'crypto-classification' });
    expect(getUsageLedger().at(-1)?.estimatedCostUsd).toBeCloseTo(2);
  });

  it('erfasst OpenAI-Embeddings ohne Candidate-Tokens', async () => {
    await trackedOpenAIEmbedding(openai({ data: [], usage: { prompt_tokens: 42, total_tokens: 42 } }), { model: 'embedding-test', input: ['x'] } as any, { promptId: 'rag-index-build' });
    expect(getUsageLedger().at(-1)).toMatchObject({ promptTokens: 42, candidateTokens: 0, totalTokens: 42 });
  });

  it('erfindet ohne Usage-Metadaten keinen Ledger-Eintrag', async () => {
    const before = getUsageLedger().length;
    await trackedOpenAIMessage(openai({ choices: [] }), { model: 'gpt-empty', messages: [] } as any, { promptId: 'crypto-sentiment' });
    expect(getUsageLedger()).toHaveLength(before);
  });

  it('aggregiert nach Prompt und Modell', () => {
    const summary = getUsageSummary();
    expect(summary.totalCalls).toBe(getUsageLedger().length);
    expect(summary.byPromptId['crypto-risk'].calls).toBeGreaterThanOrEqual(1);
  });

  it('fuehrt nur vollstaendige Prompt-Registry-Eintraege', () => {
    expect(Object.keys(PROMPT_REGISTRY).length).toBeGreaterThan(0);
    for (const [id, entry] of Object.entries(PROMPT_REGISTRY)) {
      expect(entry).toMatchObject({ id });
      expect(entry.module).not.toBe('');
      expect(entry.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});
