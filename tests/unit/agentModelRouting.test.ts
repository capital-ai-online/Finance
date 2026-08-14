import { describe, expect, it } from 'vitest';
import { Type } from '../../src/services/aiSchema';
import { generateStructuredWithFallback, generateTextWithFallback, toJsonSchema } from '../../src/services/agentModelRouting';

function anthropic(mode: 'ok' | 'fail' | 'empty', data: any = { foo: 'anthropic' }) {
  const calls: any[] = [];
  return { calls, client: { messages: { create: async (params: any) => {
    calls.push(params);
    if (mode === 'fail') throw new Error('anthropic failed');
    if (mode === 'empty') return { content: [{ type: 'text', text: '' }], usage: {} };
    return { content: [{ type: params.tools ? 'tool_use' : 'text', name: 'submit_structured_result', input: data, text: 'anthropic-text' }], usage: { input_tokens: 2, output_tokens: 1 } };
  } } } as any };
}

function openai(mode: 'ok' | 'fail' | 'empty', data: any = { foo: 'openai' }) {
  const calls: any[] = [];
  return { calls, client: { chat: { completions: { create: async (params: any) => {
    calls.push(params);
    if (mode === 'fail') throw new Error('openai failed');
    return { choices: [{ message: { content: mode === 'empty' ? null : (params.response_format ? JSON.stringify(data) : 'openai-text') } }], usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 } };
  } } } } as any };
}

const structured = {
  promptId: 'crypto-risk',
  contents: 'analysiere',
  systemInstruction: 'test',
  schema: { type: Type.OBJECT, properties: { foo: { type: Type.STRING } }, required: ['foo'] },
};

describe('agentModelRouting ohne Gemini', () => {
  it('wandelt das providerneutrale Schema in JSON Schema um', () => {
    const schema = toJsonSchema({ type: Type.OBJECT, properties: { score: { type: Type.INTEGER } } });
    expect(schema.type).toBe('object');
    expect(schema.properties.score.type).toBe('number');
  });

  it('liefert null ohne Provider', async () => {
    expect(await generateStructuredWithFallback({ ...structured, anthropic: null, openai: null })).toBeNull();
  });

  it('priorisiert Anthropic vor OpenAI', async () => {
    const result = await generateStructuredWithFallback({ ...structured, anthropic: anthropic('ok').client, openai: openai('ok').client });
    expect(result?.provider).toMatch(/^anthropic:/);
    expect(result?.data).toEqual({ foo: 'anthropic' });
  });

  it('faellt von Anthropic auf OpenAI zurueck', async () => {
    const result = await generateStructuredWithFallback({ ...structured, anthropic: anthropic('fail').client, openai: openai('ok').client });
    expect(result?.provider).toMatch(/^openai:/);
    expect(result?.data).toEqual({ foo: 'openai' });
  });

  it('liefert null, wenn beide Provider fehlschlagen', async () => {
    expect(await generateStructuredWithFallback({ ...structured, anthropic: anthropic('fail').client, openai: openai('fail').client })).toBeNull();
  });

  it('routet Freitext inklusive Historie Anthropic -> OpenAI', async () => {
    const history = [{ role: 'user' as const, text: 'Frage' }, { role: 'assistant' as const, text: 'Antwort' }];
    const a = anthropic('fail');
    const o = openai('ok');
    const result = await generateTextWithFallback({ promptId: 'chat-assistant', contents: 'Weiter', systemInstruction: 'test', history, anthropic: a.client, openai: o.client });
    expect(result?.provider).toMatch(/^openai:/);
    expect(result?.text).toBe('openai-text');
    expect(o.calls[0].messages).toEqual([
      { role: 'system', content: 'test' },
      { role: 'user', content: 'Frage' },
      { role: 'assistant', content: 'Antwort' },
      { role: 'user', content: 'Weiter' },
    ]);
  });

  it('liefert null, wenn beide Freitext-Provider fehlschlagen', async () => {
    expect(await generateTextWithFallback({ promptId: 'chat-assistant', contents: 'x', systemInstruction: 'test', anthropic: anthropic('fail').client, openai: openai('fail').client })).toBeNull();
  });
});
