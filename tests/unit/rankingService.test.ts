// Audit ARCH-AUDIT-0002 (D5): Testabdeckung fuer den kritischen Scoring/Ranking-Pfad.

import { describe, it, expect } from 'vitest';
import { calculateRankScore, isTop10Eligible } from '../../src/services/ranking.service';

describe('ranking.service', () => {
  describe('calculateRankScore', () => {
    it('gewichtet final_score, Datenqualitaet, Tier und Liquiditaet gemaess der dokumentierten Formel (0.70/0.15/0.10/0.05)', () => {
      const payload = {
        asset_name: 'A', symbol: 'A',
        data_quality: { level: 'high' as const },
        classification: { category_main: 'Layer 1' as const, category_sub: 'Chain-native Asset' as const, asset_type: 'coin' as const, tier: 1 as const, confidence: 0.9, reasoning: [] },
        scores: { liquidity: 80 },
      };
      const score = calculateRankScore(payload, 90);
      // 0.70*90 + 0.15*100 + 0.10*100 + 0.05*80 = 63 + 15 + 10 + 4 = 92
      expect(score).toBeCloseTo(92, 5);
    });

    it('niedrigere Datenqualitaet senkt den Rank-Score bei identischem final_score', () => {
      const base = { asset_name: 'A', symbol: 'A', scores: { liquidity: 50 } };
      const high = calculateRankScore({ ...base, data_quality: { level: 'high' } }, 70);
      const low = calculateRankScore({ ...base, data_quality: { level: 'low' } }, 70);
      expect(high).toBeGreaterThan(low);
    });

    it('fehlende classification/scores fuehren zu neutralen Default-Werten statt zum Absturz', () => {
      expect(() => calculateRankScore({ asset_name: 'A', symbol: 'A' }, 50)).not.toThrow();
    });
  });

  describe('isTop10Eligible', () => {
    const eligibleBase = {
      asset_name: 'A', symbol: 'A',
      classification: { category_main: 'Layer 1' as const, category_sub: 'Chain-native Asset' as const, asset_type: 'coin' as const, tier: 1 as const, confidence: 0.8, reasoning: [] },
      scores: { liquidity: 60 },
      data_quality: { level: 'high' as const },
    };

    it('ist erfuellt, wenn Confidence >= 0.65, Liquiditaet >= 50 und Datenqualitaet nicht "low" ist', () => {
      expect(isTop10Eligible(eligibleBase)).toBe(true);
    });

    it('ist NICHT erfuellt bei Confidence unter 0.65', () => {
      expect(isTop10Eligible({ ...eligibleBase, classification: { ...eligibleBase.classification, confidence: 0.5 } })).toBe(false);
    });

    it('ist NICHT erfuellt bei Liquiditaet unter 50', () => {
      expect(isTop10Eligible({ ...eligibleBase, scores: { liquidity: 20 } })).toBe(false);
    });

    it('ist NICHT erfuellt bei Datenqualitaet "low"', () => {
      expect(isTop10Eligible({ ...eligibleBase, data_quality: { level: 'low' } })).toBe(false);
    });

    it('ist NICHT erfuellt ohne jede Angabe (sichere Default-Ablehnung)', () => {
      expect(isTop10Eligible({ asset_name: 'A', symbol: 'A' })).toBe(false);
    });
  });
});
