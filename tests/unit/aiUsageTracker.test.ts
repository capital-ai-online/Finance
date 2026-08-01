// Audit ARCH-AUDIT-0002 (N2): Testabdeckung fuer die Token-/Kostenerfassung. Prueft die reine
// Aggregationslogik (recordUsage()/getUsageSummary()) ueber den oeffentlichen
// trackedGenerateContent()-Wrapper mit einem Mock-Client statt eines echten Gemini-Aufrufs.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackedGenerateContent,
  getUsageLedger,
  getUsageSummary,
  configureModelPricing,
  PROMPT_REGISTRY,
} from '../../src/services/aiUsageTracker';
import type { GoogleGenAI } from '@google/genai';

function mockAiClient(response: any): GoogleGenAI {
  return {
    models: {
      generateContent: async () => response,
    },
  } as unknown as GoogleGenAI;
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

  it('PROMPT_REGISTRY deckt alle 15 bekannten Aufrufstellen ab', () => {
    expect(Object.keys(PROMPT_REGISTRY).length).toBe(15);
  });
});
