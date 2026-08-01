// Audit ARCH-AUDIT-0002 (D5): Testabdeckung fuer den kritischen Scoring-Pfad.
// Diese Tests pruefen die Berechnungslogik (Gewichtung, Clamping, Determinismus) der
// bestehenden Engines - nicht die fachliche Richtigkeit der Eingangsgroessen selbst
// (siehe AUD2-F-001, Kapitel 6 des Audits: die Eingangsgroessen sind bekanntermassen
// synthetisch, das ist hier bewusst NICHT Testgegenstand).

import { describe, it, expect } from 'vitest';
import { calculateBaseScore, calculateDefiScore, calculateValueCorridor, generateCryptoScores } from '../../src/services/scoring.service';
import type { CryptoScores } from '../../src/types/crypto.types';

describe('scoring.service', () => {
  describe('generateCryptoScores', () => {
    it('ist deterministisch fuer dasselbe Symbol und denselben change24h-Wert', () => {
      const a = generateCryptoScores('DOGE', 3.5);
      const b = generateCryptoScores('DOGE', 3.5);
      expect(a).toEqual(b);
    });

    it('ist unabhaengig von Gross-/Kleinschreibung und Whitespace des Symbols', () => {
      const a = generateCryptoScores('ada', 1.0);
      const b = generateCryptoScores(' ADA ', 1.0);
      expect(a).toEqual(b);
    });

    it('liefert fuer unterschiedliche Symbole in aller Regel unterschiedliche Werte', () => {
      const a = generateCryptoScores('XRP', 0);
      const b = generateCryptoScores('LTC', 0);
      expect(a).not.toEqual(b);
    });

    it('haelt alle Faktoren im Wertebereich [0, 100]', () => {
      for (const symbol of ['BTC', 'ETH', 'SOL', 'AAVE', 'XYZ123', 'A', '']) {
        const scores = generateCryptoScores(symbol, 25) as unknown as Record<string, number>;
        for (const [key, value] of Object.entries(scores)) {
          if (key === 'final_score') continue;
          expect(value, `${symbol}.${key}`).toBeGreaterThanOrEqual(0);
          expect(value, `${symbol}.${key}`).toBeLessThanOrEqual(100);
        }
      }
    });

    it('verwendet fuer BTC/ETH/SOL fest hinterlegte Sonderwerte statt des Hash-Seeds', () => {
      const btc = generateCryptoScores('BTC', 0);
      expect(btc.security).toBe(97);
      expect(btc.marketCap).toBe(98);
    });
  });

  describe('calculateBaseScore', () => {
    const maxInputs: Partial<CryptoScores> = {
      marketCap: 100, liquidity: 100, volumeQuality: 100, tokenomics: 100,
      supplyTransparency: 100, networkActivity: 100, security: 100, developerActivity: 100,
      utility: 100, feeGeneration: 100, revenue: 100, governanceStrength: 100, adoption: 100,
      risk: 0, volatility: 0, sentiment: 100, compliance: 100,
    };

    it('clampt das Ergebnis nach oben auf 100, auch wenn die Gewichtssumme rechnerisch mehr ergeben wuerde', () => {
      const result = calculateBaseScore({ asset_name: 'Test', symbol: 'TEST', scores: maxInputs });
      expect(result.final_score).toBeLessThanOrEqual(100);
      expect(result.final_score).toBe(100);
    });

    it('liefert 0 fuer durchgehend minimale Eingangsgroessen (maximales Risiko)', () => {
      const minInputs: Partial<CryptoScores> = {
        marketCap: 0, liquidity: 0, volumeQuality: 0, tokenomics: 0, supplyTransparency: 0,
        networkActivity: 0, security: 0, developerActivity: 0, utility: 0, feeGeneration: 0,
        revenue: 0, governanceStrength: 0, adoption: 0, risk: 100, volatility: 100, sentiment: 0,
        compliance: 0,
      };
      const result = calculateBaseScore({ asset_name: 'Test', symbol: 'TEST', scores: minInputs });
      expect(result.final_score).toBe(0);
    });

    it('ein hoeherer risk-Wert senkt den final_score (risikoadjustierte Gewichtung wirkt in die richtige Richtung)', () => {
      // Bewusst moderate statt maximale Werte, damit der Effekt nicht vom oberen Clamp (100)
      // verdeckt wird - mit maxInputs waeren beide Ergebnisse ohnehin auf 100 geclampt.
      const low = calculateBaseScore({ asset_name: 'A', symbol: 'A', scores: { marketCap: 50, risk: 10 } });
      const high = calculateBaseScore({ asset_name: 'A', symbol: 'A', scores: { marketCap: 50, risk: 90 } });
      expect(low.final_score!).toBeGreaterThan(high.final_score!);
    });

    it('behandelt fehlende scores als endliche Zahl statt zu werfen', () => {
      // Ein komplett leeres scores-Objekt bedeutet risk ?? 0 -> riskAdjusted = 100 - 0 = 100,
      // d.h. fehlende Risikodaten werden als "risikofrei" gewertet, nicht als neutral - das
      // ist ein bestehendes Formelverhalten, kein Test-Fehler.
      expect(() => calculateBaseScore({ asset_name: 'Empty', symbol: 'EMPTY' })).not.toThrow();
      const result = calculateBaseScore({ asset_name: 'Empty', symbol: 'EMPTY' });
      expect(Number.isFinite(result.final_score)).toBe(true);
      expect(result.final_score).toBeGreaterThanOrEqual(0);
      expect(result.final_score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateDefiScore', () => {
    it('clampt das Ergebnis auf [0, 100]', () => {
      const result = calculateDefiScore({
        asset_name: 'DeFi Test', symbol: 'DFT',
        scores: { feeGeneration: 100, tvlQuality: 100, utility: 100, tokenomics: 100, liquidity: 100, security: 100, governanceStrength: 100, adoption: 100, risk: 0 },
      });
      expect(result.final_score).toBeLessThanOrEqual(100);
      expect(result.final_score).toBeGreaterThanOrEqual(0);
    });

    it('uebernimmt tvlQuality unveraendert in das Ergebnisobjekt', () => {
      const result = calculateDefiScore({ asset_name: 'A', symbol: 'A', scores: { tvlQuality: 73 } });
      expect(result.tvlQuality).toBe(73);
    });
  });

  describe('calculateValueCorridor', () => {
    it('ordnet conservative < neutral < optimistic fuer einen positiven Score', () => {
      const corridor = calculateValueCorridor(80);
      expect(corridor.conservative).toBeLessThan(corridor.neutral);
      expect(corridor.neutral).toBeLessThanOrEqual(corridor.optimistic);
    });

    it('liefert fairValueGapPct von 0 ohne Marktreferenzpreis', () => {
      const corridor = calculateValueCorridor(80);
      expect(corridor.fairValueGapPct).toBe(0);
    });

    it('berechnet die prozentuale Abweichung korrekt, wenn eine Marktreferenz vorliegt', () => {
      const corridor = calculateValueCorridor(100, 50);
      // neutral = clamp(100) = 100; gap = (100 - 50) / 50 * 100 = 100%
      expect(corridor.fairValueGapPct).toBeCloseTo(100, 5);
    });
  });
});
