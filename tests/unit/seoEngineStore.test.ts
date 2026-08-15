import { describe, it, expect, beforeEach } from 'vitest';
import { SeoEngineService } from '../../src/platform/SeoEngine/SeoEngineService';

describe('SeoEngineService (S1)', () => {
  let engine: SeoEngineService;

  beforeEach(() => {
    engine = new SeoEngineService();
  });

  it('seeds keywords without rank snapshots (no demo ranks)', () => {
    expect(engine.listKeywords(false).length).toBeGreaterThan(0);
    expect(engine.listRanks()).toEqual([]);
  });

  it('seeds published legal/home content paths', () => {
    const paths = engine.listContent().map((c) => c.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/impressum');
    expect(paths).toContain('/agb');
    expect(paths).toContain('/datenschutz');
  });

  it('upserts keywords by phrase+locale', () => {
    const a = engine.addKeyword({ phrase: 'Monte Carlo Portfolio Simulator', locale: 'en' });
    const b = engine.addKeyword({ phrase: 'monte carlo portfolio simulator', locale: 'en' });
    expect(a.id).toBe(b.id);
  });

  it('rejects rank snapshots for unknown keywords', () => {
    expect(() =>
      engine.addRankSnapshot({
        keywordId: 'missing',
        position: 12,
        source: 'manual-import',
      }),
    ).toThrow(/unknown keywordId/);
  });

  it('accepts manual-import ranks', () => {
    const kw = engine.listKeywords(false)[0];
    const snap = engine.addRankSnapshot({
      keywordId: kw.id,
      position: 8,
      source: 'manual-import',
      sourceRef: 'owner-csv-2026-08',
    });
    expect(snap.position).toBe(8);
    expect(engine.listRanks(kw.id)).toHaveLength(1);
  });

  it('rejects invalid position values', () => {
    const kw = engine.listKeywords(false)[0];
    expect(() =>
      engine.addRankSnapshot({ keywordId: kw.id, position: 0, source: 'manual-import' }),
    ).toThrow(/position/);
  });
});
