/**
 * SEO-GM-ROADMAP-0002 / WP-S1 — storage contract for SeoEngine.
 * Production path: privileged server Supabase only (ADR-0043).
 */
import type {
  CreateContentItemInput,
  CreateKeywordInput,
  CreateRankSnapshotInput,
  SeoContentInventoryItem,
  SeoEngineSnapshot,
  SeoKeyword,
  SeoRankSnapshot,
} from '../types';

export interface ISeoEngineStore {
  listKeywords(activeOnly?: boolean): Promise<SeoKeyword[]>;
  getKeyword(keywordId: string): Promise<SeoKeyword | undefined>;
  addKeyword(input: CreateKeywordInput): Promise<SeoKeyword>;

  listContent(): Promise<SeoContentInventoryItem[]>;
  addContentItem(input: CreateContentItemInput): Promise<SeoContentInventoryItem>;

  listRanks(keywordId?: string): Promise<SeoRankSnapshot[]>;
  addRankSnapshot(input: CreateRankSnapshotInput): Promise<SeoRankSnapshot>;

  snapshot(): Promise<SeoEngineSnapshot>;
}
