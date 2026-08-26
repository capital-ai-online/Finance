// F-01 / ADR-0067 — ausgeführte Evidenz für die Poll-Abbruchpolicy der administrativen
// Orchestrator-Reads.
//
// Diese Ebene prüft die Entscheidung selbst, nicht ihren Quelltext: Welche HTTP-Antworten beenden
// den 2-Sekunden-Poll, welche nicht, und was bekommt der Operator zu sehen. Die Verdrahtung im
// React-Panel wird ergänzend in orchestratorAdminReadBoundary.test.ts statisch abgesichert, weil
// die Vitest-Umgebung dieses Repositories `node` ist und keine Komponenten rendern kann.

import { describe, expect, it } from 'vitest';
import {
  REFUSAL_STATUS_CODES,
  describeRefusal,
  isRefusalStatus,
} from '../../src/lib/orchestratorPollPolicy';

describe('F-01 Orchestrator-Poll-Abbruchpolicy', () => {
  it('stoppt den Poll bei jeder serverseitigen Abweisung', () => {
    // 401 = kein/ungültiger Bearer, 403 = Rolle außerhalb SUPERVISOR_ZONE_ROLES,
    // 429 = Autorisierungs-Rate-Limit. Alle drei werden durch Wiederholung nicht besser.
    expect(isRefusalStatus(401)).toBe(true);
    expect(isRefusalStatus(403)).toBe(true);
    expect(isRefusalStatus(429)).toBe(true);
  });

  it('hält den Poll bei Erfolg und bei transienten Serverfehlern am Laufen', () => {
    // 5xx und 404 sind keine Abweisung des Aufrufers — hier ist ein erneuter Versuch sinnvoll,
    // und ein Stopp würde das Panel bei einem kurzen Deploy-Fenster dauerhaft einfrieren.
    for (const status of [200, 204, 304, 404, 500, 502, 503, 504]) {
      expect(isRefusalStatus(status)).toBe(false);
    }
  });

  it('führt genau die drei Abweisungscodes und keine weiteren', () => {
    expect([...REFUSAL_STATUS_CODES].sort((a, b) => a - b)).toEqual([401, 403, 429]);
  });

  it('nennt dem Operator Ursache, Folge und nächsten Schritt', () => {
    const unauthorized = describeRefusal(401);
    expect(unauthorized).toContain('401');
    expect(unauthorized).toContain('Automatische Aktualisierung gestoppt');
    expect(unauthorized).toMatch(/Anmeldung/);

    const rateLimited = describeRefusal(429);
    expect(rateLimited).toContain('429');
    expect(rateLimited).toContain('Automatische Aktualisierung gestoppt');
    // Ein Rate-Limit erfordert keine erneute Anmeldung, sondern Warten.
    expect(rateLimited).toMatch(/warten/i);
    expect(rateLimited).not.toMatch(/Sitzung ist abgelaufen/);
  });

  it('unterscheidet Rollen-/Sitzungsabweisung von Rate-Limit', () => {
    expect(describeRefusal(403)).not.toEqual(describeRefusal(429));
    expect(describeRefusal(403)).toContain('Supervisor-Rolle');
  });

  it('ist frei von React-/DOM-Abhängigkeiten', async () => {
    // Die Policy muss in der node-Umgebung ohne jsdom ladbar bleiben, damit diese Ebene
    // ausgeführte statt behauptete Evidenz liefert.
    const mod = await import('../../src/lib/orchestratorPollPolicy');
    expect(Object.keys(mod).sort()).toEqual([
      'REFUSAL_STATUS_CODES',
      'describeRefusal',
      'isRefusalStatus',
    ]);
  });
});
