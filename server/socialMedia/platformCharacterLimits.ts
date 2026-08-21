/**
 * Canonical social-platform text limits for CAPITAL-AI publishing.
 *
 * Verified on 2026-08-21. Keep this registry as the single source of truth for
 * caption/post length checks. Limits describe the publishing surface used by
 * the Social Media Engine, not ad-copy recommendations.
 */

export type SocialMediaTextPlatform =
  | 'linkedin'
  | 'x'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook';

export type CharacterCountMode =
  | 'characters'
  | 'utf16'
  | 'x_weighted_conservative';

export interface PlatformCharacterLimit {
  maxCharacters: number;
  surface: string;
  countMode: CharacterCountMode;
  verifiedOn: '2026-08-21';
  sourceUrl: string;
  sourceAuthority: 'official' | 'official-api' | 'operational-verification';
  notes?: string;
  premiumMaxCharacters?: number;
  photoDescriptionMaxCharacters?: number;
  maxHashtags?: number;
  maxMentions?: number;
}

export const PLATFORM_CHARACTER_LIMITS: Record<SocialMediaTextPlatform, PlatformCharacterLimit> = {
  linkedin: {
    maxCharacters: 3000,
    surface: 'Feed post',
    countMode: 'characters',
    verifiedOn: '2026-08-21',
    sourceUrl: 'https://www.linkedin.com/help/linkedin/answer/a527227',
    sourceAuthority: 'official',
  },
  x: {
    maxCharacters: 280,
    surface: 'Standard post / thread entry',
    countMode: 'x_weighted_conservative',
    verifiedOn: '2026-08-21',
    sourceUrl: 'https://help.x.com/en/using-x/how-to-post',
    sourceAuthority: 'official',
    premiumMaxCharacters: 25000,
    notes: 'The engine targets the universally available 280-character surface. X Premium supports longer posts, but automated cross-platform copy must not depend on a paid account tier.',
  },
  instagram: {
    maxCharacters: 2200,
    surface: 'Feed/Reels caption',
    countMode: 'characters',
    verifiedOn: '2026-08-21',
    sourceUrl: 'https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/',
    sourceAuthority: 'official-api',
    maxHashtags: 30,
    maxMentions: 20,
  },
  tiktok: {
    maxCharacters: 2200,
    surface: 'Direct Post video caption',
    countMode: 'utf16',
    verifiedOn: '2026-08-21',
    sourceUrl: 'https://developers.tiktok.com/doc/content-posting-api-reference-direct-post',
    sourceAuthority: 'official-api',
    photoDescriptionMaxCharacters: 4000,
    notes: 'TikTok documents the Direct Post video caption as 2200 UTF-16 runes. Photo-post descriptions use a separate 4000 UTF-16 limit.',
  },
  youtube: {
    maxCharacters: 5000,
    surface: 'Video description',
    countMode: 'characters',
    verifiedOn: '2026-08-21',
    sourceUrl: 'https://support.google.com/youtube/answer/12948449',
    sourceAuthority: 'official',
  },
  facebook: {
    maxCharacters: 63206,
    surface: 'Organic post text',
    countMode: 'characters',
    verifiedOn: '2026-08-21',
    sourceUrl: 'https://www.facebook.com/help/',
    sourceAuthority: 'operational-verification',
    notes: 'Meta does not currently expose this hard cap as cleanly in an accessible Help/API reference as the other platforms. 63,206 remains the current operational platform maximum; keep marketing copy far below it.',
  },
};

export const PLATFORM_MAX_CHARACTERS: Record<SocialMediaTextPlatform, number> = {
  linkedin: PLATFORM_CHARACTER_LIMITS.linkedin.maxCharacters,
  x: PLATFORM_CHARACTER_LIMITS.x.maxCharacters,
  instagram: PLATFORM_CHARACTER_LIMITS.instagram.maxCharacters,
  tiktok: PLATFORM_CHARACTER_LIMITS.tiktok.maxCharacters,
  youtube: PLATFORM_CHARACTER_LIMITS.youtube.maxCharacters,
  facebook: PLATFORM_CHARACTER_LIMITS.facebook.maxCharacters,
};

/**
 * Conservative engine-side count. UTF-16 code units deliberately over-count
 * some Unicode/platform-specific cases and therefore fail safe. X applies its
 * own weighted rules (including URL shortening); using UTF-16 length here is a
 * conservative guardrail for generated CAPITAL-AI copy.
 */
export function conservativeCharacterCount(text: string): number {
  return text.length;
}

export function isWithinPlatformCharacterLimit(
  platform: SocialMediaTextPlatform,
  text: string,
): boolean {
  return conservativeCharacterCount(text) <= PLATFORM_CHARACTER_LIMITS[platform].maxCharacters;
}
