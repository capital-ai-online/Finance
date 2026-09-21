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

test('Governance repair consumes completed events for initial runs and reruns without polling', () => {
  assert.match(workflow, /types: \[completed\]/);
  assert.doesNotMatch(workflow, /types: \[[^\]]*in_progress/);
  for (const token of [
    "github.event.action == 'completed'",
    'Abgeschlossenen Governance-Source-Run exakt binden',
    "context.payload.action !== 'completed'",
    "sourceRun.status !== 'completed'",
    'Number(sourceRun.run_attempt) < 1',
    "core.setOutput('conclusion'",
    "core.setOutput('run_attempt'",
  ]) assert.ok(workflow.includes(token), 'missing completed Governance source control: ' + token);
  assert.doesNotMatch(workflow, /getWorkflowRun|Date\.now\(\) \+ 240_000|setTimeout/);
});

test('baseline refresh concurrency isolates Governance repair from CI completion events', () => {
  const concurrency = workflow.split('concurrency:\n')[1].split('\n\njobs:')[0];
  assert.ok(
    concurrency.includes('pr-production-baseline-${{ github.event.workflow_run.path }}-'),
    'source workflow path must namespace the concurrency group',
  );
  assert.ok(
    concurrency.includes("github.event.workflow_run.event == 'push'"),
    'main-deploy grouping must remain explicit inside each source-workflow domain',
  );
  assert.ok(
    concurrency.includes('github.event.workflow_run.pull_requests[0].number'),
    'PR runs must remain grouped by pull request inside their source-workflow domain',
  );
  assert.ok(
    concurrency.includes('github.event.workflow_run.run_attempt'),
    'a later event from the same source run must not cancel another attempt lane',
  );
  assert.ok(
    concurrency.includes('github.event.action'),
    'in_progress fallback and completed notification must use distinct concurrency lanes',
  );
  assert.match(concurrency, /cancel-in-progress: true/);
  assert.ok(
    workflow.includes('CI completion events intentionally use different groups'),
    'the race-control intent must remain reviewable next to the concurrency key',
  );
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
    workflow.includes('PR_BODY_REPAIR_ELIGIBLE: ${{ steps.body_repair.outputs.eligible }}'),
    'reconciliation must receive whether the deterministic PR-body repair was eligible',
  );
  assert.ok(
    workflow.includes('PR_BODY_REPAIR_REASON: ${{ steps.body_repair.outputs.reason }}'),
    'reconciliation must receive the deterministic PR-body repair reason',
  );
  assert.ok(
    workflow.includes('SOURCE_CONCLUSION: ${{ steps.source.outputs.conclusion }}'),
    'reconciliation must use the completion-bound source conclusion for fail-closed metadata handling',
  );
  assert.ok(
    workflow.includes("const baselineChanged = String(process.env.BASELINE_CHANGED || '').toLowerCase() === 'true';"),
    'baseline-change state must be normalized inside the trusted rerun decision',
  );
});

test('baseline write is gated by source success or a proven canonical/repaired body', () => {
  const refresh = workflow.split('      - name: Nur kanonischen Produktions-Baseline-Block aktualisieren\n')[1]
    .split('\n      - name: Aktualisierten PR-Body gegen trusted-main Validator prüfen\n')[0];
  for (const token of [
    "steps.source.outputs.conclusion != 'failure'",
    "steps.body_repair.outputs.changed == 'true'",
    "steps.body_repair.outputs.reason == 'already-canonical'",
  ]) assert.ok(refresh.includes(token), 'missing safe baseline-write prerequisite: ' + token);
});

test('mutated PR metadata is revalidated with trusted-main validatePrBody before Governance rerun', () => {
  const validation = workflow.split('      - name: Aktualisierten PR-Body gegen trusted-main Validator prüfen\n')[1]
    .split('\n      - name: Baseline-/Template-Write oder Race-Recovery an exakte PR-Governance binden\n')[0];
  for (const token of [
    "steps.body_repair.outputs.changed == 'true' || steps.refresh.outputs.changed == 'true'",
    'PR_BASE_REF: origin/main',
    'PR_HEAD_REF: HEAD',
    'PR_BASELINE_OUTPUT: ${{ runner.temp }}/production-baseline.json',
    'node ../policy/scripts/pr/validatePrBody.mjs',
  ]) assert.ok(validation.includes(token), 'missing trusted PR-body revalidation control: ' + token);
});

test('blocked template repair stays fail-closed and is never reported as already correct', () => {
  for (const token of [
    "const bodyRepairEligible = String(process.env.PR_BODY_REPAIR_ELIGIBLE || '').toLowerCase() === 'true';",
    "const bodyRepairReason = String(process.env.PR_BODY_REPAIR_REASON || '').trim();",
    "const bodyAlreadyCanonical = bodyRepairReason === 'already-canonical';",
    "sourceConclusion === 'failure'",
    '!bodyRepaired',
    '!bodyAlreadyCanonical',
    'PR-Body-Reparatur konnte nicht deterministisch konvergieren',
    'Governance bleibt fail-closed; der Body darf nicht als bereits korrekt gemeldet werden.',
  ]) {
    assert.ok(workflow.includes(token), 'missing blocked-body-repair guard: ' + token);
  }
  assert.doesNotMatch(workflow, /Baseline und PR-Body bereits korrekt/);
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

test('Governance rerun requires a proven baseline or metadata mutation', () => {
  assert.ok(
    workflow.includes('const provenMetadataRace = bodyRepaired;'),
    'metadata rerun authority must be tied to an observed deterministic body mutation',
  );
  assert.ok(
    workflow.includes('const provenBaselineRace = baselineChanged;'),
    'baseline rerun authority must be tied to an observed production-baseline mutation',
  );
  assert.ok(
    workflow.includes('const shouldRerun = provenMetadataRace || provenBaselineRace;'),
    'rerun authority must contain no generic failed-attempt fallback',
  );
  assert.doesNotMatch(
    workflow,
    /firstFailedAttempt|Race-Recovery für bereits korrekte Baseline/,
    'unchanged failed Governance runs must never be generically retried',
  );
  assert.ok(
    workflow.includes('keine nachgewiesene Baseline-/Metadata-Mutation'),
    'unchanged failure must explicitly terminate without a rerun',
  );
  assert.ok(
    workflow.includes("POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun"),
    'the exact workflow-run rerun endpoint remains available only for proven mutations',
  );
});

test('Governance template remediation is failure-only, trusted-main and exact-snapshot bound', () => {
  for (const token of [
    'Fehlende kanonische PR-Abschnitte deterministisch reparieren',
    "steps.source.outputs.conclusion == 'failure'",
    'node ../policy/scripts/pr/classifyPrScope.mjs',
    'node ../policy/scripts/pr/repairLegacyPrBodyStructure.mjs',
    'EXPECTED_HEAD_SHA: ${{ steps.pr.outputs.head_sha }}',
    'EXPECTED_MAIN_SHA: ${{ steps.policy_main.outputs.sha }}',
    'PR_CHECK_CLASS: ${{ steps.body_scope.outputs.class }}',
  ]) assert.ok(workflow.includes(token), 'missing bounded template-repair control: ' + token);
  assert.doesNotMatch(workflow, /node scripts\/pr\/repairLegacyPrBodyStructure\.mjs/);
  assert.doesNotMatch(workflow, /pull_request_target\s*:/);
});


test('all production baseline PR writers share the canonical per-PR writer lease', () => {
  const direct = workflow.split('  refresh-baseline:\n')[1].split('\n  discover_post_deploy_prs:\n')[0];
  const postDeploy = workflow.split('  refresh_post_deploy_baselines:\n')[1];
  assert.ok(direct.includes('group: capital-ai-pr-writer-${{ github.event.workflow_run.pull_requests[0].number }}'));
  assert.ok(postDeploy.includes('group: capital-ai-pr-writer-${{ matrix.pr_number }}'));
  assert.match(direct, /cancel-in-progress: false/);
  assert.match(postDeploy, /cancel-in-progress: false/);
});


test('post-deploy and post-merge baseline reconciliation advance at most one FIFO PR', () => {
  const postMerge = fs.readFileSync('.github/workflows/pr-production-baseline-post-merge-refresh.yml', 'utf8');
  for (const source of [workflow, postMerge]) {
    assert.ok(source.includes('sort((a, b) => Number(a.number) - Number(b.number))'));
    assert.ok(source.includes("break;"));
    assert.match(source, /max-parallel: 1/);
    assert.doesNotMatch(source, /max-parallel: 4/);
  }
  assert.doesNotMatch(postMerge, /setTimeout\(/);
  assert.doesNotMatch(postMerge, /maxRounds/);
  assert.ok(postMerge.includes('next-pr-not-synced'));
  assert.ok(workflow.includes('next-pr-not-synced'));
});


test('direct Governance baseline writer correlates CURRENT_MAIN before any PR-body mutation', () => {
  const direct = workflow.split('  refresh-baseline:\n')[1].split('\n  discover_post_deploy_prs:\n')[0];
  assert.ok(direct.includes('Aktuellen PR-Snapshot und CURRENT_MAIN vor Write autorisieren'));
  assert.ok(direct.includes('EXPECTED_MAIN_SHA: ${{ steps.policy_main.outputs.sha }}'));
  assert.ok(direct.includes("basehead: `${expectedMain}...${pr.head.sha}`"));
  assert.ok(direct.includes("workflow_id: 'sync-agent-pr-branches.yml'"));
  assert.ok(direct.includes("core.setOutput('eligible', 'false')"));
  assert.ok(direct.includes('CURRENT_MAIN ancestry PASS; Governance baseline fix may continue.'));
});
