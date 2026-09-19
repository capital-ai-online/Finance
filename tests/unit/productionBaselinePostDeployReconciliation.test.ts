import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/pr-production-baseline-refresh.yml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

describe('production baseline post-deploy reconciliation', () => {
  it('uses the workflow_run source allowlist instead of dynamic run-name labels as identity', () => {
    const yaml = workflow();
    expect(yaml).toContain("workflows: ['PR Governance', 'CI']");
    expect(yaml).toContain('types: [completed]');
    expect(yaml).not.toContain("github.event.workflow_run.name == 'PR Governance'");
    expect(yaml).not.toContain("github.event.workflow_run.name == 'CI'");
    expect(yaml).not.toContain("sourceRun.name !== 'CI'");
  });

  it('accepts the deployment trigger only for successful push/main CI semantics', () => {
    const yaml = workflow();
    expect(yaml).toContain("github.event.workflow_run.event == 'push'");
    expect(yaml).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(yaml).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(yaml).toContain("sourceRun.event !== 'push' || sourceRun.head_branch !== 'main'");
    expect(yaml).toContain("job.name === 'Deployment verifiziert / Render-Produktion'");
    expect(yaml).toContain("deployJob.status !== 'completed' || deployJob.conclusion !== 'success'");
  });

  it('keeps the PR Governance path event-bound without depending on its dynamic run-name', () => {
    const yaml = workflow();
    expect(yaml).toContain("github.event.workflow_run.event == 'pull_request'");
    expect(yaml).toContain('github.event.workflow_run.pull_requests[0].number != null');
    expect(yaml).toContain("sourceRun.event !== 'pull_request'");
  });

  it('correlates source CI, current main and live production before any PR write', () => {
    const yaml = workflow();
    expect(yaml).toContain('sourceHeadSha !== mainSha');
    expect(yaml).toContain("fetch('https://capital-ai.online/healthz'");
    expect(yaml).toContain('health?.deployment?.commitSha');
    expect(yaml).toContain("healthResponse.headers.get('x-capital-ai-commit')");
    expect(yaml).toContain('productionSha !== mainSha || productionSha !== sourceHeadSha');
    expect(yaml).toContain('keine PR-Baseline wird aus einem überholten Deploy-Event geschrieben');
  });

  it('limits post-deploy mutation to open same-repository PRs that already contain current main', () => {
    const yaml = workflow();
    expect(yaml).toContain("state: 'open'");
    expect(yaml).toContain("base: 'main'");
    expect(yaml).toContain('pr.head?.repo?.full_name === `${context.repo.owner}/${context.repo.repo}`');
    expect(yaml).toContain("basehead: `${mainSha}...${headSha}`");
    expect(yaml).toContain("compare.data.status === 'ahead' || compare.data.status === 'identical'");
    expect(yaml).toContain('not-synced(${compare.data.status})');
  });

  it('runs trusted main policy against candidate data without persistent checkout credentials', () => {
    const yaml = workflow();
    expect(yaml).toContain('ref: ${{ matrix.base_sha }}');
    expect(yaml).toContain('ref: ${{ matrix.head_sha }}');
    expect(yaml).toContain('persist-credentials: false');
    expect(yaml).toContain('node ../policy/scripts/pr/productionPreflight.mjs');
    expect(yaml).toContain('node ../policy/scripts/pr/updatePrProductionBaseline.mjs');
    expect(yaml).not.toContain('node candidate/');
    expect(yaml).not.toContain('npm --prefix candidate');
  });

  it('re-runs only exact completed Governance and bounds stale-baseline race recovery to attempt one', () => {
    const yaml = workflow();
    expect(yaml).toContain("run.path === '.github/workflows/pr-governance.yml'");
    expect(yaml).not.toContain("run.name === 'PR Governance'");
    expect(yaml).toContain("event: 'pull_request'");
    expect(yaml).toContain('head_sha: expectedHeadSha');
    expect(yaml).toContain('normalizeSha(item.base?.sha) === expectedMainSha');
    expect(yaml).toContain("exactRun.conclusion === 'failure'");
    expect(yaml).toContain("Number(exactRun.run_attempt || 1) === 1");
    expect(yaml).toContain("const bodyRepaired = String(process.env.PR_BODY_REPAIRED || '').toLowerCase() === 'true';");
    expect(yaml).toContain('PR_BODY_REPAIRED: ${{ steps.body_repair.outputs.changed }}');
    expect(yaml).toContain('const shouldRerun = bodyRepaired || baselineChanged || firstFailedAttempt;');
    expect(yaml).toContain("POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun");
    expect(yaml).not.toContain('run_id: sourceRunId');
    expect(yaml).toContain('main änderte sich während der Baseline-Revalidierung');
  });

  it('keeps reconciliation idempotent and bounded under one main-deploy concurrency group', () => {
    const yaml = workflow();
    expect(yaml).toContain("'main-deploy'");
    expect(yaml).toContain('cancel-in-progress: true');
    expect(yaml).toContain('BASELINE_CHANGED: ${{ steps.refresh.outputs.changed }}');
    expect(yaml).toContain('kein automatischer Re-Run');
    expect(yaml).toContain('gegen Rerun-Schleifen begrenzt');
    expect(yaml).toContain('max-parallel: 4');
  });

  it('keeps privileged actions immutable and explicit', () => {
    const yaml = workflow();
    expect(yaml).toContain('actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8');
    expect(yaml).toContain('actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444');
    expect(yaml).toContain('actions/github-script@3a2844b7e9c422d3c10d287c895573f7108da1b3');
    expect(yaml).not.toContain('pull_request_target');
  });
});
