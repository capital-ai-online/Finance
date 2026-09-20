import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  applyDocumentaryAutoSyncPlan,
  planDocumentaryAutoSync,
} from '../../src/platform/Documentary/Automation/DocumentaryAutoSyncEngine';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

const output = arg('output') ?? 'artifacts/documentary/autosync-plan.json';
const sourceCommit = execFileSync('git', ['rev-parse', arg('head') ?? 'HEAD'], { encoding: 'utf8' }).trim();
const plan = planDocumentaryAutoSync({ sourceCommit });

if (process.argv.includes('--apply')) {
  applyDocumentaryAutoSyncPlan(plan);
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  output,
  sourceCommit,
  patches: plan.patches.length,
  paths: plan.patches.map((patch) => patch.path),
  applied: process.argv.includes('--apply'),
}, null, 2));
