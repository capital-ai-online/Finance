// FO-05 / F-01 — Polling-Policy für die administrativen Request-Orchestrator-Reads.
//
// Bewusst frei von React- und DOM-Abhängigkeiten, damit sicherheits- und lifecycle-relevante
// Entscheidungen in der bestehenden node-Vitest-Umgebung ausgeführt werden können.

/** HTTP-Status, die eine serverseitige Abweisung des Aufrufers bedeuten. */
export const REFUSAL_STATUS_CODES: readonly number[] = [401, 403, 429];

/** Erfolgsintervall für sichtbare, autorisierte Admin-Telemetrie. */
export const ORCHESTRATOR_POLL_BASE_INTERVAL_MS = 2_000;

/** Obergrenze für transientes Retry-Backoff, damit Fehler nicht zu aggressiv gepollt werden. */
export const ORCHESTRATOR_POLL_MAX_BACKOFF_MS = 30_000;

/**
 * Entscheidet, ob eine Antwort den automatischen Poll beenden muss.
 *
 * 401/403/429 werden nicht automatisch wiederholt. Transiente Netzwerk-/5xx-Fehler bleiben
 * retry-fähig, laufen aber mit bounded exponential backoff statt im festen 2-Sekunden-Takt.
 */
export function isRefusalStatus(status: number): boolean {
  return REFUSAL_STATUS_CODES.includes(status);
}

/**
 * Liefert die Verzögerung bis zum nächsten automatischen Poll.
 * 0 Fehler => 2s, 1 => 4s, 2 => 8s, 3 => 16s, ab 4 => maximal 30s.
 */
export function getOrchestratorPollDelayMs(consecutiveFailures: number): number {
  const normalizedFailures = Number.isFinite(consecutiveFailures)
    ? Math.max(0, Math.floor(consecutiveFailures))
    : 0;
  const exponentialDelay = ORCHESTRATOR_POLL_BASE_INTERVAL_MS * (2 ** normalizedFailures);
  return Math.min(ORCHESTRATOR_POLL_MAX_BACKOFF_MS, exponentialDelay);
}

/** Abort ist ein kontrollierter Lifecycle-Abbruch und kein Telemetriefehler. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';
}

/** Operator-Meldung zu einer Abweisung: Ursache, Folge und nächster Schritt. */
export function describeRefusal(status: number): string {
  if (status === 429) {
    return 'Zu viele Autorisierungsversuche (429). Automatische Aktualisierung gestoppt – bitte kurz warten und erneut aktualisieren.';
  }
  return `Zugriff verweigert (${status}). Die Sitzung ist abgelaufen oder besitzt keine Supervisor-Rolle. Automatische Aktualisierung gestoppt – nach erneuter Anmeldung „Aktualisieren“ wählen.`;
}
