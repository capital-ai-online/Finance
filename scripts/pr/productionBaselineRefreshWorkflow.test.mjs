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

test('Governance rerun is reachable only after a real baseline body mutation', () => {
  assert.match(workflow, /id: refresh/);
  assert.match(
    workflow,
    /if: steps\.pr\.outputs\.eligible == 'true' && steps\.refresh\.outputs\.changed == 'true'/,
  );
  assert.match(workflow, /steps\.refresh\.outputs\.changed != 'true'/);
});

test('Governance rerun is bound to the same PR, immutable head, main SHA and source run', () => {
  for (const token of [
    'EXPECTED_HEAD_SHA: ${{ steps.pr.outputs.head_sha }}',
    'EXPECTED_MAIN_SHA: ${{ steps.policy_main.outputs.sha }}',
    'SOURCE_RUN_ID: ${{ github.event.workflow_run.id }}',
    "sourceRun.event !== 'pull_request'",
    'normalizeSha(sourceRun.head_sha) !== expectedHeadSha',
    "pr.state !== 'open' || pr.base?.ref !== 'main' || !sameRepo",
    'liveHeadSha !== expectedHeadSha',
    'liveMainSha !== expectedMainSha',
  ]) {
    assert.ok(workflow.includes(token), `missing exact-snapshot guard: ${token}`);
  }
});

test('Governance rerun targets only the exact triggering Actions run and loop terminates on unchanged baseline', () => {
  assert.ok(
    workflow.includes("POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun"),
    'exact workflow-run rerun endpoint must be used',
  );
  assert.ok(
    workflow.includes('Baseline unverändert; kein Governance-Re-Run und damit keine Workflow-Schleife.'),
    'unchanged baseline must terminate orchestration without another rerun',
  );
});
