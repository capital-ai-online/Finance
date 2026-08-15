/**
 * SEO-GM-ROADMAP-0002 / WP-S1 — contract tests for store behaviour.
 * Memory adapter only; no live DB required in CI.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSeoEngineStore,
  resetSeoEngineStoreSingletonForTests,
} from '../../src/platform/SeoEngine/store/createSeoEngineStore';
import { MemorySeoEngineStore } from '../../src/platform/SeoEngine/store/MemorySeoEngineStore';

describe('SeoEngine persistence contracts (WP-S1)', () => {
  beforeEach(() => {
    resetSeoEngineStoreSingletonForTests();
  });

  it('forceMemory yields MemorySeoEngineStore', () => {
    const store = createSeoEngineStore({ forceMemory: true });
    expect(store).toBeInstanceOf(MemorySeoEngineStore);
  });

  it('empty ranks is the honest default', async () => {
    const store = createSeoEngineStore({ forceMemory: true });
    expect(await store.listRanks()).toEqual([]);
    const snap = await store.snapshot();
    expect(snap.ranks).toEqual([]);
  });

  it('rejects non-canonical rank source', async () => {
    const store = createSeoEngineStore({ forceMemory: true });
    const kw = await store.addKeyword({ phrase: 'contract-test-keyword', locale: 'en' });
    await expect(
      store.addRankSnapshot({
        keywordId: kw.id,
        position: 1,
        source: 'search_console' as 'search-console',
      }),
    ).rejects.toThrow(/source must be search-console or manual-import/);
  });

  it('rejects unknown keywordId on rank write', async () => {
    const store = createSeoEngineStore({ forceMemory: true, seed: false });
    await expect(
      store.addRankSnapshot({
        keywordId: '00000000-0000-0000-0000-000000000000',
        position: 5,
        source: 'search-console',
      }),
    ).rejects.toThrow(/unknown keywordId/);
  });

  it('accepts search-console source', async () => {
    const store = createSeoEngineStore({ forceMemory: true });
    const kw = (await store.listKeywords(false))[0];
    const rank = await store.addRankSnapshot({
      keywordId: kw.id,
      position: 11,
      source: 'search-console',
      sourceRef: 'gsc-export-fixture',
    });
    expect(rank.source).toBe('search-console');
    expect(rank.position).toBe(11);
  });
});
