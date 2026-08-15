import { describe, it, expect, beforeEach } from 'vitest';
import { MemorySeoEngineStore } from '../../src/platform/SeoEngine/store/MemorySeoEngineStore';

describe('MemorySeoEngineStore (WP-S1)', () => {
  let store: MemorySeoEngineStore;

  beforeEach(() => {
    store = new MemorySeoEngineStore();
  });

  it('seeds keywords without rank snapshots (no demo ranks)', async () => {
    expect((await store.listKeywords(false)).length).toBeGreaterThan(0);
    expect(await store.listRanks()).toEqual([]);
  });

  it('seeds published legal/home content paths', async () => {
    const paths = (await store.listContent()).map((c) => c.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/impressum');
    expect(paths).toContain('/agb');
    expect(paths).toContain('/datenschutz');
  });

  it('upserts keywords by phrase+locale', async () => {
    const a = await store.addKeyword({ phrase: 'Monte Carlo Portfolio Simulator', locale: 'en' });
    const b = await store.addKeyword({ phrase: 'monte carlo portfolio simulator', locale: 'en' });
    expect(a.id).toBe(b.id);
  });

  it('rejects rank snapshots for unknown keywords', async () => {
    await expect(
      store.addRankSnapshot({
        keywordId: 'missing',
        position: 12,
        source: 'manual-import',
      }),
    ).rejects.toThrow(/unknown keywordId/);
  });

  it('accepts manual-import ranks', async () => {
    const kw = (await store.listKeywords(false))[0];
    const snap = await store.addRankSnapshot({
      keywordId: kw.id,
      position: 8,
      source: 'manual-import',
      sourceRef: 'owner-csv-2026-08',
    });
    expect(snap.position).toBe(8);
    expect(await store.listRanks(kw.id)).toHaveLength(1);
  });

  it('rejects invalid position values', async () => {
    const kw = (await store.listKeywords(false))[0];
    await expect(
      store.addRankSnapshot({ keywordId: kw.id, position: 0, source: 'manual-import' }),
    ).rejects.toThrow(/position/);
  });

  it('rejects estimated / non-canonical sources (No-Demo-Data)', async () => {
    const kw = (await store.listKeywords(false))[0];
    await expect(
      store.addRankSnapshot({
        keywordId: kw.id,
        position: 3,
        source: 'estimated' as 'manual-import',
      }),
    ).rejects.toThrow(/source must be search-console or manual-import/);
  });
});
