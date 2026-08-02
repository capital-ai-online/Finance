// ARCH-AUDIT-0002 (J4, Kapitel 14.6). Oeffentliche Retrieval-Funktion: bettet die Anfrage ein
// und liefert die aehnlichsten real indizierten Dokumentabschnitte. Liefert eine leere Liste
// (kein Fehler, keine erfundenen Treffer), wenn kein Index existiert oder kein Embedding-Provider
// konfiguriert ist - Aufrufer arbeiten dann exakt wie vor der Einfuehrung von RAG weiter.

import { randomUUID } from 'node:crypto';
import { embedTexts } from './embeddingsClient';
import { loadRagIndex, rankBySimilarity, type ScoredChunk } from './vectorStore';
import { buildRagEvidenceBundle, type RagEvidenceBundle } from './evidenceLayer';

export interface RetrievalOptions {
  topK?: number;
  /** Nur Treffer ab diesem Kosinus-Aehnlichkeitswert zurueckgeben (0..1). */
  minScore?: number;
}

export async function retrieveRelevantChunks(query: string, options: RetrievalOptions = {}): Promise<ScoredChunk[]> {
  const result = await retrieveRelevantChunksWithEvidence(query, options);
  return result.chunks;
}

export interface EvidenceRetrievalOptions extends RetrievalOptions {
  retrievalId?: string;
  promptId?: string;
  promptVersion?: string;
  modelProvider?: string;
  model?: string;
}

export interface EvidenceRetrievalResult {
  chunks: ScoredChunk[];
  evidence: RagEvidenceBundle;
}

/**
 * Enterprise Financial-RAG retrieval contract. In addition to the chunks it returns explicit
 * source policy, temporal validity, retrieval quality and model/prompt attribution metadata.
 * The function remains fail-closed: missing index/provider yields an empty evidence bundle.
 */
export async function retrieveRelevantChunksWithEvidence(
  query: string,
  options: EvidenceRetrievalOptions = {},
): Promise<EvidenceRetrievalResult> {
  const { topK = 5, minScore = 0.5 } = options;
  const retrievalId = options.retrievalId ?? randomUUID();
  const retrievedAt = new Date().toISOString();
  const index = loadRagIndex();

  if (!index || index.chunks.length === 0) {
    return {
      chunks: [],
      evidence: buildRagEvidenceBundle({
        retrievalId,
        query,
        chunks: [],
        retrievedAt,
        promptId: options.promptId,
        promptVersion: options.promptVersion,
        modelProvider: options.modelProvider,
        model: options.model,
      }),
    };
  }

  const embedding = await embedTexts([query]);
  if (!embedding || embedding.vectors.length === 0) {
    return {
      chunks: [],
      evidence: buildRagEvidenceBundle({
        retrievalId,
        query,
        chunks: [],
        retrievedAt,
        indexGeneratedAt: index.generatedAt,
        embeddingProvider: embedding?.provider,
        promptId: options.promptId,
        promptVersion: options.promptVersion,
        modelProvider: options.modelProvider,
        model: options.model,
      }),
    };
  }

  const queryVector = embedding.vectors[0];
  const chunks = rankBySimilarity(index, queryVector, topK).filter(r => r.score >= minScore);
  return {
    chunks,
    evidence: buildRagEvidenceBundle({
      retrievalId,
      query,
      chunks,
      retrievedAt,
      indexGeneratedAt: index.generatedAt,
      embeddingProvider: embedding.provider,
      promptId: options.promptId,
      promptVersion: options.promptVersion,
      modelProvider: options.modelProvider,
      model: options.model,
    }),
  };
}

/** Formatiert Treffer als zitierfaehigen Kontextblock fuer eine System-Instruction. */
export function formatChunksForPrompt(chunks: ScoredChunk[]): string {
  if (chunks.length === 0) return '';
  return chunks
    .map(({ chunk }) => `Quelle: ${chunk.sourcePath} (${chunk.heading})\n${chunk.text}`)
    .join('\n\n---\n\n');
}
