// P0 Scoring Integrity tests for the critical deterministic scoring path.
// Registry bootstrap values intentionally do not count as verified market observations unless
// field-level provenance is available. At this stage generateCryptoScores() therefore accepts
// only real history (`source: live`) and returns no fabricated substitutes.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateBaseScore, calculateDefiScore, calculateValueCorridor, generateCryptoScores } from '../../src/services/scoring.service';
import { assetRegistry, type RegistryAsset, type HistoryResult } from '../../src/lib/assetRegistry';
import type { CryptoScores } from '../../src/types/crypto.types';

function makeAsset(overrides: Partial<RegistryAsset>): RegistryAsset {
  return {
    symbol: 'TST', name: 'Test Coin', type: 'crypto', price: 100, change24h: 0,
    expectedReturn: 0, volatility: 0, drift: 0, risk: 'High', status: 'Verifiziert',
    volume24h: 0, score: 5,
    ...overrides,
  };
}

describe('scoring.service', () => {
  describe('generateCryptoScores', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('liefert keine Faktoren, wenn keine reale Historie vorliegt', async () => {
      vi.spyOn(assetRegistry, 'getAsset').mockReturnValue(undefined);
      vi.spyOn(assetRegistry, 'getHistory').mockResolvedValue({ points: [], source: 'simulated' } as HistoryResult);

      const scores = await generateCryptoScores('UNKNOWNXYZ', 0);
      expect(scores).toEqual({});
    });

    it('verwendet Registry-Bootstrapwerte ohne Provenance nicht fuer marketCap/liquidity', async () => {
      vi.spyOn(assetRegistry, 'getAsset').mockReturnValue(makeAsset({ marketCap: 100, volume24h: 20 }));
      vi.spyOn(assetRegistry, 'getHistory').mockResolvedValue({ points: [], source: 'simulated' } as HistoryResult);

      const scores = await generateCryptoScores('TST', 0);
      expect(scores.marketCap).toBeUndefined();
      expect(scores.liquidity).toBeUndefined();
    });

    it('verwendet Registry-Supplywerte ohne Provenance nicht fuer tokenomics/supplyTransparency', async () => {
      vi.spyOn(assetRegistry, 'getAsset').mockReturnValue(
        makeAsset({ circulatingSupply: 50_000_000, maxSupply: 100_000_000 })
      );
      vi.spyOn(assetRegistry, 'getHistory').mockResolvedValue({ points: [], source: 'simulated' } as HistoryResult);

      const scores = await generateCryptoScores('TST', 0);
      expect(scores.tokenomics).toBeUndefined();
      expect(scores.supplyTransparency).toBeUndefined();
    });

    it('berechnet volatility nur aus einer echten (source: live) Kurshistorie', async () => {
      vi.spyOn(assetRegistry, 'getHistory').mockResolvedValue({
        points: [
          { date: '2026-07-30', close: 100 },
          { date: '2026-07-31', close: 105 },
          { date: '2026-08-01', close: 98 },
        ],
        source: 'live',
      } as HistoryResult);

      const scores = await generateCryptoScores('TST', 0);
      expect(scores.volatility).toBeDefined();
      expect(scores.volatility!).toBeGreaterThanOrEqual(0);
      expect(scores.volatility!).toBeLessThanOrEqual(100);
    });

    it('laesst volatility undefined, wenn getHistory nur simulierte Daten liefert', async () => {
      vi.spyOn(assetRegistry, 'getHistory').mockResolvedValue({
        points: [{ date: '2026-07-31', close: 100 }, { date: '2026-08-01', close: 105 }],
        source: 'simulated',
      } as HistoryResult);

      const scores = await generateCryptoScores('TST', 0);
      expect(scores.volatility).toBeUndefined();
    });
  });

  describe('calculateBaseScore', () => {
    const maxInputs: Partial<CryptoScores> = {
      marketCap: 100, liquidity: 100, tokenomics: 100, supplyTransparency: 100,
      networkActivity: 100, security: 100, utility: 100, adoption: 100,
      risk: 0, volatility: 0, sentiment: 100,
    };

    it('clampt das Ergebnis nach oben auf 100, wenn alle Faktoren optimal sind', () => {
      const result = calculateBaseScore({ asset_name: 'Test', symbol: 'TEST', scores: maxInputs });
      expect(result.final_score).toBeLessThanOrEqual(100);
      expect(result.final_score).toBe(100);
    });

    it('liefert 0 fuer durchgehend minimale vorhandene Eingangsgroessen', () => {
      const minInputs: Partial<CryptoScores> = {
        marketCap: 0, liquidity: 0, tokenomics: 0, supplyTransparency: 0,
        networkActivity: 0, security: 0, utility: 0, adoption: 0,
        risk: 100, volatility: 100, sentiment: 0,
      };
      const result = calculateBaseScore({ asset_name: 'Test', symbol: 'TEST', scores: minInputs });
      expect(result.final_score).toBe(0);
    });

    it('ein hoeherer risk-Wert senkt den final_score', () => {
      const low = calculateBaseScore({ asset_name: 'A', symbol: 'A', scores: { marketCap: 50, risk: 10 } });
      const high = calculateBaseScore({ asset_name: 'A', symbol: 'A', scores: { marketCap: 50, risk: 90 } });
      expect(low.final_score!).toBeGreaterThan(high.final_score!);
    });

    it('wirft SCORE_NOT_COMPUTABLE wenn keine verifizierten Score-Faktoren vorhanden sind', () => {
      expect(() => calculateBaseScore({ asset_name: 'Empty', symbol: 'EMPTY' }))
        .toThrow(/SCORE_NOT_COMPUTABLE/);
    });

    it('schliesst fehlende Faktoren dynamisch aus der Gewichtung aus', () => {
      const result = calculateBaseScore({ asset_name: 'A', symbol: 'A', scores: { marketCap: 60 } });
      expect(result.final_score).toBe(60);
    });
  });

  describe('calculateDefiScore', () => {
    it('clampt das Ergebnis auf [0, 100] und erreicht 100 bei optimalen Faktoren', () => {
      const result = calculateDefiScore({
        asset_name: 'DeFi Test', symbol: 'DFT',
        scores: {
          liquidity: 100, tokenomics: 100, marketCap: 100, volatility: 0, utility: 100,
          adoption: 100, security: 100, networkActivity: 100, risk: 0,
        },
      });
      expect(result.final_score).toBeLessThanOrEqual(100);
      expect(result.final_score).toBe(100);
    });

    it('uebernimmt uebergebene Rohwerte unveraendert in das Ergebnisobjekt', () => {
      const result = calculateDefiScore({ asset_name: 'A', symbol: 'A', scores: { tokenomics: 73 } });
      expect(result.tokenomics).toBe(73);
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
      expect(corridor.fairValueGapPct).toBeCloseTo(100, 5);
    });
  });
});
