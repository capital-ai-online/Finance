// ARCH-AUDIT-0002 (J4, Kapitel 14.6): "RAG mit Wissensanbindung". Embedding-Erzeugung ueber
// echte Provider-APIs, nach demselben Muster wie src/services/agentModelRouting.ts (J3): Client
// wird injiziert (testbar ohne echten Schluessel), Reihenfolge OpenAI -> Gemini. Anthropic
// bietet keine Embeddings-API und entfaellt hier. Ohne konfigurierten Provider liefert
// embedTexts() `null` statt erfundener Vektoren - exakt das Gegenteil des in Kapitel 6 dieses
// Audits kritisierten Symbol-Hash-Musters.

import type { GoogleGenAI } from '@google/genai';
import type OpenAI from 'openai';
import { getOpenAIInstance, isOpenAIConfigured } from '../../../server/openaiClient';
import { getGeminiInstance, isGeminiConfigured } from '../../../server/ai';
import { trackedOpenAIEmbedding } from '../aiUsageTracker';

export const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
export const GEMINI_EMBEDDING_MODEL = 'text-embedding-004';

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

async function embedWithGemini(client: GoogleGenAI, texts: string[]): Promise<EmbeddingResult> {
  const response = await client.models.embedContent({ model: GEMINI_EMBEDDING_MODEL, contents: texts });
  const vectors = (response.embeddings ?? []).map(e => e.values ?? []);
  return { vectors, provider: `gemini:${GEMINI_EMBEDDING_MODEL}` };
}

/**
 * Erzeugt Embeddings fuer die uebergebenen Texte, in der Reihenfolge OpenAI -> Gemini. Liefert
 * `null`, wenn kein Provider konfiguriert ist oder alle konfigurierten Provider fehlschlagen -
 * der Aufrufer muss dann ohne Retrieval weiterarbeiten, nicht mit erfundenen Vektoren.
 */
export async function embedTexts(
  texts: string[],
  clients: { openai: OpenAI | null; gemini: GoogleGenAI | null } = {
    openai: isOpenAIConfigured() ? getOpenAIInstance() : null,
    gemini: isGeminiConfigured() ? getGeminiInstance() : null,
  },
  promptId: string = 'rag-retrieval-query',
): Promise<EmbeddingResult | null> {
  if (texts.length === 0) return { vectors: [], provider: 'none' };

  if (clients.openai) {
    try {
      return await embedWithOpenAI(clients.openai, texts, promptId);
    } catch (e) {
      console.warn('[rag/embeddingsClient] OpenAI-Embedding fehlgeschlagen.', e);
    }
  }

  if (clients.gemini) {
    try {
      return await embedWithGemini(clients.gemini, texts);
    } catch (e) {
      console.warn('[rag/embeddingsClient] Gemini-Embedding fehlgeschlagen.', e);
    }
  }

  return null;
}

export function isEmbeddingProviderConfigured(): boolean {
  return isOpenAIConfigured() || isGeminiConfigured();
}
