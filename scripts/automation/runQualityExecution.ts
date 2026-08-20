import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  readQualityExecutionEvidence,
  writeQualityExecutionEvidence,
  type QualityExecutionPhase,
  type QualityExecutionRecord,
} from '../../src/platform/Quality/Execution/QualityExecutionEvidence';
import {
  QUALITY_CENTER_SNAPSHOT_RELATIVE_PATH,
  QUALITY_CENTER_WORKING_SNAPSHOT_RELATIVE_PATH,
} from '../../src/platform/Quality/Operations/QualityCenterSnapshotStore';
import { resolveSourceCommit } from './sourceIdentity';

const phase = process.argv[2] as QualityExecutionPhase | undefined;
if (phase !== 'test' && phase !== 'build') {
  console.error('[QualityExecution] usage: tsx scripts/automation/runQualityExecution.ts <test|build> [release-manifest-script] [quality-snapshot-script]');
  process.exit(2);
}

const repoRoot = process.cwd();
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxExecutable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const rawScript = phase === 'test' ? 'test:raw' : 'build:raw';
const releaseManifestScript = phase === 'build' ? process.argv[3] : undefined;
const qualitySnapshotScript = phase === 'build' ? process.argv[4] : undefined;
const expectedReleaseManifestScript = 'scripts/automation/buildRuntimeReleaseManifest.ts';
const expectedQualitySnapshotScript = 'scripts/automation/buildQualityCenterSnapshot.ts';
const command = phase === 'build'
  ? `npm run ${rawScript} && tsx ${expectedReleaseManifestScript} && tsx ${expectedQualitySnapshotScript}`
  : `npm run ${rawScript}`;

if (phase === 'build' && releaseManifestScript !== expectedReleaseManifestScript) {
  console.error(`[QualityExecution] build requires the canonical release-manifest finalizer: ${expectedReleaseManifestScript}`);
  process.exit(2);
}
if (phase === 'build' && qualitySnapshotScript !== expectedQualitySnapshotScript) {
  console.error(`[QualityExecution] build requires the canonical Quality Center snapshot finalizer: ${expectedQualitySnapshotScript}`);
  process.exit(2);
}

function fullGitSha(): string {
  const sha = resolveSourceCommit(repoRoot)?.trim() ?? '';
  if (!/^[0-9a-f]{40}$/i.test(sha)) {
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

function run(commandName: string, args: string[]): number {
  const result = spawnSync(commandName, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });
  return typeof result.status === 'number' ? result.status : 1;
}

function removeQualitySnapshots(): void {
  for (const relativePath of [
    QUALITY_CENTER_WORKING_SNAPSHOT_RELATIVE_PATH,
    QUALITY_CENTER_SNAPSHOT_RELATIVE_PATH,
  ]) {
    try {
      fs.rmSync(path.join(repoRoot, relativePath), { force: true });
    } catch {
      // Build failure remains authoritative; cleanup is best-effort only.
    }
  }
}

const sourceCommit = fullGitSha();
const previous = readQualityExecutionEvidence(repoRoot, sourceCommit);
const retained = previous?.records.filter((record) => {
  if (phase === 'test') return record.phase === 'build';
  return record.phase === 'contract' || record.phase === 'test';
}) ?? [];

const startedAt = new Date().toISOString();
const evidenceRefs = phase === 'test'
  ? ['ESS-0001-CONTRACTS Chapter 12', 'package.json#scripts.test:raw']
  : [
      'ESS-0001-CONTRACTS Chapter 12',
      'package.json#scripts.build:raw',
      expectedReleaseManifestScript,
      expectedQualitySnapshotScript,
    ];

function phaseRecord(status: 'PASS' | 'FAIL', exitCode: number): QualityExecutionRecord {
  return {
    phase,
    status,
    checkedAt: startedAt,
    sourceCommit,
    command,
    exitCode,
    evidenceRefs,
  };
}

function writeRecords(status: 'PASS' | 'FAIL', exitCode: number): ReturnType<typeof writeQualityExecutionEvidence> {
  const records: QualityExecutionRecord[] = [...retained, phaseRecord(status, exitCode)];
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
  return writeQualityExecutionEvidence(repoRoot, sourceCommit, records);
}

let exitCode = run(npmExecutable, ['run', rawScript]);
if (phase === 'build' && exitCode === 0) {
  exitCode = run(npxExecutable, ['tsx', expectedReleaseManifestScript]);
}

if (phase === 'build' && exitCode === 0) {
  // The snapshot consumes the same commit-bound Build evidence that the panel displays.
  // Materialize PASS only for the duration of the finalizer; any finalizer error rewrites
  // the record to FAIL and removes partially produced snapshots before the command exits.
  writeRecords('PASS', 0);
  exitCode = run(npxExecutable, ['tsx', expectedQualitySnapshotScript]);
  if (exitCode !== 0) removeQualitySnapshots();
}

const status = exitCode === 0 ? 'PASS' as const : 'FAIL' as const;
const snapshot = writeRecords(status, exitCode);
console.log(`[QualityExecution] ${phase}=${status}; evidence=${snapshot.records.map((record) => `${record.phase}:${record.status}`).join(',')}`);
process.exit(exitCode);
