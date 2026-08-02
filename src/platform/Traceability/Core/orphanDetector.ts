// ESS-0011. Erkennung nicht verknuepfter oder widerspruechlicher Artefakte.
// ARCH-AUDIT-0002 (N4, Kapitel 14.4): "Eine Verknuepfung, die ausschliesslich in einer
// Richtung existiert, ist ein Befund" (README.md, Traceability-Achsen).

import { pathExistsOnDisk } from '../Discovery/artifactDiscovery';
import type { IOrphanDetector } from '../Interfaces';
import type { OrphanFinding, TraceabilityMatrix } from '../Models/traceabilityModels';

export class OrphanDetector implements IOrphanDetector {
  detect(matrix: TraceabilityMatrix): OrphanFinding[] {
    const findings: OrphanFinding[] = [];
    const componentByPath = new Map(matrix.components.map(c => [c.path, c]));
    const adrIds = new Set(matrix.adr.map(a => a.id));

    for (const e of matrix.ess) {
      if (e.implementedBy.length === 0) {
        findings.push({
          type: 'ess-without-component',
          id: e.id,
          detail: `${e.id} ("${e.title}") hat kein implementedBy in der ESS-Registry.`,
        });
        continue;
      }
      for (const implPath of e.implementedBy) {
        if (componentByPath.has(implPath)) continue;
        // Pfade ausserhalb von src/platform (z. B. src/agents, src/orchestrator) haben kein
        // Manifest-System - hier reicht die Existenz auf dem Dateisystem als Beleg.
        if (!implPath.startsWith('src/platform/') && pathExistsOnDisk(implPath)) continue;
        findings.push({
          type: 'implementedBy-path-missing',
          id: e.id,
          detail: `ESS-Registry verweist fuer ${e.id} auf "${implPath}" - weder ein Manifest noch ein Verzeichnis unter diesem Pfad gefunden.`,
        });
      }
    }

    for (const c of matrix.components) {
      if (c.ess.length === 0) {
        findings.push({
          type: 'component-without-ess',
          id: c.name,
          detail: `${c.path}/manifest.json fuehrt kein ESS-Feld.`,
        });
      }
      for (const adrId of c.adr) {
        if (!adrIds.has(adrId)) {
          findings.push({
            type: 'adr-without-component',
            id: `${c.name}:${adrId}`,
            detail: `${c.path}/manifest.json verweist auf ${adrId}, das nicht in docs/adr/adr_history.json gefuehrt wird.`,
          });
        }
      }
    }

    return findings;
  }
}
