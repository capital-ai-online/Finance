import { describe, it, expect } from 'vitest';
import { buildScriptPackage } from '../../server/socialMedia/scriptTemplates';
import {
  CAPITAL_AI_EMOJI,
  CAPITAL_AI_EMOJI_TAG,
  MARKETING_EMOJI_LEXICON,
  decorateMarketingText,
  resolveMarketingEmojis,
} from '../../server/socialMedia/marketingEmojiLexicon';

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
    expect(pkg.marketingPack.brandEmoji).toBe(CAPITAL_AI_EMOJI);
    expect(pkg.marketingPack.brandEmojiTag).toBe(CAPITAL_AI_EMOJI_TAG);
    expect(pkg.marketingPack.standaloneEmojiTags).toContain('🍀🪽🍀');
    expect(pkg.marketingPack.linkedinPost).toContain(CAPITAL_AI_EMOJI);
    expect(pkg.marketingPack.linkedinPost).toContain('🧠');
    expect(pkg.marketingPack.linkedinPost).toContain('🔐');
    expect(pkg.marketingPack.linkedinPost).toContain('⚠️');
    expect(pkg.marketingPack.linkedinPost).toContain('🎫');
    expect(pkg.marketingPack.linkedinPost).toContain('📧');
  });

  it('maps the owner-defined marketing keywords deterministically', () => {
    const copy = 'Aufwind und Hype: bullisches Pattern. Governance durch Geschäftsführer. MFA Sicherheit. Launch Erfolg. Top Score. Big Bang.';
    const emojis = resolveMarketingEmojis(copy);

    expect(emojis).toContain('🚀');
    expect(emojis).toContain('🏦');
    expect(emojis).toContain('🔐');
    expect(emojis).toContain('🥳');
    expect(emojis).toContain('💯');
    expect(emojis).toContain('💥');

    const decorated = decorateMarketingText(copy);
    for (const emoji of ['🚀', '🏦', '🔐', '🥳', '💯', '💥']) {
      expect(decorated).toContain(emoji);
    }
    expect(decorated).toContain(copy);
  });

  it('keeps signal-sensitive emojis source-bound instead of inventing claims', () => {
    expect(resolveMarketingEmojis('Neutrale Marktanalyse ohne Pattern oder Score')).not.toContain('🚀');
    expect(resolveMarketingEmojis('Neutrale Marktanalyse ohne Pattern oder Score')).not.toContain('💯');
    expect(resolveMarketingEmojis('Explizit bullisches Pattern')).toContain('🚀');
    expect(resolveMarketingEmojis('Expliziter Top Score')).toContain('💯');
  });

  it('exposes the standalone lucky-wings tag and portable CAPITAL-AI brand emoji', () => {
    expect(MARKETING_EMOJI_LEXICON.luckyWingsTag.emoji).toBe('🍀🪽🍀');
    expect(CAPITAL_AI_EMOJI).toBe('🧠✦');
    expect(CAPITAL_AI_EMOJI_TAG).toBe(':capital_ai:');
  });

  it('uses the pattern-break emoji when no context note is supplied', () => {
    const pkg = buildScriptPackage({
      topic: 'Datenqualität',
      locale: 'de',
    });

    expect(pkg.marketingPack.linkedinPost).toContain('⛓️‍💥');
    expect(pkg.marketingPack.facebookPost).toContain('⛓️‍💥');
  });

  it('decorates explicit context keywords in social descriptions', () => {
    const pkg = buildScriptPackage({
      topic: 'Enterprise Scorer Update',
      locale: 'de',
      contextNote: 'Governance, MFA Sicherheit, Aufwind, Top Score und Big Bang zum Release',
    });

    for (const emoji of ['🏦', '🔐', '🚀', '💯', '💥', '🥳']) {
      expect(pkg.marketingPack.linkedinPost).toContain(emoji);
      expect(pkg.marketingPack.instagramCaption).toContain(emoji);
    }
  });

  it('rejects empty topic', () => {
    expect(() => buildScriptPackage({ topic: '  ' })).toThrow(/topic/);
  });
});
