/**
 * SEO-ROADMAP-0001 / S1 — in-memory store until Supabase migration is applied.
 * No fabricated rankings (No-Demo-Data).
 */
import type {
  CreateContentItemInput,
  CreateKeywordInput,
  CreateRankSnapshotInput,
  SeoContentInventoryItem,
  SeoKeyword,
  SeoRankSnapshot,
} from './types';

function nowIso(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function seedContent(): SeoContentInventoryItem[] {
  const t = nowIso();
  return [
    { id: 'ci_home', path: '/', title: 'CAPITAL-AI Portal', status: 'published', createdAt: t, updatedAt: t },
    { id: 'ci_impressum', path: '/impressum', title: 'Impressum – CAPITAL-AI', status: 'published', createdAt: t, updatedAt: t },
    { id: 'ci_agb', path: '/agb', title: 'AGB – CAPITAL-AI', status: 'published', createdAt: t, updatedAt: t },
    { id: 'ci_datenschutz', path: '/datenschutz', title: 'Datenschutzerklärung – CAPITAL-AI', status: 'published', createdAt: t, updatedAt: t },
  ];
}

function seedKeywords(): SeoKeyword[] {
  const t = nowIso();
  return [
    {
      id: 'kw_graham',
      phrase: 'benjamin graham calculator online',
      locale: 'en',
      intent: 'informational',
      targetPath: '/',
      notes: 'Primary targeted keyword from SEO checklist',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'kw_screener',
      phrase: 'quantitative investment screener',
      locale: 'en',
      intent: 'commercial',
      targetPath: '/',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: 'kw_dsgvo',
      phrase: 'dsgvo konforme trading software',
      locale: 'de',
      intent: 'commercial',
      targetPath: '/',
      createdAt: t,
      updatedAt: t,
    },
  ];
}

export class SeoEngineStore {
  private keywords: SeoKeyword[] = seedKeywords();
  private ranks: SeoRankSnapshot[] = [];
  private content: SeoContentInventoryItem[] = seedContent();

  listKeywords(): SeoKeyword[] {
    return [...this.keywords].sort((a, b) => a.phrase.localeCompare(b.phrase));
  }

  getKeyword(keywordId: string): SeoKeyword | undefined {
    return this.keywords.find((k) => k.id === keywordId);
  }

  addKeyword(input: CreateKeywordInput): SeoKeyword {
    const phrase = String(input.phrase || '').trim().toLowerCase();
    if (!phrase) throw new Error('phrase is required');
    const locale = input.locale || 'de';
    const existing = this.keywords.find((k) => k.phrase === phrase && k.locale === locale);
    if (existing) return existing;
    const t = nowIso();
    const row: SeoKeyword = {
      id: id('kw'),
      phrase,
      locale,
      intent: input.intent || 'informational',
      targetPath: input.targetPath ? normalizePath(input.targetPath) : undefined,
      notes: input.notes,
      createdAt: t,
      updatedAt: t,
    };
    this.keywords.push(row);
    return row;
  }

  listRankSnapshots(keywordId?: string): SeoRankSnapshot[] {
    const rows = keywordId ? this.ranks.filter((r) => r.keywordId === keywordId) : [...this.ranks];
    return rows.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  }

  addRankSnapshot(input: CreateRankSnapshotInput): SeoRankSnapshot {
    if (!this.getKeyword(input.keywordId)) {
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
      id: id('rk'),
      keywordId: input.keywordId,
      position: input.position === null || input.position === undefined ? null : Math.round(Number(input.position)),
      source: input.source,
      capturedAt: input.capturedAt || nowIso(),
      sourceRef: input.sourceRef,
    };
    this.ranks.push(row);
    return row;
  }

  listContent(): SeoContentInventoryItem[] {
    return [...this.content].sort((a, b) => a.path.localeCompare(b.path));
  }

  addContentItem(input: CreateContentItemInput): SeoContentInventoryItem {
    const pathNorm = normalizePath(String(input.path || ''));
    const title = String(input.title || '').trim();
    if (!title) throw new Error('title is required');
    const existing = this.content.find((c) => c.path === pathNorm);
    if (existing) {
      existing.title = title;
      existing.primaryKeywordId = input.primaryKeywordId ?? existing.primaryKeywordId;
      existing.status = input.status || existing.status;
      existing.notes = input.notes ?? existing.notes;
      existing.updatedAt = nowIso();
      return existing;
    }
    const t = nowIso();
    const row: SeoContentInventoryItem = {
      id: id('ci'),
      path: pathNorm,
      title,
      primaryKeywordId: input.primaryKeywordId,
      status: input.status || 'draft',
      notes: input.notes,
      createdAt: t,
      updatedAt: t,
    };
    this.content.push(row);
    return row;
  }

  resetForTests(): void {
    this.keywords = seedKeywords();
    this.ranks = [];
    this.content = seedContent();
  }
}

export const seoEngineStore = new SeoEngineStore();
