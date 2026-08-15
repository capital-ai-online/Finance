/**
 * SEO-ROADMAP-0001 / S1 — SeoEngine domain types.
 * Rank positions only from Search Console (D5) or manual import — never synthetic.
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
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeoRankSnapshot {
  id: string;
  keywordId: string;
  capturedAt: string;
  /** 1-based SERP position; null = not observed */
  position: number | null;
  /** Runtime API uses search-console | manual-import; SQL draft may differ until DB wire-up. */
  source: 'search-console' | 'manual-import' | 'manual' | 'search_console';
  sourceRef?: string;
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
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SeoEngineSnapshot {
  keywords: SeoKeyword[];
  ranks: SeoRankSnapshot[];
  content: SeoContentInventoryItem[];
}

export interface CreateKeywordInput {
  phrase: string;
  locale?: KeywordLocale;
  intent?: KeywordIntent;
  targetPath?: string;
  priority?: number;
  notes?: string;
}

export interface CreateRankSnapshotInput {
  keywordId: string;
  position: number | null;
  source: 'search-console' | 'manual-import';
  sourceRef?: string;
  capturedAt?: string;
}

export interface CreateContentItemInput {
  path: string;
  title: string;
  locale?: KeywordLocale;
  primaryKeywordId?: string;
  status?: 'draft' | 'published' | 'archived';
  notes?: string;
}
