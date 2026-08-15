import { describe, it, expect } from 'vitest';
import { SeoEngineService, SEO_KEYWORD_SEED } from '../../src/platform/SeoEngine';

describe('SeoEngineService (S1 facade)', () => {
  it('loads keyword seed without fabricated ranks', async () => {
    const engine = new SeoEngineService();
    expect((await engine.listKeywords()).length).toBe(SEO_KEYWORD_SEED.length);
    expect(await engine.listRanks()).toEqual([]);
    expect((await engine.listContent()).some((c) => c.path === '/')).toBe(true);
  });

  it('snapshot is serializable', async () => {
    const snap = await new SeoEngineService().snapshot();
    expect(JSON.parse(JSON.stringify(snap)).keywords.length).toBeGreaterThan(0);
  });
});
