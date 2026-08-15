/**
 * SEO-ROADMAP-0001 / S1 — SeoEngine domain types.
 * Rank positions must come from Search Console (D5) or explicit manual import — never synthetic.
 */

export type KeywordLocale = 'de' | 'en';
export type KeywordIntent = 'informational' | 'commercial' | 'navigational' | 'transactional';

export interface SeoKeyword {
  id: string;
  phrase: string;
  locale: KeywordLocale;
  intent: KeywordIntent;
  /** Optional target path on capital-ai.online (no trailing slash except `/`). */
  targetPath?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeoRankSnapshot {
  id: string;
  keywordId: string;
  /** 1-based position when known; null = not ranking / unknown. */
  position: number | null;
  /** Source system — never "synthetic". */
  source: 'search-console' | 'manual-import';
  capturedAt: string;
  /** Optional GSC property or import batch id. */
  sourceRef?: string;
}

export type ContentInventoryStatus = 'draft' | 'published' | 'archived';

export interface SeoContentInventoryItem {
  id: string;
  path: string;
  title: string;
  primaryKeywordId?: string;
  status: ContentInventoryStatus;
  /** ISO date of last meaningful content change when known. */
  lastReviewedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKeywordInput {
  phrase: string;
  locale?: KeywordLocale;
  intent?: KeywordIntent;
  targetPath?: string;
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
  primaryKeywordId?: string;
  status?: ContentInventoryStatus;
  notes?: string;
}
