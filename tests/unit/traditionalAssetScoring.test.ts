import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetHistory = vi.fn();

vi.mock('../../src/lib/assetRegistry', () => ({
  assetRegistry: { getHistory: (...args: any[]) => mockGetHistory(...args) },
}));

import {
  scoreValue,
  scoreDividend,
  scoreQuality,
  generateTraditionalAssetInputs,
  generateTraditionalAssetInputsFromCloses,
  TraditionalAssetScoringService,
  STOCK_SCORING_WEIGHTS,
  FX_SCORING_WEIGHTS,
} from '../../src/services/traditionalAssetScoring';

describe('traditionalAssetScoring', () => {
  beforeEach(() => mockGetHistory.mockReset());

  describe('pure scoring functions', () => {
    it('scores value monotonically', () => {
      expect(scoreValue(0)).toBe(100);
      expect(scoreValue(20)).toBe(50);
      expect(scoreValue(40)).toBe(0);
      expect(scoreValue(80)).toBe(0);
    });

    it('scores dividend yield with cap', () => {
      expect(scoreDividend(0)).toBe(0);
      expect(scoreDividend(3)).toBe(50);
      expect(scoreDividend(6)).toBe(100);
      expect(scoreDividend(10)).toBe(100);
    });

    it('scores profit margin with cap', () => {
      expect(scoreQuality(0)).toBe(0);
      expect(scoreQuality(12.5)).toBe(50);
      expect(scoreQuality(25)).toBe(100);
    });
  });

  describe('stock/forex input generation', () => {
    it('derives technical factors and Stooq provenance from verified history', async () => {
      mockGetHistory.mockResolvedValue({
        source: 'live',
        points: Array.from({ length: 30 }, (_, i) => ({ date: `${i}`, close: 100 + i })),
      });

      const inputs = await generateTraditionalAssetInputs('AAPL', 'stock');
      expect(inputs.trend).toBeDefined();
      expect(inputs.momentum).toBeGreaterThan(0.5);
      expect(inputs.breakout_quality).toBeDefined();
      expect(inputs.volatility_quality).toBeDefined();
      expect(inputs.relative_strength).toBeDefined();
      expect(inputs.provenance?.length).toBeGreaterThanOrEqual(4);
      expect(inputs.provenance?.every(item => item.provider === 'Stooq')).toBe(true);
      expect(inputs.provenance?.map(item => item.field)).toContain('trend');
    });

    it('rejects simulated history as technical scoring evidence', async () => {
      mockGetHistory.mockResolvedValue({ source: 'simulated', points: [] });
      const inputs = await generateTraditionalAssetInputs('EURUSD', 'forex');
      expect(inputs.trend).toBeUndefined();
      expect(inputs.momentum).toBeUndefined();
      expect(inputs.provenance).toEqual([]);
    });

    it('derives stock factors from attributed Alpha Vantage fields', async () => {
      mockGetHistory.mockResolvedValue({ source: 'simulated', points: [] });
      const retrievedAt = '2026-08-02T07:00:00.000Z';
      const inputs = await generateTraditionalAssetInputs('AAPL', 'stock', {
        peRatio: 20,
        dividendYieldPct: 3,
        profitMarginPct: 12.5,
        provenance: [
          { field: 'peRatio', provider: 'AlphaVantage', sourcePath: 'alpha://overview/AAPL', retrievedAt, value: 20 },
          { field: 'dividendYieldPct', provider: 'AlphaVantage', sourcePath: 'alpha://overview/AAPL', retrievedAt, value: 3 },
          { field: 'profitMarginPct', provider: 'AlphaVantage', sourcePath: 'alpha://overview/AAPL', retrievedAt, value: 12.5 },
        ],
      });
      expect(inputs.value).toBeCloseTo(0.5, 5);
      expect(inputs.dividend).toBeCloseTo(0.5, 5);
      expect(inputs.quality).toBeCloseTo(0.5, 5);
      expect(inputs.provenance?.map(item => item.field)).toEqual(expect.arrayContaining(['value', 'dividend', 'quality']));

      const result = TraditionalAssetScoringService.scoreTraditionalAsset(inputs);
      expect(result.lineage.providers).toContain('AlphaVantage');
      expect(result.lineage.evidenceIds.some(id => id.includes('AAPL:value'))).toBe(true);
    });

    it('does not apply company fundamentals to forex', async () => {
      mockGetHistory.mockResolvedValue({ source: 'simulated', points: [] });
      const inputs = await generateTraditionalAssetInputs('EURUSD', 'forex', {
        peRatio: 20, dividendYieldPct: 3, profitMarginPct: 12.5,
      });
      expect(inputs.value).toBeUndefined();
      expect(inputs.dividend).toBeUndefined();
      expect(inputs.quality).toBeUndefined();
    });
  });

  describe('scoring and lineage', () => {
    it('returns zero with no used factors and no fabricated lineage evidence', () => {
      const result = TraditionalAssetScoringService.scoreTraditionalAsset({ symbol: 'AAPL', assetType: 'stock' });
      expect(result.score).toBe(0);
      expect(result.usedFactors).toHaveLength(0);
      expect(result.lineage.evidenceIds).toHaveLength(0);
    });

    it('renormalizes missing stock fundamentals instead of estimating them', () => {
      const result = TraditionalAssetScoringService.scoreTraditionalAsset({
        symbol: 'AAPL', assetType: 'stock', trend: 1, momentum: 1,
        breakout_quality: 1, volatility_quality: 1, relative_strength: 1,
      });
      expect(result.score).toBe(100);
      expect(result.missingFactors).toEqual(expect.arrayContaining(['value', 'dividend', 'quality']));
    });

    it('uses technical-only weights for forex', () => {
      const result = TraditionalAssetScoringService.scoreTraditionalAsset({
        symbol: 'EURUSD', assetType: 'forex', trend: 1, momentum: 1,
        breakout_quality: 1, volatility_quality: 1, relative_strength: 1,
      });
      expect(result.score).toBe(100);
      expect(result.missingFactors).toHaveLength(0);
    });
  });

  it('weights sum to one per scoring model', () => {
    expect(Object.values(STOCK_SCORING_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 5);
    expect(Object.values(FX_SCORING_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 5);
  });

  describe('index input generation from FMP history', () => {
    it('derives FMP-attributed technical factors and lineage', () => {
      const closes = Array.from({ length: 30 }, (_, i) => 7000 + i * 5);
      const inputs = generateTraditionalAssetInputsFromCloses('GSPC', 'index', closes);
      expect(inputs.symbol).toBe('GSPC');
      expect(inputs.assetType).toBe('index');
      expect(inputs.trend).toBeDefined();
      expect(inputs.momentum).toBeGreaterThan(0.5);
      expect(inputs.provenance?.every(item => item.provider === 'FMP')).toBe(true);

      const result = TraditionalAssetScoringService.scoreTraditionalAsset(inputs);
      expect(result.lineage.providers).toEqual(['FMP']);
      expect(result.lineage.features).toContain('trend');
      expect(result.lineage.evidenceIds.length).toBeGreaterThan(0);
    });

    it('does not create factors or evidence from insufficient history', () => {
      const inputs = generateTraditionalAssetInputsFromCloses('GSPC', 'index', [7000]);
      expect(inputs.trend).toBeUndefined();
      const result = TraditionalAssetScoringService.scoreTraditionalAsset(inputs);
      expect(result.lineage.evidenceIds).toHaveLength(0);
    });
  });
});
