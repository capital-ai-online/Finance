// Audit ARCH-AUDIT-0002 (J3/J3-Folge, Kapitel 14.6): Testabdeckung fuer die gemeinsame Modell-/
// Provider-Routing-Kette. Reihenfolge (Nutzerpriorisierung): Anthropic -> OpenAI -> Gemini.

import { describe, it, expect } from 'vitest';
import { Type } from '@google/genai';
import { generateStructuredWithFallback, generateTextWithFallback, toJsonSchema } from '../../src/services/agentModelRouting';

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

function mockOpenAI(behavior: 'ok' | 'fail' | 'no-content', data: any = { foo: 'openai' }) {
  return {
    chat: {
      completions: {
        create: async () => {
          if (behavior === 'fail') throw new Error('openai call failed');
          if (behavior === 'no-content') return { choices: [{ message: { content: null } }], usage: { prompt_tokens: 1, completion_tokens: 1 } };
          return {
            choices: [{ message: { content: JSON.stringify(data) } }],
            usage: { prompt_tokens: 30, completion_tokens: 15, total_tokens: 45 },
          };
        },
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
  describe('toJsonSchema', () => {
    it('wandelt Gemini-Type-Enums (Grossschreibung) in JSON-Schema-Typen (Kleinschreibung) um', () => {
      const schema = toJsonSchema({
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
    it('liefert null, wenn kein Provider konfiguriert ist', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: null,
        anthropic: null,
        openai: null,
        geminiModels: ['model-a', 'model-b'],
      });
      expect(result).toBeNull();
    });

    it('verwendet Anthropic, wenn konfiguriert, VOR OpenAI und Gemini', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: mockGemini(['ok']),
        anthropic: mockAnthropic('ok'),
        openai: mockOpenAI('ok'),
        geminiModels: ['premium-model'],
      });
      expect(result?.provider).toMatch(/^anthropic:/);
      expect(result?.data).toEqual({ foo: 'anthropic' });
    });

    it('faellt auf OpenAI zurueck, wenn Anthropic fehlschlaegt oder nicht konfiguriert ist', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: mockGemini(['ok']),
        anthropic: null,
        openai: mockOpenAI('ok'),
        geminiModels: ['premium-model'],
      });
      expect(result?.provider).toMatch(/^openai:/);
      expect(result?.data).toEqual({ foo: 'openai' });
    });

    it('faellt auf Gemini zurueck, wenn sowohl Anthropic als auch OpenAI fehlschlagen', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: mockGemini(['fail', 'ok']),
        anthropic: mockAnthropic('fail'),
        openai: mockOpenAI('fail'),
        geminiModels: ['premium-model', 'flash-model'],
      });
      expect(result?.provider).toBe('flash-model');
    });

    it('versucht Gemini-Modelle in der uebergebenen Reihenfolge, wenn es die einzige konfigurierte Stufe ist', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: mockGemini(['fail', 'ok']),
        anthropic: null,
        openai: null,
        geminiModels: ['premium-model', 'flash-model'],
      });
      expect(result?.provider).toBe('flash-model');
    });

    it('liefert null, wenn alle drei Provider fehlschlagen', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: mockGemini(['fail']),
        anthropic: mockAnthropic('fail'),
        openai: mockOpenAI('fail'),
        geminiModels: ['premium-model'],
      });
      expect(result).toBeNull();
    });

    it('faellt weiter, wenn Anthropic antwortet, aber keinen tool_use-Block liefert', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: null,
        anthropic: mockAnthropic('no-tool-use'),
        openai: mockOpenAI('ok'),
        geminiModels: [],
      });
      expect(result?.provider).toMatch(/^openai:/);
    });

    it('faellt weiter, wenn OpenAI antwortet, aber keinen Inhalt liefert', async () => {
      const result = await generateStructuredWithFallback({
        ...BASE_REQUEST,
        gemini: mockGemini(['ok']),
        anthropic: null,
        openai: mockOpenAI('no-content'),
        geminiModels: ['premium-model'],
      });
      expect(result?.provider).toBe('premium-model');
    });
  });

  describe('generateTextWithFallback', () => {
    // Audit ARCH-AUDIT-0002 (J4, Kapitel 14.6): Nutzerentscheidung, dieselbe Prioritaet auch
    // fuer Freitext-Antworten (Chat, Dokumenten-Propagation) anzuwenden.
    const TEXT_BASE_REQUEST = {
      promptId: 'chat-assistant',
      contents: 'Wie ist die aktuelle Marktlage?',
      systemInstruction: 'du bist ein test-assistent',
    };

    function mockAnthropicText(behavior: 'ok' | 'fail' | 'no-text', text = 'anthropic-antwort') {
      const calls: any[] = [];
      return {
        client: {
          messages: {
            create: async (params: any) => {
              calls.push(params);
              if (behavior === 'fail') throw new Error('anthropic call failed');
              if (behavior === 'no-text') return { content: [{ type: 'tool_use', input: {} }], usage: { input_tokens: 1, output_tokens: 1 } };
              return { content: [{ type: 'text', text }], usage: { input_tokens: 20, output_tokens: 10 } };
            },
          },
        } as any,
        calls,
      };
    }

    function mockOpenAIText(behavior: 'ok' | 'fail' | 'no-content', text = 'openai-antwort') {
      const calls: any[] = [];
      return {
        client: {
          chat: {
            completions: {
              create: async (params: any) => {
                calls.push(params);
                if (behavior === 'fail') throw new Error('openai call failed');
                if (behavior === 'no-content') return { choices: [{ message: { content: null } }], usage: { prompt_tokens: 1, completion_tokens: 1 } };
                return { choices: [{ message: { content: text } }], usage: { prompt_tokens: 30, completion_tokens: 15, total_tokens: 45 } };
              },
            },
          },
        } as any,
        calls,
      };
    }

    function mockGeminiText(behaviors: Array<'ok' | 'fail'>, text = 'gemini-antwort') {
      let call = 0;
      const calls: any[] = [];
      return {
        client: {
          models: {
            generateContent: async (params: any) => {
              calls.push(params);
              const behavior = behaviors[call] ?? 'fail';
              call += 1;
              if (behavior === 'fail') throw new Error(`gemini model '${params.model}' failed`);
              return { text, usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 } };
            },
          },
        } as any,
        calls,
      };
    }

    it('liefert null, wenn kein Provider konfiguriert ist', async () => {
      const result = await generateTextWithFallback({
        ...TEXT_BASE_REQUEST,
        gemini: null,
        anthropic: null,
        openai: null,
        geminiModels: ['model-a'],
      });
      expect(result).toBeNull();
    });

    it('verwendet Anthropic, wenn konfiguriert, VOR OpenAI und Gemini', async () => {
      const anthropic = mockAnthropicText('ok');
      const result = await generateTextWithFallback({
        ...TEXT_BASE_REQUEST,
        gemini: mockGeminiText(['ok']).client,
        anthropic: anthropic.client,
        openai: mockOpenAIText('ok').client,
        geminiModels: ['premium-model'],
      });
      expect(result?.provider).toMatch(/^anthropic:/);
      expect(result?.text).toBe('anthropic-antwort');
    });

    it('faellt auf OpenAI zurueck, wenn Anthropic fehlschlaegt oder nicht konfiguriert ist', async () => {
      const result = await generateTextWithFallback({
        ...TEXT_BASE_REQUEST,
        gemini: mockGeminiText(['ok']).client,
        anthropic: null,
        openai: mockOpenAIText('ok').client,
        geminiModels: ['premium-model'],
      });
      expect(result?.provider).toMatch(/^openai:/);
      expect(result?.text).toBe('openai-antwort');
    });

    it('faellt auf Gemini zurueck, wenn sowohl Anthropic als auch OpenAI fehlschlagen', async () => {
      const result = await generateTextWithFallback({
        ...TEXT_BASE_REQUEST,
        gemini: mockGeminiText(['ok']).client,
        anthropic: mockAnthropicText('fail').client,
        openai: mockOpenAIText('fail').client,
        geminiModels: ['premium-model'],
      });
      expect(result?.provider).toBe('premium-model');
      expect(result?.text).toBe('gemini-antwort');
    });

    it('liefert null, wenn alle drei Provider fehlschlagen', async () => {
      const result = await generateTextWithFallback({
        ...TEXT_BASE_REQUEST,
        gemini: mockGeminiText(['fail']).client,
        anthropic: mockAnthropicText('fail').client,
        openai: mockOpenAIText('fail').client,
        geminiModels: ['premium-model'],
      });
      expect(result).toBeNull();
    });

    it('faellt weiter, wenn Anthropic antwortet, aber keinen Textblock liefert', async () => {
      const result = await generateTextWithFallback({
        ...TEXT_BASE_REQUEST,
        gemini: null,
        anthropic: mockAnthropicText('no-text').client,
        openai: mockOpenAIText('ok').client,
        geminiModels: [],
      });
      expect(result?.provider).toMatch(/^openai:/);
    });

    it('reicht die Gespraechshistorie an alle drei Provider in providerspezifischem Format weiter', async () => {
      const history = [
        { role: 'user' as const, text: 'Frage 1' },
        { role: 'assistant' as const, text: 'Antwort 1' },
      ];

      const anthropic = mockAnthropicText('ok');
      await generateTextWithFallback({ ...TEXT_BASE_REQUEST, history, gemini: null, anthropic: anthropic.client, openai: null, geminiModels: [] });
      expect(anthropic.calls[0].messages).toEqual([
        { role: 'user', content: 'Frage 1' },
        { role: 'assistant', content: 'Antwort 1' },
        { role: 'user', content: TEXT_BASE_REQUEST.contents },
      ]);

      const openai = mockOpenAIText('ok');
      await generateTextWithFallback({ ...TEXT_BASE_REQUEST, history, gemini: null, anthropic: null, openai: openai.client, geminiModels: [] });
      expect(openai.calls[0].messages).toEqual([
        { role: 'system', content: TEXT_BASE_REQUEST.systemInstruction },
        { role: 'user', content: 'Frage 1' },
        { role: 'assistant', content: 'Antwort 1' },
        { role: 'user', content: TEXT_BASE_REQUEST.contents },
      ]);

      const gemini = mockGeminiText(['ok']);
      await generateTextWithFallback({ ...TEXT_BASE_REQUEST, history, gemini: gemini.client, anthropic: null, openai: null, geminiModels: ['model-a'] });
      expect(gemini.calls[0].contents).toEqual([
        { role: 'user', parts: [{ text: 'Frage 1' }] },
        { role: 'model', parts: [{ text: 'Antwort 1' }] },
        { role: 'user', parts: [{ text: TEXT_BASE_REQUEST.contents }] },
      ]);
    });

    it('nutzt maxTokens, wenn angegeben, sonst den Default (2048)', async () => {
      const anthropic = mockAnthropicText('ok');
      await generateTextWithFallback({ ...TEXT_BASE_REQUEST, gemini: null, anthropic: anthropic.client, openai: null, geminiModels: [], maxTokens: 8192 });
      expect(anthropic.calls[0].max_tokens).toBe(8192);

      const anthropicDefault = mockAnthropicText('ok');
      await generateTextWithFallback({ ...TEXT_BASE_REQUEST, gemini: null, anthropic: anthropicDefault.client, openai: null, geminiModels: [] });
      expect(anthropicDefault.calls[0].max_tokens).toBe(2048);
    });
  });
});
