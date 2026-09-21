import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/ci.yml');
const baselineAutofixWorkflowPath = path.join(root, '.github/workflows/current-state-baseline-autofix.yml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

function stepBlock(yaml: string, stepName: string): string {
  const marker = `      - name: ${stepName}`;
  const start = yaml.indexOf(marker);
  if (start < 0) throw new Error(`Step ${stepName} not found in ci.yml`);
  const rest = yaml.slice(start + marker.length);
  const next = rest.indexOf('\n      - name: ');
  return next >= 0 ? rest.slice(0, next) : rest;
}

describe('P0 GitHub Actions CI cost control', () => {
  it('contains no retired M10 authorization and binds revalidation dispatch to an exact PR snapshot', () => {
    const yaml = workflow();
    expect(yaml).not.toContain('M10_CI_GATE_ENABLED');
    expect(yaml).not.toContain('AUTHORIZE_PR_CI');
    expect(yaml).not.toContain('/api/m10/');
    expect(yaml).toContain('workflow_dispatch:');
    expect(yaml).toContain('expected_head_sha:');
    expect(yaml).toContain('expected_head_ref:');
    expect(yaml).toContain('expected_base_sha:');
    expect(yaml).toContain("context.eventName !== 'workflow_dispatch' || runSha === headSha");
    expect(yaml).toContain("livePr.base?.ref === 'main'");
    expect(yaml).toContain('livePr.head?.repo?.full_name === `${owner}/${repo}`');
    expect(yaml).toContain('normalizeSha(main.commit?.sha) === baseSha');
  });

  it('dispatches CI only after the validated non-force branch write and evaluates the planner eligibility output fail-closed', () => {
    const yaml = fs.readFileSync(baselineAutofixWorkflowPath, 'utf8');
    const write = yaml.indexOf('await github.rest.git.updateRef');
    const dispatch = yaml.indexOf("workflow_id: 'ci.yml'", write);

    expect(write).toBeGreaterThan(-1);
    expect(dispatch).toBeGreaterThan(write);
    expect(yaml).toContain('force: false');
    expect(yaml).toContain('expected_head_sha: commit.sha');
    expect(yaml).toContain('expected_head_ref: pr.head.ref');
    expect(yaml).toContain('expected_base_sha: process.env.EXPECTED_BASE_SHA');
    expect(yaml).toContain("if: ${{ needs.plan.result == 'success' && fromJSON(needs.plan.outputs.eligible || 'false') }}");
    expect(yaml).toContain('tail -n 700 "$raw" > "$bounded"');
    expect(yaml).not.toContain('tail -n 700 "$raw" | head -c 120000');
  });

  it('places cost control before checkout and expensive work', () => {
    const yaml = workflow();
    const cost = yaml.indexOf('P0 CI-Kostenkontrolle — exakten PR-Snapshot wiederverwenden');
    const checkout = yaml.indexOf('Repository auschecken');

    expect(cost).toBeGreaterThan(-1);
    expect(checkout).toBeGreaterThan(cost);
  });

  it('grants only read access to Actions for exact-run lookup', () => {
    const yaml = workflow();
    const buildStart = yaml.indexOf('  build-and-test:');
    const nextJob = yaml.indexOf('\n  deploy-production:', buildStart);
    const block = yaml.slice(buildStart, nextJob);

    expect(block).toContain('actions: read');
    expect(block).not.toContain('actions: write');
  });

  it('reuses a PASS only for the same workflow, PR number, normalized head SHA and normalized base SHA', () => {
    const cost = stepBlock(workflow(), 'P0 CI-Kostenkontrolle — exakten PR-Snapshot wiederverwenden');

    expect(cost).toContain("event: 'pull_request'");
    expect(cost).toContain('head_sha: headSha');
    expect(cost).toContain("status: 'success'");
    expect(cost).toContain('run.workflow_id !== workflowId');
    expect(cost).toContain('pr.number === prNumber');
    expect(cost).toContain('normalizeSha(correlatedPr?.head?.sha) === headSha');
    expect(cost).toContain('normalizeSha(correlatedPr?.base?.sha) === baseSha');
  });

  it('reuses a successful prior attempt only for the same exact normalized PR snapshot', () => {
    const cost = stepBlock(workflow(), 'P0 CI-Kostenkontrolle — exakten PR-Snapshot wiederverwenden');

    expect(cost).toContain('currentRun.data.run_attempt');
    expect(cost).toContain("'GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}'");
    expect(cost).toContain('attempt_number: currentAttempt - 1');
    expect(cost).toContain("previous.conclusion === 'success'");
    expect(cost).toContain("previous.event === 'pull_request'");
    expect(cost).toContain('normalizeSha(previous.head_sha) === headSha');
    expect(cost).toContain('normalizeSha(previousCorrelatedPr?.head?.sha) === headSha');
    expect(cost).toContain('normalizeSha(previousCorrelatedPr?.base?.sha) === baseSha');
    expect(cost).toContain('vollständige CI bleibt aktiv');
  });

  it('limits snapshot reuse to exact PR validation events and validates the event snapshot against live PR and main first', () => {
    const cost = stepBlock(workflow(), 'P0 CI-Kostenkontrolle — exakten PR-Snapshot wiederverwenden');
    expect(cost).toContain("if: github.event_name == 'pull_request' || github.event_name == 'workflow_dispatch'");
    expect(cost).toContain('github.rest.pulls.get');
    expect(cost).toContain("github.rest.repos.getBranch({ owner, repo, branch: 'main' })");
    expect(cost).toContain("core.setOutput('current_snapshot', currentSnapshot ? 'true' : 'false')");
    expect(cost).toContain("core.setOutput('reuse_exact_snapshot', 'false')");
  });

  it('skips checkout and scope classification for stale snapshots or after an exact successful snapshot match', () => {
    const yaml = workflow();
    const checkout = stepBlock(yaml, 'Repository auschecken');
    const scope = stepBlock(yaml, 'Prüfumfang klassifizieren (D/C/R)');
    const guardedHeavyWork = "if: steps.cost_control.outputs.current_snapshot != 'false' && steps.cost_control.outputs.reuse_exact_snapshot != 'true'";

    expect(checkout).toContain(guardedHeavyWork);
    expect(scope).toContain(guardedHeavyWork);
  });

  it('does not reuse PR validation for stale snapshots or the production main-push chain', () => {
    const yaml = workflow();
    const reuse = stepBlock(yaml, 'Exakten CI-PASS wiederverwenden');

    expect(reuse).toContain("if: steps.cost_control.outputs.current_snapshot != 'false' && steps.cost_control.outputs.reuse_exact_snapshot == 'true'");
    expect(yaml).toContain("github.event_name == 'push' && github.ref == 'refs/heads/main'");
  });

  it('serializes current-state branch mutation through the canonical per-PR writer lease', () => {
    const yaml = fs.readFileSync(baselineAutofixWorkflowPath, 'utf8');
    const write = yaml.split('  write:\n')[1];
    expect(write).toContain('group: capital-ai-pr-writer-${{ needs.plan.outputs.pr_number }}');
    expect(write).toContain('cancel-in-progress: false');
  });

});
