// F-01 / ADR-0067 — Poll-Abbruchpolicy für die administrativen Request-Orchestrator-Reads.
//
// Bewusst frei von React- und DOM-Abhängigkeiten, damit die sicherheitsrelevante Entscheidung
// "weiterpollen oder stoppen" in der bestehenden node-Vitest-Umgebung ausgeführt und nicht nur
// über einen Quelltextvergleich behauptet werden kann.
//
// Hintergrund: PR #541 hat `/api/orchestrator/stats` und `/ping-models` hinter den kanonischen
// IAM-Guard gestellt. Der Panel-Poll lief danach unverändert alle zwei Sekunden weiter und erzeugte
// pro Versuch einen DENIED-Datensatz in `iam_access_log`. Ein abgewiesener Aufruf wird durch
// Wiederholung nicht autorisiert — er verdünnt nur das Sicherheits-Auditlog.

/** HTTP-Status, die eine serverseitige Abweisung des Aufrufers bedeuten. */
export const REFUSAL_STATUS_CODES: readonly number[] = [401, 403, 429];

/**
 * Entscheidet, ob eine Antwort den automatischen Poll beenden muss.
 *
 * Nur Autorisierungs-/Rate-Limit-Abweisungen stoppen den Poll. Transiente Serverfehler (5xx) und
 * Netzwerkfehler tun das ausdrücklich nicht: dort ist ein erneuter Versuch sinnvoll, und der
 * Server hat den Aufrufer nicht abgelehnt.
 */
export function isRefusalStatus(status: number): boolean {
  return REFUSAL_STATUS_CODES.includes(status);
}

/**
 * Operator-Meldung zu einer Abweisung: was passiert ist, warum der Poll steht und was zu tun ist.
 */
export function describeRefusal(status: number): string {
  if (status === 429) {
    return 'Zu viele Autorisierungsversuche (429). Automatische Aktualisierung gestoppt – bitte kurz warten und erneut aktualisieren.';
  }
  return `Zugriff verweigert (${status}). Die Sitzung ist abgelaufen oder besitzt keine Supervisor-Rolle. Automatische Aktualisierung gestoppt – nach erneuter Anmeldung „Aktualisieren“ wählen.`;
}
