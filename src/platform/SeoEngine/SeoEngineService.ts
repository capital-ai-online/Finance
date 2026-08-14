import { SEO_KEYWORD_SEED } from './keywordSeed';
import type { SeoContentInventoryItem, SeoEngineSnapshot, SeoKeyword, SeoRankSnapshot } from './types';

/**
 * SEO-ROADMAP-0001 / S1 — in-process SeoEngine (read-only scaffold).
 * Persistence via Supabase lands with migration `supabase/migrations/*_seo_engine.sql`.
 * Rankings are never invented: empty until Search Console / manual import (D5/H3).
 */
export class SeoEngineService {
  private keywords: SeoKeyword[] = [];
  private ranks: SeoRankSnapshot[] = [];
  private content: SeoContentInventoryItem[] = [];

  constructor() {
    const now = new Date().toISOString();
    this.keywords = SEO_KEYWORD_SEED.map((k, i) => ({
      ...k,
      id: `seed-kw-${i + 1}`,
      createdAt: now,
      updatedAt: now,
    }));
    this.content = [
      {
        id: 'inv-home',
        path: '/',
        title: 'CAPITAL-AI Portal',
        locale: 'de',
        status: 'published',
        lastReviewedAt: now,
      },
      {
        id: 'inv-impressum',
        path: '/impressum',
        title: 'Impressum – CAPITAL-AI',
        locale: 'de',
        status: 'published',
        lastReviewedAt: now,
      },
      {
        id: 'inv-agb',
        path: '/agb',
        title: 'AGB – CAPITAL-AI',
        locale: 'de',
        status: 'published',
        lastReviewedAt: now,
      },
      {
        id: 'inv-datenschutz',
        path: '/datenschutz',
        title: 'Datenschutzerklärung – CAPITAL-AI',
        locale: 'de',
        status: 'published',
        lastReviewedAt: now,
      },
    ];
  }

  listKeywords(activeOnly = true): SeoKeyword[] {
    return activeOnly ? this.keywords.filter((k) => k.active) : [...this.keywords];
  }

  listContent(): SeoContentInventoryItem[] {
    return [...this.content];
  }

  /** Rank history is empty until an external source is connected (honest empty state). */
  listRanks(): SeoRankSnapshot[] {
    return [...this.ranks];
  }

  snapshot(): SeoEngineSnapshot {
    return {
      keywords: this.listKeywords(false),
      ranks: this.listRanks(),
      content: this.listContent(),
    };
  }
}

export const seoEngine = new SeoEngineService();
