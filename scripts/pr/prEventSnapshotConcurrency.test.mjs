import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workflow = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const ci = workflow('.github/workflows/ci.yml');
const container = workflow('.github/workflows/container-security.yml');
const governance = workflow('.github/workflows/pr-governance.yml');
const zizmor = workflow('.github/workflows/zizmor.yml');
const branchSync = workflow('.github/workflows/sync-agent-pr-branches.yml');
const shadow = workflow('.github/workflows/capital-ai-ci-shadow.yml');

test('build-and-test cancellation is isolated by exact PR head/base snapshot', () => {
  assert.ok(ci.includes("format('{0}-pr-{1}-{2}-{3}'"));
  assert.ok(ci.includes('github.event.pull_request.head.sha'));
  assert.ok(ci.includes('github.event.pull_request.base.sha'));
  assert.ok(ci.includes('github.rest.pulls.get'));
  assert.ok(ci.includes("core.setOutput('current_snapshot', currentSnapshot ? 'true' : 'false')"));
  assert.ok(ci.includes('Stale PR-Event vor teurer CI beenden'));
  assert.ok(ci.indexOf('Stale PR-Event vor teurer CI beenden') < ci.indexOf('Repository auschecken'));
  assert.ok(ci.includes('name: build-and-test'));
  assert.ok(ci.includes('cancel-in-progress: true'));
  assert.ok(!ci.includes('group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}'));
});

test('autofix workflow_dispatch snapshot mismatch fails closed while stale PR events remain cheap no-ops', () => {
  assert.ok(ci.includes("if: github.event_name == 'workflow_dispatch' && steps.cost_control.outputs.current_snapshot == 'false'"));
  assert.ok(ci.includes("if: github.event_name == 'pull_request' && steps.cost_control.outputs.current_snapshot == 'false'"));
  assert.ok(ci.includes('Invalid autofix workflow_dispatch snapshot'));
  assert.ok(ci.includes('exit 1'));
  assert.ok(ci.includes('Stale PR-Snapshot erkannt; kein Checkout, npm ci, TypeScript, Test oder Build für veraltete Event-Evidence.'));
  assert.ok(ci.indexOf('Invalid autofix workflow_dispatch snapshot') < ci.indexOf('Repository auschecken'));
  assert.ok(ci.indexOf('Stale PR-Event vor teurer CI beenden') < ci.indexOf('Repository auschecken'));
});

test('container required check rejects stale PR snapshots before checkout and heavy work', () => {
  assert.ok(container.includes("format('container-security-pr-{0}-{1}-{2}'"));
  assert.ok(container.includes('github.rest.pulls.get'));
  assert.ok(container.includes('Stale PR-Event kostensparend beenden'));
  assert.ok(container.indexOf('Stale PR-Event kostensparend beenden') < container.indexOf('Repository auschecken'));
  assert.ok(container.includes('name: Hardened image / HIGH+CRITICAL CVE gate'));
  assert.ok(container.includes('cancel-in-progress: true'));
  assert.ok(!container.includes('group: container-security-${{ github.event.pull_request.number || github.ref }}'));
});

test('governance separates event actions and validates the live head/base snapshot', () => {
  assert.ok(governance.includes("format('pr-governance-pr-{0}-{1}-{2}-{3}'"));
  assert.ok(governance.includes('github.event.action'));
  assert.ok(governance.includes('github.rest.pulls.get'));
  assert.ok(governance.includes('Stale PR-Event kostensparend beenden'));
  assert.ok(governance.includes('name: PR Governance (Kosten / Workflow / Vorlage)'));
  assert.ok(governance.includes('cancel-in-progress: true'));
  assert.ok(!governance.includes('group: pr-governance-${{ github.event.pull_request.number || github.ref }}'));
});

test('zizmor workflow analysis is isolated by exact PR head/base snapshot', () => {
  assert.ok(zizmor.includes("format('zizmor-pr-{0}-{1}-{2}'"));
  assert.ok(zizmor.includes('github.rest.pulls.get'));
  assert.ok(zizmor.includes('Stale PR-Event vor Workflow-Analyse beenden'));
  assert.ok(zizmor.indexOf('Stale PR-Event vor Workflow-Analyse beenden') < zizmor.indexOf('Repository auschecken'));
  assert.ok(zizmor.includes('cancel-in-progress: true'));
  assert.ok(!zizmor.includes('group: zizmor-${{ github.event.pull_request.number || github.ref }}'));
});

test('remaining PR-number concurrency surfaces are already bounded or non-automatic', () => {
  assert.ok(branchSync.includes('headRefOid'));
  assert.ok(branchSync.includes('-f "expected_head_sha=$head_sha"'));
  assert.ok(branchSync.includes('Head inzwischen geaendert oder Update laeuft schon (422)'));
  assert.ok(shadow.includes('on:\n  workflow_dispatch:'));
  assert.ok(!shadow.includes('on:\n  pull_request:'));
});
