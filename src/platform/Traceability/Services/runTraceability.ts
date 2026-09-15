// ESS-0011. CLI-Einstiegspunkt der Enterprise Traceability Matrix.
// ARCH-AUDIT-0002 (N4, Kapitel 14.4): baut die Matrix, schreibt die Berichte unter
// .ai/knowledge/traceability/ und docs/traceability/, und fuehrt das `tests`-Feld in allen
// Komponenten-Manifesten nach - berechnet aus den tatsaechlich gefundenen Testdateien, nicht
// manuell gesetzt (ESS-0001-CONTRACTS Chapter 12). Aufruf: `npm run traceability:build`.

import fs from 'fs';
import path from 'path';
import { CoverageAnalyzer } from '../Core/coverageAnalyzer';
import { TraceabilityBuilder } from '../Core/traceabilityBuilder';
import { TraceabilityReporter } from '../Reports/traceabilityReporter';
import { registerMatrix } from '../Registry/traceabilityRegistry';
import { TraceabilityMatrixValidator } from '../Validators/traceabilityMatrixValidator';
import { eventMeshBus } from '../../EventMesh/Core/EventBus';
import { bootstrapEventMesh, isBootstrapped } from '../../EventMesh/Services/EventMeshService';
import type { OperationalTraceStateSourceRecord } from '../Contracts/OperationalTraceStateContract';
import { buildOperationalTraceStateProjection } from './OperationalTraceStateProjection';
import { buildPublishedTraceabilityEventOperationalSource } from './TraceabilityEventOperationalSource';

const REPO_ROOT = process.cwd();
const SOURCE_COMPONENT = 'src/platform/Traceability';
const OPERATIONAL_TRACE_OUTPUT = '.ai/knowledge/traceability/operational-state.json';
const operationalTraceSources: OperationalTraceStateSourceRecord[] = [];

// ARCH-AUDIT-0002 (N4-Folge, Kapitel 14.4, Traceability Stufe 3): Event-Veroeffentlichung ist
// best-effort und darf den eigentlichen Matrixlauf nicht gefaehrden - derselbe Grundsatz wie in
// src/platform/Supervisor/supervisor.ts (executeSupervised()).
//
// correlationId is always the existing Traceability runId. This prevents the EventPublisher from
// generating a new correlation per event and makes all events from one real run reproducibly bound.
function publishTraceabilityEvent(
  eventName: string,
  payload: Record<string, unknown>,
  correlationId: string,
): void {
  try {
    if (!isBootstrapped()) bootstrapEventMesh(eventMeshBus);
    const event = eventMeshBus.publish(eventName, payload, {
      sourceComponent: SOURCE_COMPONENT,
      correlationId,
      essReferences: ['ESS-0011'],
      adrReferences: ['ADR-0015', 'ADR-0018'],
    });
    operationalTraceSources.push(buildPublishedTraceabilityEventOperationalSource(event));
  } catch (e) {
    console.warn(`[traceability] Event "${eventName}" konnte nicht veroeffentlicht werden.`, e);
  }
}

function writeOperationalTraceStateProjection(generatedAt = new Date().toISOString()): void {
  const projection = buildOperationalTraceStateProjection(operationalTraceSources, generatedAt);
  const outputPath = path.join(REPO_ROOT, OPERATIONAL_TRACE_OUTPUT);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(projection, null, 2)}\n`, 'utf8');
}

// Befundtypen, die auf eine tatsaechlich falsche Angabe hindeuten (dangling Referenz), nicht
// nur auf eine noch unspezifizierte Komponente - nur diese lassen den Lauf fehlschlagen.
const HARD_FAILURE_TYPES = new Set(['implementedBy-path-missing', 'adr-without-component']);

function updateManifestTestsField(componentPath: string, testPaths: string[]): boolean {
  const manifestPath = path.join(REPO_ROOT, componentPath, 'manifest.json');
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(raw) as Record<string, unknown>;
  const sorted = [...testPaths].sort();
  if (JSON.stringify(manifest.tests) === JSON.stringify(sorted)) return false;

  const ordered: Record<string, unknown> = {};
  let inserted = false;
  for (const [key, value] of Object.entries(manifest)) {
    if (key === 'tests') continue; // wird unten neu gesetzt
    ordered[key] = value;
    if (key === 'documentation') {
      ordered.tests = sorted;
      inserted = true;
    }
  }
  if (!inserted) ordered.tests = sorted;

  fs.writeFileSync(manifestPath, `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
  return true;
}

function main() {
  const runId = new Date().toISOString();
  publishTraceabilityEvent('TraceabilityBuildStartedEvent', { runId }, runId);

  const builder = new TraceabilityBuilder();
  const matrix = builder.build();
  registerMatrix(matrix);

  const coverage = new CoverageAnalyzer().analyze(matrix);
  const orphans = new TraceabilityMatrixValidator().validate(matrix).findings;
  new TraceabilityReporter().write(matrix, coverage, orphans);
  publishTraceabilityEvent('TraceabilityReportGeneratedEvent', {
    runId,
    files: ['.ai/knowledge/traceability/matrix.json', '.ai/knowledge/traceability/coverage.json', '.ai/knowledge/traceability/orphans.json', 'docs/traceability/COVERAGE_REPORT.md'],
  }, runId);

  const testsByComponent = new Map<string, string[]>();
  for (const link of matrix.links) {
    if (link.from.type !== 'component' || link.to.type !== 'test') continue;
    const list = testsByComponent.get(link.from.id) ?? [];
    list.push(link.to.id);
    testsByComponent.set(link.from.id, list);
  }

  let manifestsUpdated = 0;
  for (const component of matrix.components) {
    const changed = updateManifestTestsField(component.path, testsByComponent.get(component.name) ?? []);
    if (changed) manifestsUpdated += 1;
  }

  publishTraceabilityEvent('CoverageCalculatedEvent', {
    runId,
    essCoverageRatio: coverage.ess.ratio,
    componentTestRatio: coverage.components.testRatio,
    componentsTotal: coverage.components.total,
  }, runId);
  if (orphans.length > 0) {
    publishTraceabilityEvent('OrphanDetectedEvent', {
      runId,
      count: orphans.length,
      findings: orphans.map(o => ({ type: o.type, id: o.id })),
    }, runId);
  }

  console.log(`[traceability] ${matrix.ess.length} ESS-Eintraege, ${matrix.components.length} Komponenten, ${matrix.tests.length} Testdateien, ${matrix.links.length} Verknuepfungen.`);
  console.log(`[traceability] ESS-Abdeckung: ${coverage.ess.withComponent}/${coverage.ess.total}. Testabdeckung: ${coverage.components.withTests}/${coverage.components.total} Komponenten.`);
  console.log(`[traceability] ${manifestsUpdated} Manifest(e) mit aktualisiertem tests-Feld beschrieben.`);
  console.log(`[traceability] ${orphans.length} Befund(e), davon ${orphans.filter(o => HARD_FAILURE_TYPES.has(o.type)).length} hart.`);

  const hardFailures = orphans.filter(o => HARD_FAILURE_TYPES.has(o.type));
  if (hardFailures.length > 0) {
    publishTraceabilityEvent('TraceabilityBuildFailedEvent', {
      runId,
      hardFailureCount: hardFailures.length,
      findings: hardFailures.map(f => ({ type: f.type, id: f.id })),
    }, runId);
    writeOperationalTraceStateProjection();
    for (const f of hardFailures) console.error(`[FEHLER] ${f.type}: ${f.detail}`);
    process.exit(1);
  }

  publishTraceabilityEvent('TraceabilityBuildCompletedEvent', {
    runId,
    essCount: matrix.ess.length,
    componentCount: matrix.components.length,
    testCount: matrix.tests.length,
    linkCount: matrix.links.length,
  }, runId);
  writeOperationalTraceStateProjection();
}

main();
