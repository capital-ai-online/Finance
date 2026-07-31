// ESS-0013-CONTRACTS Abschnitt 6, Discovery Contract — liest ausschliesslich
// deklarierte manifest.json-Felder (events.produces/events.consumes). Leitet
// Producer/Consumer niemals aus Quellcode-Analyse ab, solange keine Komponente ueber
// ausfuehrbaren Code verfuegt (Chapter 3 Prinzip, hier auf Discovery angewendet).
//
// Node-only (fs/path) - unproblematisch, da src/platform/EventMesh von keiner
// Frontend-Komponente importiert wird und daher nicht Teil des Vite-Browser-Bundles
// ist (vgl. server/compliance/scanners.ts fuer dasselbe Muster).

import fs from 'fs';
import path from 'path';
import type { DiscoveredComponent, ManifestEventsDeclaration } from '../Models/ManifestEventsDeclaration';

const PLATFORM_ROOT = path.join(process.cwd(), 'src', 'platform');
const EXCLUDE_DIRS = new Set(['EventMesh']);

function normalizeEvents(raw: unknown): ManifestEventsDeclaration {
  if (Array.isArray(raw)) {
    // Legacy-Form: events: [] (leeres Array, noch nicht nachgepflegt).
    return { produces: [], consumes: [] };
  }
  const obj = (raw ?? {}) as Partial<ManifestEventsDeclaration>;
  return {
    produces: Array.isArray(obj.produces) ? obj.produces : [],
    consumes: Array.isArray(obj.consumes) ? obj.consumes : [],
    note: obj.note,
  };
}

/**
 * Liest alle src/platform/<Komponente>/manifest.json Dateien (ausser EventMesh
 * selbst) und liefert deren deklarierte Producer/Consumer. Wird von
 * EventMeshService verwendet, um die Registry beim Start automatisch zu befuellen.
 */
export function discoverComponents(): DiscoveredComponent[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(PLATFORM_ROOT, { withFileTypes: true });
  } catch {
    return [];
  }

  const discovered: DiscoveredComponent[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || EXCLUDE_DIRS.has(entry.name)) continue;
    const manifestPath = path.join(PLATFORM_ROOT, entry.name, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      discovered.push({
        component: entry.name,
        manifestPath,
        events: normalizeEvents(raw.events),
      });
    } catch {
      // Nicht parsebares manifest.json wird uebersprungen, nicht als Fehler
      // eskaliert - Discovery darf den Registrierungsvorgang nicht abbrechen.
      continue;
    }
  }
  return discovered;
}
