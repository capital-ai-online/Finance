import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  applyReleaseVersionPlan,
  buildReleaseVersionPlan,
} from '../../../src/platform/Release/Services/releaseVersionGate.ts';
import {
  buildExpectedReadme,
} from '../../../src/platform/Release/Services/readmeVersionProjection.ts';
import { resolveMergeCadence } from '../../operations/mergeCadence.mjs';

export const MERGE_CADENCE_PATCH_SIGNATURE = 'MERGE_CADENCE_PATCH_V1';

function git(worktree, args) {
  return execFileSync('git', ['-C', worktree, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function readJson(worktree, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(worktree, relativePath), 'utf8'));
}

export async function repairPrAutofix({ worktree, signature }) {
  if (signature !== MERGE_CADENCE_PATCH_SIGNATURE) {
    throw new Error('Unsupported merge-cadence repair signature: ' + String(signature));
  }

  const baseSha = git(worktree, ['rev-parse', 'refs/remotes/origin/main']);
  const cadence = resolveMergeCadence({ repoRoot: worktree, ref: baseSha });
  if (!cadence.active || !cadence.nextVersionDue || cadence.mergeOrdinal % 10 !== 9) {
    throw new Error('Merge-cadence PATCH repair is not eligible at mergeOrdinal=' + String(cadence.mergeOrdinal) + '.');
  }

  const basePackage = JSON.parse(git(worktree, ['show', baseSha + ':package.json']));
  const candidatePackage = readJson(worktree, 'package.json');
  if (candidatePackage.version !== basePackage.version) {
    throw new Error(
      'Cadence repair refuses to overwrite candidate version ' +
      String(candidatePackage.version) +
      '; expected unchanged base version ' +
      String(basePackage.version) +
      '.',
    );
  }

  const plan = buildReleaseVersionPlan(worktree, {
    targetVersion: cadence.nextPatchVersion,
    classification: 'PATCH',
    workPackages: ['MERGE-CADENCE-PATCH-ORDINAL-' + String(cadence.mergeOrdinal + 1)],
    adrs: ['ADR-0105'],
    migrations: ['none'],
    risks: ['Cadence version materialization is a branch candidate only; Production Acceptance remains separate.'],
    rollbackBoundary: 'Restore the exact governed version files to the pre-cadence candidate state.',
    acceptanceRequirements: ['Exact-head CI, Governance, Security and Human/CODEOWNER merge remain required.'],
  });

  if (plan.currentVersion !== basePackage.version || plan.targetVersion !== cadence.nextPatchVersion) {
    throw new Error('Existing Release Version Gate did not resolve the cadence PATCH transition exactly.');
  }

  applyReleaseVersionPlan(worktree, plan);

  const updatedPackage = readJson(worktree, 'package.json');
  const nvmrc = fs.readFileSync(path.join(worktree, '.nvmrc'), 'utf8').trim();
  const readmePath = path.join(worktree, 'README.md');
  const readme = fs.readFileSync(readmePath, 'utf8');
  fs.writeFileSync(readmePath, buildExpectedReadme(readme, updatedPackage, nvmrc));

  const lock = readJson(worktree, 'package-lock.json');
  if (
    updatedPackage.version !== cadence.nextPatchVersion ||
    lock.version !== cadence.nextPatchVersion ||
    lock?.packages?.['']?.version !== cadence.nextPatchVersion
  ) {
    throw new Error('Cadence PATCH materialization did not converge package.json and package-lock mirrors.');
  }
}
