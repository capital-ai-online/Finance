import { describe, it, expect } from 'vitest';
import {
  adaptAgentClassification,
  adaptLegacyEnterpriseClassification,
  ensureCanonicalClassification,
  normalizeCryptoCategory,
  CLASSIFICATION_ADAPTER_VERSION,
} from '../../src/services/classificationAdapter';

describe('classificationAdapter (SC-1)', () => {
  it('exposes stable adapter version', () => {
    expect(CLASSIFICATION_ADAPTER_VERSION).toBe('classification-adapter/1.0.0');
  });

  it('normalizes common agent aliases to canonical CryptoCategory', () => {
    expect(normalizeCryptoCategory('L1')).toBe('Layer 1');
    expect(normalizeCryptoCategory('DeFi')).toBe('DeFi');
    expect(normalizeCryptoCategory('memecoin')).toBe('Meme');
    expect(normalizeCryptoCategory('stablecoin')).toBe('Stablecoin');
    expect(normalizeCryptoCategory('totally-unknown-xyz')).toBe('Unknown');
  });

  it('adapts agent free-text classification to canonical shape', () => {
    const adapted = adaptAgentClassification({
      category: 'L1',
      sub_tier: 'Core Layer',
      confidence: 0.91,
      reasoning: ['agent'],
    });
    expect(adapted.category_main).toBe('Layer 1');
    expect(adapted.category_sub).toBe('Chain-native Asset');
    expect(adapted.asset_type).toBe('coin');
    expect(adapted.confidence).toBeCloseTo(0.91);
    expect(adapted.tier).toBeGreaterThanOrEqual(1);
  });

  it('adapts legacy enterprise Crypto|Unknown shape without inventing high confidence', () => {
    const adapted = adaptLegacyEnterpriseClassification({
      category_main: 'Crypto',
      category_sub: 'DeFi',
      confidence: 0.7,
      reasoning: ['legacy'],
    });
    expect(adapted.category_main).toBe('DeFi');
    expect(adapted.confidence).toBeCloseTo(0.7);
  });

  it('ensureCanonicalClassification is fail-closed on empty input', () => {
    const empty = ensureCanonicalClassification(null);
    expect(empty.category_main).toBe('Unknown');
    expect(empty.tier).toBe(3);
    expect(empty.confidence).toBeLessThanOrEqual(0.6);
  });

  it('clamps out-of-range confidence', () => {
    const adapted = adaptAgentClassification({ category: 'Oracle', confidence: 5 });
    expect(adapted.confidence).toBe(1);
  });
});
