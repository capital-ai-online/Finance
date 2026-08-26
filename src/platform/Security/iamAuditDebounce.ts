// F-01 — Entprellung wiederholter identischer DENIED-Einträge in `iam_access_log`.
//
// Ausgangslage: ein Client, der eine abgewiesene Zone im Sekundentakt pollt, erzeugt pro Versuch
// eine Auditzeile. Zum Zeitpunkt des Sicherheitsreports waren dadurch 32 % des Logs selbst erzeugtes
// Rauschen; echte Denials gehen darin unter und die Tabelle wächst unbegrenzt.
//
// Diese Entprellung unterdrückt keine Evidenz, sie verdichtet sie: die erste Abweisung je
// Merkmalskombination wird immer geschrieben, Wiederholungen innerhalb des Fensters werden gezählt,
// und der Zähler reist mit dem nächsten geschriebenen Datensatz mit. Aus 1200 identischen Zeilen
// wird eine Zeile mit "1199 weitere unterdrückt" — für die Angriffserkennung ist das die bessere
// Darstellung, nicht die schlechtere.
//
// Bewusst NICHT entprellt werden GRANTED-Einträge: ein gewährter Zugriff ist einzeln
// nachweispflichtig und darf nicht zusammengefasst werden.

const DEFAULT_WINDOW_MS = 60_000;

// Der Schlüssel enthält die Client-IP. Ein Angreifer, der die IP variiert, könnte die Map sonst
// unbegrenzt wachsen lassen — deshalb eine harte Obergrenze mit FIFO-Verdrängung.
const DEFAULT_MAX_TRACKED_KEYS = 5_000;

interface DebounceWindow {
  openedAt: number;
  suppressed: number;
}

export interface AuditWriteDecision {
  /** true = Datensatz schreiben. false = identische Wiederholung innerhalb des Fensters. */
  write: boolean;
  /** Anzahl der seit dem letzten geschriebenen Datensatz unterdrückten Wiederholungen. */
  suppressedSincePrevious: number;
}

export interface IamAuditDebounce {
  decide(key: string, now?: number): AuditWriteDecision;
  trackedKeys(): number;
}

/** Stabiler Schlüssel über die Merkmale, die eine Abweisung fachlich identifizieren. */
export function buildDebounceKey(parts: {
  role: string;
  zone: string;
  reason?: string | null;
  ip?: string | null;
}): string {
  return [parts.role, parts.zone, parts.reason ?? '', parts.ip ?? ''].join('|');
}

export function createIamAuditDebounce(
  windowMs: number = DEFAULT_WINDOW_MS,
  maxTrackedKeys: number = DEFAULT_MAX_TRACKED_KEYS,
): IamAuditDebounce {
  const windows = new Map<string, DebounceWindow>();

  function evictOverflow(): void {
    if (windows.size <= maxTrackedKeys) return;
    // Map iteriert in Einfügereihenfolge — die ältesten Fenster fallen zuerst heraus.
    const overflow = windows.size - maxTrackedKeys;
    let removed = 0;
    for (const key of windows.keys()) {
      windows.delete(key);
      if (++removed >= overflow) break;
    }
  }

  return {
    decide(key: string, now: number = Date.now()): AuditWriteDecision {
      const current = windows.get(key);

      if (!current || now - current.openedAt >= windowMs) {
        const suppressedSincePrevious = current ? current.suppressed : 0;
        // Neu einfügen statt mutieren, damit der Eintrag in der FIFO-Ordnung nach hinten rutscht.
        windows.delete(key);
        windows.set(key, { openedAt: now, suppressed: 0 });
        evictOverflow();
        return { write: true, suppressedSincePrevious };
      }

      current.suppressed += 1;
      return { write: false, suppressedSincePrevious: 0 };
    },

    trackedKeys(): number {
      return windows.size;
    },
  };
}

/**
 * Hängt den Unterdrückungszähler an den Grund an, damit die verdichtete Information im Datensatz
 * selbst steht und nicht nur im Prozessspeicher existiert.
 */
export function annotateReason(reason: string | null | undefined, suppressed: number): string | null {
  if (suppressed <= 0) return reason ?? null;
  const base = reason ?? 'denied';
  return `${base} (+${suppressed} identische Wiederholungen unterdrückt)`;
}
