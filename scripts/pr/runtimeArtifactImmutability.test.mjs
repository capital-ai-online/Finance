import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const guardPath = path.join(repoRoot, 'server', 'runtime', 'runtimeArtifactGuard.mjs');

function runGuardProbe(targetRelativePath) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-r002-'));
  fs.mkdirSync(path.join(tempRoot, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, 'uploads'), { recursive: true });

  const script = `
    const fs = require('node:fs');
    try {
      fs.writeFileSync(${JSON.stringify(targetRelativePath)}, 'probe', 'utf8');
      process.stdout.write('WRITE_OK');
    } catch (error) {
      process.stdout.write(String(error && error.code || error));
    }
  `;

  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: tempRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      CAPITAL_AI_RUNTIME_ARTIFACT_MODE: 'readonly',
      NODE_OPTIONS: `--import=${guardPath}`,
    },
  });

  fs.rmSync(tempRoot, { recursive: true, force: true });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

test('R-002 blocks production writes to repository-style docs', () => {
  const result = runGuardProbe('docs/runtime-mutation.md');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /CAPITAL_AI_RUNTIME_ARTIFACT_READ_ONLY/);
});

test('R-002 blocks legacy Document Hygiene local authority', () => {
  const result = runGuardProbe('uploads/document_hygiene.json');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /CAPITAL_AI_RUNTIME_ARTIFACT_READ_ONLY/);
});

test('R-002 blocks legacy Version Manager local authority', () => {
  const result = runGuardProbe('uploads/version_manager.json');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /CAPITAL_AI_RUNTIME_ARTIFACT_READ_ONLY/);
});

test('R-002 does not block ordinary application uploads', () => {
  const result = runGuardProbe('uploads/ordinary-runtime-file.txt');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /WRITE_OK/);
});

test('production Docker image preloads the R-002 guard and makes docs OS-level read-only', () => {
  const dockerfile = fs.readFileSync(path.join(repoRoot, 'Dockerfile'), 'utf8');
  assert.match(dockerfile, /CAPITAL_AI_RUNTIME_ARTIFACT_MODE=readonly/);
  assert.match(dockerfile, /NODE_OPTIONS=--import=\/app\/server\/runtime\/runtimeArtifactGuard\.mjs/);
  assert.match(dockerfile, /chmod 0555 \/app\/docs/);
});
