import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

import { verifyPatch } from './verifyPrCiAutofixPatch.mjs';

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

function createRepo() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-ci-autofix-'));
  fs.mkdirSync(path.join(cwd, 'src/features'), { recursive: true });
  fs.mkdirSync(path.join(cwd, '.github/workflows'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'src/features/example.ts'), 'export const value = 1;\n');
  fs.writeFileSync(path.join(cwd, 'README.md'), '# Example\n');
  fs.writeFileSync(path.join(cwd, '.github/workflows/ci.yml'), 'name: CI\n');
  git(cwd, ['init']);
  git(cwd, ['config', 'user.name', 'CI Test']);
  git(cwd, ['config', 'user.email', 'ci@example.invalid']);
  git(cwd, ['add', '.']);
  git(cwd, ['commit', '-m', 'baseline']);
  return cwd;
}

function cleanup(cwd) {
  fs.rmSync(cwd, { recursive: true, force: true });
}

test('accepts deterministic README sync only when README is the sole modified file', () => {
  const cwd = createRepo();
  try {
    fs.writeFileSync(path.join(cwd, 'README.md'), '# Example\n\nVersion projection updated.\n');
    const result = verifyPatch({ cwd, engine: 'deterministic-readme' });
    assert.deepEqual(result.files, ['README.md']);
    assert.ok(result.changedLines > 0);
  } finally {
    cleanup(cwd);
  }
});

test('rejects source modifications even when README is also modified', () => {
  const cwd = createRepo();
  try {
    fs.writeFileSync(path.join(cwd, 'README.md'), '# Updated\n');
    fs.writeFileSync(path.join(cwd, 'src/features/example.ts'), 'export const value = 2;\n');
    assert.throws(() => verifyPatch({ cwd, engine: 'deterministic-readme' }), /maximum is 1/);
  } finally {
    cleanup(cwd);
  }
});

test('rejects protected workflow mutations', () => {
  const cwd = createRepo();
  try {
    fs.writeFileSync(path.join(cwd, '.github/workflows/ci.yml'), 'name: Changed CI\n');
    assert.throws(() => verifyPatch({ cwd, engine: 'deterministic-readme' }), /protected path/);
  } finally {
    cleanup(cwd);
  }
});

test('rejects untracked files instead of silently ignoring them', () => {
  const cwd = createRepo();
  try {
    fs.writeFileSync(path.join(cwd, 'untracked.txt'), 'unexpected\n');
    fs.writeFileSync(path.join(cwd, 'README.md'), '# Updated\n');
    assert.throws(() => verifyPatch({ cwd, engine: 'deterministic-readme' }), /untracked files are not eligible/);
  } finally {
    cleanup(cwd);
  }
});

test('rejects unsupported engines', () => {
  const cwd = createRepo();
  try {
    fs.writeFileSync(path.join(cwd, 'README.md'), '# Updated\n');
    assert.throws(() => verifyPatch({ cwd, engine: 'copilot' }), /unsupported patch engine/);
  } finally {
    cleanup(cwd);
  }
});

test('rejects oversized README patches', () => {
  const cwd = createRepo();
  try {
    fs.writeFileSync(path.join(cwd, 'README.md'), `${Array.from({ length: 301 }, (_, index) => `line-${index}`).join('\n')}\n`);
    assert.throws(() => verifyPatch({ cwd, engine: 'deterministic-readme' }), /maximum is 300/);
  } finally {
    cleanup(cwd);
  }
});

test('rejects secret-like material in deterministic patches', () => {
  const cwd = createRepo();
  try {
    fs.writeFileSync(path.join(cwd, 'README.md'), "github_pat_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890\n");
    assert.throws(() => verifyPatch({ cwd, engine: 'deterministic-readme' }), /secret-like material/);
  } finally {
    cleanup(cwd);
  }
});
