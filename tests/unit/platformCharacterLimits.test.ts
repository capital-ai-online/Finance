import { describe, expect, it } from 'vitest';
import { buildScriptPackage } from '../../server/socialMedia/scriptTemplates';
import {
  PLATFORM_CHARACTER_LIMITS,
  PLATFORM_MAX_CHARACTERS,
  isWithinPlatformCharacterLimit,
} from '../../server/socialMedia/platformCharacterLimits';

describe('platformCharacterLimits', () => {
  it('keeps the verified platform limits in one canonical registry', () => {
    expect(PLATFORM_MAX_CHARACTERS).toEqual({
      linkedin: 3000,
      x: 280,
      instagram: 2200,
      tiktok: 2200,
      youtube: 5000,
      facebook: 63206,
    });

    expect(PLATFORM_CHARACTER_LIMITS.x.premiumMaxCharacters).toBe(25000);
    expect(PLATFORM_CHARACTER_LIMITS.instagram.maxHashtags).toBe(30);
    expect(PLATFORM_CHARACTER_LIMITS.instagram.maxMentions).toBe(20);
    expect(PLATFORM_CHARACTER_LIMITS.tiktok.photoDescriptionMaxCharacters).toBe(4000);
  });

  it('keeps generated default social copy inside each publishing limit', () => {
    const pkg = buildScriptPackage({
      topic: 'Enterprise Scorer Datenqualität und Governance',
      locale: 'de',
      contextNote: 'MFA Sicherheit, No Demo Data und nachvollziehbare Multi-Asset-Analyse',
      ctaText: 'Mehr erfahren auf capital-ai.online',
    });

    expect(isWithinPlatformCharacterLimit('linkedin', pkg.marketingPack.linkedinPost)).toBe(true);
    expect(isWithinPlatformCharacterLimit('instagram', pkg.marketingPack.instagramCaption)).toBe(true);
    expect(isWithinPlatformCharacterLimit('tiktok', pkg.marketingPack.tiktokDescription)).toBe(true);
    expect(isWithinPlatformCharacterLimit('youtube', pkg.marketingPack.youtubeDescription)).toBe(true);
    expect(isWithinPlatformCharacterLimit('facebook', pkg.marketingPack.facebookPost)).toBe(true);

    for (const post of pkg.marketingPack.twitterThread) {
      expect(isWithinPlatformCharacterLimit('x', post)).toBe(true);
    }
  });

  it('fails closed when text exceeds a platform limit', () => {
    expect(isWithinPlatformCharacterLimit('x', 'x'.repeat(281))).toBe(false);
    expect(isWithinPlatformCharacterLimit('instagram', 'x'.repeat(2201))).toBe(false);
    expect(isWithinPlatformCharacterLimit('youtube', 'x'.repeat(5001))).toBe(false);
  });
});
