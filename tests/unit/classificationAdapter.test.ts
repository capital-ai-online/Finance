import { describe, it, expect } from 'vitest';
import {
  adaptAgentClassification,
  adaptLegacyEnterpriseClassification,
  ensureCanonicalClassification,
  mergeDeterministicAndAgentClassification,
  normalizeCryptoCategory,
  CLASSIFICATION_ADAPTER_VERSION,
} from '../../src/services/classificationAdapter';

describe('classificationAdapter (SC-1)', () => {
  it('exposes stable adapter version', () => {
    expect(CLASSIFICATION_ADAPTER_VERSION).toMatch(/^classification-adapter\/1\./);
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

  it('merge prefers deterministic category when not Unknown', () => {
    const det = ensureCanonicalClassification({
      category_main: 'Layer 1',
      category_sub: 'Chain-native Asset',
      asset_type: 'coin',
      tier: 1,
      confidence: 0.95,
      reasoning: ['det'],
    });
    const agent = adaptAgentClassification({
      category: 'DeFi',
      sub_tier: 'Protocol Token',
      confidence: 0.8,
      reasoning: ['agent'],
    });
    const merged = mergeDeterministicAndAgentClassification(det, agent);
    expect(merged.category_main).toBe('Layer 1');
    expect(merged.tier).toBe(1);
    expect(merged.confidence).toBeCloseTo(0.88, 1);
    expect(merged.reasoning.some((r) => r.includes('merge'))).toBe(true);
  });

  it('merge falls back to agent when deterministic is Unknown', () => {
    const det = ensureCanonicalClassification({
      category_main: 'Unknown',
      category_sub: 'Unknown',
      asset_type: 'unknown',
      tier: 3,
      confidence: 0.6,
      reasoning: ['det-unknown'],
    });
    const agent = adaptAgentClassification({
      category: 'Oracle',
      sub_tier: 'Protocol Token',
      confidence: 0.85,
      reasoning: ['agent-oracle'],
    });
    const merged = mergeDeterministicAndAgentClassification(det, agent);
    expect(merged.category_main).toBe('Oracle');
    expect(merged.category_sub).toBe('Protocol Token');
  });

  it('merge is fail-closed when both Unknown', () => {
    const det = ensureCanonicalClassification(null);
    const agent = adaptAgentClassification({ category: 'crypto token', confidence: 0.5 });
    const merged = mergeDeterministicAndAgentClassification(det, agent);
    expect(merged.category_main).toBe('Unknown');
    expect(merged.tier).toBe(3);
  });
});
