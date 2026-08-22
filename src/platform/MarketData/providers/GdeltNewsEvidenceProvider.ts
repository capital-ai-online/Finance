import { createHash } from 'node:crypto';
import { ResearchEvidenceProviderHttp, type ResearchEvidenceProviderHttpOptions } from './ResearchEvidenceProviderHttp';

export const GDELT_PROVIDER_ID = 'gdelt' as const;
export const GDELT_BASE_URL = 'https://api.gdeltproject.org/api/v2/doc' as const;
export const GDELT_NEWS_CONTRACT_VERSION = 'gdelt-news-evidence/1.0.0' as const;

export type GdeltNewsStatus = 'VERIFIED' | 'SOURCE_UNAVAILABLE' | 'INVALID';

export interface GdeltArticleEvidence {
  readonly title: string;
  readonly url: string;
  readonly sourceName: string;
  readonly language: string | null;
  readonly sourceCountry: string | null;
  readonly publishedAt: string;
  readonly evidenceRef: string;
}

export interface GdeltNewsEvidenceResult {
  readonly contractVersion: typeof GDELT_NEWS_CONTRACT_VERSION;
  readonly status: GdeltNewsStatus;
  readonly query: string;
  readonly retrievedAt: string;
  readonly articles: readonly GdeltArticleEvidence[];
  readonly reason?: string;
}

export interface GdeltNewsEvidenceProviderOptions {
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly nowMs?: () => number;
  readonly baseUrl?: string;
}

function parseSeenDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const text = value.trim();
  const compact = text.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (compact) {
    const iso = `${compact[1]}-${compact[2]}-${compact[3]}T${compact[4]}:${compact[5]}:${compact[6]}Z`;
    return Number.isNaN(Date.parse(iso)) ? null : iso;
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function stableEvidenceRef(url: string, publishedAt: string): string {
  const digest = createHash('sha256').update(`${url}|${publishedAt}`).digest('hex').slice(0, 24);
  return `gdelt:doc:${digest}`;
}

function normalizedArticle(value: unknown): GdeltArticleEvidence | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const title = typeof item.title === 'string' ? item.title.trim() : '';
  const url = typeof item.url === 'string' ? item.url.trim() : '';
  const publishedAt = parseSeenDate(item.seendate);
  if (!title || !/^https?:\/\//i.test(url) || !publishedAt) return null;

  let sourceName = typeof item.domain === 'string' ? item.domain.trim() : '';
  if (!sourceName) {
    try { sourceName = new URL(url).hostname; } catch { sourceName = 'GDELT source'; }
  }

  return Object.freeze({
    title,
    url,
    sourceName,
    language: typeof item.language === 'string' && item.language.trim() ? item.language.trim() : null,
    sourceCountry: typeof item.sourcecountry === 'string' && item.sourcecountry.trim() ? item.sourcecountry.trim() : null,
    publishedAt,
    evidenceRef: stableEvidenceRef(url, publishedAt),
  });
}

/**
 * Keyless, read-only article discovery through GDELT DOC 2.0.
 *
 * CAPITAL-AI projects article metadata and the publisher URL only. This adapter neither fetches
 * publisher article bodies nor grants republication rights over publisher content.
 */
export class GdeltNewsEvidenceProvider {
  private readonly http: ResearchEvidenceProviderHttp;

  constructor(options: GdeltNewsEvidenceProviderOptions = {}) {
    const transport: ResearchEvidenceProviderHttpOptions = {
      baseUrl: options.baseUrl ?? GDELT_BASE_URL,
      apiKey: null,
      apiKeyRequired: false,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      nowMs: options.nowMs,
    };
    this.http = new ResearchEvidenceProviderHttp(GDELT_PROVIDER_ID, 'news', transport);
  }

  public async searchArticles(queryInput: string, maxRecords = 20, timespan = '1d'): Promise<GdeltNewsEvidenceResult> {
    const query = queryInput.trim();
    const limit = Math.min(50, Math.max(1, Math.floor(maxRecords)));
    if (!query || query.length > 400) {
      return Object.freeze({
        contractVersion: GDELT_NEWS_CONTRACT_VERSION,
        status: 'INVALID',
        query,
        retrievedAt: new Date().toISOString(),
        articles: Object.freeze([]),
        reason: 'GDELT query must contain 1-400 characters.',
      });
    }
    if (!/^\d+(min|h|d|week|weeks|month|months)$/i.test(timespan)) {
      return Object.freeze({
        contractVersion: GDELT_NEWS_CONTRACT_VERSION,
        status: 'INVALID',
        query,
        retrievedAt: new Date().toISOString(),
        articles: Object.freeze([]),
        reason: 'GDELT timespan is outside the governed relative-time format.',
      });
    }

    const path = `/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=${limit}&timespan=${encodeURIComponent(timespan)}&sort=datedesc&format=json`;
    const result = await this.http.requestJson(path);
    if (result.status !== 'READY' || !result.data || typeof result.data !== 'object') {
      return Object.freeze({
        contractVersion: GDELT_NEWS_CONTRACT_VERSION,
        status: 'SOURCE_UNAVAILABLE',
        query,
        retrievedAt: result.retrievedAt,
        articles: Object.freeze([]),
        reason: result.reason ?? 'GDELT DOC 2.0 source unavailable.',
      });
    }

    const root = result.data as Record<string, unknown>;
    const raw = Array.isArray(root.articles) ? root.articles : [];
    const articles = raw.map(normalizedArticle).filter((item): item is GdeltArticleEvidence => item !== null);
    if (articles.length === 0) {
      return Object.freeze({
        contractVersion: GDELT_NEWS_CONTRACT_VERSION,
        status: 'SOURCE_UNAVAILABLE',
        query,
        retrievedAt: result.retrievedAt,
        articles: Object.freeze([]),
        reason: 'GDELT returned no usable article metadata for the governed query.',
      });
    }

    return Object.freeze({
      contractVersion: GDELT_NEWS_CONTRACT_VERSION,
      status: 'VERIFIED',
      query,
      retrievedAt: result.retrievedAt,
      articles: Object.freeze(articles),
    });
  }
}
