import { describe, expect, it } from 'vitest';
import {
  buildRagEvidenceBundle,
  evaluateTemporalValidity,
  getRagSourcePolicy,
} from '../../src/services/rag/evidenceLayer';

describe('Financial RAG evidence layer', () => {
  it('classifies architecture and compliance sources with explicit source policies', () => {
    expect(getRagSourcePolicy('docs/architecture/ENTERPRISE.md')).toMatchObject({
      sourceClass: 'architecture',
      authoritative: true,
      citationRequired: true,
    });
    expect(getRagSourcePolicy('docs/compliance/BAFIN.md')).toMatchObject({
      sourceClass: 'compliance',
      authoritative: true,
      citationRequired: true,
    });
  });

  it('marks time-sensitive evidence stale when the index exceeds its validity window', () => {
    const policy = getRagSourcePolicy('docs/compliance/BAFIN.md');
    const now = Date.UTC(2026, 7, 2);
    expect(evaluateTemporalValidity('2026-07-20T00:00:00.000Z', policy, now)).toBe('CURRENT');
    expect(evaluateTemporalValidity('2026-01-01T00:00:00.000Z', policy, now)).toBe('STALE');
  });

  it('builds auditable retrieval evaluation and model/prompt attribution', () => {
    const bundle = buildRagEvidenceBundle({
      retrievalId: 'ret-1',
      query: 'Welche Scoring-Regeln gelten?',
      indexGeneratedAt: '2026-08-02T06:00:00.000Z',
      retrievedAt: '2026-08-02T06:05:00.000Z',
      embeddingProvider: 'openai:text-embedding-3-small',
      promptId: 'chat-assistant',
      promptVersion: '1.2.0',
      modelProvider: 'anthropic',
      model: 'claude',
      nowMs: Date.parse('2026-08-02T06:05:00.000Z'),
      chunks: [
        {
          chunk: {
            id: 'chunk-1',
            sourcePath: 'docs/architecture/ENTERPRISE_SCREENING_SCORING_MASTER_ARCHITECTURE.md',
            heading: 'Scoring',
            text: 'Evidence-backed scoring.',
          },
          score: 0.82,
        },
        {
          chunk: {
            id: 'chunk-2',
            sourcePath: 'docs/compliance/controls.md',
            heading: 'Controls',
            text: 'Audit controls.',
          },
          score: 0.71,
        },
      ],
    });

    expect(bundle.attribution).toMatchObject({
      retrievalId: 'ret-1',
      promptId: 'chat-assistant',
      promptVersion: '1.2.0',
      modelProvider: 'anthropic',
      embeddingProvider: 'openai:text-embedding-3-small',
    });
    expect(bundle.evidence).toHaveLength(2);
    expect(bundle.evidence[0].evidenceId).toContain('ret-1');
    expect(bundle.evaluation.resultCount).toBe(2);
    expect(bundle.evaluation.topScore).toBe(0.82);
    expect(bundle.evaluation.currentEvidenceCount).toBe(2);
    expect(bundle.evaluation.quality).toBe('HIGH');
  });

  it('returns NO_EVIDENCE rather than fabricating retrieval quality', () => {
    const bundle = buildRagEvidenceBundle({ retrievalId: 'empty', query: 'x', chunks: [] });
    expect(bundle.evaluation.quality).toBe('NO_EVIDENCE');
    expect(bundle.evaluation.topScore).toBeNull();
    expect(bundle.evidence).toEqual([]);
  });
});
