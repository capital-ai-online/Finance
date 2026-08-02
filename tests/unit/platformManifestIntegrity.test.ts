import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Schliesst eine der drei in der letzten Architektur-Bewertung identifizierten Luecken:
// "23 leere Plattform-Scaffolds" (src/platform/*). Vollstaendiges Loeschen wuerde dem bereits
// etablierten Praezedenzfall widersprechen (src/platform/Core/manifest.json wurde von einem
// frueheren Audit bewusst auf status:"unspecified" korrigiert statt entfernt, um den
// reservierten ESS-Namensraum zu erhalten, auf den andere reale Module wie EventMesh/
// Traceability/Documentary/Governance in ihrem "dependencies"-Feld verweisen). Stattdessen wird
// hier die Ehrlichkeits-Invariante technisch erzwungen: der manifest.json "status" eines
// Plattform-Moduls muss zum tatsaechlichen Code-Bestand passen. Deckt den bei dieser Pruefung
// gefundenen konkreten Verstoss ab (Documentary/Governance behauptete "development" bei 0
// Code-Dateien) und verhindert das erneute Auftreten - fuer dieses wie fuer jedes kuenftige
// Modul.

const repoRoot = process.cwd();
const platformRoot = path.join(repoRoot, 'src/platform');

function findManifests(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findManifests(full));
    else if (entry.name === 'manifest.json') results.push(full);
  }
  return results;
}

function countRealCodeFiles(dir: string): number {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countRealCodeFiles(full);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.d.ts')) {
      count += 1;
    }
  }
  return count;
}

const manifestPaths = findManifests(platformRoot);

describe('platform module manifest status matches actual code presence', () => {
  it('finds at least one platform manifest (sanity check for the scan itself)', () => {
    expect(manifestPaths.length).toBeGreaterThan(0);
  });

  it.each(manifestPaths.map((absolutePath) => [path.relative(repoRoot, absolutePath), absolutePath] as const))(
    '%s',
    (_relativePath, absolutePath) => {
      const manifest = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      const moduleDir = path.dirname(absolutePath);
      const codeFileCount = countRealCodeFiles(moduleDir);

      if (manifest.status === 'unspecified') {
        // "unspecified" darf keinen aktiven Entwicklungsstand vortaeuschen: 0 Code erwartet.
        expect(codeFileCount).toBe(0);
      } else if (manifest.status === 'implemented' || manifest.status === 'development') {
        // Umgekehrt darf ein Modul, das aktive Arbeit oder Fertigstellung behauptet, nicht leer sein.
        expect(codeFileCount).toBeGreaterThan(0);
      }
    },
  );
});
