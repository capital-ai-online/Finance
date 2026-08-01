// Audit ARCH-AUDIT-0002 (H1): Testabdeckung fuer die reale Aktien-/Forex-Bewertungslogik.
// assetRegistry wird gemockt (kein echter Netzwerkzugriff im Test), analog zum Muster in
// tests/unit/scoreValidation.test.ts.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetHistory = vi.fn();

vi.mock('../../src/lib/assetRegistry', () => ({
  assetRegistry: {
    getHistory: (...args: any[]) => mockGetHistory(...args),
  },
}));

import {
  scoreValue,
  scoreDividend,
  scoreQuality,
  generateTraditionalAssetInputs,
  TraditionalAssetScoringService,
  STOCK_SCORING_WEIGHTS,
  FX_SCORING_WEIGHTS,
} from '../../src/services/traditionalAssetScoring';

describe('traditionalAssetScoring', () => {
  beforeEach(() => {
    mockGetHistory.mockReset();
  });

  describe('reine Bewertungsfunktionen', () => {
    it('scoreValue: niedrigeres KGV ergibt eine hoehere Punktzahl', () => {
      expect(scoreValue(0)).toBe(100);
      expect(scoreValue(20)).toBe(50);
      expect(scoreValue(40)).toBe(0);
      expect(scoreValue(80)).toBe(0); // gedeckelt, nicht negativ
    });

    it('scoreDividend: hoehere Dividendenrendite ergibt eine hoehere Punktzahl bis zur Obergrenze', () => {
      expect(scoreDividend(0)).toBe(0);
      expect(scoreDividend(3)).toBe(50);
      expect(scoreDividend(6)).toBe(100);
      expect(scoreDividend(10)).toBe(100); // gedeckelt
    });

    it('scoreQuality: hoehere Nettomarge ergibt eine hoehere Punktzahl bis zur Obergrenze', () => {
      expect(scoreQuality(0)).toBe(0);
      expect(scoreQuality(12.5)).toBe(50);
      expect(scoreQuality(25)).toBe(100);
    });
  });

  describe('generateTraditionalAssetInputs', () => {
    it('berechnet technische Faktoren aus echter Kurshistorie (source: live)', async () => {
      mockGetHistory.mockResolvedValue({
        source: 'live',
        points: Array.from({ length: 30 }, (_, i) => ({ date: `${i}`, close: 100 + i })), // stetiger Aufwaertstrend
      });

      const inputs = await generateTraditionalAssetInputs('AAPL', 'stock');
      expect(inputs.trend).toBeDefined();
      expect(inputs.momentum).toBeDefined();
      expect(inputs.breakout_quality).toBeDefined();
      expect(inputs.volatility_quality).toBeDefined();
      expect(inputs.relative_strength).toBeDefined();
      // Stetiger Aufwaertstrend -> starkes Momentum
      expect(inputs.momentum!).toBeGreaterThan(0.5);
    });

    it('laesst technische Faktoren undefined, wenn keine echte Historie vorliegt (source: simulated)', async () => {
      mockGetHistory.mockResolvedValue({ source: 'simulated', points: [] });

      const inputs = await generateTraditionalAssetInputs('XYZ', 'forex');
      expect(inputs.trend).toBeUndefined();
      expect(inputs.momentum).toBeUndefined();
    });

    it('reichert Aktien-Inputs mit Fundamentaldaten an, wenn uebergeben', async () => {
      mockGetHistory.mockResolvedValue({ source: 'simulated', points: [] });

      const inputs = await generateTraditionalAssetInputs('AAPL', 'stock', {
        peRatio: 20,
        dividendYieldPct: 3,
        profitMarginPct: 12.5,
      });
      expect(inputs.value).toBeCloseTo(0.5, 5);
      expect(inputs.dividend).toBeCloseTo(0.5, 5);
      expect(inputs.quality).toBeCloseTo(0.5, 5);
    });

    it('reichert Forex-Inputs NICHT mit Fundamentaldaten an, selbst wenn uebergeben', async () => {
      mockGetHistory.mockResolvedValue({ source: 'simulated', points: [] });

      const inputs = await generateTraditionalAssetInputs('EURUSD', 'forex', {
        peRatio: 20,
        dividendYieldPct: 3,
        profitMarginPct: 12.5,
      });
      expect(inputs.value).toBeUndefined();
      expect(inputs.dividend).toBeUndefined();
      expect(inputs.quality).toBeUndefined();
    });
  });

  describe('TraditionalAssetScoringService.scoreTraditionalAsset', () => {
    it('liefert Score 0 und keine usedFactors, wenn kein einziger Faktor vorliegt', () => {
      const result = TraditionalAssetScoringService.scoreTraditionalAsset({ symbol: 'AAPL', assetType: 'stock' });
      expect(result.score).toBe(0);
      expect(result.usedFactors).toHaveLength(0);
    });

    it('legt bei fehlenden Faktoren deren Gewichtsanteil auf die vorhandenen um (Aktie ohne Fundamentaldaten)', () => {
      const result = TraditionalAssetScoringService.scoreTraditionalAsset({
        symbol: 'AAPL',
        assetType: 'stock',
        trend: 1,
        momentum: 1,
        breakout_quality: 1,
        volatility_quality: 1,
        relative_strength: 1,
      });
      // Nur technische Faktoren vorhanden, alle auf Maximalwert -> voller Score trotz
      // fehlender Fundamentaldaten (renormalisiert statt geschaetzt).
      expect(result.score).toBe(100);
      expect(result.missingFactors).toEqual(expect.arrayContaining(['value', 'dividend', 'quality']));
    });

    it('verwendet fuer Forex ausschliesslich FX_SCORING_WEIGHTS (keine Fundamentalfaktoren)', () => {
      const result = TraditionalAssetScoringService.scoreTraditionalAsset({
        symbol: 'EURUSD',
        assetType: 'forex',
        trend: 1,
        momentum: 1,
        breakout_quality: 1,
        volatility_quality: 1,
        relative_strength: 1,
      });
      expect(result.score).toBe(100);
      expect(result.missingFactors).toHaveLength(0);
    });
  });

  it('Gewichte summieren sich je Anlageklasse auf 1.00', () => {
    const stockSum = Object.values(STOCK_SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
    const fxSum = Object.values(FX_SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(stockSum).toBeCloseTo(1.0, 5);
    expect(fxSum).toBeCloseTo(1.0, 5);
  });
});
