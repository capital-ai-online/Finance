import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflow = fs.readFileSync('.github/workflows/current-state-baseline-autofix.yml', 'utf8');

test('current-state baseline autofix correlates exact PR with CURRENT_MAIN before mutation', () => {
  assert.ok(workflow.includes('sync_required: ${{ steps.pr.outputs.sync_required }}'));
  assert.ok(workflow.includes("basehead: `${mainSha}...${pr.head.sha}`"));
  assert.ok(workflow.includes("core.setOutput('base_sha', mainSha)"));
  assert.ok(workflow.includes("core.setOutput('sync_required', 'true')"));
  assert.ok(workflow.includes('PR vor Baseline-Fix auf CURRENT_MAIN korrelieren'));
  assert.ok(workflow.includes("workflow_id: 'sync-agent-pr-branches.yml'"));
});

test('baseline write rechecks CURRENT_MAIN and chooses branch sync or exact-head CI', () => {
  const write = workflow.split('  write:\n')[1];
  assert.ok(write.includes('actions: write'));
  assert.ok(write.includes('CURRENT_MAIN moved before baseline fix'));
  assert.ok(write.includes("basehead: `${main.commit.sha}...${pr.head.sha}`"));
  assert.ok(write.includes("workflow_id: 'sync-agent-pr-branches.yml'"));
  assert.ok(write.includes("workflow_id: 'ci.yml'"));
  assert.ok(write.includes('expected_head_sha: commit.sha'));
  assert.ok(write.includes('expected_base_sha: postMain.commit.sha'));
  assert.ok(write.includes("core.setOutput('revalidation', 'branch-sync')"));
  assert.ok(write.includes("core.setOutput('revalidation', 'ci')"));
});

test('baseline fix remains serialized by the canonical per-PR writer lease', () => {
  const sync = workflow.split('  sync-before-fix:\n')[1].split('\n  patch:\n')[0];
  const write = workflow.split('  write:\n')[1];
  assert.ok(sync.includes('group: capital-ai-pr-writer-${{ needs.plan.outputs.pr_number }}'));
  assert.ok(write.includes('group: capital-ai-pr-writer-${{ needs.plan.outputs.pr_number }}'));
  assert.ok(sync.includes('cancel-in-progress: false'));
  assert.ok(write.includes('cancel-in-progress: false'));
});


test('current-state baseline autofix accepts exact CI workflow_dispatch revalidation without broadening writer scope', () => {
  assert.ok(workflow.includes("github.event.workflow_run.event == 'workflow_dispatch'"));
  assert.ok(workflow.includes("run.event === 'workflow_dispatch'"));
  assert.ok(workflow.includes("String(run.head_branch || '') !== pr.head.ref"));
  assert.ok(workflow.includes("github.event.workflow_run.path == '.github/workflows/ci.yml'"));
});
