#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { planChatGptSandboxChecks } from './chatGptSandboxPolicy.mjs';

const root = process.cwd();
const full = process.argv.includes('--full');

function fail(message) {
  throw new Error(`[CHATGPT-SANDBOX] ${message}`);
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    env: {
      ...process.env,
      CI: '1',
      CHATGPT_SANDBOX: '1',
    },
  });
}

function git(args) {
  return String(run('git', args, { capture: true })).trim();
}

const repoRoot = git(['rev-parse', '--show-toplevel']);
if (path.resolve(repoRoot) !== path.resolve(root)) {
  fail(`run from repository root; expected ${repoRoot}, got ${root}.`);
}

const branch = git(['branch', '--show-current']);
if (!branch || branch === 'main') {
  fail(`sandbox validation requires a non-main feature branch; got ${branch || '<detached>'}.`);
}

let originMain;
try {
  originMain = git(['rev-parse', 'origin/main']).toLowerCase();
} catch {
  fail('origin/main is unavailable. A real repository checkout with the current main ref is required.');
}

const mergeBase = git(['merge-base', 'origin/main', 'HEAD']).toLowerCase();
if (mergeBase !== originMain) {
  fail(`branch is not synchronized to current origin/main; merge-base=${mergeBase}, origin/main=${originMain}.`);
}

if (!fs.existsSync(path.join(root, 'node_modules'))) {
  fail('node_modules is missing. This runner never installs dependencies automatically; provision them explicitly before sandbox validation.');
}

const committed = git(['diff', '--name-only', 'origin/main...HEAD']);
const unstaged = git(['diff', '--name-only']);
const staged = git(['diff', '--name-only', '--cached']);
const changedFiles = [...new Set([committed, unstaged, staged]
  .flatMap((value) => value ? value.split(/\r?\n/).filter(Boolean) : []))];

if (changedFiles.length === 0) {
  fail('no changed files detected relative to origin/main.');
}

git(['diff', '--check', 'origin/main...HEAD']);
const plan = planChatGptSandboxChecks(changedFiles, { full });

console.log(`[CHATGPT-SANDBOX] branch=${branch}`);
console.log(`[CHATGPT-SANDBOX] origin/main=${originMain}`);
console.log(`[CHATGPT-SANDBOX] mode=${full ? 'full' : 'cost-controlled'}`);
console.log(`[CHATGPT-SANDBOX] changedFiles=${plan.changedFiles.length}`);
console.log(`[CHATGPT-SANDBOX] plannedScripts=${plan.scripts.join(', ')}`);
console.log('[CHATGPT-SANDBOX] networkInstallAllowed=false repositoryMutationAllowed=false mergeAuthority=false hostedCiReplacement=false');

for (const script of plan.scripts) {
  console.log(`[CHATGPT-SANDBOX] npm run ${script}`);
  run('npm', ['run', script]);
}

console.log('[CHATGPT-SANDBOX] PASS');
