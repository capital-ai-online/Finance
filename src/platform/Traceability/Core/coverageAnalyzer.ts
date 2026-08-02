// ESS-0011. Berechnet Abdeckungskennzahlen ausschliesslich aus der uebergebenen Matrix -
// keine geschaetzten oder manuell gesetzten Werte (ESS-0001-CONTRACTS Chapter 12).
// ARCH-AUDIT-0002 (N4, Kapitel 14.4).

import type { ICoverageAnalyzer } from '../Interfaces';
import type { CoverageReport, TraceabilityMatrix } from '../Models/traceabilityModels';

export class CoverageAnalyzer implements ICoverageAnalyzer {
  analyze(matrix: TraceabilityMatrix): CoverageReport {
    const essWithComponent = new Set(
      matrix.links.filter(l => l.from.type === 'ess' && l.to.type === 'component').map(l => l.from.id),
    );
    const testCountByComponent = new Map<string, number>();
    for (const link of matrix.links) {
      if (link.from.type !== 'component' || link.to.type !== 'test') continue;
      testCountByComponent.set(link.from.id, (testCountByComponent.get(link.from.id) ?? 0) + 1);
    }

    const componentsWithTests = matrix.components.filter(c => (testCountByComponent.get(c.name) ?? 0) > 0);
    const implementedStatuses = new Set(['implemented', 'development']);

    return {
      generatedAt: matrix.generatedAt,
      ess: {
        total: matrix.ess.length,
        withComponent: essWithComponent.size,
        ratio: matrix.ess.length === 0 ? 0 : essWithComponent.size / matrix.ess.length,
      },
      components: {
        total: matrix.components.length,
        implemented: matrix.components.filter(c => implementedStatuses.has(c.status)).length,
        withEss: matrix.components.filter(c => c.ess.length > 0).length,
        withAdr: matrix.components.filter(c => c.adr.length > 0).length,
        withTests: componentsWithTests.length,
        testRatio: matrix.components.length === 0 ? 0 : componentsWithTests.length / matrix.components.length,
      },
      perComponent: matrix.components.map(c => ({
        name: c.name,
        status: c.status,
        essCount: c.ess.length,
        adrCount: c.adr.length,
        testCount: testCountByComponent.get(c.name) ?? 0,
      })),
    };
  }
}
