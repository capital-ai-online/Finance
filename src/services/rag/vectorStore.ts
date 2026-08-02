// ARCH-AUDIT-0002 (J4, Kapitel 14.6). Dateibasierter Vektorspeicher: laedt den unter
// .ai/knowledge/rag/index.json abgelegten Index (siehe scripts/automation/buildRagIndex.ts) und
// beantwortet Aehnlichkeitsanfragen per Kosinus-Aehnlichkeit. Keine Datenbank, keine Migration -
// bewusst dieselbe Ablageform wie die Traceability Matrix (N4), proportional zum Umfang dieses
// ersten RAG-Ausbaus.

import fs from 'fs';
import path from 'path';
import type { DocumentChunk } from './documentLoader';

const REPO_ROOT = process.cwd();
export const RAG_INDEX_PATH = path.join(REPO_ROOT, '.ai/knowledge/rag/index.json');

export interface IndexedChunk extends DocumentChunk {
  vector: number[];
}

export interface RagIndex {
  generatedAt: string;
  provider: string;
  chunkCount: number;
  chunks: IndexedChunk[];
}

export function ragIndexExists(): boolean {
  return fs.existsSync(RAG_INDEX_PATH);
}

export function loadRagIndex(): RagIndex | null {
  if (!ragIndexExists()) return null;
  return JSON.parse(fs.readFileSync(RAG_INDEX_PATH, 'utf8')) as RagIndex;
}

export function saveRagIndex(index: RagIndex): void {
  fs.mkdirSync(path.dirname(RAG_INDEX_PATH), { recursive: true });
  fs.writeFileSync(RAG_INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface ScoredChunk {
  chunk: DocumentChunk;
  score: number;
}

/** Sortiert die Chunks eines Index nach Kosinus-Aehnlichkeit zum Anfragevektor, absteigend. */
export function rankBySimilarity(index: RagIndex, queryVector: number[], topK: number): ScoredChunk[] {
  return index.chunks
    .map(chunk => ({ chunk, score: cosineSimilarity(chunk.vector, queryVector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ chunk, score }) => ({ chunk: { id: chunk.id, sourcePath: chunk.sourcePath, heading: chunk.heading, text: chunk.text }, score }));
}
