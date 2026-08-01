// Audit ARCH-AUDIT-0002 (D5, S1/S2/S5): Testabdeckung fuer den kritischen Scoring-Pfad.
// Seit S1/S2/S5 (AUD2-F-001) bezieht generateMemeCoinInputs() reale Marktdaten aus der
// AssetRegistry statt eines Zeichen-Hash-Generators - assetRegistry.getAsset()/getHistory()
// werden hier gemockt, damit die Tests deterministisch bleiben und keinen echten
// Netzwerkzugriff benoetigen. scoreMemeCoin() nutzt die dynamische Neugewichtung
// (renormalizeAndScore): fehlende Faktoren werden ausgeschlossen statt mit 0 bewertet.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemeCoinScoringService, MEME_COIN_WEIGHTS } from '../../src/services/memeCoinScoringService';
import { assetRegistry, type RegistryAsset, type HistoryResult } from '../../src/lib/assetRegistry';
import type { MemeCoinInputs } from '../../src/types/memeCoin';

const neutralInputs: MemeCoinInputs = {
  coin: 'TEST',
  liquidity: 0.5, trend_structure: 0.5, momentum: 0.5, volatility_quality: 0.5,
};

function makeAsset(overrides: Partial<RegistryAsset>): RegistryAsset {
  return {
    symbol: 'TST', name: 'Test Coin', type: 'crypto', subtype: 'memecoin', price: 1, change24h: 0,
    expectedReturn: 0, volatility: 0, drift: 0, risk: 'High', status: 'Verifiziert',
    volume24h: 0, score: 5,
    ...overrides,
  };
}

describe('memeCoinScoringService', () => {
  describe('scoreMemeCoin', () => {
    it('das in der Antwort zurueckgegebene weights-Objekt stimmt mit den tatsaechlich verwendeten Formel-Gewichten ueberein und summiert auf 1.00', () => {
      const result = MemeCoinScoringService.scoreMemeCoin(neutralInputs);
      const sumOfWeights = Object.values(result.weights).reduce((a, b) => a + b, 0);
      expect(sumOfWeights).toBeCloseTo(1.0, 5);
      expect(result.weights).toEqual(MEME_COIN_WEIGHTS);
    });

    it('final_score entspricht dem Rohwert bei einheitlichen Eingaben (alle Faktoren = 50)', () => {
      const result = MemeCoinScoringService.scoreMemeCoin(neutralInputs);
      expect(result.final_score).toBeCloseTo(50, 5);
    });

    it('schliesst fehlende Faktoren dynamisch aus der Gewichtung aus, statt sie als 0 zu werten', () => {
      // Nur liquidity vorhanden (typischer Fall fuer Meme-Coins ohne reale Kurshistorie) ->
      // dessen Gewichtsanteil wird auf 100% umgelegt, final_score muss dem Rohwert entsprechen.
      const result = MemeCoinScoringService.scoreMemeCoin({ coin: 'TEST', liquidity: 0.8 });
      expect(result.final_score).toBeCloseTo(80, 5);
      expect(result.data_quality.missing_fields).toEqual(
        expect.arrayContaining(['trend_structure', 'momentum', 'volatility_quality'])
      );
    });

    it('liefert final_score 0 und einen kritischen Alert, wenn kein einziger Faktor real belegt ist', () => {
      const result = MemeCoinScoringService.scoreMemeCoin({ coin: 'TEST' });
      expect(result.final_score).toBe(0);
      expect(result.alerts.some(a => a.includes('Kritisch'))).toBe(true);
    });

    it('kennzeichnet risk_level als unbekannt statt eines erfundenen Risikoscores (kein realer Risikofaktor mehr vorhanden)', () => {
      const result = MemeCoinScoringService.scoreMemeCoin(neutralInputs);
      expect(result.risk_level).toMatch(/Unbekannt/);
    });

    it('final_score bleibt im Bereich [0, 100]', () => {
      const extreme = MemeCoinScoringService.scoreMemeCoin({
        coin: 'TEST', liquidity: 1, trend_structure: 1, momentum: 1, volatility_quality: 1,
      });
      expect(extreme.final_score).toBeLessThanOrEqual(100);
      expect(extreme.final_score).toBeGreaterThanOrEqual(0);

      const worst = MemeCoinScoringService.scoreMemeCoin({
        coin: 'TEST', liquidity: 0, trend_structure: 0, momentum: 0, volatility_quality: 0,
      });
      expect(worst.final_score).toBeGreaterThanOrEqual(0);
    });

    it('vergibt fuer einen sehr hohen Score die Entscheidung A_setup', () => {
      const result = MemeCoinScoringService.scoreMemeCoin({
        coin: 'TEST', liquidity: 1, trend_structure: 1, momentum: 1, volatility_quality: 1,
      });
      expect(result.final_score).toBeGreaterThanOrEqual(90);
      expect(result.decision).toBe('A_setup');
    });

    it('vergibt fuer einen sehr niedrigen Score die Entscheidung reject', () => {
      const result = MemeCoinScoringService.scoreMemeCoin({
        coin: 'TEST', liquidity: 0, trend_structure: 0, momentum: 0, volatility_quality: 0,
      });
      expect(result.decision).toBe('reject');
    });
  });

  describe('generateMemeCoinInputs', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('berechnet liquidity aus realen Registry-Werten (Mrd./Mio. USD)', async () => {
      vi.spyOn(assetRegistry, 'getAsset').mockReturnValue(makeAsset({ marketCap: 100, volume24h: 20 }));
      vi.spyOn(assetRegistry, 'getHistory').mockResolvedValue({ points: [], source: 'simulated' } as HistoryResult);

      const inputs = await MemeCoinScoringService.generateMemeCoinInputs('DOGE', 5);
      expect(inputs.liquidity).toBeDefined();
      expect(inputs.liquidity!).toBeGreaterThanOrEqual(0);
      expect(inputs.liquidity!).toBeLessThanOrEqual(1);
    });

    it('laesst trend_structure/momentum/volatility_quality undefined, wenn getHistory nur simulierte Daten liefert', async () => {
      vi.spyOn(assetRegistry, 'getAsset').mockReturnValue(undefined);
      vi.spyOn(assetRegistry, 'getHistory').mockResolvedValue({ points: [], source: 'simulated' } as HistoryResult);

      const inputs = await MemeCoinScoringService.generateMemeCoinInputs('PEPE', 0);
      expect(inputs.trend_structure).toBeUndefined();
      expect(inputs.momentum).toBeUndefined();
      expect(inputs.volatility_quality).toBeUndefined();
    });

    it('berechnet trend_structure/momentum/volatility_quality aus einer echten (source: live) Kurshistorie', async () => {
      vi.spyOn(assetRegistry, 'getAsset').mockReturnValue(undefined);
      vi.spyOn(assetRegistry, 'getHistory').mockResolvedValue({
        points: [
          { date: '01.01.24', close: 100 },
          { date: '02.01.24', close: 105 },
          { date: '03.01.24', close: 98 },
        ],
        source: 'live',
      } as HistoryResult);

      const inputs = await MemeCoinScoringService.generateMemeCoinInputs('DOGE', 5);
      expect(inputs.trend_structure).toBeDefined();
      expect(inputs.momentum).toBeDefined();
      expect(inputs.volatility_quality).toBeDefined();
    });
  });
});
