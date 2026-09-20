import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const workflow = fs.readFileSync('.github/workflows/pr-autofix-controller.yml', 'utf8');

test('controller is a privileged completion trigger with rerun fallback and default-deny permissions', () => {
  assert.match(workflow, /workflow_run:\n\s+workflows: \[CI, PR Governance\]/);
  assert.match(workflow, /types: \[in_progress, completed\]/);
  assert.match(workflow, /^permissions: \{\}$/m);
  assert.doesNotMatch(workflow, /pull_request_target\s*:/);
  assert.doesNotMatch(workflow, /permissions:\s*write-all/);
});

test('classifier is read-only and binds exact same-repository PR head to current main', () => {
  const block = workflow.split('  classify:\n')[1].split('\n  repair:\n')[0];
  for (const token of [
    'actions: read',
    'contents: read',
    'pull-requests: read',
    "pr.state === 'open'",
    "pr.base.ref === 'main'",
    'pr.head.repo?.full_name === repository',
    'normalizeSha(pr.head.sha) === headSha',
    'mainSha !== baseSha',
    "github.event.action == 'completed'",
        'github.event.workflow_run.run_attempt == 1',
    "github.event.action == 'in_progress'",
    'github.event.workflow_run.run_attempt > 1',
    "steps.source.outputs.conclusion == 'failure'",
  ]) assert.ok(block.includes(token), 'missing classify guard: ' + token);
  assert.doesNotMatch(block, /contents: write|pull-requests: write|actions: write/);
});

test('rerun fallback waits for the exact source run without adding write authority', () => {
  const classify = workflow.split('  classify:\n')[1].split('\n  repair:\n')[0];
  for (const token of [
    'Source-Run bis zum Abschluss exakt binden',
    'github.rest.actions.getWorkflowRun',
    'run_id: expectedId',
    'Number(data.id) !== expectedId',
    'normalizeSha(data.head_sha) !== expectedHead',
    "String(data.path || '') !== expectedPath",
    "sourceRun.status !== 'completed'",
    "core.setOutput('conclusion'",
    'Date.now() + 240_000',
  ]) assert.ok(classify.includes(token), 'missing rerun source binding: ' + token);
  assert.doesNotMatch(classify, /contents: write|pull-requests: write|actions: write/);
});

test('failure logs are bounded, redacted and never uploaded as artifacts', () => {
  assert.ok(workflow.includes('tail -n 700 "$raw" > "$bounded"'));
  assert.ok(workflow.includes('head -c 120000 "$bounded"'));
  assert.ok(workflow.includes('[REDACTED_GITHUB_TOKEN]'));
  assert.ok(workflow.includes('[REDACTED_API_TOKEN]'));
  assert.ok(workflow.includes('[REDACTED_STRIPE_TOKEN]'));
  assert.ok(workflow.includes('[REDACTED_SUPABASE_TOKEN]'));
  assert.doesNotMatch(workflow, /path: \$\{\{ runner\.temp \}\}\/pr-autofix-failed/);
});

test('existing baseline and PR metadata writers remain specialist-owned', () => {
  assert.ok(workflow.includes('Current-State Baseline Autofix owns CURRENT_STATE_PROJECTION_BASELINE_* repository writes.'));
  assert.ok(workflow.includes('PR Production Baseline Auto-Refresh owns deterministic PR-body/template/baseline writes.'));
  assert.doesNotMatch(workflow, /updatePrProductionBaseline\.mjs|repairLegacyPrBodyStructure\.mjs/);
});

test('candidate checkout exists only in read-only repair job and never in write job', () => {
  const repair = workflow.split('  repair:\n')[1].split('\n  write:\n')[0];
  const write = workflow.split('  write:\n')[1];
  assert.match(repair, /permissions:\n      contents: read/);
  assert.ok(repair.includes('Kandidaten-Head ohne persistierte Credentials auschecken'));
  assert.ok(repair.includes('persist-credentials: false'));
  assert.doesNotMatch(repair, /contents: write|actions: write|pull-requests: write/);

  assert.match(write, /actions: write\n      contents: write\n      pull-requests: read/);
  assert.doesNotMatch(write, /actions\/checkout@/);
  assert.doesNotMatch(write, /node (?:work|candidate)\//);
});

test('write is exact-head/main, non-force and CI redispatch is after the branch write', () => {
  const write = workflow.split('  write:\n')[1];
  for (const token of [
    "pr.state !== 'open' || pr.base.ref !== 'main'",
    'normalizeSha(pr.head.sha) !== expectedHead',
    'normalizeSha(pr.base.sha) !== expectedBase',
    'normalizeSha(main.commit.sha) !== expectedBase',
    'force: false',
    "workflow_id: 'ci.yml'",
    'expected_head_sha: commit.sha',
    'expected_base_sha: expectedBase',
  ]) assert.ok(write.includes(token), 'missing write guard: ' + token);
  assert.ok(write.indexOf('updateRef') < write.indexOf('createWorkflowDispatch'));
});

test('all referenced marketplace actions are pinned to immutable commit SHAs', () => {
  const refs = [...workflow.matchAll(/uses:\s+([^\s#]+)/g)].map((match) => match[1]);
  assert.ok(refs.length > 0);
  for (const ref of refs) {
    assert.match(ref, /@[0-9a-f]{40}$/i, 'un-pinned action: ' + ref);
  }
});

test('repeat-autofix signature trailer is read and written for loop prevention', () => {
  assert.ok(workflow.includes('CAPITAL_AI_AUTOFIX_SIGNATURE:'));
  assert.ok(workflow.includes('previous_autofix_signature'));
  assert.ok(workflow.includes('PREVIOUS_AUTOFIX_SIGNATURE'));
});
