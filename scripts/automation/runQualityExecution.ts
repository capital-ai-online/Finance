import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  readQualityExecutionEvidence,
  writeQualityExecutionEvidence,
  type QualityExecutionPhase,
  type QualityExecutionRecord,
} from '../../src/platform/Quality/Execution/QualityExecutionEvidence';

const phase = process.argv[2] as QualityExecutionPhase | undefined;
if (phase !== 'test' && phase !== 'build') {
  console.error('[QualityExecution] usage: tsx scripts/automation/runQualityExecution.ts <test|build>');
  process.exit(2);
}

const repoRoot = process.cwd();
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const rawScript = phase === 'test' ? 'test:raw' : 'build:raw';
const command = `npm run ${rawScript}`;

function fullGitSha(): string {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' });
  const sha = result.stdout?.trim() ?? '';
  if (result.status !== 0 || !/^[0-9a-f]{40}$/i.test(sha)) {
    throw new Error('[QualityExecution] unable to resolve full Git HEAD SHA.');
  }
  return sha;
}

function containsContractTests(dir: string): boolean {
  if (!fs.existsSync(dir)) return false;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory() && containsContractTests(absolute)) return true;
    if (entry.isFile() && /\.(test|spec)\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) return true;
  }
  return false;
}

const sourceCommit = fullGitSha();
const previous = readQualityExecutionEvidence(repoRoot, sourceCommit);
const retained = previous?.records.filter((record) => {
  if (phase === 'test') return record.phase === 'build';
  return record.phase === 'contract' || record.phase === 'test';
}) ?? [];

const startedAt = new Date().toISOString();
const result = spawnSync(npmExecutable, ['run', rawScript], {
  cwd: repoRoot,
  stdio: 'inherit',
  env: process.env,
});
const exitCode = typeof result.status === 'number' ? result.status : 1;
const status = exitCode === 0 ? 'PASS' as const : 'FAIL' as const;

const evidenceRefs = phase === 'test'
  ? ['ESS-0001-CONTRACTS Chapter 12', 'package.json#scripts.test:raw']
  : ['ESS-0001-CONTRACTS Chapter 12', 'package.json#scripts.build:raw'];

const records: QualityExecutionRecord[] = [
  ...retained,
  {
    phase,
    status,
    checkedAt: startedAt,
    sourceCommit,
    command,
    exitCode,
    evidenceRefs,
  },
];

if (phase === 'test' && status === 'PASS' && containsContractTests(path.join(repoRoot, 'tests', 'contract'))) {
  records.push({
    phase: 'contract',
    status: 'PASS',
    checkedAt: startedAt,
    sourceCommit,
    command: `${command} (includes tests/contract)`,
    exitCode: 0,
    evidenceRefs: [
      'ESS-0001-CONTRACTS Chapter 12',
      'tests/contract',
      'package.json#scripts.test:raw',
    ],
  });
}

const snapshot = writeQualityExecutionEvidence(repoRoot, sourceCommit, records);
console.log(`[QualityExecution] ${phase}=${status}; evidence=${snapshot.records.map((record) => `${record.phase}:${record.status}`).join(',')}`);
process.exit(exitCode);
