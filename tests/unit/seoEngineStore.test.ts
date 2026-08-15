import { describe, it, expect, beforeEach } from 'vitest';
import { SeoEngineStore } from '../../src/platform/SeoEngine/store';

describe('SeoEngineStore (S1)', () => {
  let store: SeoEngineStore;

  beforeEach(() => {
    store = new SeoEngineStore();
    store.resetForTests();
  });

  it('seeds keywords without rank snapshots (no demo ranks)', () => {
    expect(store.listKeywords().length).toBeGreaterThan(0);
    expect(store.listRankSnapshots()).toEqual([]);
  });

  it('seeds published legal/home content paths', () => {
    const paths = store.listContent().map((c) => c.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/impressum');
    expect(paths).toContain('/agb');
    expect(paths).toContain('/datenschutz');
  });

  it('upserts keywords by phrase+locale', () => {
    const a = store.addKeyword({ phrase: 'Monte Carlo Portfolio Simulator', locale: 'en' });
    const b = store.addKeyword({ phrase: 'monte carlo portfolio simulator', locale: 'en' });
    expect(a.id).toBe(b.id);
  });

  it('rejects rank snapshots for unknown keywords', () => {
    expect(() =>
      store.addRankSnapshot({
        keywordId: 'missing',
        position: 12,
        source: 'manual-import',
      }),
    ).toThrow(/unknown keywordId/);
  });

  it('accepts manual-import and search-console ranks only', () => {
    const kw = store.listKeywords()[0];
    const snap = store.addRankSnapshot({
      keywordId: kw.id,
      position: 8,
      source: 'manual-import',
      sourceRef: 'owner-csv-2026-08',
    });
    expect(snap.position).toBe(8);
    expect(store.listRankSnapshots(kw.id)).toHaveLength(1);
  });

  it('rejects invalid position values', () => {
    const kw = store.listKeywords()[0];
    expect(() =>
      store.addRankSnapshot({ keywordId: kw.id, position: 0, source: 'manual-import' }),
    ).toThrow(/position/);
  });
});
