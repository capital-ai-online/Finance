import { describe, expect, it } from 'vitest';
import { generateTextContent } from '../../server/socialMedia/textContentGeneration';
import { isWithinPlatformCharacterLimit } from '../../server/socialMedia/platformCharacterLimits';

describe('textContentGeneration (N1)', () => {
  it('generates x/facebook/community variants with in-band disclaimer', () => {
    const result = generateTextContent({
      topic: 'Benjamin Graham Fair Value Check',
      locale: 'de',
    });

    expect(result.variants).toHaveLength(3);
    expect(result.humanReviewed).toBe(false);

    const xVariant = result.variants.find((variant) => variant.platform === 'x');
    expect(xVariant).toBeDefined();
    expect(isWithinPlatformCharacterLimit('x', xVariant!.text)).toBe(true);
    expect(xVariant!.text).toContain(xVariant!.disclaimer);

    const facebookVariant = result.variants.find((variant) => variant.platform === 'facebook');
    expect(facebookVariant).toBeDefined();
    expect(isWithinPlatformCharacterLimit('facebook', facebookVariant!.text)).toBe(true);
    expect(facebookVariant!.text).toContain(facebookVariant!.disclaimer);
  });

  it('fails closed instead of truncating overlong x copy', () => {
    const longContext = Array.from({ length: 280 }, () => 'x').join('');
    expect(() =>
      generateTextContent({
        topic: 'Datenintegrität',
        locale: 'de',
        platforms: ['x'],
        contextNote: longContext,
      }),
    ).toThrow(/exceeds platform character limit/);
  });

  it('rejects empty topic', () => {
    expect(() => generateTextContent({ topic: '   ' })).toThrow(/topic/);
  });
});
