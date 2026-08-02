// ARCH-AUDIT-0002 (J4, Kapitel 14.6): "RAG mit Wissensanbindung". Baut den Vektorindex fuer die
// interne Dokumentation (docs/, .ai/skills/) und schreibt ihn nach .ai/knowledge/rag/index.json.
// Kein automatischer Lauf beim Serverstart - bewusst, dieselbe Begruendung wie bei
// src/platform/Traceability (N4): explizit per `npm run rag:build-index`, nicht als
// ueberraschende Nebenwirkung jedes Entwicklerlaufs (vgl. AUD2-F-014).
//
// Erfordert OPENAI_API_KEY oder GEMINI_API_KEY. Ohne einen der beiden bricht der Lauf mit einer
// klaren Fehlermeldung ab, statt einen Index mit erfundenen Vektoren zu schreiben.

import { loadCorpusChunks } from '../../src/services/rag/documentLoader';
import { embedTexts, isEmbeddingProviderConfigured } from '../../src/services/rag/embeddingsClient';
import { saveRagIndex, type IndexedChunk } from '../../src/services/rag/vectorStore';

const BATCH_SIZE = 100;

async function main() {
  if (!isEmbeddingProviderConfigured()) {
    console.error('[buildRagIndex] Weder OPENAI_API_KEY noch GEMINI_API_KEY gesetzt - kein Embedding-Provider konfiguriert. Abbruch ohne Index.');
    process.exit(1);
  }

  const chunks = loadCorpusChunks();
  console.log(`[buildRagIndex] ${chunks.length} Chunks aus docs/ und .ai/skills/ geladen.`);

  const indexed: IndexedChunk[] = [];
  let provider = '';
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const result = await embedTexts(batch.map(c => c.text), undefined, 'rag-index-build');
    if (!result) {
      console.error(`[buildRagIndex] Embedding-Aufruf fuer Batch ${i / BATCH_SIZE + 1} fehlgeschlagen - Provider abgelehnt oder nicht erreichbar. Abbruch ohne Index.`);
      process.exit(1);
    }
    provider = result.provider;
    batch.forEach((chunk, j) => indexed.push({ ...chunk, vector: result.vectors[j] }));
    console.log(`[buildRagIndex] ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} eingebettet (${provider}).`);
  }

  saveRagIndex({
    generatedAt: new Date().toISOString(),
    provider,
    chunkCount: indexed.length,
    chunks: indexed,
  });
  console.log(`[buildRagIndex] Index mit ${indexed.length} Chunks geschrieben nach .ai/knowledge/rag/index.json.`);
}

main();
