#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const FULL_SHA_RE = /^[0-9a-f]{40}$/i;
const TARGET_RE = /^docs\/projects\/[^/]+\/(?:ROADMAP|TASK_REGISTER)\.md$/;
const BASELINE_LABELS = [
  'Baseline',
  'Current-main synchronization baseline',
  'Correlation baseline',
  'Current correlation baseline',
  'Current repository baseline for this synchronization',
];

function fail(message) {
  throw new Error(`[current-state-baseline-autofix] ${message}`);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseTargets(value) {
  const parsed = JSON.parse(String(value ?? '[]'));
  if (!Array.isArray(parsed) || parsed.length === 0) fail('TARGET_FILES_JSON must contain at least one path');
  const targets = [...new Set(parsed.map((entry) => String(entry).replace(/\\/g, '/').replace(/^\.\//, '').trim()))];
  if (targets.some((entry) => !TARGET_RE.test(entry))) {
    fail(`target outside exact current-state projection scope: ${targets.filter((entry) => !TARGET_RE.test(entry)).join(',')}`);
  }
  return targets.sort();
}

export function repairProjectionText(text, expectedMainSha) {
  const sha = String(expectedMainSha ?? '').toLowerCase();
  if (!FULL_SHA_RE.test(sha)) fail('EXPECTED_MAIN_SHA must be a full 40-character SHA');
  const source = String(text ?? '');

  for (const label of BASELINE_LABELS) {
    const pattern = new RegExp(`^\\*\\*${escapeRegExp(label)}:\\*\\*\\s*[^\\r\\n]*$`, 'im');
    if (pattern.test(source)) {
      return source.replace(pattern, `**${label}:** \`main@${sha}\``);
    }
  }

  const lines = source.split(/\r?\n/);
  let insertAt = 1;
  while (insertAt < lines.length && lines[insertAt].trim() === '') insertAt += 1;
  lines.splice(insertAt, 0, '', `**Baseline:** \`main@${sha}\``);
  return lines.join('\n');
}

export function repairCurrentStateProjectionBaselines({ worktree, targets, expectedMainSha }) {
  const root = path.resolve(worktree || process.cwd());
  const sha = String(expectedMainSha ?? '').toLowerCase();
  if (!FULL_SHA_RE.test(sha)) fail('EXPECTED_MAIN_SHA must be a full 40-character SHA');

  const changed = [];
  for (const target of targets) {
    if (!TARGET_RE.test(target)) fail(`target outside exact scope: ${target}`);
    const absolute = path.resolve(root, target);
    if (!absolute.startsWith(`${root}${path.sep}`)) fail(`target escapes worktree: ${target}`);
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile() || stat.isSymbolicLink()) fail(`target must be a regular non-symlink file: ${target}`);
    const before = fs.readFileSync(absolute, 'utf8');
    const after = repairProjectionText(before, sha);
    if (after !== before) {
      fs.writeFileSync(absolute, after, 'utf8');
      changed.push(target);
    }
  }
  return changed;
}

function main() {
  const worktree = process.env.WORKTREE || process.cwd();
  const targets = parseTargets(process.env.TARGET_FILES_JSON || '[]');
  const changed = repairCurrentStateProjectionBaselines({
    worktree,
    targets,
    expectedMainSha: process.env.EXPECTED_MAIN_SHA,
  });
  if (changed.length === 0) fail('repair produced no changes');
  if (changed.some((entry) => !targets.includes(entry))) fail('repair changed an unrequested target');
  console.log(`[current-state-baseline-autofix] repaired ${changed.length} projection(s): ${changed.join(', ')}`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('repairCurrentStateProjectionBaselines.mjs')) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
