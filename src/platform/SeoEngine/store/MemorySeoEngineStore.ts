/**
 * SEO-GM-ROADMAP-0002 / WP-S1 — in-memory adapter (tests / local dev).
 * Ranks stay empty until explicit search-console | manual-import (No-Demo-Data).
 */
import { SEO_KEYWORD_SEED } from '../keywordSeed';
import type {
  CreateContentItemInput,
  CreateKeywordInput,
  CreateRankSnapshotInput,
  SeoContentInventoryItem,
  SeoEngineSnapshot,
  SeoKeyword,
  SeoRankSnapshot,
} from '../types';
import type { ISeoEngineStore } from './ISeoEngineStore';
import { stripTrailingSlashes } from '../../Security/safeIo';

export class MemorySeoEngineStore implements ISeoEngineStore {
  private keywords: SeoKeyword[] = [];
  private ranks: SeoRankSnapshot[] = [];
  private content: SeoContentInventoryItem[] = [];

  constructor(options?: { seed?: boolean }) {
    const seed = options?.seed !== false;
    if (!seed) return;

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
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'inv-impressum',
        path: '/impressum',
        title: 'Impressum – CAPITAL-AI',
        locale: 'de',
        status: 'published',
        lastReviewedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'inv-agb',
        path: '/agb',
        title: 'AGB – CAPITAL-AI',
        locale: 'de',
        status: 'published',
        lastReviewedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'inv-datenschutz',
        path: '/datenschutz',
        title: 'Datenschutzerklärung – CAPITAL-AI',
        locale: 'de',
        status: 'published',
        lastReviewedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  private nowIso(): string {
    return new Date().toISOString();
  }

  private newId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private normalizePath(pathname: string): string {
    return stripTrailingSlashes(pathname);
  }

  async listKeywords(activeOnly = true): Promise<SeoKeyword[]> {
    const rows = activeOnly ? this.keywords.filter((k) => k.active) : [...this.keywords];
    return rows.sort((a, b) => a.phrase.localeCompare(b.phrase));
  }

  async getKeyword(keywordId: string): Promise<SeoKeyword | undefined> {
    return this.keywords.find((k) => k.id === keywordId);
  }

  async addKeyword(input: CreateKeywordInput): Promise<SeoKeyword> {
    const phrase = String(input.phrase || '').trim().toLowerCase();
    if (!phrase) throw new Error('phrase is required');
    const locale = input.locale || 'de';
    const existing = this.keywords.find((k) => k.phrase === phrase && k.locale === locale);
    if (existing) return existing;
    const t = this.nowIso();
    const row: SeoKeyword = {
      id: this.newId('kw'),
      phrase,
      locale,
      intent: input.intent || 'informational',
      targetPath: input.targetPath ? this.normalizePath(input.targetPath) : '/',
      priority: input.priority ?? 100,
      active: true,
      notes: input.notes,
      createdAt: t,
      updatedAt: t,
    };
    this.keywords.push(row);
    return row;
  }

  async listContent(): Promise<SeoContentInventoryItem[]> {
    return [...this.content].sort((a, b) => a.path.localeCompare(b.path));
  }

  async addContentItem(input: CreateContentItemInput): Promise<SeoContentInventoryItem> {
    const pathNorm = this.normalizePath(String(input.path || ''));
    const title = String(input.title || '').trim();
    if (!title) throw new Error('title is required');
    const existing = this.content.find((c) => c.path === pathNorm);
    const t = this.nowIso();
    if (existing) {
      existing.title = title;
      existing.primaryKeywordId = input.primaryKeywordId ?? existing.primaryKeywordId;
      existing.status = input.status || existing.status;
      existing.locale = input.locale || existing.locale;
      existing.notes = input.notes ?? existing.notes;
      existing.updatedAt = t;
      return existing;
    }
    const row: SeoContentInventoryItem = {
      id: this.newId('ci'),
      path: pathNorm,
      title,
      locale: input.locale || 'de',
      primaryKeywordId: input.primaryKeywordId,
      status: input.status || 'draft',
      notes: input.notes,
      createdAt: t,
      updatedAt: t,
    };
    this.content.push(row);
    return row;
  }

  async listRanks(keywordId?: string): Promise<SeoRankSnapshot[]> {
    const rows = keywordId ? this.ranks.filter((r) => r.keywordId === keywordId) : [...this.ranks];
    return rows.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  }

  async addRankSnapshot(input: CreateRankSnapshotInput): Promise<SeoRankSnapshot> {
    if (!(await this.getKeyword(input.keywordId))) {
      throw new Error(`unknown keywordId: ${input.keywordId}`);
    }
    if (input.source !== 'search-console' && input.source !== 'manual-import') {
      throw new Error('source must be search-console or manual-import');
    }
    if (input.position !== null && input.position !== undefined) {
      const p = Number(input.position);
      if (!Number.isFinite(p) || p < 1 || p > 1000) {
        throw new Error('position must be null or an integer 1–1000');
      }
    }
    const row: SeoRankSnapshot = {
      id: this.newId('rk'),
      keywordId: input.keywordId,
      position:
        input.position === null || input.position === undefined
          ? null
          : Math.round(Number(input.position)),
      source: input.source,
      capturedAt: input.capturedAt || this.nowIso(),
      sourceRef: input.sourceRef,
    };
    this.ranks.push(row);
    return row;
  }

  async snapshot(): Promise<SeoEngineSnapshot> {
    return {
      keywords: await this.listKeywords(false),
      ranks: await this.listRanks(),
      content: await this.listContent(),
    };
  }

  /** Test helper — reset to seeded empty-rank state */
  resetForTests(): void {
    const fresh = new MemorySeoEngineStore();
    this.keywords = (fresh as unknown as { keywords: SeoKeyword[] }).keywords;
    this.ranks = (fresh as unknown as { ranks: SeoRankSnapshot[] }).ranks;
    this.content = (fresh as unknown as { content: SeoContentInventoryItem[] }).content;
  }
}
