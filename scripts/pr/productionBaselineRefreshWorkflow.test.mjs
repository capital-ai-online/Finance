import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const relay = fs.readFileSync('.github/workflows/pr-production-baseline-refresh.yml', 'utf8');
const postMerge = fs.readFileSync('.github/workflows/pr-production-baseline-post-merge-refresh.yml', 'utf8');
const leading = fs.readFileSync('.github/workflows/pr-decision-reconciler.yml', 'utf8');
const reconcilerScript = fs.readFileSync('scripts/pr/reconcilePrDecisionEvidence.mjs', 'utf8');

function count(source, token) {
  return source.split(token).length - 1;
}

test('PR Decision Evidence Reconciler is the only PR-body writer in the convergence chain', () => {
  assert.match(leading, /# Leading PR self-healing body chain\./);
  assert.match(leading, /pull-requests: write/);
  assert.match(leading, /group: capital-ai-pr-writer-/);
  assert.match(leading, /PR_BASELINE_OUTPUT:/);
  assert.match(leading, /reconcilePrDecisionEvidence\.mjs/);

  for (const [name, source] of [
    ['baseline relay', relay],
    ['post-merge observer', postMerge],
  ]) {
    assert.doesNotMatch(source, /pull-requests: write/, name + ' must not own PR-body write authority');
    assert.doesNotMatch(source, /contents: write/, name + ' must not mutate repository content');
    assert.doesNotMatch(source, /updatePrProductionBaseline\.mjs/, name + ' must not update PR baseline bodies');
    assert.doesNotMatch(source, /repairLegacyPrBodyStructure\.mjs/, name + ' must not repair PR bodies');
    assert.doesNotMatch(source, /validatePrBody\.mjs/, name + ' must not run a second body-validation/write lane');
    assert.doesNotMatch(source, /rerunFailedJobs|reRunWorkflow|rerunWorkflow/, name + ' must not own Governance rerun authority');
  }
});

test('leading writer can disarm provider auto-merge before repairing a human-merge-required PR body', () => {
  const reconcileJob = leading.split('  reconcile:\n')[1];
  assert.ok(reconcileJob, 'reconcile job must exist');
  assert.match(reconcileJob, /permissions:\n      actions: write\n      checks: read\n(?:      #.*\n)*      contents: write\n      pull-requests: write/);
  assert.match(reconcilerScript, /disablePullRequestAutoMerge/);
  assert.match(
    reconcilerScript,
    /if \(livePr\?\.auto_merge\) \{\s*await mutateAutoMerge\(\{ repository, token, pr: livePr, enabled: false \}\);/s,
  );
});

test('stale PR heads delegate canonical branch sync before production preflight', () => {
  const lineageAt = leading.indexOf('Main-Ancestry vor Production-Preflight prüfen');
  const earlySyncAt = leading.indexOf('Stale Head vor Preflight an kanonischen Branch-Sync delegieren');
  const preflightAt = leading.indexOf('Produktionsbaseline aus Trusted Main für die führende PR-Convergence erzeugen');
  assert.ok(lineageAt >= 0, 'bootstrap lineage guard must exist');
  assert.ok(earlySyncAt > lineageAt, 'stale-head sync delegation must follow lineage classification');
  assert.ok(preflightAt > earlySyncAt, 'production preflight must run only after the stale-head sync gate');
  assert.match(leading, /id: bootstrap_lineage/);
  assert.match(leading, /git merge-base --is-ancestor "\$EXPECTED_MAIN_SHA" HEAD/);
  assert.match(leading, /Stale Head vor Preflight an kanonischen Branch-Sync delegieren\n        if: steps\.bootstrap_lineage\.outputs\.branch_sync_required == 'true'/);
  assert.match(leading, /Produktionsbaseline aus Trusted Main für die führende PR-Convergence erzeugen\n        if: steps\.bootstrap_lineage\.outputs\.branch_sync_required != 'true'/);
  assert.match(leading, /Evidence → Decision gegen Live-State reconciliieren\n        if: steps\.bootstrap_lineage\.outputs\.branch_sync_required != 'true'/);
  assert.equal(count(leading, "workflow_id: 'sync-agent-pr-branches.yml'"), 2);
});

test('baseline refresh is a read-only Governance observer plus verified post-deploy relay', () => {
  assert.match(relay, /workflows: \['PR Governance', 'CI'\]/);
  assert.match(relay, /types: \[completed\]/);
  assert.match(relay, /group: pr-production-baseline-relay-/);
  assert.match(relay, /run_attempt/);
  assert.match(relay, /cancel-in-progress: false/);

  assert.match(relay, /observe-pr-governance:/);
  assert.match(relay, /pr-governance\.yml/);
  assert.match(relay, /pull_request/);
  assert.match(relay, /pull-requests: read/);
  assert.match(relay, /Single-writer authority bestätigen/);

  assert.match(relay, /relay-post-deploy:/);
  assert.match(relay, /sourceRun\.path/);
  assert.match(relay, /sourceRun\.event/);
  assert.match(relay, /sourceRun\.head_branch/);
  assert.match(relay, /sourceRun\.status/);
  assert.match(relay, /sourceRun\.run_attempt/);
  assert.match(relay, /Deployment verifiziert \/ Render-Produktion/);
  assert.match(relay, /deployJob\.conclusion/);
  assert.match(relay, /workflow_id: 'pr-decision-reconciler\.yml'/);
  assert.match(relay, /inputs: \{ pr_number: '' \}/);
});

test('post-merge baseline workflow is compatibility observer only', () => {
  assert.match(postMerge, /workflows: \['Agenten-PR-Branches synchronisieren'\]/);
  assert.match(postMerge, /types: \[completed\]/);
  assert.match(postMerge, /sync-agent-pr-branches\.yml/);
  assert.match(postMerge, /workflow_run/);
  assert.match(postMerge, /conclusion == 'success'/);
  assert.match(postMerge, /Single-writer handoff bestätigen/);
  assert.match(postMerge, /No PR body mutation here/);
  assert.doesNotMatch(postMerge, /actions: write/);
  assert.doesNotMatch(postMerge, /pull-requests:/);
});

test('compatibility workflows do not duplicate the canonical per-PR body writer lease', () => {
  assert.equal(count(relay, 'capital-ai-pr-writer-'), 0);
  assert.equal(count(postMerge, 'capital-ai-pr-writer-'), 0);
  assert.equal(count(leading, 'capital-ai-pr-writer-'), 1);
});

test('verified production movement delegates into the leading chain instead of writing a second body projection', () => {
  assert.match(relay, /CI completed without a verified production deployment; no PR convergence dispatch\./);
  assert.match(relay, /Verified post-deploy event delegated to the single PR Decision Evidence Reconciler writer\./);
  assert.equal(count(relay, "workflow_id: 'pr-decision-reconciler.yml'"), 1);
});

test('leading chain owns structure, production baseline and Decision/Evidence in one generation', () => {
  for (const token of [
    'PR-v1.8-Struktur und exakten Bootstrap-Snapshot binden',
    'PR_BASELINE_OUTPUT:',
    'PR_CHECK_CLASS:',
    'node scripts/pr/reconcilePrDecisionEvidence.mjs',
    'capital-ai-pr-writer-',
    'pull-requests: write',
  ]) {
    assert.ok(leading.includes(token), 'missing leading-chain control: ' + token);
  }

  assert.match(leading, /actions: write/);
  assert.match(leading, /persist-credentials: false/);
});
