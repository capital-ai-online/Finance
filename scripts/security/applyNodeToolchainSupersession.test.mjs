import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  BASELINE_WORKFLOW_TARGETS,
  NEW_NODE_RANGE,
  NEW_NODE_VERSION,
  OLD_NODE_RANGE,
  OLD_NODE_VERSION,
  TARGET_PATHS,
  WORKFLOW_TARGETS,
  applySupersession,
  assertComplete,
  assertPending,
} from './applyNodeToolchainSupersession.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function write(root, relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
}

function read(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function fixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-node-supersession-'));
  write(root, '.nvmrc', `${OLD_NODE_VERSION}\n`);
  write(root, 'package.json', `${JSON.stringify({ name: 'fixture', engines: { node: OLD_NODE_RANGE } }, null, 2)}\n`);
  write(root, 'package-lock.json', `${JSON.stringify({ name: 'fixture', lockfileVersion: 3, packages: { '': { name: 'fixture', engines: { node: OLD_NODE_RANGE } } } }, null, 2)}\n`);

  for (const [relativePath, expectedPins] of WORKFLOW_TARGETS) {
    const useUnquotedPin = relativePath.endsWith('google-marketing-protected-change.yml') || relativePath.endsWith('ionos-dns-admin.yml');
    const renderedVersion = useUnquotedPin ? OLD_NODE_VERSION : `'${OLD_NODE_VERSION}'`;
    const pins = Array.from({ length: expectedPins }, (_, index) => `      - name: Node ${index + 1}\n        with:\n          node-version: ${renderedVersion}`).join('\n');
    write(root, relativePath, `name: fixture\njobs:\n  fixture:\n    steps:\n${pins}\n`);
  }

  write(root, 'tests/unit/productionCiRunnerConsolidation.test.ts', `expect(deploy).toContain("node-version: '${OLD_NODE_VERSION}'");\n`);
  return root;
}

test('supersession transforms quoted and unquoted Node pins and reaches complete state', () => {
  const root = fixtureRoot();
  try {
    const before = assertPending(root);
    assert.equal(before.complete.length, 0);
    const after = applySupersession(root);
    assert.equal(after.pending.length, 0);
    assert.equal(after.complete.length, after.states.length);
    assertComplete(root);
    assert.equal(read(root, '.nvmrc').trim(), NEW_NODE_VERSION);
    assert.equal(JSON.parse(read(root, 'package.json')).engines.node, NEW_NODE_RANGE);
    assert.equal(JSON.parse(read(root, 'package-lock.json')).packages[''].engines.node, NEW_NODE_RANGE);
    assert.ok(fs.existsSync(path.join(root, 'tests/unit/nodeToolchainBaseline.test.ts')));

    for (const [relativePath, expectedPins] of WORKFLOW_TARGETS) {
      const source = read(root, relativePath);
      assert.equal((source.match(/node-version:\s*(?:'24\.20\.0'|"24\.20\.0"|24\.20\.0)/g) ?? []).length, expectedPins);
      assert.equal((source.match(/node-version:\s*(?:'24\.18\.0'|"24\.18\.0"|24\.18\.0)/g) ?? []).length, 0);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('supersession rejects a mixed baseline instead of silently widening the patch', () => {
  const root = fixtureRoot();
  try {
    const [relativePath] = WORKFLOW_TARGETS[0];
    write(root, relativePath, read(root, relativePath).replace(`node-version: '${OLD_NODE_VERSION}'`, `node-version: '${NEW_NODE_VERSION}'`));
    assert.throws(() => assertPending(root), /unerwarteter\/mischender Node-Pin-Stand|Preflight erwartet vollständig alte Baseline/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('generated baseline also covers the supersession bootstrap workflow itself', () => {
  assert.deepEqual(BASELINE_WORKFLOW_TARGETS.at(-1), ['.github/workflows/node-toolchain-write-boundary-supersession.yml', 1]);
});

test('target allowlist is closed and contains no provider or production configuration', () => {
  const sorted = [...TARGET_PATHS].sort();
  assert.deepEqual(sorted, [
    '.github/workflows/ci.yml',
    '.github/workflows/google-marketing-protected-change.yml',
    '.github/workflows/ionos-dns-admin.yml',
    '.github/workflows/pr-governance.yml',
    '.github/workflows/pr-production-baseline-refresh.yml',
    '.github/workflows/systemadmin-roadmap-executor.yml',
    '.github/workflows/systemadmin-work-package-runner.yml',
    '.nvmrc',
    'package-lock.json',
    'package.json',
    'tests/unit/nodeToolchainBaseline.test.ts',
    'tests/unit/productionCiRunnerConsolidation.test.ts',
  ]);

  for (const relativePath of TARGET_PATHS) assert.doesNotMatch(relativePath, /render\.yaml|supabase|stripe|\.env|secret/i);
});

test('bootstrap remains owner-only, branch-only and does not gain provider or PR mutation authority', () => {
  const workflow = read(repositoryRoot, '.github/workflows/node-toolchain-write-boundary-supersession.yml');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /github\.actor == 'SvenKulessa'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /pull-requests: read/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /node-version: '24\.20\.0'/);
  assert.match(workflow, /SUPERSEDE NODE TOOLCHAIN TO 24\.20\.0/);
  assert.match(workflow, /security\/node-toolchain-24-20-remediation-/);
  assert.doesNotMatch(workflow, /pull_request_target:/);
  assert.doesNotMatch(workflow, /pull-requests: write/);
  assert.doesNotMatch(workflow, /actions: write/);
  assert.doesNotMatch(workflow, /id-token: write/);
  assert.doesNotMatch(workflow, /RENDER_DEPLOY_HOOK_URL|SUPABASE_|STRIPE_|IONOS_DNS_API_KEY/);
  assert.doesNotMatch(workflow, /gh\s+pr\s+create|merge_pull_request|gh\s+pr\s+merge/);
});
