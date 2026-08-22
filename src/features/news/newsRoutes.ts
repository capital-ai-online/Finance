// ARCH-AUDIT-0002 / SC-4: /api/news remains the product projection, while external transport,
// rate limiting, circuit breaking and provenance live in the shared evidence-provider layer.
// No route-level synthetic headline or AI-generated financial claim is permitted.

import express from 'express';
import { NewsApiEvidenceProvider } from '../../platform/MarketData/providers/NewsApiEvidenceProvider';

export type NewsSentiment = 'positive' | 'negative' | 'neutral';

/**
 * Deterministic keyword heuristic only. This is deliberately NOT promoted to model/NLP evidence.
 * Raw article provenance is supplied by NewsApiEvidenceProvider.
 */
export type NewsSentimentBasis = 'heuristic';
export const NEWS_SENTIMENT_BASIS: NewsSentimentBasis = 'heuristic';

const POSITIVE_KEYWORDS = ['bullish', 'surge', 'gain', 'rise', 'rally', 'growth', 'beats', 'record high'];
const NEGATIVE_KEYWORDS = ['bearish', 'plummet', 'drop', 'fall', 'crash', 'risk', 'hack', 'misses', 'lawsuit'];
const NEWS_CACHE_TTL_MS = 5 * 60_000;
const MAX_NEWS_ITEMS = 20;

interface ProjectedNewsItem {
  id: string;
  headline: string;
  summary: string;
  sentiment: NewsSentiment;
  sentimentBasis: NewsSentimentBasis;
  time: string;
  source: string;
  evidenceRef: string;
  publishedAt: string;
  url: string;
}

interface NewsCacheEntry {
  expiresAt: number;
  items: readonly ProjectedNewsItem[];
}

const newsCache = new Map<string, NewsCacheEntry>();

export function classifyNewsSentiment(headline: string, description: string): NewsSentiment {
  const text = `${headline || ''} ${description || ''}`.toLowerCase();
  if (POSITIVE_KEYWORDS.some(kw => text.includes(kw))) return 'positive';
  if (NEGATIVE_KEYWORDS.some(kw => text.includes(kw))) return 'negative';
  return 'neutral';
}

function normalizedSymbol(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const symbol = value.toUpperCase().trim();
  return /^[A-Z0-9.=-]{1,20}$/.test(symbol) ? symbol : null;
}

function normalizedLimit(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(MAX_NEWS_ITEMS, Math.max(1, Math.floor(parsed)));
}

function buildProviderQuery(symbol: string | null): string {
  if (symbol) return `"${symbol}" AND (market OR finance OR crypto OR earnings OR economy)`;
  return '("artificial intelligence" OR AI OR finance OR markets OR cryptocurrency OR fintech)';
}

function projectArticles(
  articles: readonly {
    title: string;
    description: string | null;
    sourceName: string;
    evidenceRef: string;
    publishedAt: string;
    url: string;
  }[],
): readonly ProjectedNewsItem[] {
  return Object.freeze(articles.map((article, index) => Object.freeze({
    id: `news_${index}_${encodeURIComponent(article.evidenceRef)}`,
    headline: article.title,
    summary: article.description || 'Keine detaillierte Beschreibung verfügbar.',
    sentiment: classifyNewsSentiment(article.title, article.description ?? ''),
    sentimentBasis: NEWS_SENTIMENT_BASIS,
    time: new Date(article.publishedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr',
    source: article.sourceName,
    evidenceRef: article.evidenceRef,
    publishedAt: article.publishedAt,
    url: article.url,
  })));
}

export const newsRouter = express.Router();

newsRouter.get('/', async (req, res) => {
  const symbol = normalizedSymbol(req.query.symbol);
  if (req.query.symbol !== undefined && !symbol) {
    return res.status(400).json({ status: 'INVALID_REQUEST', reason: 'Ungültiges Asset-Symbol.' });
  }

  const limit = normalizedLimit(req.query.limit);
  const query = buildProviderQuery(symbol);
  const cacheKey = `${query}|${limit}`;
  const now = Date.now();
  const cached = newsCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    res.setHeader('x-capital-ai-news-cache', 'hit');
    return res.json(cached.items.slice(0, limit));
  }

  const provider = new NewsApiEvidenceProvider();
  const result = await provider.searchEverything(query, Math.max(limit, 10));

  if (result.status !== 'VERIFIED') {
    return res.status(503).json({
      status: 'NO_DATA',
      source: 'NewsAPI',
      reason: result.reason ?? `NewsAPI Evidence ist nicht verfügbar (${result.status}).`,
    });
  }

  const items = projectArticles(result.articles.slice(0, MAX_NEWS_ITEMS));
  newsCache.set(cacheKey, { expiresAt: now + NEWS_CACHE_TTL_MS, items });
  res.setHeader('x-capital-ai-news-cache', 'miss');
  return res.json(items.slice(0, limit));
});
