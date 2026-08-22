import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const NEWS_API_PROVIDER_ID = 'newsapi' as const;
export const NEWS_API_BASE_URL = 'https://newsapi.org/v2' as const;
export const NEWS_API_EVIDENCE_CONTRACT_VERSION = 'newsapi-article-evidence/1.0.0' as const;

export type NewsApiEvidenceStatus = 'VERIFIED' | 'NOT_CONFIGURED' | 'SOURCE_UNAVAILABLE' | 'INVALID';

export interface NewsApiArticleEvidence {
  readonly sourceName: string;
  readonly author: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly url: string;
  readonly publishedAt: string;
  readonly evidenceRef: string;
}

export interface NewsApiEvidenceResult {
  readonly contractVersion: typeof NEWS_API_EVIDENCE_CONTRACT_VERSION;
  readonly status: NewsApiEvidenceStatus;
  readonly query: string;
  readonly retrievedAt: string;
  readonly articles: readonly NewsApiArticleEvidence[];
  readonly reason?: string;
}

export interface NewsApiEvidenceProviderOptions {
  readonly apiKey?: string | null;
  readonly env?: NodeJS.ProcessEnv;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly baseUrl?: string;
}

function validApiKey(value: string | null | undefined): string | null {
  const candidate = value?.trim() ?? '';
  if (!candidate || candidate.startsWith('MY_') || candidate.toLowerCase().includes('test') || candidate.length <= 5) return null;
  return candidate;
}

function failure(
  status: NewsApiEvidenceStatus,
  query: string,
  retrievedAt: string,
  reason: string,
): NewsApiEvidenceResult {
  return Object.freeze({
    contractVersion: NEWS_API_EVIDENCE_CONTRACT_VERSION,
    status,
    query,
    retrievedAt,
    articles: Object.freeze([]),
    reason,
  });
}

function normalizeArticle(value: unknown): NewsApiArticleEvidence | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const title = typeof item.title === 'string' ? item.title.trim() : '';
  const url = typeof item.url === 'string' ? item.url.trim() : '';
  const published = typeof item.publishedAt === 'string' ? Date.parse(item.publishedAt) : Number.NaN;
  if (!title || !url || !/^https?:\/\//i.test(url) || !Number.isFinite(published)) return null;
  const source = item.source && typeof item.source === 'object' ? item.source as Record<string, unknown> : null;
  const sourceName = typeof source?.name === 'string' && source.name.trim() ? source.name.trim() : 'unknown';
  const publishedAt = new Date(published).toISOString();
  return Object.freeze({
    sourceName,
    author: typeof item.author === 'string' && item.author.trim() ? item.author.trim() : null,
    title,
    description: typeof item.description === 'string' && item.description.trim() ? item.description.trim() : null,
    url,
    publishedAt,
    evidenceRef: `newsapi:${encodeURIComponent(sourceName)}:${publishedAt}:${encodeURIComponent(url)}`,
  });
}

/** Raw article evidence only. No NLP/sentiment classification is performed here. */
export class NewsApiEvidenceProvider {
  private readonly http: ResearchEvidenceProviderHttp;

  constructor(options: NewsApiEvidenceProviderOptions = {}) {
    const env = options.env ?? process.env;
    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? NEWS_API_BASE_URL,
      apiKey: validApiKey(options.apiKey ?? env.NEWS_API_KEY),
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: options.nowMs,
      authHeaders: (apiKey) => ({ 'X-Api-Key': apiKey }),
    };
    this.http = new ResearchEvidenceProviderHttp(NEWS_API_PROVIDER_ID, 'news', transport);
  }

  public async searchEverything(queryInput: string, pageSize = 20): Promise<NewsApiEvidenceResult> {
    const query = queryInput.trim();
    if (!query || query.length > 500) {
      return failure('INVALID', query, new Date().toISOString(), 'NewsAPI query must contain 1..500 characters.');
    }
    const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));
    const result = await this.http.requestJson(
      `/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${safePageSize}&language=en`,
    );
    if (result.status !== 'READY') {
      return failure(
        result.status === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'SOURCE_UNAVAILABLE',
        query,
        result.retrievedAt,
        result.reason ?? 'NewsAPI source unavailable.',
      );
    }
    if (!result.data || typeof result.data !== 'object') {
      return failure('INVALID', query, result.retrievedAt, 'NewsAPI response is not an object.');
    }
    const root = result.data as Record<string, unknown>;
    if (root.status !== 'ok' || !Array.isArray(root.articles)) {
      return failure('INVALID', query, result.retrievedAt, 'NewsAPI response has invalid status/articles schema.');
    }
    const articles = root.articles
      .map(normalizeArticle)
      .filter((article): article is NewsApiArticleEvidence => article !== null);
    if (articles.length === 0) {
      return failure('SOURCE_UNAVAILABLE', query, result.retrievedAt, 'NewsAPI returned no valid articles for this query.');
    }
    return Object.freeze({
      contractVersion: NEWS_API_EVIDENCE_CONTRACT_VERSION,
      status: 'VERIFIED',
      query,
      retrievedAt: result.retrievedAt,
      articles: Object.freeze(articles),
    });
  }
}
