/**
 * SEO-GM-ROADMAP-0002 / WP-S1 — thin facade over MemorySeoEngineStore.
 * Prefer ISeoEngineStore / getSeoEngineStore() for new call sites.
 * Rankings are never invented: empty until Search Console / manual import.
 */
import type {
  CreateContentItemInput,
  CreateKeywordInput,
  CreateRankSnapshotInput,
  SeoContentInventoryItem,
  SeoEngineSnapshot,
  SeoKeyword,
  SeoRankSnapshot,
} from './types';
import { MemorySeoEngineStore } from './store/MemorySeoEngineStore';

export class SeoEngineService {
  private readonly store: MemorySeoEngineStore;

  constructor() {
    this.store = new MemorySeoEngineStore();
  }

  listKeywords(activeOnly = true): Promise<SeoKeyword[]> {
    return this.store.listKeywords(activeOnly);
  }

  getKeyword(keywordId: string): Promise<SeoKeyword | undefined> {
    return this.store.getKeyword(keywordId);
  }

  addKeyword(input: CreateKeywordInput): Promise<SeoKeyword> {
    return this.store.addKeyword(input);
  }

  listContent(): Promise<SeoContentInventoryItem[]> {
    return this.store.listContent();
  }

  addContentItem(input: CreateContentItemInput): Promise<SeoContentInventoryItem> {
    return this.store.addContentItem(input);
  }

  listRanks(keywordId?: string): Promise<SeoRankSnapshot[]> {
    return this.store.listRanks(keywordId);
  }

  addRankSnapshot(input: CreateRankSnapshotInput): Promise<SeoRankSnapshot> {
    return this.store.addRankSnapshot(input);
  }

  snapshot(): Promise<SeoEngineSnapshot> {
    return this.store.snapshot();
  }

  /** Test helper */
  resetForTests(): void {
    this.store.resetForTests();
  }
}

/** @deprecated Prefer getSeoEngineStore() for production routes. */
export const seoEngine = new SeoEngineService();
