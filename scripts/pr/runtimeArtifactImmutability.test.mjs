import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const guardPath = path.join(repoRoot, 'server', 'runtime', 'runtimeArtifactGuard.mjs');
const releaseManifestBuilder = path.join(repoRoot, 'scripts', 'automation', 'buildRuntimeReleaseManifest.ts');
const tsxBin = path.join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');

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
  const result = spawnSync(process.execPath, ['-e', script], { cwd: tempRoot, encoding: 'utf8', env: productionProbeEnv() });
  fs.rmSync(tempRoot, { recursive: true, force: true });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function runWatcherProbe(targetRelativePath) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-r002-watch-'));
  fs.mkdirSync(path.join(tempRoot, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, 'uploads'), { recursive: true });
  const script = `
    const fs = require('node:fs');
    const watcher = fs.watch(${JSON.stringify(targetRelativePath)}, () => process.stdout.write('WATCH_EVENT'));
    const hasContract = watcher && typeof watcher.close === 'function' && typeof watcher.unref === 'function';
    if (hasContract) watcher.close();
    process.stdout.write(hasContract ? 'WATCH_SUPPRESSED' : 'WATCH_INVALID');
  `;
  const result = spawnSync(process.execPath, ['-e', script], { cwd: tempRoot, encoding: 'utf8', env: productionProbeEnv() });
  fs.rmSync(tempRoot, { recursive: true, force: true });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function runHttpProbe(method, requestPath, cwd = repoRoot) {
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
      } finally {
        server.close();
      }
    });
  `;
  return spawnSync(process.execPath, ['-e', script], { cwd, encoding: 'utf8', env: productionProbeEnv() });
}

function parseLastJsonObject(stdout) {
  const start = stdout.lastIndexOf('{"status"');
  assert.notEqual(start, -1, `Expected probe JSON in stdout: ${stdout}`);
  return JSON.parse(stdout.slice(start));
}

function buildReleaseManifestFixture() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-r002-release-'));
  fs.mkdirSync(path.join(tempRoot, 'docs', 'architecture'), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, 'dist'), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, 'package.json'), path.join(tempRoot, 'package.json'));
  fs.copyFileSync(path.join(repoRoot, 'package-lock.json'), path.join(tempRoot, 'package-lock.json'));
  fs.writeFileSync(path.join(tempRoot, 'docs', 'architecture', 'fixture.md'), '# Immutable Documentary Fixture\n', 'utf8');
  fs.writeFileSync(path.join(tempRoot, 'dist', 'server.cjs'), 'module.exports = {};\n', 'utf8');
  const commitSha = 'fedcba9876543210fedcba9876543210fedcba98';
  const result = spawnSync(tsxBin, [releaseManifestBuilder], {
    cwd: tempRoot,
    encoding: 'utf8',
    env: { ...process.env, RELEASE_SOURCE_COMMIT: commitSha, SOURCE_DATE_EPOCH: '1786147200' },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return { tempRoot, commitSha, manifestPath: path.join(tempRoot, 'dist', 'control-plane', 'release-manifest.json') };
}

test('R-002 blocks production writes to repository-style docs', () => {
  const result = runGuardProbe('docs/runtime-mutation.md');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /CAPITAL_AI_RUNTIME_ARTIFACT_READ_ONLY/);
});

test('R-002 keeps retired Document Hygiene state write-protected', () => {
  const result = runGuardProbe('uploads/document_hygiene.json');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /CAPITAL_AI_RUNTIME_ARTIFACT_READ_ONLY/);
});

test('R-002 keeps retired Version Manager state write-protected', () => {
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

test('R-002 rejects retired production Documentary and VersionManager mutations', () => {
  for (const requestPath of [
    '/api/docs-file',
    '/api/admin/hygiene/review',
    '/api/admin/hygiene/rollback',
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

test('R-002 does not intercept GET /api/admin/version before Express authorization', () => {
  const result = runHttpProbe('GET', '/api/admin/version');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const probe = parseLastJsonObject(result.stdout);
  assert.equal(probe.status, 599);
  assert.match(probe.body, /fallbackHandlerReached/);
});

test('R-002 build step still emits immutable release and Documentary evidence', () => {
  const fixture = buildReleaseManifestFixture();
  try {
    const manifest = JSON.parse(fs.readFileSync(fixture.manifestPath, 'utf8'));
    assert.equal(manifest.contract, 'capital-ai-runtime-release-manifest/1.0.0');
    assert.equal(manifest.authority, 'ci-or-controlled-build');
    assert.equal(manifest.mutable, false);
    assert.equal(manifest.version, '0.6.0');
    assert.equal(manifest.sourceCommit, fixture.commitSha);
    assert.match(manifest.buildIdentity, /^[a-f0-9]{64}$/);
    assert.match(manifest.inputs.packageLockSha256, /^[a-f0-9]{64}$/);
    assert.match(manifest.inputs.documentaryTreeSha256, /^[a-f0-9]{64}$/);
    assert.equal(manifest.inputs.documentaryFileCount, 1);
    assert.equal(manifest.runtimeArtifact.root, 'dist');
    assert.equal(manifest.runtimeArtifact.algorithm, 'sha256-subject-set-v1');
    assert.match(manifest.runtimeArtifact.sha256, /^[a-f0-9]{64}$/);
    assert.equal(manifest.runtimeArtifact.files, 1);
  } finally {
    fs.rmSync(fixture.tempRoot, { recursive: true, force: true });
  }
});

test('production build emits immutable manifest and Docker preloads R-002 guard', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  assert.match(packageJson.scripts.build, /buildRuntimeReleaseManifest\.ts/);
  const dockerfile = fs.readFileSync(path.join(repoRoot, 'Dockerfile'), 'utf8');
  assert.match(dockerfile, /CAPITAL_AI_RUNTIME_ARTIFACT_MODE=readonly/);
  assert.match(dockerfile, /NODE_OPTIONS="--import=\/app\/server\/runtime\/runtimeArtifactGuard\.mjs(?:\s+--import=[^"]+)*"/);
  assert.match(dockerfile, /chmod 0555 \/app\/docs/);
});
