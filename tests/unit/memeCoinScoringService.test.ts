// Audit ARCH-AUDIT-0002 (D5): Testabdeckung fuer den kritischen Scoring-Pfad.
// Deckt zugleich die in Q6 (ARCH-AUDIT-0002 Kapitel 14.1) konsolidierten Gewichte ab -
// eine Regression, bei der Formel und Response-Payload wieder auseinanderlaufen, faellt
// hier auf.

import { describe, it, expect } from 'vitest';
import { MemeCoinScoringService } from '../../src/services/memeCoinScoringService';
import type { MemeCoinInputs } from '../../src/types/memeCoin';

const neutralInputs: MemeCoinInputs = {
  coin: 'TEST',
  liquidity: 0.5, volume_trend: 0.5, trend_structure: 0.5, momentum: 0.5,
  volatility_quality: 0.5, social_sentiment: 0.5, narrative_strength: 0.5, catalyst_strength: 0.5,
  spread_penalty: 0, liquidity_penalty: 0, manipulation_penalty: 0, rugpull_penalty: 0, decay_penalty: 0,
  ai_confidence_bonus: 0,
};

describe('memeCoinScoringService', () => {
  it('das in der Antwort zurueckgegebene weights-Objekt stimmt mit den tatsaechlich verwendeten Formel-Gewichten ueberein', () => {
    // Regressionsschutz fuer Q6: weights wurde zuvor als separates, unabhaengiges Objekt
    // gepflegt und konnte von der Formel abweichen, ohne dass ein Test das bemerkt haette.
    const result = MemeCoinScoringService.scoreMemeCoin(neutralInputs);
    const sumOfWeights = Object.values(result.weights).reduce((a, b) => a + b, 0);
    expect(sumOfWeights).toBeCloseTo(0.95, 5); // 0.15+0.10+0.15+0.10+0.10+0.15+0.10+0.10 = 0.95
    expect(result.weights.liquidity).toBe(0.15);
    expect(result.weights.catalyst_strength).toBe(0.10);
  });

  it('base_score entspricht der gewichteten Summe der positiven Faktoren bei einheitlichen Eingaben', () => {
    const result = MemeCoinScoringService.scoreMemeCoin(neutralInputs);
    // Alle Positivfaktoren = 0.5, Gewichtssumme = 0.95 -> base_score = 0.5 * 0.95 * 100 = 47.5
    expect(result.base_score).toBeCloseTo(47.5, 5);
  });

  it('hoehere Risikofaktoren senken final_score gegenueber identischen Basisdaten', () => {
    const safe = MemeCoinScoringService.scoreMemeCoin(neutralInputs);
    const risky = MemeCoinScoringService.scoreMemeCoin({
      ...neutralInputs,
      spread_penalty: 0.1, liquidity_penalty: 0.1, manipulation_penalty: 0.1, rugpull_penalty: 0.1, decay_penalty: 0.1,
    });
    expect(risky.final_score).toBeLessThan(safe.final_score);
    expect(risky.risk_level).not.toBe(safe.risk_level === 'Low' ? 'Low' : risky.risk_level);
  });

  it('final_score bleibt im Bereich [0, 100]', () => {
    const extreme = MemeCoinScoringService.scoreMemeCoin({
      ...neutralInputs,
      liquidity: 1, volume_trend: 1, trend_structure: 1, momentum: 1, volatility_quality: 1,
      social_sentiment: 1, narrative_strength: 1, catalyst_strength: 1, ai_confidence_bonus: 0.05,
    });
    expect(extreme.final_score).toBeLessThanOrEqual(100);
    expect(extreme.final_score).toBeGreaterThanOrEqual(0);

    const worst = MemeCoinScoringService.scoreMemeCoin({
      ...neutralInputs,
      liquidity: 0, volume_trend: 0, trend_structure: 0, momentum: 0, volatility_quality: 0,
      social_sentiment: 0, narrative_strength: 0, catalyst_strength: 0,
      spread_penalty: 1, liquidity_penalty: 1, manipulation_penalty: 1, rugpull_penalty: 1, decay_penalty: 1,
    });
    expect(worst.final_score).toBeGreaterThanOrEqual(0);
  });

  it('vergibt fuer einen sehr hohen Score die Entscheidung A_setup', () => {
    const result = MemeCoinScoringService.scoreMemeCoin({
      ...neutralInputs,
      liquidity: 1, volume_trend: 1, trend_structure: 1, momentum: 1, volatility_quality: 1,
      social_sentiment: 1, narrative_strength: 1, catalyst_strength: 1,
    });
    expect(result.final_score).toBeGreaterThanOrEqual(90);
    expect(result.decision).toBe('A_setup');
  });

  it('vergibt fuer einen sehr niedrigen Score die Entscheidung reject', () => {
    const result = MemeCoinScoringService.scoreMemeCoin({
      ...neutralInputs,
      liquidity: 0, volume_trend: 0, trend_structure: 0, momentum: 0, volatility_quality: 0,
      social_sentiment: 0, narrative_strength: 0, catalyst_strength: 0,
    });
    expect(result.decision).toBe('reject');
  });

  describe('generateMemeCoinInputs', () => {
    it('ist deterministisch fuer dasselbe Symbol', () => {
      const a = MemeCoinScoringService.generateMemeCoinInputs('DOGE', 5);
      const b = MemeCoinScoringService.generateMemeCoinInputs('DOGE', 5);
      expect(a).toEqual(b);
    });
  });
});
