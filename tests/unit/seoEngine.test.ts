import { describe, it, expect } from 'vitest';
import { SeoEngineService, SEO_KEYWORD_SEED } from '../../src/platform/SeoEngine';

describe('SeoEngineService (S1)', () => {
  it('loads keyword seed without fabricated ranks',
    () => {
      const engine = new SeoEngineService();
      expect(engine.listKeywords().length).toBe(SEO_KEYWORD_SEED.length);
      expect(engine.listRanks()).toEqual([]);
      expect(engine.listContent().some((c) => c.path === '/')).toBe(true);
    });

  it('snapshot is serializable',
    () => {
      const snap = new SeoEngineService().snapshot();
      expect(JSON.parse(JSON.stringify(snap)).keywords.length).toBeGreaterThan(0);
    });
});
