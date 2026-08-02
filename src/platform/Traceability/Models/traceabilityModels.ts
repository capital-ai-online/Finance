// ESS-0011 / ADR-0015. Datenmodelle der Enterprise Traceability Matrix (ETM).
// ARCH-AUDIT-0002 (N4, Kapitel 14.4): erste lauffaehige Implementierung. Die ETM liest
// ausschliesslich real vorhandene Artefakte (ESS-Registry, ADR-Historie, Komponenten-Manifeste,
// Testdateien) und leitet daraus Verknuepfungen und Kennzahlen ab - sie erfindet keine.

export interface EssArtifact {
  id: string;
  title: string;
  status: string;
  implementedBy: string[];
}

export interface AdrArtifact {
  id: string;
  title: string;
  status: string;
}

export interface ComponentArtifact {
  name: string;
  path: string;
  manifestPath: string;
  status: string;
  ess: string[];
  adr: string[];
}

export interface TestArtifact {
  path: string;
  /** Repo-relative Pfade der per import(...) referenzierten Quelldateien. */
  targets: string[];
}

/** Eine gerichtete Kante der Matrix, z. B. ESS -> Component oder Component -> Test. */
export interface TraceabilityLink {
  from: { type: 'ess' | 'adr' | 'component' | 'test'; id: string };
  to: { type: 'ess' | 'adr' | 'component' | 'test'; id: string };
  /** true, wenn die Gegenrichtung ebenfalls belegt ist (siehe README "Traceability-Achsen"). */
  bidirectional: boolean;
}

export interface TraceabilityMatrix {
  generatedAt: string;
  ess: EssArtifact[];
  adr: AdrArtifact[];
  components: ComponentArtifact[];
  tests: TestArtifact[];
  links: TraceabilityLink[];
}

export interface CoverageReport {
  generatedAt: string;
  ess: {
    total: number;
    withComponent: number;
    ratio: number;
  };
  components: {
    total: number;
    implemented: number;
    withEss: number;
    withAdr: number;
    withTests: number;
    testRatio: number;
  };
  perComponent: Array<{
    name: string;
    status: string;
    essCount: number;
    adrCount: number;
    testCount: number;
  }>;
}

export interface OrphanFinding {
  type: 'ess-without-component' | 'component-without-ess' | 'adr-without-component' | 'implementedBy-path-missing';
  id: string;
  detail: string;
}
