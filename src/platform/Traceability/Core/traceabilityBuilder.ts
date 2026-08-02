// ESS-0011. Kernlogik der Enterprise Traceability Matrix: verknuepft bereits vorhandene
// Artefakte, erzeugt keine eigenen. ARCH-AUDIT-0002 (N4, Kapitel 14.4): erste Implementierung.
//
// Abgedeckte Achsen dieser ersten Ausbaustufe: ESS <-> Component, Component <-> Test.
// ADR- und Event-/Interface-Achsen sind in den Manifesten vorhanden (siehe
// ComponentArtifact.adr) und fliessen in den Coverage-Report ein, werden hier aber nicht als
// bidirektionale Links gefuehrt, weil es fuer sie - anders als bei ESS und Test - keine zweite,
// unabhaengige Quelle gibt, gegen die sich eine Rueckrichtung pruefen liesse (ADR-Dokumente
// fuehren kein "implementedBy"-Feld). Ein unbelegter "bidirectional: true" waere an dieser
// Stelle selbst der Fehler, den dieses Audit an anderer Stelle beanstandet.

import { discoverAdr, discoverComponents, discoverEss, discoverTests } from '../Discovery/artifactDiscovery';
import type { ITraceabilityBuilder } from '../Interfaces';
import type { TraceabilityLink, TraceabilityMatrix } from '../Models/traceabilityModels';

export class TraceabilityBuilder implements ITraceabilityBuilder {
  build(): TraceabilityMatrix {
    const ess = discoverEss();
    const adr = discoverAdr();
    const components = discoverComponents();
    const tests = discoverTests();

    const componentByPath = new Map(components.map(c => [c.path, c]));
    const links: TraceabilityLink[] = [];

    for (const e of ess) {
      for (const implPath of e.implementedBy) {
        const component = componentByPath.get(implPath);
        if (!component) continue; // dangling Referenz - wird vom OrphanDetector gemeldet
        const bidirectional = component.ess.includes(e.id);
        links.push({
          from: { type: 'ess', id: e.id },
          to: { type: 'component', id: component.name },
          bidirectional,
        });
      }
    }

    for (const component of components) {
      for (const test of tests) {
        const references = test.targets.some(t => t === component.path || t.startsWith(`${component.path}/`));
        if (!references) continue;
        links.push({
          from: { type: 'component', id: component.name },
          to: { type: 'test', id: test.path },
          bidirectional: true, // Testdatei importiert die Komponente direkt - per Konstruktion belegt
        });
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      ess,
      adr,
      components,
      tests,
      links,
    };
  }
}
