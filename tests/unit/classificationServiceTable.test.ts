import { describe, it, expect } from 'vitest';
import { ClassificationService } from '../../src/services/classification.service';

describe('ClassificationService table expansion (SC-1)', () => {
  it('exposes expanded deterministic table (>50 symbols)', () => {
    expect(ClassificationService.tableSize()).toBeGreaterThan(50);
  });

  it('keeps legacy core symbols stable', () => {
    expect(ClassificationService.classifyAsset('BTC').category_main).toBe('Layer 1');
    expect(ClassificationService.classifyAsset('ETH').tier).toBe(1);
    expect(ClassificationService.classifyAsset('AAVE').category_main).toBe('DeFi');
    expect(ClassificationService.classifyAsset('LINK').category_main).toBe('Oracle');
    expect(ClassificationService.classifyAsset('DOGE').category_main).toBe('Meme');
  });

  it('covers stablecoins with stablecoin asset_type', () => {
    for (const s of ['USDT', 'USDC', 'DAI']) {
      const c = ClassificationService.classifyAsset(s);
      expect(c.category_main).toBe('Stablecoin');
      expect(c.asset_type).toBe('stablecoin');
      expect(c.tier).toBeLessThanOrEqual(2);
    }
  });

  it('covers Layer-2 and AI/Data categories', () => {
    expect(ClassificationService.classifyAsset('ARB').category_main).toBe('Layer 2');
    expect(ClassificationService.classifyAsset('OP').category_main).toBe('Layer 2');
    expect(ClassificationService.classifyAsset('FET').category_main).toBe('AI / Data');
    expect(ClassificationService.classifyAsset('RNDR').category_main).toBe('AI / Data');
  });

  it('covers RWA and liquid staking', () => {
    expect(ClassificationService.classifyAsset('ONDO').category_main).toBe('Real World Assets');
    expect(ClassificationService.classifyAsset('LDO').category_main).toBe('Liquid Staking');
  });

  it('is fail-closed for unknown symbols', () => {
    const c = ClassificationService.classifyAsset('ZZZNOTACOIN');
    expect(c.category_main).toBe('Unknown');
    expect(c.tier).toBe(3);
    expect(c.confidence).toBeLessThanOrEqual(0.6);
  });

  it('does not invent high confidence for tier-2 expansion rows', () => {
    const c = ClassificationService.classifyAsset('PYTH');
    expect(c.category_main).toBe('Oracle');
    expect(c.confidence).toBeCloseTo(0.82);
  });
});
