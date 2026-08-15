/**
 * SEO-ROADMAP-0001 / S1 — SeoEngine domain types.
 * Full ADR pending owner number assignment (see docs/adr/ADR-DRAFT-seo-engine-platform-module.md).
 */

export type KeywordIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';

export type KeywordLocale = 'de' | 'en';

export interface SeoKeyword {
  id: string;
  phrase: string;
  locale: KeywordLocale;
  intent: KeywordIntent;
  /** Target public path, e.g. `/` or future landing pages */
  targetPath: string;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeoRankSnapshot {
  id: string;
  keywordId: string;
  capturedAt: string;
  /** 1-based SERP position; null = not observed */
  position: number | null;
  source: 'manual' | 'search_console' | 'estimated';
  url?: string;
}

export interface SeoContentInventoryItem {
  id: string;
  path: string;
  title: string;
  locale: KeywordLocale;
  status: 'draft' | 'published' | 'archived';
  primaryKeywordId?: string;
  lastReviewedAt?: string;
}

export interface SeoEngineSnapshot {
  keywords: SeoKeyword[];
  ranks: SeoRankSnapshot[];
  content: SeoContentInventoryItem[];
}
