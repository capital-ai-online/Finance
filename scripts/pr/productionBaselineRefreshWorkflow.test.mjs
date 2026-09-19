import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const workflowPath = '.github/workflows/pr-production-baseline-refresh.yml';
const workflow = fs.readFileSync(workflowPath, 'utf8');

test('trusted baseline refresh owns only the permissions required for PR write and Governance rerun', () => {
  assert.match(workflow, /^permissions: \{\}$/m);
  for (const job of ['refresh-baseline', 'refresh_post_deploy_baselines']) {
    const body = workflow.split(`  ${job}:\n`)[1].split(/\n  [\w-]+:\n/)[0];
    assert.match(body, /permissions:\n      actions: write[^\n]*\n      contents: read[^\n]*\n      pull-requests: write/);
  }
  assert.doesNotMatch(workflow, /pull_request_target\s*:/);
  assert.doesNotMatch(workflow, /permissions:\s*write-all/);
});

test('privileged completion triggers retain source guards and isolated baseline output', () => {
  const postMerge = fs.readFileSync('.github/workflows/pr-production-baseline-post-merge-refresh.yml', 'utf8');
  for (const source of [workflow, postMerge]) {
    assert.match(source, /^permissions: \{\}$/m);
    assert.ok(source.includes('github.event.workflow_run.repository.full_name == github.repository'));
    assert.ok(source.includes('github.event.workflow_run.head_repository.full_name == github.repository'));
    const outputs = [...source.matchAll(/PR_BASELINE_OUTPUT: (.*)/g)].map((match) => match[1]);
    assert.ok(outputs.length >= 2);
    assert.ok(outputs.every((value) => value === '${{ runner.temp }}/production-baseline.json'));
    assert.doesNotMatch(source, /download-artifact@|actions\/cache@|persist-credentials: true/);
    assert.ok(source.includes('node ../policy/scripts/pr/productionPreflight.mjs'));
    assert.ok(source.includes('node ../policy/scripts/pr/updatePrProductionBaseline.mjs'));
  }
  assert.ok(workflow.includes("github.event.workflow_run.path == '.github/workflows/pr-governance.yml'"));
  assert.ok(workflow.includes("github.event.workflow_run.path == '.github/workflows/ci.yml'"));
  assert.ok(postMerge.includes("github.event.workflow_run.path == '.github/workflows/sync-agent-pr-branches.yml'"));
});

test('report steps render hostile output and input values as data without shell execution', () => {
  const cases = [
    ['ci.yml', 'Exakten CI-PASS wiederverwenden'],
    ['ci.yml', 'Scope-Zusammenfassung'],
    ['node-toolchain-write-boundary-supersession.yml', 'Branch-only Ergebnis dokumentieren'],
  ];
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-shell-test-'));
  try {
    const hostile = '$(touch INJECTED) `touch INJECTED` "; touch INJECTED; #';
    for (const [file, name] of cases) {
      const source = fs.readFileSync(`.github/workflows/${file}`, 'utf8');
      const block = source.split(`      - name: ${name}\n`)[1].split('\n      - name:')[0];
      const script = block.split('        run: |\n')[1];
      assert.ok(script, `missing shell body: ${name}`);
      assert.doesNotMatch(script, /\$\{\{/);
      const names = [...block.matchAll(/^          (REPORT_\w+):/gm)].map((match) => match[1]);
      assert.ok(names.length > 0);
      const summary = path.join(directory, 'summary');
      fs.writeFileSync(summary, '');
      const result = spawnSync('bash', ['-euo', 'pipefail', '-c', script], {
        cwd: directory,
        encoding: 'utf8',
        env: { ...process.env, GITHUB_STEP_SUMMARY: summary, ...Object.fromEntries(names.map((key) => [key, hostile])) },
      });
      assert.equal(result.status, 0, result.stderr);
      assert.ok((result.stdout + fs.readFileSync(summary, 'utf8')).includes(hostile));
      assert.equal(fs.existsSync(path.join(directory, 'INJECTED')), false);
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('Governance reconciliation runs for every eligible PR snapshot and receives the atomic baseline-change result', () => {
  assert.match(workflow, /id: refresh/);
  assert.match(workflow, /- name: Baseline-\/Template-Write oder Race-Recovery an exakte PR-Governance binden/);
  assert.match(
    workflow,
    /if: steps\.pr\.outputs\.eligible == 'true'\n\s+uses: actions\/github-script@/,
  );
  assert.ok(
    workflow.includes('BASELINE_CHANGED: ${{ steps.refresh.outputs.changed }}'),
    'reconciliation must receive the canonical baseline updater result',
  );
  assert.ok(
    workflow.includes('PR_BODY_REPAIRED: ${{ steps.body_repair.outputs.changed }}'),
    'reconciliation must receive the deterministic PR-body repair result',
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
    workflow.includes('const shouldRerun = bodyRepaired || baselineChanged || firstFailedAttempt;'),
    'rerun authority must be limited to a deterministic body repair, real baseline write or the bounded first-attempt recovery',
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


test('Governance template remediation is failure-only, trusted-main and exact-snapshot bound', () => {
  for (const token of [
    'Fehlende kanonische PR-Abschnitte deterministisch reparieren',
    "github.event.workflow_run.conclusion == 'failure'",
    'node ../policy/scripts/pr/classifyPrScope.mjs',
    'node ../policy/scripts/pr/repairLegacyPrBodyStructure.mjs',
    'EXPECTED_HEAD_SHA: ${{ steps.pr.outputs.head_sha }}',
    'EXPECTED_MAIN_SHA: ${{ steps.policy_main.outputs.sha }}',
    'PR_CHECK_CLASS: ${{ steps.body_scope.outputs.class }}',
  ]) assert.ok(workflow.includes(token), 'missing bounded template-repair control: ' + token);
  assert.doesNotMatch(workflow, /node scripts\/pr\/repairLegacyPrBodyStructure\.mjs/);
  assert.doesNotMatch(workflow, /pull_request_target\s*:/);
});
