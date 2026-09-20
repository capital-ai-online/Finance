import fs from 'node:fs';
import path from 'node:path';
import { buildDocumentaryMaintenanceHandoff } from '../../src/platform/Documentary/Orchestration/DocumentaryMaintenanceHandoff';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

const impactPath = arg('impact') ?? 'artifacts/documentary/change-impact.json';
const autoSyncPath = arg('autosync') ?? 'artifacts/documentary/autosync-plan.json';
const output = arg('output') ?? 'artifacts/documentary/maintenance-handoff.json';

const impact = JSON.parse(fs.readFileSync(impactPath, 'utf8'));
const autoSync = JSON.parse(fs.readFileSync(autoSyncPath, 'utf8'));
const handoff = buildDocumentaryMaintenanceHandoff({ impact, autoSync });

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(handoff, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  output,
  state: handoff.state,
  autoSyncPaths: handoff.autoSyncPaths.length,
  semanticPatchPaths: handoff.semanticPatchPaths.length,
  reviewRequiredPaths: handoff.reviewRequiredPaths.length,
  authorizationRequired: handoff.requiredAuthorization.required,
}, null, 2));
