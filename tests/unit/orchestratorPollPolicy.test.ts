// F-01 / FO-05 — ausgeführte Evidenz für die Polling-Policy der administrativen
// Orchestrator-Reads. Die Policy bleibt React-/DOM-unabhängig testbar.

import { describe, expect, it } from 'vitest';
import {
  ORCHESTRATOR_POLL_BASE_INTERVAL_MS,
  ORCHESTRATOR_POLL_MAX_BACKOFF_MS,
  REFUSAL_STATUS_CODES,
  describeRefusal,
  getOrchestratorPollDelayMs,
  isAbortError,
  isRefusalStatus,
} from '../../src/lib/orchestratorPollPolicy';

describe('FO-05 Orchestrator-Polling-Policy', () => {
  it('stoppt automatische Retries bei serverseitiger Abweisung', () => {
    expect(isRefusalStatus(401)).toBe(true);
    expect(isRefusalStatus(403)).toBe(true);
    expect(isRefusalStatus(429)).toBe(true);
  });

  it('lässt Erfolg und transiente Serverfehler retry-fähig', () => {
    for (const status of [200, 204, 304, 404, 500, 502, 503, 504]) {
      expect(isRefusalStatus(status)).toBe(false);
    }
  });

  it('führt genau die drei Abweisungscodes und keine weiteren', () => {
    expect([...REFUSAL_STATUS_CODES].sort((a, b) => a - b)).toEqual([401, 403, 429]);
  });

  it('nutzt bounded exponential backoff statt blindem 2-Sekunden-Retry', () => {
    expect(ORCHESTRATOR_POLL_BASE_INTERVAL_MS).toBe(2_000);
    expect(ORCHESTRATOR_POLL_MAX_BACKOFF_MS).toBe(30_000);
    expect(getOrchestratorPollDelayMs(0)).toBe(2_000);
    expect(getOrchestratorPollDelayMs(1)).toBe(4_000);
    expect(getOrchestratorPollDelayMs(2)).toBe(8_000);
    expect(getOrchestratorPollDelayMs(3)).toBe(16_000);
    expect(getOrchestratorPollDelayMs(4)).toBe(30_000);
    expect(getOrchestratorPollDelayMs(20)).toBe(30_000);
  });

  it('normalisiert ungültige Failure-Counter fail-safe auf das Basisintervall', () => {
    expect(getOrchestratorPollDelayMs(-5)).toBe(2_000);
    expect(getOrchestratorPollDelayMs(Number.NaN)).toBe(2_000);
    expect(getOrchestratorPollDelayMs(Number.POSITIVE_INFINITY)).toBe(2_000);
    expect(getOrchestratorPollDelayMs(1.9)).toBe(4_000);
  });

  it('erkennt kontrollierte AbortErrors ohne sie als Retry-Fehler zu klassifizieren', () => {
    expect(isAbortError(new DOMException('aborted', 'AbortError'))).toBe(true);
    expect(isAbortError(new Error('network'))).toBe(false);
  });

  it('nennt dem Operator Ursache, Folge und nächsten Schritt', () => {
    const unauthorized = describeRefusal(401);
    expect(unauthorized).toContain('401');
    expect(unauthorized).toContain('Automatische Aktualisierung gestoppt');
    expect(unauthorized).toMatch(/Anmeldung/);

    const rateLimited = describeRefusal(429);
    expect(rateLimited).toContain('429');
    expect(rateLimited).toContain('Automatische Aktualisierung gestoppt');
    expect(rateLimited).toMatch(/warten/i);
    expect(rateLimited).not.toMatch(/Sitzung ist abgelaufen/);
  });

  it('unterscheidet Rollen-/Sitzungsabweisung von Rate-Limit', () => {
    expect(describeRefusal(403)).not.toEqual(describeRefusal(429));
    expect(describeRefusal(403)).toContain('Supervisor-Rolle');
  });
});
