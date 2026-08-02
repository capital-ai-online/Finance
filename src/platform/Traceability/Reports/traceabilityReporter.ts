// ESS-0011. Berichtsdatenerzeugung der Enterprise Traceability Matrix.
// ARCH-AUDIT-0002 (N4, Kapitel 14.4). Schreibt ausschliesslich generierte Dateien - siehe
// README.md ("Ablage der Matrix"): "Diese Dateien werden ausschliesslich generiert und
// niemals manuell bearbeitet."

import fs from 'fs';
import path from 'path';
import type { ITraceabilityReporter } from '../Interfaces';
import type { CoverageReport, OrphanFinding, TraceabilityMatrix } from '../Models/traceabilityModels';

const REPO_ROOT = process.cwd();
const KNOWLEDGE_DIR = path.join(REPO_ROOT, '.ai/knowledge/traceability');
const DOCS_DIR = path.join(REPO_ROOT, 'docs/traceability');

function writeJson(dir: string, file: string, data: unknown): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function toMarkdown(matrix: TraceabilityMatrix, coverage: CoverageReport, orphans: OrphanFinding[]): string {
  const pct = (n: number) => `${(n * 100).toFixed(0)} %`;
  const lines: string[] = [];
  lines.push('# Traceability Coverage Report');
  lines.push('');
  lines.push('Automatisch generiert von `src/platform/Traceability`. Nicht manuell bearbeiten.');
  lines.push('');
  lines.push(`Generiert am: ${matrix.generatedAt}`);
  lines.push('');
  lines.push('## Kennzahlen');
  lines.push('');
  lines.push('| Kennzahl | Wert |');
  lines.push('|---|---|');
  lines.push(`| ESS-Eintraege gesamt | ${coverage.ess.total} |`);
  lines.push(`| ESS mit verknuepfter Komponente | ${coverage.ess.withComponent} (${pct(coverage.ess.ratio)}) |`);
  lines.push(`| Plattformkomponenten gesamt | ${coverage.components.total} |`);
  lines.push(`| davon implementiert/in Entwicklung | ${coverage.components.implemented} |`);
  lines.push(`| davon mit ESS-Referenz | ${coverage.components.withEss} |`);
  lines.push(`| davon mit ADR-Referenz | ${coverage.components.withAdr} |`);
  lines.push(`| davon mit Testabdeckung | ${coverage.components.withTests} (${pct(coverage.components.testRatio)}) |`);
  lines.push('');
  lines.push('## Komponenten im Detail');
  lines.push('');
  lines.push('| Komponente | Status | ESS | ADR | Tests |');
  lines.push('|---|---|---|---|---|');
  for (const c of coverage.perComponent) {
    lines.push(`| ${c.name} | ${c.status} | ${c.essCount} | ${c.adrCount} | ${c.testCount} |`);
  }
  lines.push('');
  lines.push(`## Befunde (${orphans.length})`);
  lines.push('');
  if (orphans.length === 0) {
    lines.push('Keine.');
  } else {
    lines.push('| Typ | ID | Detail |');
    lines.push('|---|---|---|');
    for (const o of orphans) {
      lines.push(`| ${o.type} | ${o.id} | ${o.detail} |`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

export class TraceabilityReporter implements ITraceabilityReporter {
  write(matrix: TraceabilityMatrix, coverage: CoverageReport, orphans: OrphanFinding[]): void {
    writeJson(KNOWLEDGE_DIR, 'matrix.json', matrix);
    writeJson(KNOWLEDGE_DIR, 'coverage.json', coverage);
    writeJson(KNOWLEDGE_DIR, 'orphans.json', orphans);

    fs.mkdirSync(DOCS_DIR, { recursive: true });
    fs.writeFileSync(path.join(DOCS_DIR, 'COVERAGE_REPORT.md'), toMarkdown(matrix, coverage, orphans), 'utf8');
  }
}
