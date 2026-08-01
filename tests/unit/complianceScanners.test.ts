// Audit ARCH-AUDIT-0002 (N6): Regressionsschutz fuer die ISO/IEC 27001:2022 Annex-A-
// Kontrollzuordnung der Compliance-Scanner. Prueft nur die Struktur (jeder Scanner hat
// ein isoControls-Array im dokumentierten Format), nicht die fachliche Richtigkeit der
// Zuordnung selbst - das bleibt eine bewusste Selbsteinschaetzung (siehe scanners.ts).

import { describe, it, expect } from 'vitest';
import { runAllScanners } from '../../server/compliance/scanners';

describe('compliance scanners', () => {
  it('liefert alle 21 registrierten Scanner', () => {
    const results = runAllScanners();
    expect(results.length).toBe(21);
  });

  it('jeder Scanner hat ein isoControls-Array (leer oder mit Eintraegen)', () => {
    const results = runAllScanners();
    for (const r of results) {
      expect(Array.isArray(r.isoControls), `${r.id}.isoControls`).toBe(true);
    }
  });

  it('jeder belegte ISO-Kontrolleintrag folgt dem Format "A.x.y Kurzbezeichnung"', () => {
    const results = runAllScanners();
    const pattern = /^A\.\d+\.\d+ .+/;
    for (const r of results) {
      for (const control of r.isoControls) {
        expect(control, `${r.id}: "${control}"`).toMatch(pattern);
      }
    }
  });

  it('mindestens die Sicherheits- und Daten-Scanner haben eine ISO-27001-Zuordnung', () => {
    const results = runAllScanners();
    const securityAndData = results.filter(r => r.type === 'SECURITY' || r.type === 'DATA');
    for (const r of securityAndData) {
      expect(r.isoControls.length, `${r.id} (${r.type})`).toBeGreaterThan(0);
    }
  });

  it('reine Code-Qualitaets-/Build-Scanner ohne Informationssicherheits-Bezug bleiben bewusst ohne Zuordnung', () => {
    const results = runAllScanners();
    const importIntegrity = results.find(r => r.id === 'QUA-02');
    const orphanComponents = results.find(r => r.id === 'QUA-03');
    expect(importIntegrity?.isoControls).toEqual([]);
    expect(orphanComponents?.isoControls).toEqual([]);
  });
});
