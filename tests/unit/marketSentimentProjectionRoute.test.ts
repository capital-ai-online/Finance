import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const routes = readFileSync('src/features/news/newsRoutes.ts', 'utf8');
const contract = readFileSync('src/platform/Scoring/SentimentEvidenceProjection.ts', 'utf8');
const newsFeatureAdapter = readFileSync('src/platform/Scoring/SentimentNewsFeatureEvidenceAdapter.ts', 'utf8');

describe('Market sentiment projection route boundary', () => {
  it('exposes one FINTECH projection endpoint through the existing news router', () => {
    expect(routes).toContain("newsRouter.get('/sentiment-projection'");
    expect(routes).toContain('buildAttestedMarketSentimentProjection');
    expect(routes).toContain('SENTIMENT_FEATURE_CONTRACT_VERSION');
    expect(routes).toContain('buildNewsDerivedSentimentFeatureAttestations');
    expect(routes).toContain('attestedFeatures,');
    expect(routes).toContain("scoreCandidate: false");
    expect(routes).toContain('const providerLimit = PROVIDER_FETCH_LIMIT;');
  });

  it('does not promote headline heuristic metadata into FINTECH scoring', () => {
    expect(contract).toContain("sentimentBasis?: string");
    expect(contract).toContain('Raw news metadata and the headline heuristic are context-only');
    expect(contract).toContain("scoreCandidates.length === 0");
    expect(contract).toContain("status === 'SOURCE_UNAVAILABLE'");
    expect(contract).toContain('evaluateSentimentResearch(researchItems)');
  });

  it('keeps partial existing-evidence attestations below the score-candidate gate', () => {
    expect(newsFeatureAdapter).toContain("'news-exact-headline-novelty/1.0.0'");
    expect(newsFeatureAdapter).toContain("'news-evidence-count-24h/1.0.0'");
    expect(newsFeatureAdapter).toContain('It does not infer polarity/intensity, source trust/credibility, bot probability or market');
    expect(routes).toContain('A partial vector therefore remains ineligible for scoring.');
  });

  it('requires the complete governed feature vector before READY', () => {
    for (const field of [
      'polarity',
      'intensity',
      'novelty',
      'credibility',
      'botProbability',
      'sourceWeight',
      'mentionIntensity',
      'regimeAdjustment',
    ]) {
      expect(contract).toContain(`'${field}'`);
    }
    expect(contract).toContain('RESEARCH_CONTEXT_ONLY');
    expect(contract).toContain('scoreEligible: false');
    expect(contract).toContain('executionEligible: false');
  });
});
