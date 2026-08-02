// ESS-0011-CONTRACTS. Oeffentliche Schnittstellen der Enterprise Traceability Matrix.
// ARCH-AUDIT-0002 (N4, Kapitel 14.4): erste Implementierung dieser Interfaces in Core/.

import type { CoverageReport, OrphanFinding, TraceabilityMatrix } from '../Models/traceabilityModels';

export interface ITraceabilityLink {
  from: { type: 'ess' | 'adr' | 'component' | 'test'; id: string };
  to: { type: 'ess' | 'adr' | 'component' | 'test'; id: string };
  bidirectional: boolean;
}

export interface ITraceabilityBuilder {
  build(): TraceabilityMatrix;
}

export interface ICoverageAnalyzer {
  analyze(matrix: TraceabilityMatrix): CoverageReport;
}

export interface IOrphanDetector {
  detect(matrix: TraceabilityMatrix): OrphanFinding[];
}

export interface ITraceabilityReporter {
  write(matrix: TraceabilityMatrix, coverage: CoverageReport, orphans: OrphanFinding[]): void;
}
