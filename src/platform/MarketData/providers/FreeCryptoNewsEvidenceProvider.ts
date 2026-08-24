import { createHash } from 'node:crypto';
import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const FREE_CRYPTO_NEWS_PROVIDER_ID = 'free-crypto-news' as const;
export const FREE_CRYPTO_NEWS_BASE_URL = 'https://cryptocurrency.cv' as const;
export const FREE_CRYPTO_NEWS_CONTRACT_VERSION = 'free-crypto-news-evidence/1.1.0' as const;

export type FreeCryptoNewsStatus = 'VERIFIED' | 'SOURCE_UNAVAILABLE' | 'INVALID';

export interface FreeCryptoNewsArticleEvidence {
  readonly title: string;
  readonly url: string;
  readonly sourceName: string;
  readonly sourceKey: string | null;
  readonly description: string | null;
  readonly category: string | null;
  readonly publishedAt: string;
  readonly evidenceRef: string;
}

export interface FreeCryptoNewsEvidenceResult {
  readonly contractVersion: typeof FREE_CRYPTO_NEWS_CONTRACT_VERSION;
  readonly status: FreeCryptoNewsStatus;
  readonly query: string;
  readonly retrievedAt: string;
  readonly articles: readonly FreeCryptoNewsArticleEvidence[];
  readonly reason?: string;
  readonly sources?: readonly string[];
}

export interface FreeCryptoNewsEvidenceProviderOptions {
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly baseUrl?: string;
}

function parsePubDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Date.parse(value.trim());
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function stableEvidenceRef(url: string, publishedAt: string): string {
  const digest = createHash('sha256').update(`${url}|${publishedAt}`).digest('hex').slice(0, 24);
  return `free-crypto-news:doc:${digest}`;
}

function normalizedSourceIdentity(value: string): string {
  return value.trim().toLowerCase().replace(/^www\./, '').replace(/[^a-z0-9]+/g, '');
}

function articleMatchesSource(article: FreeCryptoNewsArticleEvidence, requestedSource: string): boolean {
  const requested = normalizedSourceIdentity(requestedSource);
  if (!requested) return false;
  const candidates = [article.sourceName, article.sourceKey ?? '']
    .map(normalizedSourceIdentity)
    .filter(Boolean);
  return candidates.includes(requested);
}

function normalizedArticle(value: unknown): FreeCryptoNewsArticleEvidence | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const title = typeof item.title === 'string' ? item.title.trim() : '';
  const urlRaw = typeof item.link === 'string' ? item.link.trim() : (typeof item.url === 'string' ? item.url.trim() : '');
  const publishedAt = parsePubDate(item.pubDate ?? item.publishedAt ?? item.published_on);
  if (!title || !/^https?:\/\//i.test(urlRaw) || !publishedAt) return null;

  const sourceName = typeof item.source === 'string' && item.source.trim()
    ? item.source.trim()
    : (() => {
        try { return new URL(urlRaw).hostname; } catch { return 'crypto-news'; }
      })();

  const sourceKey = typeof item.sourceKey === 'string' && item.sourceKey.trim()
    ? item.sourceKey.trim().toLowerCase()
    : null;

  const description = typeof item.description === 'string' && item.description.trim()
    ? item.description.trim()
    : null;

  const category = typeof item.category === 'string' && item.category.trim()
    ? item.category.trim()
    : null;

  return Object.freeze({
    title,
    url: urlRaw,
    sourceName,
    sourceKey,
    description,
    category,
    publishedAt,
    evidenceRef: stableEvidenceRef(urlRaw, publishedAt),
  });
}

/**
 * Public, keyless cryptocurrency.cv article-metadata API.
 *
 * CAPITAL-AI projects article metadata and publisher URL only. The upstream
 * software license is not used as a source-use claim and publisher bodies are
 * neither scraped nor granted scoring authority.
 */
export class FreeCryptoNewsEvidenceProvider {
  private readonly http: ResearchEvidenceProviderHttp;

  constructor(options: FreeCryptoNewsEvidenceProviderOptions = {}) {
    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? FREE_CRYPTO_NEWS_BASE_URL,
      apiKey: null,
      apiKeyRequired: false,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs ?? 10_000,
      nowMs: options.nowMs,
    };
    this.http = new ResearchEvidenceProviderHttp(FREE_CRYPTO_NEWS_PROVIDER_ID, 'news', transport);
  }

  public async searchArticles(options: {
    query?: string;
    source?: string;
    category?: string;
    limit?: number;
    page?: number;
  } = {}): Promise<FreeCryptoNewsEvidenceResult> {
    const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 20)));
    const page = Math.max(1, Math.floor(options.page ?? 1));
    const source = options.source?.trim() || null;
    const category = options.category?.trim().toLowerCase() || null;
    const query = options.query?.trim() || '';

    const params = new URLSearchParams({
      limit: String(limit),
      page: String(page),
    });
    if (category) params.set('category', category);

    // Upstream source= accepts an internal RSS key (for example "coindesk"),
    // while CAPITAL-AI exposes publisher display names to users. Do not couple
    // the UI contract to that private key space: fetch public metadata first and
    // apply the bounded source filter locally against sourceName/sourceKey.
    const path = query
      ? `/api/search?q=${encodeURIComponent(query)}&${params.toString()}`
      : `/api/news?${params.toString()}`;

    const result = await this.http.requestJson(path);
    if (result.status !== 'READY' || !result.data || typeof result.data !== 'object') {
      return Object.freeze({
        contractVersion: FREE_CRYPTO_NEWS_CONTRACT_VERSION,
        status: 'SOURCE_UNAVAILABLE',
        query: query || (source ? `source:${source}` : 'latest'),
        retrievedAt: result.retrievedAt,
        articles: Object.freeze([]),
        reason: result.reason ?? 'cryptocurrency.cv source unavailable.',
      });
    }

    const root = result.data as Record<string, unknown>;
    const raw = Array.isArray(root.articles)
      ? root.articles
      : (Array.isArray(root.data) ? root.data : []);
    const normalizedArticles = raw
      .map(normalizedArticle)
      .filter((item): item is FreeCryptoNewsArticleEvidence => item !== null);
    const articles = source
      ? normalizedArticles.filter(article => articleMatchesSource(article, source))
      : normalizedArticles;

    if (articles.length === 0) {
      return Object.freeze({
        contractVersion: FREE_CRYPTO_NEWS_CONTRACT_VERSION,
        status: 'SOURCE_UNAVAILABLE',
        query: query || (source ? `source:${source}` : 'latest'),
        retrievedAt: result.retrievedAt,
        articles: Object.freeze([]),
        reason: source
          ? `cryptocurrency.cv returned no usable article metadata for source ${source}.`
          : 'cryptocurrency.cv returned no usable article metadata.',
      });
    }

    const sources = Array.isArray(root.sources)
      ? root.sources.filter((s): s is string => typeof s === 'string')
      : undefined;

    return Object.freeze({
      contractVersion: FREE_CRYPTO_NEWS_CONTRACT_VERSION,
      status: 'VERIFIED',
      query: query || (source ? `source:${source}` : 'latest'),
      retrievedAt: result.retrievedAt,
      articles: Object.freeze(articles),
      sources: sources ? Object.freeze(sources) : undefined,
    });
  }

  public async listSources(): Promise<{ status: FreeCryptoNewsStatus; sources: readonly string[]; retrievedAt: string; reason?: string }> {
    // The upstream /api/sources catalog currently requires a short-lived HMAC
    // token. CAPITAL-AI deliberately introduces no new credential or payment
    // path here; source-filter metadata is derived from the same public article
    // evidence already consumed by the newsfeed.
    const result = await this.searchArticles({ limit: 100 });
    if (result.status !== 'VERIFIED') {
      return {
        status: 'SOURCE_UNAVAILABLE',
        sources: Object.freeze([]),
        retrievedAt: result.retrievedAt,
        reason: result.reason ?? 'Public source metadata unavailable.',
      };
    }

    const sources = [...new Set(result.articles.map(article => article.sourceName.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    if (sources.length === 0) {
      return {
        status: 'SOURCE_UNAVAILABLE',
        sources: Object.freeze([]),
        retrievedAt: result.retrievedAt,
        reason: 'Public article evidence contained no usable source names.',
      };
    }

    return {
      status: 'VERIFIED',
      sources: Object.freeze(sources),
      retrievedAt: result.retrievedAt,
    };
  }
}
