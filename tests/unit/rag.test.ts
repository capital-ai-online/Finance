// Audit ARCH-AUDIT-0002 (J4, Kapitel 14.6): Testabdeckung fuer "RAG mit Wissensanbindung".
// Provider-Clients werden injiziert (kein echter API-Schluessel noetig), analog
// tests/unit/agentModelRouting.test.ts.

import { describe, it, expect } from 'vitest';
import { loadCorpusChunks } from '../../src/services/rag/documentLoader';
import { embedTexts } from '../../src/services/rag/embeddingsClient';
import { cosineSimilarity, rankBySimilarity, type RagIndex } from '../../src/services/rag/vectorStore';
import { formatChunksForPrompt, retrieveRelevantChunks } from '../../src/services/rag/retrieval';

function mockOpenAI(behavior: 'ok' | 'fail', dims = 3) {
  return {
    embeddings: {
      create: async ({ input }: { input: string[] }) => {
        if (behavior === 'fail') throw new Error('openai embeddings failed');
        return { data: input.map((_, i) => ({ embedding: Array(dims).fill(0).map((_, d) => i + d) })) };
      },
    },
  } as any;
}

describe('rag/documentLoader', () => {
  it('laedt reale Chunks aus docs/ und .ai/skills/', () => {
    const chunks = loadCorpusChunks();
    expect(chunks.length).toBeGreaterThan(100);
    for (const chunk of chunks.slice(0, 50)) {
      expect(chunk.text.length).toBeGreaterThan(0);
      expect(chunk.sourcePath.startsWith('docs/') || chunk.sourcePath.startsWith('.ai/skills/')).toBe(true);
    }
  });

  it('entfernt den wiederkehrenden Marken-Header (kein Rauschen im Korpus)', () => {
    const chunks = loadCorpusChunks();
    const withHeader = chunks.filter(c => c.text.includes('CAPITAL-AI DOCUMENTARY HEADER'));
    expect(withHeader).toHaveLength(0);
  });
});

describe('rag/embeddingsClient', () => {
  it('liefert null, wenn kein Provider konfiguriert ist', async () => {
    const result = await embedTexts(['x'], { openai: null });
    expect(result).toBeNull();
  });

  it('verwendet OpenAI für echte Embeddings', async () => {
    const result = await embedTexts(['a', 'b'], { openai: mockOpenAI('ok') });
    expect(result?.provider).toMatch(/^openai:/);
    expect(result?.vectors).toHaveLength(2);
  });

  it('liefert null, wenn OpenAI fehlschlägt', async () => {
    const result = await embedTexts(['a'], { openai: mockOpenAI('fail') });
    expect(result).toBeNull();
  });
});

describe('rag/vectorStore', () => {
  it('cosineSimilarity: identische Vektoren ergeben 1, orthogonale 0', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('rankBySimilarity: sortiert absteigend und begrenzt auf topK', () => {
    const index: RagIndex = {
      generatedAt: new Date().toISOString(),
      provider: 'test',
      chunkCount: 3,
      chunks: [
        { id: 'a', sourcePath: 'docs/a.md', heading: 'A', text: 'a', vector: [1, 0] },
        { id: 'b', sourcePath: 'docs/b.md', heading: 'B', text: 'b', vector: [0.9, 0.1] },
        { id: 'c', sourcePath: 'docs/c.md', heading: 'C', text: 'c', vector: [0, 1] },
      ],
    };
    const ranked = rankBySimilarity(index, [1, 0], 2);
    expect(ranked).toHaveLength(2);
    expect(ranked[0].chunk.id).toBe('a');
    expect(ranked[1].chunk.id).toBe('b');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });
});

describe('rag/retrieval', () => {
  it('retrieveRelevantChunks liefert eine leere Liste ohne gebauten Index (fail-open)', async () => {
    // Im Testlauf existiert .ai/knowledge/rag/index.json nicht - genau der Zustand, in dem
    // sich das Repository ohne konfigurierten Embedding-Provider tatsaechlich befindet.
    const result = await retrieveRelevantChunks('irgendeine Frage');
    expect(result).toEqual([]);
  });

  it('formatChunksForPrompt: leere Liste ergibt leeren String, sonst Quelle + Text je Treffer', () => {
    expect(formatChunksForPrompt([])).toBe('');
    const formatted = formatChunksForPrompt([
      { chunk: { id: 'x', sourcePath: 'docs/x.md', heading: 'X', text: 'Inhalt X' }, score: 0.9 },
    ]);
    expect(formatted).toContain('docs/x.md');
    expect(formatted).toContain('Inhalt X');
  });
});
