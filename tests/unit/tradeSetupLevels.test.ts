import { describe, it, expect } from 'vitest';
import { computeTradeSetupLevels } from '../../src/services/tradeSetupLevels';
import type { ReturnStats } from '../../src/services/realMarketSignals';

function stats(overrides: Partial<ReturnStats>): ReturnStats {
  return { dailyStdevPct: 2, rocPct: 0, sma: 100, last: 100, high: 110, low: 90, ...overrides };
}

describe('tradeSetupLevels.computeTradeSetupLevels', () => {
  it('klassifiziert als "long", wenn der letzte Kurs auf/ueber dem SMA liegt (identisch zu scoreTrend())', () => {
    const setup = computeTradeSetupLevels(stats({ last: 105, sma: 100 }));
    expect(setup.direction).toBe('long');
  });

  it('klassifiziert als "short", wenn der letzte Kurs unter dem SMA liegt', () => {
    const setup = computeTradeSetupLevels(stats({ last: 95, sma: 100 }));
    expect(setup.direction).toBe('short');
  });

  it('ordnet Long-Level monoton: SL2 < SL1 < Entry-Zone <= TP1 < TP2', () => {
    const setup = computeTradeSetupLevels(stats({ last: 105, sma: 100, high: 130, low: 80, dailyStdevPct: 3 }));
    expect(setup.stopLoss2).toBeLessThan(setup.stopLoss1);
    expect(setup.stopLoss1).toBeLessThan(setup.entryLow);
    expect(setup.entryLow).toBeLessThanOrEqual(setup.entryHigh);
    expect(setup.entryHigh).toBeLessThan(setup.takeProfit1);
    expect(setup.takeProfit1).toBeLessThan(setup.takeProfit2);
  });

  it('ordnet Short-Level monoton in umgekehrter Richtung: TP2 < TP1 < Entry-Zone <= SL1 < SL2', () => {
    const setup = computeTradeSetupLevels(stats({ last: 90, sma: 100, high: 130, low: 70, dailyStdevPct: 3 }));
    expect(setup.takeProfit2).toBeLessThan(setup.takeProfit1);
    expect(setup.takeProfit1).toBeLessThan(setup.entryLow);
    expect(setup.entryHigh).toBeLessThan(setup.stopLoss1);
    expect(setup.stopLoss1).toBeLessThan(setup.stopLoss2);
  });

  it('nutzt den strukturellen 30-Tage-Extremwert, wenn dieser weiter entfernt liegt als das 2x-Stdev-Band', () => {
    const setup = computeTradeSetupLevels(stats({ last: 100, sma: 100, high: 200, low: 10, dailyStdevPct: 1 }));
    expect(setup.takeProfit2).toBe(200);
    expect(setup.stopLoss2).toBe(10);
  });

  it('faellt niemals auf einen Null-/negativen Volatilitaetswert zurueck (Mindestband bei dailyStdevPct=0)', () => {
    const setup = computeTradeSetupLevels(stats({ last: 100, sma: 100, dailyStdevPct: 0, high: 100, low: 100 }));
    expect(setup.volatilityAbs).toBeGreaterThan(0);
    expect(setup.stopLoss1).toBeLessThan(setup.entryLow);
  });
});
