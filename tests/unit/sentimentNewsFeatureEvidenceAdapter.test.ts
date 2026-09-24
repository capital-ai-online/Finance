import { describe, expect, it } from 'vitest';
import {
  SENTIMENT_NEWS_EVIDENCE_WINDOW_HOURS,
  SENTIMENT_NEWS_FEATURE_ADAPTER_VERSION,
  SENTIMENT_NEWS_MENTION_SATURATION_COUNT,
  buildNewsDerivedSentimentFeatureAttestations,
} from '../../src/platform/Scoring/SentimentNewsFeatureEvidenceAdapter';

const NOW = Date.parse('2026-09-24T02:00:00.000Z');

describe('Sentiment news feature evidence adapter', () => {
  it('attests only exact-headline novelty and bounded 24h mention intensity', () => {
    const result = buildNewsDerivedSentimentFeatureAttestations([
      {
        evidenceRef: 'gdelt:1',
        publishedAt: '2026-09-24T01:00:00.000Z',
        headline: 'Bitcoin ETF inflows rise',
      },
      {
        evidenceRef: 'free-crypto-news:2',
        publishedAt: '2026-09-24T00:30:00.000Z',
        headline: 'Bitcoin ETF inflows rise!',
      },
      {
        evidenceRef: 'gdelt:3',
        publishedAt: '2026-09-23T23:30:00.000Z',
        headline: 'Ethereum activity expands',
      },
    ], NOW);

    expect(SENTIMENT_NEWS_FEATURE_ADAPTER_VERSION).toBe('sentiment-news-feature-adapter/1.0.0');
    expect(SENTIMENT_NEWS_EVIDENCE_WINDOW_HOURS).toBe(24);
    expect(SENTIMENT_NEWS_MENTION_SATURATION_COUNT).toBe(20);

    const duplicated = result.get('gdelt:1');
    const unique = result.get('gdelt:3');

    expect(duplicated?.novelty).toEqual({
      value: 0.5,
      evidenceRefs: ['free-crypto-news:2', 'gdelt:1'],
      method: 'news-exact-headline-novelty/1.0.0',
    });
    expect(unique?.novelty).toEqual({
      value: 1,
      evidenceRefs: ['gdelt:3'],
      method: 'news-exact-headline-novelty/1.0.0',
    });
    expect(duplicated?.mentionIntensity).toEqual({
      value: 0.15,
      evidenceRefs: ['free-crypto-news:2', 'gdelt:1', 'gdelt:3'],
      method: 'news-evidence-count-24h/1.0.0',
    });

    for (const feature of ['polarity', 'intensity', 'credibility', 'botProbability', 'sourceWeight', 'regimeAdjustment']) {
      expect(duplicated).not.toHaveProperty(feature);
    }
  });

  it('does not attest stale, future, invalid or reference-less observations', () => {
    const result = buildNewsDerivedSentimentFeatureAttestations([
      {
        evidenceRef: 'too-old',
        publishedAt: '2026-09-22T00:00:00.000Z',
        headline: 'Old evidence',
      },
      {
        evidenceRef: 'future',
        publishedAt: '2026-09-24T02:00:01.000Z',
        headline: 'Future evidence',
      },
      {
        evidenceRef: 'invalid-date',
        publishedAt: 'invalid',
        headline: 'Invalid evidence',
      },
      {
        evidenceRef: '   ',
        publishedAt: '2026-09-24T01:00:00.000Z',
        headline: 'Missing ref',
      },
    ], NOW);

    expect(result.size).toBe(0);
  });

  it('saturates mention intensity without making route limit a scoring input', () => {
    const evidence = Array.from({ length: 25 }, (_, index) => ({
      evidenceRef: `news:${index}`,
      publishedAt: '2026-09-24T01:00:00.000Z',
      headline: `Distinct headline ${index}`,
    }));
    const result = buildNewsDerivedSentimentFeatureAttestations(evidence, NOW);
    expect(result.get('news:0')?.mentionIntensity?.value).toBe(1);
  });
});
