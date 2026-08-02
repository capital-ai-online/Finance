// ESS-0011. Erkennung verknuepfbarer Artefakte fuer die Enterprise Traceability Matrix.
// ARCH-AUDIT-0002 (N4, Kapitel 14.4): liest ausschliesslich real vorhandene Dateien -
// .ai/registry/ess-registry.json, docs/adr/adr_history.json, src/platform/*/manifest.json,
// tests/**/*.test.ts. Fehlt eine Quelle, wirft die Funktion statt mit Annahmen weiterzuarbeiten
// (siehe README.md "Datenquellen": "Fehlt eine Quelle, meldet die ETM dies als Befund").

import fs from 'fs';
import path from 'path';
import type { AdrArtifact, ComponentArtifact, EssArtifact, TestArtifact } from '../Models/traceabilityModels';

const REPO_ROOT = process.cwd();

function readJson<T>(relPath: string): T {
  const full = path.join(REPO_ROOT, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Traceability-Quelle fehlt: ${relPath}`);
  }
  return JSON.parse(fs.readFileSync(full, 'utf8')) as T;
}

export function discoverEss(): EssArtifact[] {
  const registry = readJson<{ entries: Array<{ id: string; title: string; status: string; implementedBy?: string }> }>(
    '.ai/registry/ess-registry.json',
  );
  return registry.entries.map(e => ({
    id: e.id,
    title: e.title,
    status: e.status,
    implementedBy: e.implementedBy ? e.implementedBy.split(',').map(p => p.trim()).filter(Boolean) : [],
  }));
}

export function discoverAdr(): AdrArtifact[] {
  const history = readJson<Record<string, Array<{ title: string; status: string }>>>('docs/adr/adr_history.json');
  const result: AdrArtifact[] = [];
  for (const [id, versions] of Object.entries(history)) {
    if (!/^ADR-\d{4}(\.\d+)?$/.test(id)) continue; // ueberspringt Nicht-ADR-Schluessel wie "documentaryMetadata"
    const latest = versions[versions.length - 1];
    if (!latest) continue;
    result.push({ id, title: latest.title, status: latest.status });
  }
  return result;
}

/** Findet jedes manifest.json unter src/platform, beliebig tief - z. B.
 *  src/platform/Documentary/Governance/manifest.json neben src/platform/Documentary/manifest.json.
 *  Der Komponentenname ist der Pfad relativ zu src/platform (z. B. "Documentary/Governance"). */
export function discoverComponents(): ComponentArtifact[] {
  const platformDir = path.join(REPO_ROOT, 'src/platform');
  const components: ComponentArtifact[] = [];
  const walk = (dir: string) => {
    const manifestPath = path.join(dir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
        status?: string;
        ess?: string[];
        adr?: string[];
      };
      const relPath = path.relative(REPO_ROOT, dir).split(path.sep).join('/');
      components.push({
        name: path.relative(platformDir, dir).split(path.sep).join('/'),
        path: relPath,
        manifestPath: `${relPath}/manifest.json`,
        status: manifest.status ?? 'unknown',
        ess: manifest.ess ?? [],
        adr: manifest.adr ?? [],
      });
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name));
    }
  };
  walk(platformDir);
  return components.sort((a, b) => a.name.localeCompare(b.name));
}

/** Prueft, ob ein von der ESS-Registry referenzierter implementedBy-Pfad ausserhalb von
 *  src/platform (z. B. "src/agents", "src/orchestrator" - reguläre Quellverzeichnisse ohne
 *  Manifest-System, siehe ARCH-AUDIT-0002 Kapitel 4.3) wenigstens auf dem Dateisystem existiert.
 *  Nur ein tatsaechlich fehlender Pfad ist ein Befund. */
export function pathExistsOnDisk(relPath: string): boolean {
  return fs.existsSync(path.join(REPO_ROOT, relPath));
}

/** Extrahiert relative Import-Ziele (`from '../../x'`) aus einer Testdatei und loest sie
 *  gegen den Repository-Root auf. Nur lokale Imports zaehlen - Pakete wie 'vitest' nicht. */
function extractImportTargets(testFile: string, content: string): string[] {
  const targets = new Set<string>();
  const pattern = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(content))) {
    const resolved = path.normalize(path.join(path.dirname(testFile), m[1]));
    targets.add(path.relative(REPO_ROOT, resolved).split(path.sep).join('/'));
  }
  return [...targets];
}

export function discoverTests(): TestArtifact[] {
  const testsDir = path.join(REPO_ROOT, 'tests');
  if (!fs.existsSync(testsDir)) return [];
  const results: TestArtifact[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) {
        const content = fs.readFileSync(full, 'utf8');
        results.push({
          path: path.relative(REPO_ROOT, full).split(path.sep).join('/'),
          targets: extractImportTargets(full, content),
        });
      }
    }
  };
  walk(testsDir);
  return results;
}
