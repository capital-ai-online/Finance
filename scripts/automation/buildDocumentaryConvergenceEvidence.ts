import fs from 'node:fs';
import path from 'node:path';
import { buildDocumentaryConvergenceEvidence } from '../../src/platform/Documentary/Orchestration/DocumentaryConvergenceEvidence';
import type { ApplicationChangeImpact } from '../../src/platform/Documentary/Discovery/ApplicationChangeImpactAnalyzer';
import type { DocumentaryAutoSyncPlan } from '../../src/platform/Documentary/Automation/DocumentaryAutoSyncEngine';
import type { DocumentaryMaintenanceHandoff } from '../../src/platform/Documentary/Orchestration/DocumentaryMaintenanceHandoff';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

const impactPath = arg('impact') ?? 'artifacts/documentary/change-impact.json';
const autoSyncPath = arg('autosync') ?? 'artifacts/documentary/autosync-plan.json';
const handoffPath = arg('handoff') ?? 'artifacts/documentary/maintenance-handoff.json';
const outputPath = arg('output') ?? 'artifacts/documentary/convergence-evidence.json';
const concurrencyKey = arg('concurrency-key') ?? 'documentary-change-impact-main';
const observedCurrentMain = arg('current-main') === 'true';

const evidence = buildDocumentaryConvergenceEvidence({
  impact: readJson<ApplicationChangeImpact>(impactPath),
  autoSync: readJson<DocumentaryAutoSyncPlan>(autoSyncPath),
  handoff: readJson<DocumentaryMaintenanceHandoff>(handoffPath),
  observedCurrentMain,
  concurrencyKey,
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  output: outputPath,
  parentWorkPackage: evidence.parentWorkPackage,
  role: evidence.role,
  sourceCommit: evidence.sourceCommit,
  observedCurrentMain: evidence.observedCurrentMain,
  impactState: evidence.impactState,
  selfHealingContractVersion: evidence.selfHealingContract.version,
  selfHealingContractValid: evidence.selfHealingContract.valid,
  convergenceClaim: evidence.convergenceClaim,
}, null, 2));
