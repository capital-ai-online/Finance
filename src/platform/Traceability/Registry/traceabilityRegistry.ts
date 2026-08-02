// ESS-0011. Registrierung der zuletzt gebauten Matrix fuer den laufenden Prozess.
// ARCH-AUDIT-0002 (N4, Kapitel 14.4): haelt ausschliesslich das Ergebnis eines Builder-Laufs
// im Prozessspeicher vor, damit Reporter und aufrufender Code dieselbe Matrix referenzieren,
// ohne sie mehrfach neu zu bauen. Keine Persistenz - die persistente Ablage erfolgt gemaess
// README.md ("Ablage der Matrix") ausschliesslich ueber den Reporter unter
// .ai/knowledge/traceability/.

import type { TraceabilityMatrix } from '../Models/traceabilityModels';

let current: TraceabilityMatrix | null = null;

export function registerMatrix(matrix: TraceabilityMatrix): void {
  current = matrix;
}

export function getRegisteredMatrix(): TraceabilityMatrix | null {
  return current;
}
