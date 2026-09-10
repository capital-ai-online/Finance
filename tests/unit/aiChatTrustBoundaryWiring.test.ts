import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const aiSource = readFileSync(resolve(process.cwd(), 'server/ai.ts'), 'utf8');

describe('AI chat productive trust-boundary wiring', () => {
  it('routes retrieved evidence through the untrusted model-input builder instead of system concatenation', () => {
    expect(aiSource).toContain("from '../src/services/aiChatTrustBoundary'");
    expect(aiSource).toContain('const modelInput = buildAiChatModelInput({');
    expect(aiSource).toContain('retrievedContext: retrieval.chunks.length > 0 ? formatChunksForPrompt(retrieval.chunks) : undefined');
    expect(aiSource).toContain('contents: modelInput.contents');
    expect(aiSource).toContain('history: modelInput.history');
    expect(aiSource).toContain('systemInstruction: modelInput.systemInstruction');
    expect(aiSource).not.toMatch(/systemInstruction\s*\+=/);
  });

  it('keeps the chat route on the text-only provider path with no agent/tool execution binding', () => {
    expect(aiSource).toContain('generateTextWithFallback({');
    expect(aiSource).not.toContain('generateStructuredWithFallback');
    expect(aiSource).not.toContain('tool_choice');
    expect(aiSource).not.toContain('tools:');
  });
});
