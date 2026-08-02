import type { ScoredChunk } from './vectorStore';

export type RagSourceClass = 'governance' | 'architecture' | 'security' | 'compliance' | 'financial-research' | 'internal-documentation';

export interface RagSourcePolicy {
  sourceClass: RagSourceClass;
  authoritative: boolean;
  maxAgeMs: number | null;
  citationRequired: boolean;
}

export interface RagEvidenceAttribution {
  retrievalId: string;
  query: string;
  retrievedAt: string;
  indexGeneratedAt?: string;
  embeddingProvider?: string;
  promptId?: string;
  promptVersion?: string;
  modelProvider?: string;
  model?: string;
}

export interface RagEvidenceItem {
  evidenceId: string;
  chunkId: string;
  sourcePath: string;
  heading: string;
  similarity: number;
  sourcePolicy: RagSourcePolicy;
  temporalStatus: 'CURRENT' | 'STALE' | 'UNDATED';
}

export interface RagRetrievalEvaluation {
  resultCount: number;
  topScore: number | null;
  meanScore: number | null;
  currentEvidenceCount: number;
  staleEvidenceCount: number;
  citationCoverage: number;
  quality: 'HIGH' | 'MEDIUM' | 'LOW' | 'NO_EVIDENCE';
}

export interface RagEvidenceBundle {
  attribution: RagEvidenceAttribution;
  evidence: RagEvidenceItem[];
  evaluation: RagRetrievalEvaluation;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Source Registry for repository-backed RAG. The policy is deliberately derived from the
 * concrete repository path; unknown paths are not silently promoted to authoritative sources.
 */
export function getRagSourcePolicy(sourcePath: string): RagSourcePolicy {
  const normalized = sourcePath.replace(/\\/g, '/').toLowerCase();
  if (normalized.includes('/adr/') || normalized.includes('/architecture/')) {
    return { sourceClass: 'architecture', authoritative: true, maxAgeMs: null, citationRequired: true };
  }
  if (normalized.includes('/security')) {
    return { sourceClass: 'security', authoritative: true, maxAgeMs: 90 * DAY, citationRequired: true };
  }
  if (normalized.includes('/compliance') || normalized.includes('datenschutz')) {
    return { sourceClass: 'compliance', authoritative: true, maxAgeMs: 90 * DAY, citationRequired: true };
  }
  if (normalized.includes('research') || normalized.includes('market') || normalized.includes('scoring')) {
    return { sourceClass: 'financial-research', authoritative: false, maxAgeMs: 30 * DAY, citationRequired: true };
  }
  if (normalized.includes('.ai/skills') || normalized.includes('/governance/')) {
    return { sourceClass: 'governance', authoritative: true, maxAgeMs: null, citationRequired: true };
  }
  return { sourceClass: 'internal-documentation', authoritative: false, maxAgeMs: 180 * DAY, citationRequired: true };
}

export function evaluateTemporalValidity(indexGeneratedAt: string | undefined, policy: RagSourcePolicy, nowMs = Date.now()): RagEvidenceItem['temporalStatus'] {
  if (!indexGeneratedAt) return 'UNDATED';
  const generatedMs = Date.parse(indexGeneratedAt);
  if (!Number.isFinite(generatedMs)) return 'UNDATED';
  if (policy.maxAgeMs === null) return 'CURRENT';
  return nowMs - generatedMs <= policy.maxAgeMs ? 'CURRENT' : 'STALE';
}

export function buildRagEvidenceBundle(input: {
  retrievalId: string;
  query: string;
  chunks: ScoredChunk[];
  retrievedAt?: string;
  indexGeneratedAt?: string;
  embeddingProvider?: string;
  promptId?: string;
  promptVersion?: string;
  modelProvider?: string;
  model?: string;
  nowMs?: number;
}): RagEvidenceBundle {
  const retrievedAt = input.retrievedAt ?? new Date(input.nowMs ?? Date.now()).toISOString();
  const nowMs = input.nowMs ?? Date.parse(retrievedAt);
  const evidence = input.chunks.map(({ chunk, score }) => {
    const sourcePolicy = getRagSourcePolicy(chunk.sourcePath);
    return {
      evidenceId: `rag:${input.retrievalId}:${chunk.id}`,
      chunkId: chunk.id,
      sourcePath: chunk.sourcePath,
      heading: chunk.heading,
      similarity: Number(score.toFixed(6)),
      sourcePolicy,
      temporalStatus: evaluateTemporalValidity(input.indexGeneratedAt, sourcePolicy, nowMs),
    } satisfies RagEvidenceItem;
  });

  const scores = evidence.map(item => item.similarity);
  const currentEvidenceCount = evidence.filter(item => item.temporalStatus === 'CURRENT').length;
  const staleEvidenceCount = evidence.filter(item => item.temporalStatus === 'STALE').length;
  const citationRequired = evidence.filter(item => item.sourcePolicy.citationRequired).length;
  const citationCoverage = evidence.length === 0 ? 0 : citationRequired / evidence.length;
  const topScore = scores.length ? Math.max(...scores) : null;
  const meanScore = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;

  let quality: RagRetrievalEvaluation['quality'] = 'NO_EVIDENCE';
  if (evidence.length > 0) {
    if ((topScore ?? 0) >= 0.75 && staleEvidenceCount === 0 && currentEvidenceCount > 0) quality = 'HIGH';
    else if ((topScore ?? 0) >= 0.6 && staleEvidenceCount < evidence.length) quality = 'MEDIUM';
    else quality = 'LOW';
  }

  return {
    attribution: {
      retrievalId: input.retrievalId,
      query: input.query,
      retrievedAt,
      indexGeneratedAt: input.indexGeneratedAt,
      embeddingProvider: input.embeddingProvider,
      promptId: input.promptId,
      promptVersion: input.promptVersion,
      modelProvider: input.modelProvider,
      model: input.model,
    },
    evidence,
    evaluation: {
      resultCount: evidence.length,
      topScore,
      meanScore: meanScore === null ? null : Number(meanScore.toFixed(6)),
      currentEvidenceCount,
      staleEvidenceCount,
      citationCoverage: Number(citationCoverage.toFixed(4)),
      quality,
    },
  };
}
