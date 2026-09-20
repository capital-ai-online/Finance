#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { appendGithubOutput, fail } from './lib.mjs';
import {
  PR_AUTOFIX_REPAIR_REGISTRY,
  validatePrAutofixRepairRegistry,
} from './prAutofixRepairRegistry.mjs';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const policyRoot = path.resolve(moduleDir, '../..');

function git(worktree, args) {
  return execFileSync('git', ['-C', worktree, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function selectRegisteredRepairer(
  { repairerId, sourceWorkflow, signature },
  registry = PR_AUTOFIX_REPAIR_REGISTRY,
) {
  validatePrAutofixRepairRegistry(registry);
  const match = registry.find((entry) =>
    entry.id === repairerId &&
    entry.sourceWorkflow === sourceWorkflow &&
    entry.exactSignatures.includes(signature));

  if (!match) throw new Error('Requested PR autofix repairer is not registered for this exact failure signature.');
  return match;
}

export function validateRegisteredRepairDiff({ worktree, allowedPaths, changedPaths }) {
  if (!Array.isArray(changedPaths) || changedPaths.length === 0) {
    throw new Error('Registered PR autofix produced no file changes.');
  }
  const allow = new Set(allowedPaths);
  for (const file of changedPaths) {
    if (!allow.has(file)) throw new Error(`Registered PR autofix exceeded its path allowlist: ${file}`);
    const absolute = path.resolve(worktree, file);
    const relative = path.relative(path.resolve(worktree), absolute);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Registered PR autofix path escaped worktree: ${file}`);
    }
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      throw new Error(`Registered PR autofix target must be a regular file: ${file}`);
    }
  }
  return changedPaths;
}

export async function applyRegisteredPrAutofix({
  worktree,
  repairerId,
  sourceWorkflow,
  signature,
  registry = PR_AUTOFIX_REPAIR_REGISTRY,
}) {
  const root = path.resolve(worktree);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error('WORKTREE is not a directory.');
  if (git(root, ['status', '--porcelain'])) throw new Error('Candidate worktree must be clean before registered repair.');

  const entry = selectRegisteredRepairer({ repairerId, sourceWorkflow, signature }, registry);
  const repairerFile = path.resolve(policyRoot, entry.repairerPath);
  const relativeRepairer = path.relative(policyRoot, repairerFile);
  if (relativeRepairer.startsWith('..') || path.isAbsolute(relativeRepairer)) {
    throw new Error('Registered repairer escaped trusted policy root.');
  }
  if (!fs.existsSync(repairerFile) || fs.lstatSync(repairerFile).isSymbolicLink()) {
    throw new Error('Registered trusted-main repairer module is missing or unsafe.');
  }

  const module = await import(pathToFileURL(repairerFile).href);
  if (typeof module.repairPrAutofix !== 'function') {
    throw new Error('Registered repairer must export repairPrAutofix({ worktree, signature }).');
  }

  await module.repairPrAutofix({ worktree: root, signature });

  const deleted = git(root, ['diff', '--name-only', '--diff-filter=D', 'HEAD', '--']);
  if (deleted) throw new Error('Registered PR autofix may not delete files.');

  const changed = git(root, ['diff', '--name-only', 'HEAD', '--'])
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  validateRegisteredRepairDiff({
    worktree: root,
    allowedPaths: entry.allowedPaths,
    changedPaths: changed,
  });
  execFileSync('git', ['-C', root, 'diff', '--check', 'HEAD', '--'], { stdio: 'inherit' });

  return {
    repairerId: entry.id,
    repairerPath: entry.repairerPath,
    changedPaths: changed,
    allowedPaths: [...entry.allowedPaths],
  };
}

if (process.argv[1]?.endsWith('applyRegisteredPrAutofix.mjs')) {
  const worktree = String(process.env.WORKTREE || '').trim();
  const repairerId = String(process.env.REPAIRER_ID || '').trim();
  const sourceWorkflow = String(process.env.SOURCE_WORKFLOW_PATH || '').trim();
  const signature = String(process.env.FAILURE_SIGNATURE || '').trim();

  if (!worktree || !repairerId || !sourceWorkflow || !signature) {
    fail('WORKTREE, REPAIRER_ID, SOURCE_WORKFLOW_PATH und FAILURE_SIGNATURE sind erforderlich.');
  }

  applyRegisteredPrAutofix({ worktree, repairerId, sourceWorkflow, signature })
    .then((outcome) => {
      appendGithubOutput({
        repairer_id: outcome.repairerId,
        repairer_path: outcome.repairerPath,
        changed_paths_json: JSON.stringify(outcome.changedPaths),
        allowed_paths_json: JSON.stringify(outcome.allowedPaths),
      });
      console.log(
        `[PR-AUTOFIX] trusted repairer ${outcome.repairerId} changed exactly: ${outcome.changedPaths.join(', ')}`,
      );
    })
    .catch((error) => fail(error instanceof Error ? error.message : String(error)));
}
