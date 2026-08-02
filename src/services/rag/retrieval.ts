// ARCH-AUDIT-0002 (J4, Kapitel 14.6). Oeffentliche Retrieval-Funktion: bettet die Anfrage ein
// und liefert die aehnlichsten real indizierten Dokumentabschnitte. Liefert eine leere Liste
// (kein Fehler, keine erfundenen Treffer), wenn kein Index existiert oder kein Embedding-Provider
// konfiguriert ist - Aufrufer arbeiten dann exakt wie vor der Einfuehrung von RAG weiter.

import { embedTexts } from './embeddingsClient';
import { loadRagIndex, rankBySimilarity, type ScoredChunk } from './vectorStore';

export interface RetrievalOptions {
  topK?: number;
  /** Nur Treffer ab diesem Kosinus-Aehnlichkeitswert zurueckgeben (0..1). */
  minScore?: number;
}

export async function retrieveRelevantChunks(query: string, options: RetrievalOptions = {}): Promise<ScoredChunk[]> {
  const { topK = 5, minScore = 0.5 } = options;

  const index = loadRagIndex();
  if (!index || index.chunks.length === 0) return [];

  const embedding = await embedTexts([query]);
  if (!embedding || embedding.vectors.length === 0) return [];

  const queryVector = embedding.vectors[0];
  return rankBySimilarity(index, queryVector, topK).filter(r => r.score >= minScore);
}

/** Formatiert Treffer als zitierfaehigen Kontextblock fuer eine System-Instruction. */
export function formatChunksForPrompt(chunks: ScoredChunk[]): string {
  if (chunks.length === 0) return '';
  return chunks
    .map(({ chunk }) => `Quelle: ${chunk.sourcePath} (${chunk.heading})\n${chunk.text}`)
    .join('\n\n---\n\n');
}
