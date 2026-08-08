// Audit ARCH-AUDIT-0002 (N2): Testabdeckung fuer die Token-/Kostenerfassung. Prueft die reine
// Aggregationslogik (recordUsage()/getUsageSummary()) ueber den oeffentlichen
// trackedGenerateContent()-Wrapper mit einem Mock-Client statt eines echten Gemini-Aufrufs.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackedGenerateContent,
  trackedAnthropicMessage,
  trackedOpenAIMessage,
  trackedOpenAIEmbedding,
  getUsageLedger,
  getUsageSummary,
  configureModelPricing,
  PROMPT_REGISTRY,
} from '../../src/services/aiUsageTracker';
import type { GoogleGenAI } from '@google/genai';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';

function mockAiClient(response: any): GoogleGenAI {
  return {
    models: {
      generateContent: async () => response,
    },
  } as unknown as GoogleGenAI;
}

function mockAnthropicClient(response: any): Anthropic {
  return {
    messages: {
      create: async () => response,
    },
  } as unknown as Anthropic;
}

function mockOpenAIClient(response: any): OpenAI {
  return {
    chat: {
      completions: {
        create: async () => response,
      },
    },
  } as unknown as OpenAI;
}

function mockOpenAIEmbeddingsClient(response: any): OpenAI {
  return {
    embeddings: {
      create: async () => response,
    },
  } as unknown as OpenAI;
}

describe('aiUsageTracker', () => {
  beforeEach(() => {
    // Ledger ist modul-privat ohne Reset-Funktion (bewusst kein Test-only-Escape-Hatch in der
    // Produktionsdatei) - Tests pruefen daher Deltas statt Absolutwerten.
  });

  it('zeichnet promptTokenCount/candidatesTokenCount/totalTokenCount aus einer realen usageMetadata auf', async () => {
    const before = getUsageLedger().length;
    const ai = mockAiClient({
      text: '{}',
      usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 30, totalTokenCount: 150 },
    });

    await trackedGenerateContent(ai, { model: 'test-model-a', contents: 'x' } as any, { promptId: 'crypto-classification' });

    const ledger = getUsageLedger();
    expect(ledger.length).toBe(before + 1);
    const last = ledger[ledger.length - 1];
    expect(last.promptTokens).toBe(120);
    expect(last.candidateTokens).toBe(30);
    expect(last.totalTokens).toBe(150);
    expect(last.model).toBe('test-model-a');
    expect(last.promptId).toBe('crypto-classification');
  });

  it('erzeugt keinen Ledger-Eintrag, wenn die Antwort keine usageMetadata enthaelt (kein geschaetzter Wert)', async () => {
    const before = getUsageLedger().length;
    const ai = mockAiClient({ text: '{}' });

    await trackedGenerateContent(ai, { model: 'test-model-b', contents: 'x' } as any, { promptId: 'crypto-sentiment' });

    expect(getUsageLedger().length).toBe(before);
  });

  it('estimatedCostUsd bleibt undefined ohne konfigurierte Preistabelle fuer das Modell', async () => {
    const ai = mockAiClient({
      text: '{}',
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
    });

    await trackedGenerateContent(ai, { model: 'test-model-unpriced', contents: 'x' } as any, { promptId: 'crypto-risk' });

    const ledger = getUsageLedger();
    const last = ledger[ledger.length - 1];
    expect(last.estimatedCostUsd).toBeUndefined();
  });

  it('berechnet estimatedCostUsd korrekt, sobald eine Preistabelle fuer das Modell konfiguriert ist', async () => {
    configureModelPricing('test-model-priced', { inputPerMillionUsd: 1.0, outputPerMillionUsd: 2.0 });
    const ai = mockAiClient({
      text: '{}',
      usageMetadata: { promptTokenCount: 1_000_000, candidatesTokenCount: 500_000, totalTokenCount: 1_500_000 },
    });

    await trackedGenerateContent(ai, { model: 'test-model-priced', contents: 'x' } as any, { promptId: 'crypto-onchain' });

    const ledger = getUsageLedger();
    const last = ledger[ledger.length - 1];
    // 1M Prompt-Tokens * 1.0 USD/M + 0.5M Candidate-Tokens * 2.0 USD/M = 1.0 + 1.0 = 2.0
    expect(last.estimatedCostUsd).toBeCloseTo(2.0, 6);
  });

  it('getUsageSummary aggregiert calls/tokens korrekt nach promptId und Modell', async () => {
    const ai = mockAiClient({
      text: '{}',
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10, totalTokenCount: 20 },
    });
    await trackedGenerateContent(ai, { model: 'test-model-summary', contents: 'x' } as any, { promptId: 'crypto-classification' });
    await trackedGenerateContent(ai, { model: 'test-model-summary', contents: 'x' } as any, { promptId: 'crypto-classification' });

    const summary = getUsageSummary();
    expect(summary.byPromptId['crypto-classification'].calls).toBeGreaterThanOrEqual(2);
    expect(summary.byModel['test-model-summary'].calls).toBe(2);
    expect(summary.byModel['test-model-summary'].totalTokens).toBe(40);
  });

  it('jede in PROMPT_REGISTRY gefuehrte ID hat module/description/version', () => {
    for (const [id, entry] of Object.entries(PROMPT_REGISTRY)) {
      expect(entry.id).toBe(id);
      expect(entry.module.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it('PROMPT_REGISTRY deckt alle 19 bekannten Aufrufstellen einschliesslich Binance Landing und Enterprise-Scorer ab', () => {
    expect(Object.keys(PROMPT_REGISTRY).length).toBe(19);
    expect(PROMPT_REGISTRY['landing-binance-quick-analysis']).toMatchObject({
      id: 'landing-binance-quick-analysis',
      module: 'server/binanceLandingQuickAnalysis.ts (/api/ai/landing/quick-analysis)',
      version: '1.0.0',
    });
    expect(PROMPT_REGISTRY['enterprise-binance-quick-analysis']).toMatchObject({
      id: 'enterprise-binance-quick-analysis',
      module: 'server/binanceLandingQuickAnalysis.ts (/api/registry/assets/:symbol/quick-analysis)',
      version: '1.0.0',
    });
  });

  // Audit ARCH-AUDIT-0002 (J3): providerübergreifender Rückfall - derselbe Ledger muss auch
  // Anthropic-Aufrufe aufzeichnen (input_tokens/output_tokens statt promptTokenCount/
  // candidatesTokenCount), damit J2s Erfolgserkennung providerunabhaengig bleibt.
  describe('trackedAnthropicMessage', () => {
    it('zeichnet input_tokens/output_tokens aus einer realen usage-Antwort auf', async () => {
      const before = getUsageLedger().length;
      const anthropic = mockAnthropicClient({
        content: [{ type: 'tool_use', name: 'submit_structured_result', input: { foo: 'bar' } }],
        usage: { input_tokens: 200, output_tokens: 40 },
      });

      await trackedAnthropicMessage(anthropic, { model: 'test-anthropic-model', messages: [] } as any, { promptId: 'crypto-risk' });

      const ledger = getUsageLedger();
      expect(ledger.length).toBe(before + 1);
      const last = ledger[ledger.length - 1];
      expect(last.promptTokens).toBe(200);
      expect(last.candidateTokens).toBe(40);
      expect(last.totalTokens).toBe(240);
      expect(last.model).toBe('test-anthropic-model');
      expect(last.promptId).toBe('crypto-risk');
    });

    it('erzeugt keinen Ledger-Eintrag, wenn die Antwort kein usage-Feld enthaelt', async () => {
      const before = getUsageLedger().length;
      const anthropic = mockAnthropicClient({ content: [] });

      await trackedAnthropicMessage(anthropic, { model: 'test-anthropic-model-2', messages: [] } as any, { promptId: 'crypto-onchain' });

      expect(getUsageLedger().length).toBe(before);
    });
  });

  // Audit ARCH-AUDIT-0002 (J3-Folge): dritter Provider (Anthropic -> OpenAI -> Gemini) - auch
  // OpenAI-Aufrufe muessen im selben providerunabhaengigen Ledger landen.
  describe('trackedOpenAIMessage', () => {
    it('zeichnet prompt_tokens/completion_tokens aus einer realen usage-Antwort auf', async () => {
      const before = getUsageLedger().length;
      const openai = mockOpenAIClient({
        choices: [{ message: { content: '{}' } }],
        usage: { prompt_tokens: 300, completion_tokens: 60, total_tokens: 360 },
      });

      await trackedOpenAIMessage(openai, { model: 'test-openai-model', messages: [] } as any, { promptId: 'crypto-classification' });

      const ledger = getUsageLedger();
      expect(ledger.length).toBe(before + 1);
      const last = ledger[ledger.length - 1];
      expect(last.promptTokens).toBe(300);
      expect(last.candidateTokens).toBe(60);
      expect(last.totalTokens).toBe(360);
      expect(last.model).toBe('test-openai-model');
      expect(last.promptId).toBe('crypto-classification');
    });

    it('erzeugt keinen Ledger-Eintrag, wenn die Antwort kein usage-Feld enthaelt', async () => {
      const before = getUsageLedger().length;
      const openai = mockOpenAIClient({ choices: [{ message: { content: '{}' } }] });

      await trackedOpenAIMessage(openai, { model: 'test-openai-model-2', messages: [] } as any, { promptId: 'crypto-sentiment' });

      expect(getUsageLedger().length).toBe(before);
    });
  });

  describe('trackedOpenAIEmbedding', () => {
    it('zeichnet prompt_tokens/total_tokens aus einer realen Embeddings-usage-Antwort auf (candidateTokens=0)', async () => {
      const before = getUsageLedger().length;
      const openai = mockOpenAIEmbeddingsClient({
        data: [{ embedding: [0.1, 0.2] }],
        usage: { prompt_tokens: 42, total_tokens: 42 },
      });

      await trackedOpenAIEmbedding(openai, { model: 'test-embedding-model', input: ['x'] } as any, { promptId: 'rag-index-build' });

      const ledger = getUsageLedger();
      expect(ledger.length).toBe(before + 1);
      const last = ledger[ledger.length - 1];
      expect(last.promptTokens).toBe(42);
      expect(last.candidateTokens).toBe(0);
      expect(last.totalTokens).toBe(42);
      expect(last.model).toBe('test-embedding-model');
      expect(last.promptId).toBe('rag-index-build');
    });

    it('erzeugt keinen Ledger-Eintrag, wenn die Antwort kein usage-Feld enthaelt', async () => {
      const before = getUsageLedger().length;
      const openai = mockOpenAIEmbeddingsClient({ data: [{ embedding: [0.1] }] });

      await trackedOpenAIEmbedding(openai, { model: 'test-embedding-model-2', input: ['x'] } as any, { promptId: 'rag-retrieval-query' });

      expect(getUsageLedger().length).toBe(before);
    });
  });
});
