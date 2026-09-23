import { describe, expect, it } from 'vitest';
import {
  buildAttestedMarketSentimentProjection,
  SENTIMENT_FEATURE_CONTRACT_VERSION,
} from '../../src/platform/Scoring/SentimentEvidenceProjection';

const NOW = Date.parse('2026-09-23T18:00:00Z');

function completeFeatures() {
  const ref = ['gdelt:doc:abc'];
  return {
    polarity: { value: 0.6, evidenceRefs: ref, method: 'governed-nlp-polarity/1.0.0' },
    intensity: { value: 0.8, evidenceRefs: ref, method: 'governed-nlp-intensity/1.0.0' },
    novelty: { value: 0.7, evidenceRefs: ref, method: 'cross-source-dedup/1.0.0' },
    credibility: { value: 0.9, evidenceRefs: ref, method: 'source-credibility/1.0.0' },
    botProbability: { value: 0.05, evidenceRefs: ref, method: 'automation-risk/1.0.0' },
    sourceWeight: { value: 0.9, evidenceRefs: ref, method: 'source-weight/1.0.0' },
    mentionIntensity: { value: 0.75, evidenceRefs: ref, method: 'mention-intensity/1.0.0' },
    regimeAdjustment: { value: 0.85, evidenceRefs: ref, method: 'regime-adjustment/1.0.0' },
  } as const;
}

describe('Sentiment evidence feature contract', () => {
  it('keeps raw provider/news heuristic evidence fail-closed', () => {
    const projection = buildAttestedMarketSentimentProjection([
      {
        evidenceRef: 'gdelt:doc:raw',
        provider: 'gdelt',
        source: 'example.com',
        publishedAt: '2026-09-23T17:00:00Z',
        headline: 'Bitcoin rally continues',
        sentimentLabel: 'positive',
        sentimentBasis: 'heuristic',
        scoreCandidate: false,
      },
    ], NOW);

    expect(projection.contractVersion).toBe(SENTIMENT_FEATURE_CONTRACT_VERSION);
    expect(projection.status).toBe('NOT_COMPUTABLE');
    expect(projection.score).toBeNull();
    expect(projection.attestation.scoreCandidateCount).toBe(0);
    expect(projection.attestation.missingFeatures).toEqual(expect.arrayContaining([
      'polarity',
      'credibility',
      'botProbability',
      'regimeAdjustment',
    ]));
    expect(projection.summary).toContain('Headline-Heuristik bleibt Präsentationsmetadatum');
  });

  it('returns SOURCE_UNAVAILABLE without verified evidence instead of a neutral score', () => {
    const projection = buildAttestedMarketSentimentProjection([], NOW);
    expect(projection.status).toBe('SOURCE_UNAVAILABLE');
    expect(projection.score).toBeNull();
    expect(projection.evidenceIds).toEqual([]);
  });

  it('produces a numeric research projection only from a complete attested candidate', () => {
    const projection = buildAttestedMarketSentimentProjection([
      {
        evidenceRef: 'gdelt:doc:abc',
        provider: 'gdelt',
        source: 'example.com',
        publishedAt: '2026-09-23T17:00:00Z',
        headline: 'Governed evidence item',
        sentimentLabel: 'negative',
        sentimentBasis: 'heuristic',
        scoreCandidate: true,
        attestedFeatures: completeFeatures(),
      },
    ], NOW);

    expect(projection.status).toBe('READY');
    expect(projection.score).not.toBeNull();
    expect(projection.score!).toBeGreaterThan(50);
    expect(projection.attestation.completeCandidateCount).toBe(1);
    expect(projection.attestation.missingFeatures).toEqual([]);
    expect(projection.scoreEligible).toBe(false);
    expect(projection.executionEligible).toBe(false);
    expect(projection.authority).toBe('RESEARCH_CONTEXT_ONLY');
  });

  it('rejects incomplete or unattested score candidates without substituting defaults', () => {
    const features = completeFeatures();
    const { botProbability: _removed, ...incomplete } = features;
    const projection = buildAttestedMarketSentimentProjection([
      {
        evidenceRef: 'gdelt:doc:incomplete',
        provider: 'gdelt',
        source: 'example.com',
        publishedAt: '2026-09-23T17:00:00Z',
        headline: 'Incomplete evidence item',
        scoreCandidate: true,
        attestedFeatures: incomplete,
      },
    ], NOW);

    expect(projection.status).toBe('NOT_COMPUTABLE');
    expect(projection.score).toBeNull();
    expect(projection.attestation.missingFeatures).toContain('botProbability');
    expect(projection.attestation.completeCandidateCount).toBe(0);
  });

  it('rejects invalid attestations and future timestamps', () => {
    const projection = buildAttestedMarketSentimentProjection([
      {
        evidenceRef: 'gdelt:doc:invalid',
        provider: 'gdelt',
        source: 'example.com',
        publishedAt: '2026-09-24T18:00:00Z',
        headline: 'Invalid evidence item',
        scoreCandidate: true,
        attestedFeatures: {
          ...completeFeatures(),
          polarity: { value: 2, evidenceRefs: ['gdelt:doc:invalid'], method: 'invalid-range' },
        },
      },
    ], NOW);

    expect(projection.status).toBe('NOT_COMPUTABLE');
    expect(projection.score).toBeNull();
    expect(projection.attestation.invalidEvidenceRefs).toContain('gdelt:doc:invalid');
  });
});
