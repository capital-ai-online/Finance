// Audit ARCH-AUDIT-0002 (D5): Testabdeckung fuer den kritischen Scoring/Ranking-Pfad.
// SC-7 phase A: composite level opt-in mapping parity (no formula change).

import { describe, it, expect } from 'vitest';
import {
  calculateRankScore,
  isTop10Eligible,
  isTop10GovernanceEligible,
  resolveRankingDqPoints,
  RANKING_SCORE_IMPACT_ENABLED,
  RANKING_COMPOSITE_OPT_IN_VERSION,
} from '../../src/services/ranking.service';
import { compositeLevelToRankingDqPoints } from '../../src/platform/MarketData/CompositeDataQuality';

const callerClassification = {
  category_main: 'Layer 1' as const,
  category_sub: 'Chain-native Asset' as const,
  asset_type: 'coin' as const,
  tier: 3 as const,
  confidence: 0.01,
  reasoning: [] as string[],
};

describe('ranking.service', () => {
  describe('SC-7 composite opt-in gates', () => {
    it('keeps ranking score impact disabled', () => {
      expect(RANKING_SCORE_IMPACT_ENABLED).toBe(false);
      expect(RANKING_COMPOSITE_OPT_IN_VERSION).toMatch(/^ranking-composite-opt-in\/1\./);
    });

    it('resolveRankingDqPoints matches compositeLevelToRankingDqPoints for all levels', () => {
      for (const level of ['high', 'medium', 'low', 'unknown'] as const) {
        const fromPayload = resolveRankingDqPoints({
          asset_name: 'A',
          symbol: 'A',
          data_quality: { level },
        });
        expect(fromPayload).toBe(compositeLevelToRankingDqPoints(level));
      }
    });

    it('optional compositeLevel overrides payload data_quality with same point map', () => {
      const payload = {
        asset_name: 'A',
        symbol: 'A',
        data_quality: { level: 'low' as const },
      };
      expect(resolveRankingDqPoints(payload)).toBe(40);
      expect(resolveRankingDqPoints(payload, { compositeLevel: 'high' })).toBe(100);
      expect(resolveRankingDqPoints(payload, { compositeLevel: 'medium' })).toBe(70);
    });

    it('calculateRankScore with compositeLevel high equals the high-DQ payload path', () => {
      const base = {
        asset_name: 'Bitcoin',
        symbol: 'BTC',
        classification: callerClassification,
        scores: { liquidity: 80 },
      };
      const viaPayload = calculateRankScore(
        { ...base, data_quality: { level: 'high' } },
        90,
      );
      const viaComposite = calculateRankScore(
        { ...base, data_quality: { level: 'unknown' } },
        90,
        { compositeLevel: 'high' },
      );
      expect(viaComposite).toBeCloseTo(viaPayload, 10);
      expect(viaPayload).toBeCloseTo(92, 5);
    });
  });

  describe('calculateRankScore', () => {
    it('gewichtet final_score, Datenqualitaet, kanonisches Tier und Liquiditaet gemaess 0.70/0.15/0.10/0.05', () => {
      const payload = {
        asset_name: 'Bitcoin',
        symbol: 'BTC',
        data_quality: { level: 'high' as const },
        classification: callerClassification,
        scores: { liquidity: 80 },
      };
      const score = calculateRankScore(payload, 90);
      expect(score).toBeCloseTo(92, 5);
    });

    it('caller-provided tier/confidence cannot manipulate the rank score', () => {
      const base = {
        asset_name: 'Bitcoin',
        symbol: 'BTC',
        data_quality: { level: 'high' as const },
        scores: { liquidity: 80 },
      };
      const spoofedLow = calculateRankScore({
        ...base,
        classification: callerClassification,
      }, 90);
      const spoofedHigh = calculateRankScore({
        ...base,
        classification: {
          ...callerClassification,
          tier: 1 as const,
          confidence: 1,
        },
      }, 90);
      expect(spoofedLow).toBeCloseTo(spoofedHigh, 10);
      expect(spoofedLow).toBeCloseTo(92, 5);
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
      asset_name: 'Bitcoin',
      symbol: 'BTC',
      classification: callerClassification,
      scores: { liquidity: 60 },
      data_quality: { level: 'high' as const },
    };

    it('ist erfuellt, wenn kanonische Confidence >= 0.65, Liquiditaet >= 50 und Datenqualitaet nicht low ist', () => {
      expect(isTop10Eligible(eligibleBase)).toBe(true);
    });

    it('ignoriert niedrige Caller-Confidence bei einem kanonisch bekannten Asset', () => {
      expect(
        isTop10Eligible({
          ...eligibleBase,
          classification: { ...eligibleBase.classification, confidence: 0 },
        }),
      ).toBe(true);
    });

    it('Caller-Classification kann ein kanonisch unbekanntes Asset nicht freischalten', () => {
      expect(isTop10Eligible({
        ...eligibleBase,
        asset_name: 'Unknown',
        symbol: 'UNKNOWN-ASSET',
        classification: {
          ...eligibleBase.classification,
          tier: 1 as const,
          confidence: 1,
        },
      })).toBe(false);
    });

    it('ist NICHT erfuellt bei Liquiditaet unter 50', () => {
      expect(isTop10Eligible({ ...eligibleBase, scores: { liquidity: 20 } })).toBe(false);
    });

    it('ist NICHT erfuellt bei Datenqualitaet low', () => {
      expect(isTop10Eligible({ ...eligibleBase, data_quality: { level: 'low' } })).toBe(false);
    });

    it('ist NICHT erfuellt ohne jede Angabe (sichere Default-Ablehnung)', () => {
      expect(isTop10Eligible({ asset_name: 'A', symbol: 'A' })).toBe(false);
    });

    it('governance-aware Zulassung verlangt explizite Eligibility und Runtime-Evidence', () => {
      expect(
        isTop10GovernanceEligible(eligibleBase, {
          eligible: true,
          operationsState: 'HEALTHY',
        }),
      ).toBe(true);
      expect(isTop10GovernanceEligible(eligibleBase)).toBe(false);
      expect(
        isTop10GovernanceEligible(eligibleBase, {
          eligible: false,
          operationsState: 'HEALTHY',
        }),
      ).toBe(false);
      expect(
        isTop10GovernanceEligible(eligibleBase, {
          eligible: true,
          operationsState: 'NO_RUNTIME_EVIDENCE',
        }),
      ).toBe(false);
      expect(
        isTop10GovernanceEligible(eligibleBase, {
          eligible: true,
          operationsState: 'HEALTHY',
          sourceConflict: true,
        }),
      ).toBe(false);
    });
  });
});
