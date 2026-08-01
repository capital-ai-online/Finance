// Audit ARCH-AUDIT-0002 (J3, Kapitel 14.6): Testabdeckung fuer die gemeinsame Modell-/
// Provider-Routing-Kette (Gemini-Modelle in Reihenfolge, dann Anthropic-Rueckfall, dann null).

import { describe, it, expect, vi } from 'vitest';
import { Type } from '@google/genai';
import { generateStructuredWithFallback, toAnthropicSchema } from '../../src/services/agentModelRouting';

function mockGemini(behaviors: Array<'ok' | 'fail'>, data: any = { foo: 'gemini' }) {
  let call = 0;
  return {
    models: {
      generateContent: async (params: any) => {
        const behavior = behaviors[call] ?? 'fail';
        call += 1;
        if (behavior === 'fail') throw new Error(`gemini model '${params.model}' failed`);
        return { text: JSON.stringify(data), usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 } };
      },
    },
  } as any;
}

function mockAnthropic(behavior: 'ok' | 'fail' | 'no-tool-use', data: any = { foo: 'anthropic' }) {
  return {
    messages: {
      create: async () => {
        if (behavior === 'fail') throw new Error('anthropic call failed');
        if (behavior === 'no-tool-use') return { content: [{ type: 'text', text: 'nope' }], usage: { input_tokens: 1, output_tokens: 1 } };
        return {
          content: [{ type: 'tool_use', name: 'submit_structured_result', input: data }],
          usage: { input_tokens: 50, output_tokens: 20 },
        };
      },
    },
  } as any;
}

const BASE_REQUEST = {
  promptId: 'crypto-risk',
  contents: 'analysiere',
  systemInstruction: 'du bist ein test-agent',
  schema: {
    type: Type.OBJECT,
    properties: { foo: { type: Type.STRING } },
    required: ['foo'],
  },
};

describe('agentModelRouting', () => {
  describe('toAnthropicSchema', () => {
    it('wandelt Gemini-Type-Enums (Grossschreibung) in JSON-Schema-Typen (Kleinschreibung) um', () => {
      const schema = toAnthropicSchema({
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'x' },
          score: { type: Type.INTEGER },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['name'],
      });
      expect(schema.type).toBe('object');
      expect(schema.properties.name.type).toBe('string');
      // INTEGER existiert in JSON Schema nicht separat - wird auf 'number' abgebildet.
      expect(schema.properties.score.type).toBe('number');
      expect(schema.properties.tags.type).toBe('array');
      expect(schema.properties.tags.items.type).toBe('string');
      expect(schema.required).toEqual(['name']);
    });
  });

  describe('generateStructuredWithFallback', () => {
    it('liefert null, wenn weder Gemini noch Anthropic konfiguriert sind', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: null,
        anthropic: null,
        geminiModels: ['model-a', 'model-b'],
      });
      expect(result).toBeNull();
    });

    it('verwendet das erste erfolgreiche Gemini-Modell in der uebergebenen Reihenfolge', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: mockGemini(['ok']),
        anthropic: null,
        geminiModels: ['premium-model', 'flash-model'],
      });
      expect(result?.provider).toBe('premium-model');
      expect(result?.data).toEqual({ foo: 'gemini' });
    });

    it('faellt bei einem fehlschlagenden ersten Gemini-Modell auf das zweite zurueck', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: mockGemini(['fail', 'ok']),
        anthropic: null,
        geminiModels: ['premium-model', 'flash-model'],
      });
      expect(result?.provider).toBe('flash-model');
    });

    it('faellt auf Anthropic zurueck, wenn alle Gemini-Modelle fehlschlagen', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: mockGemini(['fail', 'fail']),
        anthropic: mockAnthropic('ok'),
        geminiModels: ['premium-model', 'flash-model'],
      });
      expect(result?.provider).toMatch(/^anthropic:/);
      expect(result?.data).toEqual({ foo: 'anthropic' });
    });

    it('liefert null, wenn sowohl Gemini als auch Anthropic fehlschlagen', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: mockGemini(['fail']),
        anthropic: mockAnthropic('fail'),
        geminiModels: ['premium-model'],
      });
      expect(result).toBeNull();
    });

    it('liefert null, wenn Anthropic antwortet, aber keinen tool_use-Block liefert', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: null,
        anthropic: mockAnthropic('no-tool-use'),
        geminiModels: [],
      });
      expect(result).toBeNull();
    });

    it('versucht Anthropic direkt, wenn kein Gemini-Client konfiguriert ist (kein Gemini-API-Key)', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: null,
        anthropic: mockAnthropic('ok'),
        geminiModels: ['premium-model'],
      });
      expect(result?.provider).toMatch(/^anthropic:/);
    });
  });
});
