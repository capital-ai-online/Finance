import { createHash } from 'node:crypto';
import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const FREE_CRYPTO_NEWS_PROVIDER_ID = 'free-crypto-news' as const;
export const FREE_CRYPTO_NEWS_BASE_URL = 'https://cryptocurrency.cv' as const;
export const FREE_CRYPTO_NEWS_CONTRACT_VERSION = 'free-crypto-news-evidence/1.0.0' as const;

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
 * Open-source, keyless crypto news aggregator (MIT, https://cryptocurrency.cv / nirholas).
 *
 * CAPITAL-AI projects article metadata and publisher URL only.
 * No publisher body is scraped or granted scoring authority.
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
    const limit = Math.min(50, Math.max(1, Math.floor(options.limit ?? 20)));
    const page = Math.max(1, Math.floor(options.page ?? 1));
    const source = options.source?.trim().toLowerCase() || null;
    const category = options.category?.trim().toLowerCase() || null;
    const query = options.query?.trim() || '';

    const params = new URLSearchParams({
      limit: String(limit),
      page: String(page),
    });
    if (source) params.set('source', source);
    if (category) params.set('category', category);

    // Prefer dedicated search endpoint when a free-text / asset query is present.
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
        reason: result.reason ?? 'Free Crypto News source unavailable.',
      });
    }

    const root = result.data as Record<string, unknown>;
    const raw = Array.isArray(root.articles)
      ? root.articles
      : (Array.isArray(root.data) ? root.data : []);
    const articles = raw
      .map(normalizedArticle)
      .filter((item): item is FreeCryptoNewsArticleEvidence => item !== null);

    if (articles.length === 0) {
      return Object.freeze({
        contractVersion: FREE_CRYPTO_NEWS_CONTRACT_VERSION,
        status: 'SOURCE_UNAVAILABLE',
        query: query || (source ? `source:${source}` : 'latest'),
        retrievedAt: result.retrievedAt,
        articles: Object.freeze([]),
        reason: 'Free Crypto News returned no usable article metadata.',
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
    const result = await this.http.requestJson('/api/sources');
    const retrievedAt = result.retrievedAt;
    if (result.status !== 'READY' || !result.data) {
      return {
        status: 'SOURCE_UNAVAILABLE',
        sources: Object.freeze([]),
        retrievedAt,
        reason: result.reason ?? 'Sources endpoint unavailable.',
      };
    }
    const root = result.data as Record<string, unknown>;
    let list: string[] = [];
    if (Array.isArray(root.sources)) {
      list = root.sources.map((s) => {
        if (typeof s === 'string') return s;
        if (s && typeof s === 'object' && typeof (s as any).name === 'string') return (s as any).name;
        if (s && typeof s === 'object' && typeof (s as any).key === 'string') return (s as any).key;
        return null;
      }).filter((x): x is string => Boolean(x));
    } else if (Array.isArray(root.data)) {
      list = root.data.filter((x): x is string => typeof x === 'string');
    }
    return {
      status: 'VERIFIED',
      sources: Object.freeze(list),
      retrievedAt,
    };
  }
}
