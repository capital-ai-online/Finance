import { describe, it, expect } from 'vitest';
import { buildScriptPackage } from '../../server/socialMedia/scriptTemplates';

describe('scriptTemplates (N2)', () => {
  it('builds a full multi-format package',
    () => {
      const pkg = buildScriptPackage({
        topic: 'Benjamin Graham Fair Value Check',
        locale: 'de',
        contextNote: 'Margin of Safety',
      });
      expect(pkg.thread.length).toBeGreaterThanOrEqual(5);
      expect(pkg.podcastOutline.length).toBeGreaterThanOrEqual(4);
      expect(pkg.youtubeLongformOutline.length).toBeGreaterThanOrEqual(4);
      expect(pkg.marketingPack.twitterThread.length).toBe(pkg.thread.length);
      expect(pkg.humanReviewed).toBe(false);
      expect(pkg.disclaimer.length).toBeGreaterThan(20);
    });

  it('rejects empty topic',
    () => {
      expect(() => buildScriptPackage({ topic: '  ' })).toThrow(/topic/);
    });
});
