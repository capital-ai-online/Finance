import { describe, it, expect } from 'vitest';
import { generateTextContent } from '../../server/socialMedia/textContentGeneration';

describe('textContentGeneration (N1)', () => {
  it('generates x/facebook/community variants with disclaimer',
    () => {
      const result = generateTextContent({
        topic: 'Benjamin Graham Fair Value Check',
        locale: 'de',
      });
      expect(result.variants).toHaveLength(3);
      expect(result.humanReviewed).toBe(false);
      expect(result.variants.find((v) => v.platform === 'x')!.charCount).toBeLessThanOrEqual(280);
      expect(result.variants[0].disclaimer.length).toBeGreaterThan(20);
    });

  it('rejects empty topic',
    () => {
      expect(() => generateTextContent({ topic: '   ' })).toThrow(/topic/);
    });
});
