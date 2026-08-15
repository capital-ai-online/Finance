/**
 * SEO-GM-ROADMAP-0002 / WP-S1 — privileged Supabase adapter.
 * Uses getServerSupabase() only; no anon/publishable fallback (ADR-0043).
 * Schema columns only — domain notes/sourceRef are not persisted until a follow-up migration.
 */
import {
  assertPrivilegedSupabaseConfigured,
  getServerSupabase,
} from '../../../../server/db';
import type {
  CreateContentItemInput,
  CreateKeywordInput,
  CreateRankSnapshotInput,
  KeywordIntent,
  KeywordLocale,
  SeoContentInventoryItem,
  SeoEngineSnapshot,
  SeoKeyword,
  SeoRankSnapshot,
} from '../types';
import type { ISeoEngineStore } from './ISeoEngineStore';

interface KeywordRow {
  id: string;
  phrase: string;
  locale: string;
  intent: string;
  target_path: string;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface RankRow {
  id: string;
  keyword_id: string;
  captured_at: string;
  position: number | null;
  source: string;
  url: string | null;
}

interface ContentRow {
  id: string;
  path: string;
  title: string;
  locale: string;
  status: string;
  primary_keyword_id: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapKeyword(row: KeywordRow): SeoKeyword {
  return {
    id: String(row.id),
    phrase: row.phrase,
    locale: row.locale as KeywordLocale,
    intent: row.intent as KeywordIntent,
    targetPath: row.target_path,
    priority: row.priority,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRank(row: RankRow): SeoRankSnapshot {
  const source =
    row.source === 'search-console' || row.source === 'manual-import'
      ? row.source
      : (row.source as SeoRankSnapshot['source']);
  return {
    id: String(row.id),
    keywordId: String(row.keyword_id),
    capturedAt: row.captured_at,
    position: row.position,
    source,
    url: row.url ?? undefined,
  };
}

function mapContent(row: ContentRow): SeoContentInventoryItem {
  return {
    id: String(row.id),
    path: row.path,
    title: row.title,
    locale: row.locale as KeywordLocale,
    status: row.status as SeoContentInventoryItem['status'],
    primaryKeywordId: row.primary_keyword_id ? String(row.primary_keyword_id) : undefined,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export class SupabaseSeoEngineStore implements ISeoEngineStore {
  private client() {
    assertPrivilegedSupabaseConfigured('SeoEngine store');
    return getServerSupabase();
  }

  async listKeywords(activeOnly = true): Promise<SeoKeyword[]> {
    const supabase = this.client();
    let query = supabase.from('seo_keywords').select('*').order('phrase', { ascending: true });
    if (activeOnly) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) throw new Error(`seo_keywords list failed: ${error.message}`);
    return (data as KeywordRow[] | null)?.map(mapKeyword) ?? [];
  }

  async getKeyword(keywordId: string): Promise<SeoKeyword | undefined> {
    const supabase = this.client();
    const { data, error } = await supabase
      .from('seo_keywords')
      .select('*')
      .eq('id', keywordId)
      .maybeSingle();
    if (error) throw new Error(`seo_keywords get failed: ${error.message}`);
    return data ? mapKeyword(data as KeywordRow) : undefined;
  }

  async addKeyword(input: CreateKeywordInput): Promise<SeoKeyword> {
    const phrase = String(input.phrase || '').trim().toLowerCase();
    if (!phrase) throw new Error('phrase is required');
    const locale = input.locale || 'de';
    const supabase = this.client();

    const { data: existing, error: existingErr } = await supabase
      .from('seo_keywords')
      .select('*')
      .eq('phrase', phrase)
      .eq('locale', locale)
      .maybeSingle();
    if (existingErr) throw new Error(`seo_keywords lookup failed: ${existingErr.message}`);
    if (existing) return mapKeyword(existing as KeywordRow);

    const payload = {
      phrase,
      locale,
      intent: input.intent || 'informational',
      target_path: input.targetPath ? normalizePath(input.targetPath) : '/',
      priority: input.priority ?? 100,
      active: true,
    };
    const { data, error } = await supabase.from('seo_keywords').insert(payload).select('*').single();
    if (error || !data) throw new Error(`seo_keywords insert failed: ${error?.message || 'unknown'}`);
    return mapKeyword(data as KeywordRow);
  }

  async listContent(): Promise<SeoContentInventoryItem[]> {
    const supabase = this.client();
    const { data, error } = await supabase
      .from('seo_content_inventory')
      .select('*')
      .order('path', { ascending: true });
    if (error) throw new Error(`seo_content_inventory list failed: ${error.message}`);
    return (data as ContentRow[] | null)?.map(mapContent) ?? [];
  }

  async addContentItem(input: CreateContentItemInput): Promise<SeoContentInventoryItem> {
    const pathNorm = normalizePath(String(input.path || ''));
    const title = String(input.title || '').trim();
    if (!title) throw new Error('title is required');
    const supabase = this.client();

    const { data: existing, error: existingErr } = await supabase
      .from('seo_content_inventory')
      .select('*')
      .eq('path', pathNorm)
      .maybeSingle();
    if (existingErr) throw new Error(`seo_content_inventory lookup failed: ${existingErr.message}`);

    if (existing) {
      const row = existing as ContentRow;
      const update = {
        title,
        primary_keyword_id: input.primaryKeywordId ?? row.primary_keyword_id,
        status: input.status || row.status,
        locale: input.locale || row.locale,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('seo_content_inventory')
        .update(update)
        .eq('id', row.id)
        .select('*')
        .single();
      if (error || !data) throw new Error(`seo_content_inventory update failed: ${error?.message || 'unknown'}`);
      return mapContent(data as ContentRow);
    }

    const payload = {
      path: pathNorm,
      title,
      locale: input.locale || 'de',
      primary_keyword_id: input.primaryKeywordId || null,
      status: input.status || 'draft',
    };
    const { data, error } = await supabase
      .from('seo_content_inventory')
      .insert(payload)
      .select('*')
      .single();
    if (error || !data) throw new Error(`seo_content_inventory insert failed: ${error?.message || 'unknown'}`);
    return mapContent(data as ContentRow);
  }

  async listRanks(keywordId?: string): Promise<SeoRankSnapshot[]> {
    const supabase = this.client();
    let query = supabase
      .from('seo_rank_snapshots')
      .select('*')
      .order('captured_at', { ascending: false });
    if (keywordId) query = query.eq('keyword_id', keywordId);
    const { data, error } = await query;
    if (error) throw new Error(`seo_rank_snapshots list failed: ${error.message}`);
    return (data as RankRow[] | null)?.map(mapRank) ?? [];
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

    const payload = {
      keyword_id: input.keywordId,
      position:
        input.position === null || input.position === undefined
          ? null
          : Math.round(Number(input.position)),
      source: input.source,
      captured_at: input.capturedAt || new Date().toISOString(),
      url: null as string | null,
    };

    const supabase = this.client();
    const { data, error } = await supabase
      .from('seo_rank_snapshots')
      .insert(payload)
      .select('*')
      .single();
    if (error || !data) throw new Error(`seo_rank_snapshots insert failed: ${error?.message || 'unknown'}`);
    const mapped = mapRank(data as RankRow);
    if (input.sourceRef) mapped.sourceRef = input.sourceRef;
    return mapped;
  }

  async snapshot(): Promise<SeoEngineSnapshot> {
    return {
      keywords: await this.listKeywords(false),
      ranks: await this.listRanks(),
      content: await this.listContent(),
    };
  }
}
