import { describe, it, expect } from 'vitest';
import { buildScriptPackage } from '../../server/socialMedia/scriptTemplates';

describe('scriptTemplates (N2)', () => {
  it('builds a full multi-format package with marketing emojis and support contact', () => {
    const pkg = buildScriptPackage({
      topic: 'Benjamin Graham Fair Value Check',
      locale: 'de',
      contextNote: 'Margin of Safety',
    });

    expect(pkg.thread.length).toBeGreaterThanOrEqual(6);
    expect(pkg.podcastOutline.length).toBeGreaterThanOrEqual(4);
    expect(pkg.youtubeLongformOutline.length).toBeGreaterThanOrEqual(4);
    expect(pkg.marketingPack.twitterThread.length).toBe(pkg.thread.length);
    expect(pkg.humanReviewed).toBe(false);
    expect(pkg.disclaimer.length).toBeGreaterThan(20);

    const descriptions = [
      pkg.marketingPack.linkedinPost,
      pkg.marketingPack.instagramCaption,
      pkg.marketingPack.tiktokDescription,
      pkg.marketingPack.youtubeDescription,
      pkg.marketingPack.facebookPost,
      pkg.marketingPack.twitterThread.join('\n'),
    ];

    for (const description of descriptions) {
      expect(description).toContain('support@capital-ai.online');
    }

    expect(pkg.marketingPack.supportEmail).toBe('support@capital-ai.online');
    expect(pkg.marketingPack.linkedinPost).toContain('🧠');
    expect(pkg.marketingPack.linkedinPost).toContain('🔐');
    expect(pkg.marketingPack.linkedinPost).toContain('⚠️');
    expect(pkg.marketingPack.linkedinPost).toContain('🎫');
    expect(pkg.marketingPack.linkedinPost).toContain('📧');
  });

  it('uses the pattern-break emoji when no context note is supplied', () => {
    const pkg = buildScriptPackage({
      topic: 'Datenqualität',
      locale: 'de',
    });

    expect(pkg.marketingPack.linkedinPost).toContain('⛓️‍💥');
    expect(pkg.marketingPack.facebookPost).toContain('⛓️‍💥');
  });

  it('rejects empty topic', () => {
    expect(() => buildScriptPackage({ topic: '  ' })).toThrow(/topic/);
  });
});
