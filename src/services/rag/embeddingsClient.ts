// RAG-Embeddings verwenden nach Entfernung von Gemini ausschließlich OpenAI.
// Ohne konfigurierten Provider liefert embedTexts() null statt erfundener Vektoren.

import type OpenAI from 'openai';
import { getOpenAIInstance, isOpenAIConfigured } from '../../../server/openaiClient';
import { trackedOpenAIEmbedding } from '../aiUsageTracker';

export const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';

export interface EmbeddingResult {
  vectors: number[][];
  provider: string;
}

async function embedWithOpenAI(client: OpenAI, texts: string[], promptId: string): Promise<EmbeddingResult> {
  const response = await trackedOpenAIEmbedding(
    client,
    { model: OPENAI_EMBEDDING_MODEL, input: texts },
    { promptId },
  );
  return { vectors: response.data.map(d => d.embedding), provider: `openai:${OPENAI_EMBEDDING_MODEL}` };
}

export async function embedTexts(
  texts: string[],
  clients: { openai: OpenAI | null } = {
    openai: isOpenAIConfigured() ? getOpenAIInstance() : null,
  },
  promptId: string = 'rag-retrieval-query',
): Promise<EmbeddingResult | null> {
  if (texts.length === 0) return { vectors: [], provider: 'none' };

  if (clients.openai) {
    try {
      return await embedWithOpenAI(clients.openai, texts, promptId);
    } catch (error) {
      console.warn('[rag/embeddingsClient] OpenAI-Embedding fehlgeschlagen.', error);
    }
  }

  return null;
}

export function isEmbeddingProviderConfigured(): boolean {
  return isOpenAIConfigured();
}
