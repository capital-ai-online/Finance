import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const guardPath = path.join(repoRoot, 'server', 'runtime', 'runtimeArtifactGuard.mjs');

function productionProbeEnv(extra = {}) {
  return {
    ...process.env,
    NODE_ENV: 'production',
    CAPITAL_AI_RUNTIME_ARTIFACT_MODE: 'readonly',
    NODE_OPTIONS: `--import=${guardPath}`,
    ...extra,
  };
}

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
    env: productionProbeEnv(),
  });

  fs.rmSync(tempRoot, { recursive: true, force: true });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function runWatcherProbe(targetRelativePath) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-r002-watch-'));
  fs.mkdirSync(path.join(tempRoot, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, 'uploads'), { recursive: true });

  const script = `
    const fs = require('node:fs');
    const watcher = fs.watch(${JSON.stringify(targetRelativePath)}, () => {
      process.stdout.write('WATCH_EVENT');
    });
    const hasContract = watcher && typeof watcher.close === 'function' && typeof watcher.unref === 'function';
    if (hasContract) watcher.close();
    process.stdout.write(hasContract ? 'WATCH_SUPPRESSED' : 'WATCH_INVALID');
  `;

  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: tempRoot,
    encoding: 'utf8',
    env: productionProbeEnv(),
  });

  fs.rmSync(tempRoot, { recursive: true, force: true });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function runHttpProbe(method, requestPath, extraEnv = {}) {
  const script = `
    const http = require('node:http');
    const server = http.createServer((req, res) => {
      res.statusCode = 599;
      res.end(JSON.stringify({ fallbackHandlerReached: true }));
    });
    server.listen(0, '127.0.0.1', async () => {
      const address = server.address();
      try {
        const response = await fetch('http://127.0.0.1:' + address.port + ${JSON.stringify(requestPath)}, {
          method: ${JSON.stringify(method)},
          headers: { 'content-type': 'application/json' },
          body: ${JSON.stringify(method === 'GET' || method === 'HEAD' ? null : '{}')},
        });
        const text = await response.text();
        process.stdout.write(JSON.stringify({ status: response.status, body: text }));
      } catch (error) {
        process.stdout.write(JSON.stringify({ status: 0, error: String(error) }));
      } finally {
        server.close();
      }
    });
  `;

  return spawnSync(process.execPath, ['-e', script], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: productionProbeEnv(extraEnv),
  });
}

function parseLastJsonObject(stdout) {
  const start = stdout.lastIndexOf('{"status"');
  assert.notEqual(start, -1, `Expected probe JSON in stdout: ${stdout}`);
  return JSON.parse(stdout.slice(start));
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

test('R-002 suppresses production file watchers on docs', () => {
  const result = runWatcherProbe('docs');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /WATCH_SUPPRESSED/);
  assert.doesNotMatch(result.stdout, /WATCH_EVENT/);
});

test('R-002 rejects legacy production Documentary mutations with a control-plane contract', () => {
  for (const requestPath of [
    '/api/docs-file',
    '/api/admin/hygiene/review',
    '/api/admin/hygiene/rollback',
    '/api/admin/hygiene/lint-fix',
    '/api/admin/version/bump',
  ]) {
    const result = runHttpProbe('POST', requestPath);
    assert.equal(result.status, 0);
    const probe = parseLastJsonObject(result.stdout);
    assert.equal(probe.status, 409);
    assert.match(probe.body, /READ_ONLY_CONTROL_PLANE_REQUIRED/);
    assert.doesNotMatch(probe.body, /fallbackHandlerReached/);
  }
});

test('R-002 serves production version identity from immutable package/deploy metadata', () => {
  const commitSha = '0123456789abcdef0123456789abcdef01234567';
  const result = runHttpProbe('GET', '/api/admin/version', { RENDER_GIT_COMMIT: commitSha });
  assert.equal(result.status, 0);
  const probe = parseLastJsonObject(result.stdout);
  assert.equal(probe.status, 200);
  const payload = JSON.parse(probe.body);
  assert.equal(payload.state.version, '0.6.0');
  assert.equal(payload.state.commitSha, commitSha);
  assert.equal(payload.state.source, 'immutable-build-metadata');
  assert.equal(payload.state.readOnly, true);
  assert.equal(payload.workspace.mutationAuthority, 'ci-or-authenticated-control-plane');
});

test('production Docker image preloads the R-002 guard and makes docs OS-level read-only', () => {
  const dockerfile = fs.readFileSync(path.join(repoRoot, 'Dockerfile'), 'utf8');
  assert.match(dockerfile, /CAPITAL_AI_RUNTIME_ARTIFACT_MODE=readonly/);
  assert.match(dockerfile, /NODE_OPTIONS=--import=\/app\/server\/runtime\/runtimeArtifactGuard\.mjs/);
  assert.match(dockerfile, /chmod 0555 \/app\/docs/);
});
