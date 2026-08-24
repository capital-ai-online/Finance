// ARCH-AUDIT-0002 / SC-4: /api/news is a read-only product projection of external article
// metadata. cryptocurrency.cv public REST and GDELT DOC 2.0 are aggregated behind one
// evidence boundary. Publisher content is never fabricated, scraped into the product or
// granted scoring authority by this route.

import express from 'express';
import { assetRegistry, type RegistryAsset } from '../../lib/assetRegistry';
import { FreeCryptoNewsEvidenceProvider } from '../../platform/MarketData/providers/FreeCryptoNewsEvidenceProvider';
import { GdeltNewsEvidenceProvider } from '../../platform/MarketData/providers/GdeltNewsEvidenceProvider';
import { getVerifiedAssetDisplay } from '../../services/verifiedAssetDisplay';

export type NewsSentiment = 'positive' | 'negative' | 'neutral';
export type NewsSentimentBasis = 'heuristic';
export const NEWS_SENTIMENT_BASIS: NewsSentimentBasis = 'heuristic';

const POSITIVE_KEYWORDS = ['bullish', 'surge', 'gain', 'rise', 'rally', 'growth', 'beats', 'record high'];
const NEGATIVE_KEYWORDS = ['bearish', 'plummet', 'drop', 'fall', 'crash', 'risk', 'hack', 'misses', 'lawsuit'];
const NEWS_CACHE_TTL_MS = 5 * 60_000;
const MAX_NEWS_ITEMS = 20;
const PROVIDER_FETCH_LIMIT = 50;
const DEFAULT_LIMIT = 7;

type NewsAssetType = RegistryAsset['type'];

interface NewsAssetMeta {
  readonly symbol: string;
  readonly name: string;
  readonly type: NewsAssetType;
}

interface ProjectedNewsItem {
  readonly id: string;
  readonly headline: string;
  readonly summary: string;
  readonly sentiment: NewsSentiment;
  readonly sentimentBasis: NewsSentimentBasis;
  readonly time: string;
  readonly source: string;
  readonly evidenceRef: string;
  readonly publishedAt: string;
  readonly url: string;
  readonly provider: string;
  readonly assetSymbols: readonly string[];
  readonly assetClasses: readonly NewsAssetType[];
  readonly change24hPct?: number | null;
}

interface NewsCacheEntry {
  readonly expiresAt: number;
  readonly items: readonly ProjectedNewsItem[];
  readonly provider: string;
}

interface SourceCacheEntry {
  readonly expiresAt: number;
  readonly sources: readonly string[];
  readonly retrievedAt: string;
}

const newsCache = new Map<string, NewsCacheEntry>();
let sourceCache: SourceCacheEntry | null = null;

const NEWS_ASSETS: readonly NewsAssetMeta[] = Object.freeze(
  assetRegistry.getAssets()
    .map(asset => Object.freeze({ symbol: asset.symbol, name: asset.name, type: asset.type }))
    .sort((a, b) => a.type.localeCompare(b.type) || a.symbol.localeCompare(b.symbol)),
);

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
  const source = value.trim();
  return source.length > 0 && source.length <= 128 ? source : null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sourceKey(value: string): string {
  return value.trim().toLowerCase().replace(/^www\./, '');
}

function sourceMatches(itemSource: string, requestedSource: string): boolean {
  const item = sourceKey(itemSource);
  const requested = sourceKey(requestedSource);
  return item === requested || item.includes(requested) || requested.includes(item);
}

function gdeltDomainFilter(source: string | null): string {
  if (!source) return '';
  const candidate = sourceKey(source);
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(candidate) ? ` domainis:${candidate}` : '';
}

function getAssetMeta(symbol: string | null): NewsAssetMeta | null {
  if (!symbol) return null;
  const asset = assetRegistry.getAsset(symbol);
  return asset ? { symbol: asset.symbol, name: asset.name, type: asset.type } : null;
}

function detectAssets(headline: string, description = '', requestedSymbol: string | null = null): readonly NewsAssetMeta[] {
  if (requestedSymbol) {
    const requested = getAssetMeta(requestedSymbol);
    return requested ? Object.freeze([requested]) : Object.freeze([]);
  }

  const text = `${headline} ${description}`;
  const matches = NEWS_ASSETS.filter(asset => {
    const nameMatch = asset.name.length >= 4 && new RegExp(`\\b${escapeRegex(asset.name)}\\b`, 'i').test(text);
    const symbolMatch = asset.symbol.length >= 4 && new RegExp(`\\b${escapeRegex(asset.symbol)}\\b`, 'i').test(text);
    return nameMatch || symbolMatch;
  });
  return Object.freeze(matches.slice(0, 8));
}

function buildGdeltQuery(symbol: string | null, source: string | null = null): string {
  const sourceClause = gdeltDomainFilter(source);
  if (symbol) {
    const asset = getAssetMeta(symbol);
    const terms = asset && asset.name.toUpperCase() !== asset.symbol
      ? `("${asset.symbol}" OR "${asset.name.replace(/"/g, '')}")`
      : `"${symbol}"`;
    return `${terms} (market OR finance OR trading OR investment OR economy)${sourceClause}`;
  }
  return `("stock market" OR finance OR markets OR cryptocurrency OR forex OR commodities OR bonds OR "central bank")${sourceClause}`;
}

function projectFreeCryptoArticle(
  article: Awaited<ReturnType<FreeCryptoNewsEvidenceProvider['searchArticles']>>['articles'][number],
  requestedSymbol: string | null,
): ProjectedNewsItem {
  const assets = detectAssets(article.title, article.description ?? '', requestedSymbol);
  return Object.freeze({
    id: article.evidenceRef,
    headline: article.title,
    summary: article.description
      ?? 'Artikelmetadaten über cryptocurrency.cv Public REST; vollständiger Inhalt und Nutzungsrechte verbleiben beim Herausgeber.',
    sentiment: classifyNewsSentiment(article.title, article.description ?? ''),
    sentimentBasis: NEWS_SENTIMENT_BASIS,
    time: new Date(article.publishedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr',
    source: article.sourceName,
    evidenceRef: article.evidenceRef,
    publishedAt: article.publishedAt,
    url: article.url,
    provider: 'free-crypto-news',
    assetSymbols: Object.freeze(assets.map(asset => asset.symbol)),
    assetClasses: Object.freeze([...new Set(assets.map(asset => asset.type))]),
    change24hPct: null,
  });
}

function projectGdeltArticle(
  article: Awaited<ReturnType<GdeltNewsEvidenceProvider['searchArticles']>>['articles'][number],
  requestedSymbol: string | null,
): ProjectedNewsItem {
  const assets = detectAssets(article.title, '', requestedSymbol);
  return Object.freeze({
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
    assetSymbols: Object.freeze(assets.map(asset => asset.symbol)),
    assetClasses: Object.freeze([...new Set(assets.map(asset => asset.type))]),
    change24hPct: null,
  });
}

function mergeNewsItems(items: readonly ProjectedNewsItem[]): readonly ProjectedNewsItem[] {
  const byUrl = new Map<string, ProjectedNewsItem>();
  for (const item of items) {
    const key = item.url.trim().toLowerCase();
    const existing = byUrl.get(key);
    if (!existing || Date.parse(item.publishedAt) > Date.parse(existing.publishedAt)) {
      byUrl.set(key, item);
    }
  }
  return Object.freeze(
    [...byUrl.values()].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)),
  );
}

export const newsRouter = express.Router();

newsRouter.get('/', async (req, res) => {
  const rawAsset = req.query.asset ?? req.query.symbol; // symbol remains a backwards-compatible alias.
  const symbol = normalizedSymbol(rawAsset);
  if (rawAsset !== undefined && !symbol) {
    return res.status(400).json({ status: 'INVALID_REQUEST', reason: 'Ungültiges Asset-Symbol.' });
  }

  const asset = getAssetMeta(symbol);
  if (symbol && !asset) {
    return res.status(400).json({
      status: 'INVALID_REQUEST',
      reason: 'Asset ist nicht im kanonischen Enterprise-Universum registriert.',
    });
  }

  const source = normalizedSource(req.query.source);
  const limit = normalizedLimit(req.query.limit);
  const cacheKey = `aggregate|${symbol ?? 'all'}|${sourceKey(source ?? 'all')}|${limit}`;
  const now = Date.now();
  const cached = newsCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    res.setHeader('x-capital-ai-news-cache', 'hit');
    res.setHeader('x-capital-ai-news-provider', cached.provider);
    return res.json(cached.items.slice(0, limit));
  }

  const providerLimit = Math.min(PROVIDER_FETCH_LIMIT, Math.max(20, limit * 4));
  const gdelt = new GdeltNewsEvidenceProvider();
  const fcn = new FreeCryptoNewsEvidenceProvider();

  // The default feed is deliberately asset-independent: both providers are queried and merged.
  // An explicit asset filter narrows evidence afterwards; it never inherits the Enterprise Scorer selection implicitly.
  const tasks: Array<Promise<readonly ProjectedNewsItem[]>> = [
    gdelt.searchArticles(buildGdeltQuery(symbol, source), providerLimit, '1d').then(result => {
      if (result.status !== 'VERIFIED') return Object.freeze([]);
      return Object.freeze(result.articles.map(article => projectGdeltArticle(article, symbol)));
    }).catch(() => Object.freeze([])),
  ];

  if (!symbol || asset?.type === 'crypto') {
    tasks.push(
      fcn.searchArticles({
        query: asset?.type === 'crypto' ? asset.symbol : undefined,
        source: source ?? undefined,
        limit: providerLimit,
      }).then(result => {
        if (result.status !== 'VERIFIED') return Object.freeze([]);
        return Object.freeze(result.articles.map(article => projectFreeCryptoArticle(article, symbol)));
      }).catch(() => Object.freeze([])),
    );
  }

  const providerItems = (await Promise.all(tasks)).flat();
  let items = mergeNewsItems(providerItems);
  if (source) items = Object.freeze(items.filter(item => sourceMatches(item.source, source)));

  // Preserve one canonical market-data path: only an explicitly filtered crypto asset is
  // enriched, once per cache miss, through VerifiedAssetDisplay. Missing/unsupported 24h
  // evidence remains null rather than being estimated or copied from article providers.
  if (symbol && asset?.type === 'crypto' && items.length > 0) {
    const display = await getVerifiedAssetDisplay(symbol).catch(() => null);
    const change24hPct = display?.change24hPct;
    if (change24hPct != null && Number.isFinite(change24hPct)) {
      items = Object.freeze(items.map(item => Object.freeze({ ...item, change24hPct })));
    }
  }

  if (items.length === 0) {
    return res.status(503).json({
      status: 'NO_DATA',
      source: 'cryptocurrency.cv + GDELT DOC 2.0',
      reason: source
        ? `Keine verifizierten News-Evidence-Treffer für die Quelle "${source}" verfügbar.`
        : 'News-Evidence ist über die aktiven Provider derzeit nicht verfügbar.',
    });
  }

  const providers = [...new Set(items.map(item => item.provider))];
  const providerHeader = providers.length > 1 ? 'multi-provider' : providers[0] ?? 'news-evidence';
  newsCache.set(cacheKey, { expiresAt: now + NEWS_CACHE_TTL_MS, items, provider: providerHeader });
  res.setHeader('x-capital-ai-news-cache', 'miss');
  res.setHeader('x-capital-ai-news-provider', providerHeader);
  return res.json(items.slice(0, limit));
});

/** Sources are aggregated from the active provider set for the filter UI. */
newsRouter.get('/sources', async (_req, res) => {
  const now = Date.now();
  if (sourceCache && sourceCache.expiresAt > now) {
    return res.json({
      sources: sourceCache.sources,
      retrievedAt: sourceCache.retrievedAt,
      provider: 'multi-provider',
      providers: ['free-crypto-news', 'gdelt'],
      cache: 'hit',
    });
  }

  const fcn = new FreeCryptoNewsEvidenceProvider();
  const gdelt = new GdeltNewsEvidenceProvider();
  const [fcnResult, gdeltResult] = await Promise.all([
    fcn.listSources().catch(() => null),
    gdelt.searchArticles(buildGdeltQuery(null), PROVIDER_FETCH_LIMIT, '1d').catch(() => null),
  ]);

  const sourceNames = new Set<string>();
  if (fcnResult?.status === 'VERIFIED') {
    for (const name of fcnResult.sources) if (name.trim()) sourceNames.add(name.trim());
  }
  if (gdeltResult?.status === 'VERIFIED') {
    for (const article of gdeltResult.articles) if (article.sourceName.trim()) sourceNames.add(article.sourceName.trim());
  }

  const sources = Object.freeze([...sourceNames].sort((a, b) => a.localeCompare(b)));
  if (sources.length === 0) {
    return res.status(503).json({ status: 'NO_DATA', reason: 'Sources unavailable' });
  }

  const retrievedAt = new Date(now).toISOString();
  sourceCache = { expiresAt: now + NEWS_CACHE_TTL_MS, sources, retrievedAt };
  return res.json({
    sources,
    retrievedAt,
    provider: 'multi-provider',
    providers: ['free-crypto-news', 'gdelt'],
    cache: 'miss',
  });
});

/** Canonical Enterprise Scorer asset metadata used exclusively for Newsfeed filtering. */
newsRouter.get('/assets', (_req, res) => {
  return res.json({
    assets: NEWS_ASSETS,
    count: NEWS_ASSETS.length,
    source: 'assetRegistry',
  });
});
