#!/usr/bin/env node

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  isProtectedAutofixPath,
  normalizePath,
} from './planPrCiAutofix.mjs';

const MAX_CHANGED_FILES = 1;
const MAX_CHANGED_LINES = 300;

function git(args, cwd = process.cwd()) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function fail(message) {
  throw new Error(`[pr-ci-autofix-patch] ${message}`);
}

function parseNameStatus(raw) {
  if (!raw) return [];
  return raw.split(/\r?\n/).filter(Boolean).map((line) => {
    const [status, ...rest] = line.split('\t');
    return { status, path: normalizePath(rest[rest.length - 1] || '') };
  });
}

function totalChangedLines(raw) {
  if (!raw) return 0;
  let total = 0;
  for (const line of raw.split(/\r?\n/).filter(Boolean)) {
    const [added, deleted] = line.split('\t');
    if (!/^\d+$/.test(added) || !/^\d+$/.test(deleted)) fail('binary or non-numeric diff statistics are not eligible');
    total += Number(added) + Number(deleted);
  }
  return total;
}

function assertNoSecretLikeMaterial(diff) {
  const signatures = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
    /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
  ];
  if (signatures.some((pattern) => pattern.test(diff))) fail('patch contains secret-like material');
}

export function verifyPatch({ cwd = process.cwd(), engine }) {
  const untracked = git(['ls-files', '--others', '--exclude-standard'], cwd);
  if (untracked) fail(`untracked files are not eligible: ${untracked.split(/\r?\n/).join(',')}`);

  const entries = parseNameStatus(git(['diff', '--name-status', 'HEAD', '--'], cwd));
  if (entries.length === 0) fail('candidate produced no repository patch');
  if (entries.length > MAX_CHANGED_FILES) fail(`candidate changes ${entries.length} files; maximum is ${MAX_CHANGED_FILES}`);
  if (entries.some((entry) => entry.status !== 'M')) fail(`only in-place modifications are eligible: ${entries.map((entry) => `${entry.status}:${entry.path}`).join(',')}`);

  const files = entries.map((entry) => entry.path);
  if (files.some(isProtectedAutofixPath)) fail(`candidate touches protected path: ${files.filter(isProtectedAutofixPath).join(',')}`);
  if (engine !== 'deterministic-readme') fail(`unsupported patch engine: ${engine}`);
  if (files.length !== 1 || files[0] !== 'README.md') fail(`deterministic README projection may modify only README.md; observed=${files.join(',')}`);

  const changedLines = totalChangedLines(git(['diff', '--numstat', 'HEAD', '--'], cwd));
  if (changedLines > MAX_CHANGED_LINES) fail(`candidate changes ${changedLines} lines; maximum is ${MAX_CHANGED_LINES}`);

  const diff = git(['diff', '--no-ext-diff', '--unified=3', 'HEAD', '--'], cwd);
  assertNoSecretLikeMaterial(diff);
  git(['diff', '--check', 'HEAD', '--'], cwd);

  return { files, changedLines };
}

export function writeGithubOutput(result) {
  const outputPath = process.env.GITHUB_OUTPUT;
  const text = `changed_files_json=${JSON.stringify(result.files)}\nchanged_lines=${result.changedLines}\n`;
  if (outputPath) fs.appendFileSync(outputPath, text, 'utf8');
  return text;
}

function main() {
  const result = verifyPatch({
    cwd: process.env.WORKTREE || process.cwd(),
    engine: process.env.AUTOFIX_ENGINE || '',
  });
  console.log(`[pr-ci-autofix-patch] files=${result.files.length} changed_lines=${result.changedLines}`);
  writeGithubOutput(result);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('verifyPrCiAutofixPatch.mjs')) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
