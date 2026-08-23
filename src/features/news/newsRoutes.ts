// ARCH-AUDIT-0002 / SC-4: /api/news is a read-only product projection of external article
// metadata. Free Crypto News (open-source MIT, keyless REST) is the primary crypto source;
// GDELT DOC 2.0 remains the keyless discovery fallback. Publisher content is never fabricated,
// scraped into the product or granted scoring authority by this route.

import express from 'express';
import { FreeCryptoNewsEvidenceProvider } from '../../platform/MarketData/providers/FreeCryptoNewsEvidenceProvider';
import { GdeltNewsEvidenceProvider } from '../../platform/MarketData/providers/GdeltNewsEvidenceProvider';

export type NewsSentiment = 'positive' | 'negative' | 'neutral';
export type NewsSentimentBasis = 'heuristic';
export const NEWS_SENTIMENT_BASIS: NewsSentimentBasis = 'heuristic';

const POSITIVE_KEYWORDS = ['bullish', 'surge', 'gain', 'rise', 'rally', 'growth', 'beats', 'record high'];
const NEGATIVE_KEYWORDS = ['bearish', 'plummet', 'drop', 'fall', 'crash', 'risk', 'hack', 'misses', 'lawsuit'];
const NEWS_CACHE_TTL_MS = 5 * 60_000;
const MAX_NEWS_ITEMS = 20;
const DEFAULT_LIMIT = 7;

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
  provider: string;
  change24hPct?: number | null;
}

interface NewsCacheEntry {
  expiresAt: number;
  items: readonly ProjectedNewsItem[];
  provider: string;
}

const newsCache = new Map<string, NewsCacheEntry>();

export function classifyNewsSentiment(headline: string, description = ''): NewsSentiment {
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
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(MAX_NEWS_ITEMS, Math.max(1, Math.floor(parsed)));
}

function normalizedSource(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const source = value.trim().toLowerCase();
  return source.length > 0 && source.length <= 64 ? source : null;
}

function buildGdeltQuery(symbol: string | null): string {
  if (symbol) return `"${symbol}" (crypto OR cryptocurrency OR market OR finance)`;
  return '("artificial intelligence" OR fintech OR finance OR markets OR cryptocurrency)';
}

export const newsRouter = express.Router();

newsRouter.get('/', async (req, res) => {
  const symbol = normalizedSymbol(req.query.symbol);
  if (req.query.symbol !== undefined && !symbol) {
    return res.status(400).json({ status: 'INVALID_REQUEST', reason: 'Ungültiges Asset-Symbol.' });
  }

  const source = normalizedSource(req.query.source);
  const limit = normalizedLimit(req.query.limit);
  const preferCrypto = !symbol || /^[A-Z0-9]{2,10}$/.test(symbol); // crypto-like symbols prefer open-source feed

  const cacheKey = `fcn|${symbol ?? ''}|${source ?? ''}|${limit}`;
  const now = Date.now();
  const cached = newsCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    res.setHeader('x-capital-ai-news-cache', 'hit');
    res.setHeader('x-capital-ai-news-provider', cached.provider);
    return res.json(cached.items.slice(0, limit));
  }

  // 1) Primary: open-source Free Crypto News (REST, keyless, MIT)
  if (preferCrypto) {
    try {
      const fcn = new FreeCryptoNewsEvidenceProvider();
      const result = await fcn.searchArticles({
        query: symbol ?? undefined,
        source: source ?? undefined,
        limit: Math.max(limit, 10),
      });

      if (result.status === 'VERIFIED' && result.articles.length > 0) {
        const items: readonly ProjectedNewsItem[] = Object.freeze(
          result.articles.slice(0, MAX_NEWS_ITEMS).map(article => Object.freeze({
            id: article.evidenceRef,
            headline: article.title,
            summary: article.description
              ?? 'Artikelmetadaten über Free Crypto News (open-source); vollständiger Inhalt und Nutzungsrechte verbleiben beim Herausgeber.',
            sentiment: classifyNewsSentiment(article.title, article.description ?? ''),
            sentimentBasis: NEWS_SENTIMENT_BASIS,
            time: new Date(article.publishedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr',
            source: article.sourceName,
            evidenceRef: article.evidenceRef,
            publishedAt: article.publishedAt,
            url: article.url,
            provider: 'free-crypto-news',
            change24hPct: null, // enriched client-side or via separate quote path when available
          })),
        );

        newsCache.set(cacheKey, { expiresAt: now + NEWS_CACHE_TTL_MS, items, provider: 'free-crypto-news' });
        res.setHeader('x-capital-ai-news-cache', 'miss');
        res.setHeader('x-capital-ai-news-provider', 'free-crypto-news');
        return res.json(items.slice(0, limit));
      }
    } catch {
      // fall through to GDELT
    }
  }

  // 2) Fallback: GDELT DOC 2.0 (keyless, multi-asset)
  const query = buildGdeltQuery(symbol);
  const gdeltCacheKey = `gdelt|${query}|${limit}`;
  const gdeltCached = newsCache.get(gdeltCacheKey);
  if (gdeltCached && gdeltCached.expiresAt > now) {
    res.setHeader('x-capital-ai-news-cache', 'hit');
    res.setHeader('x-capital-ai-news-provider', 'gdelt');
    return res.json(gdeltCached.items.slice(0, limit));
  }

  const provider = new GdeltNewsEvidenceProvider();
  const result = await provider.searchArticles(query, Math.max(limit, 10), '1d');

  if (result.status !== 'VERIFIED') {
    return res.status(503).json({
      status: 'NO_DATA',
      source: 'free-crypto-news + GDELT DOC 2.0',
      reason: result.reason ?? `News-Evidence ist nicht verfügbar (${result.status}).`,
    });
  }

  const items: readonly ProjectedNewsItem[] = Object.freeze(result.articles.slice(0, MAX_NEWS_ITEMS).map(article => Object.freeze({
    id: article.evidenceRef,
    headline: article.title,
    summary: 'Artikelmetadaten über GDELT; vollständiger Inhalt und Nutzungsrechte verbleiben beim Herausgeber.',
    sentiment: classifyNewsSentiment(article.title),
    sentimentBasis: NEWS_SENTIMENT_BASIS,
    time: new Date(article.publishedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr',
    source: article.sourceName,
    evidenceRef: article.evidenceRef,
    publishedAt: article.publishedAt,
    url: article.url,
    provider: 'gdelt',
    change24hPct: null,
  })));

  newsCache.set(gdeltCacheKey, { expiresAt: now + NEWS_CACHE_TTL_MS, items, provider: 'gdelt' });
  res.setHeader('x-capital-ai-news-cache', 'miss');
  res.setHeader('x-capital-ai-news-provider', 'gdelt');
  return res.json(items.slice(0, limit));
});

/** Optional sources list for filter UI (primary open-source feed). */
newsRouter.get('/sources', async (_req, res) => {
  try {
    const fcn = new FreeCryptoNewsEvidenceProvider();
    const result = await fcn.listSources();
    if (result.status !== 'VERIFIED') {
      return res.status(503).json({ status: 'NO_DATA', reason: result.reason ?? 'Sources unavailable' });
    }
    return res.json({ sources: result.sources, retrievedAt: result.retrievedAt, provider: 'free-crypto-news' });
  } catch (error) {
    return res.status(503).json({
      status: 'NO_DATA',
      reason: error instanceof Error ? error.message : String(error),
    });
  }
});
