// Audit ARCH-AUDIT-0002 (J1): Testabdeckung fuer classifyTrendLabel() - ersetzt die fruehere
// hash-/hartkodiert-basierte Chartmuster-Zuweisung fuer das an Nutzer ausgelieferte
// `pattern`-Feld durch eine echte, aus Kurshistorie berechnete Trend-Einordnung.

import { describe, it, expect } from 'vitest';
import { classifyTrendLabel, computeReturnStats } from '../../src/services/realMarketSignals';

function statsFor(closes: number[]) {
  const stats = computeReturnStats(closes);
  if (!stats) throw new Error('computeReturnStats lieferte kein Ergebnis fuer den Testfall');
  return stats;
}

describe('classifyTrendLabel', () => {
  it('klassifiziert einen stetigen Kursanstieg als Aufwärtstrend', () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
    expect(classifyTrendLabel(statsFor(closes))).toBe('Aufwärtstrend');
  });

  it('klassifiziert einen stetigen Kursrueckgang als Abwärtstrend', () => {
    const closes = Array.from({ length: 30 }, (_, i) => 200 - i * 2);
    expect(classifyTrendLabel(statsFor(closes))).toBe('Abwärtstrend');
  });

  it('klassifiziert einen Kurs nahe am gleitenden Durchschnitt als Seitwärtsbewegung', () => {
    // Oszilliert eng um 100 - letzter Kurs bleibt nahe am Durchschnitt des Fensters.
    const closes = [100, 101, 99, 100, 101, 99, 100, 101, 99, 100];
    expect(classifyTrendLabel(statsFor(closes))).toBe('Seitwärtsbewegung');
  });
});
