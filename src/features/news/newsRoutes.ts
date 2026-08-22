// ARCH-AUDIT-0002 / SC-4: /api/news remains the product projection, while external transport,
// rate limiting, circuit breaking and provenance now live in the shared evidence-provider layer.

import express from 'express';
import { NewsApiEvidenceProvider } from '../../platform/MarketData/providers/NewsApiEvidenceProvider';

export type NewsSentiment = 'positive' | 'negative' | 'neutral';

/**
 * Deterministic keyword heuristic only. This is deliberately NOT promoted to model/NLP evidence.
 * Raw article provenance is supplied by NewsApiEvidenceProvider.
 */
export type NewsSentimentBasis = 'heuristic';
export const NEWS_SENTIMENT_BASIS: NewsSentimentBasis = 'heuristic';

const POSITIVE_KEYWORDS = ['bullish', 'surge', 'gain', 'rise', 'rally', 'growth'];
const NEGATIVE_KEYWORDS = ['bearish', 'plummet', 'drop', 'fall', 'crash', 'risk', 'hack'];

export function classifyNewsSentiment(headline: string, description: string): NewsSentiment {
  const text = `${headline || ''} ${description || ''}`.toLowerCase();
  if (POSITIVE_KEYWORDS.some(kw => text.includes(kw))) return 'positive';
  if (NEGATIVE_KEYWORDS.some(kw => text.includes(kw))) return 'negative';
  return 'neutral';
}

export const newsRouter = express.Router();

newsRouter.get('/', async (_req, res) => {
  const provider = new NewsApiEvidenceProvider();
  const result = await provider.searchEverything('cryptocurrency OR bitcoin OR ethereum OR finance', 10);

  if (result.status !== 'VERIFIED') {
    return res.status(503).json({
      status: 'NO_DATA',
      reason: result.reason ?? `NewsAPI Evidence ist nicht verfügbar (${result.status}).`,
    });
  }

  const newsItems = result.articles.slice(0, 5).map((article, idx) => ({
    id: `news_${idx}_${Date.now()}`,
    headline: article.title,
    summary: article.description || 'Keine detaillierte Beschreibung verfügbar.',
    sentiment: classifyNewsSentiment(article.title, article.description ?? ''),
    sentimentBasis: NEWS_SENTIMENT_BASIS,
    time: new Date(article.publishedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr',
    source: article.sourceName,
    evidenceRef: article.evidenceRef,
    publishedAt: article.publishedAt,
  }));

  return res.json(newsItems);
});
