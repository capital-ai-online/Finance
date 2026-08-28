import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const workflowPath = '.github/workflows/pr-production-baseline-refresh.yml';
const workflow = fs.readFileSync(workflowPath, 'utf8');

test('trusted baseline refresh owns only the permissions required for PR write and Governance rerun', () => {
  assert.match(workflow, /^permissions:\n  actions: write\n  contents: read\n  pull-requests: write$/m);
  assert.doesNotMatch(workflow, /pull_request_target\s*:/);
  assert.doesNotMatch(workflow, /permissions:\s*write-all/);
});

test('Governance reconciliation runs for every eligible PR snapshot and receives the atomic baseline-change result', () => {
  assert.match(workflow, /id: refresh/);
  assert.match(workflow, /- name: Baseline-Write oder Race-Recovery an exakte PR-Governance binden/);
  assert.match(
    workflow,
    /if: steps\.pr\.outputs\.eligible == 'true'\n\s+uses: actions\/github-script@/,
  );
  assert.ok(
    workflow.includes('BASELINE_CHANGED: ${{ steps.refresh.outputs.changed }}'),
    'reconciliation must receive the canonical baseline updater result',
  );
  assert.ok(
    workflow.includes("const baselineChanged = String(process.env.BASELINE_CHANGED || '').toLowerCase() === 'true';"),
    'baseline-change state must be normalized inside the trusted rerun decision',
  );
});

test('Governance rerun is bound to the same PR, immutable head and current main SHA', () => {
  for (const token of [
    'EXPECTED_HEAD_SHA: ${{ steps.pr.outputs.head_sha }}',
    'EXPECTED_MAIN_SHA: ${{ steps.policy_main.outputs.sha }}',
    "sourceRun.event !== 'pull_request'",
    'Number(sourceRun.pull_requests?.[0]?.number) !== prNumber',
    "pr.state !== 'open' || pr.base?.ref !== 'main' || !sameRepo",
    'liveHeadSha !== expectedHeadSha',
    'liveMainSha !== expectedMainSha',
    "event: 'pull_request'",
    'head_sha: expectedHeadSha',
    "run.path === '.github/workflows/pr-governance.yml'",
    'normalizeSha(item.head?.sha) === expectedHeadSha',
    'normalizeSha(item.base?.sha) === expectedMainSha',
  ]) {
    assert.ok(workflow.includes(token), `missing exact-snapshot guard: ${token}`);
  }
});

test('unchanged baseline permits exactly one stale-baseline race recovery and then terminates', () => {
  assert.ok(
    workflow.includes("exactRun.conclusion === 'failure' && Number(exactRun.run_attempt || 1) === 1"),
    'race recovery must require a failed first Governance attempt',
  );
  assert.ok(
    workflow.includes('const shouldRerun = baselineChanged || firstFailedAttempt;'),
    'rerun authority must be limited to a real baseline write or the bounded first-attempt recovery',
  );
  assert.ok(
    workflow.includes('if (!shouldRerun)'),
    'all unchanged non-first-failure states must terminate without another rerun',
  );
  assert.ok(
    workflow.includes('kein automatischer Re-Run.'),
    'the workflow must explicitly terminate after a successful or already-retried Governance result',
  );
  assert.ok(
    workflow.includes('Race-Recovery für bereits korrekte Baseline'),
    'the bounded stale-baseline recovery path must remain explicit and reviewable',
  );
  assert.ok(
    workflow.includes("POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun"),
    'the exact workflow-run rerun endpoint must be used',
  );
});
