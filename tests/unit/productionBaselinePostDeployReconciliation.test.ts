import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const relayPath = path.join(root, '.github/workflows/pr-production-baseline-refresh.yml');
const leadingWriterPath = path.join(root, '.github/workflows/pr-decision-reconciler.yml');

const relay = () => fs.readFileSync(relayPath, 'utf8');
const leading = () => fs.readFileSync(leadingWriterPath, 'utf8');

describe('production baseline post-deploy relay', () => {
  it('accepts only completed successful CI push/main deployment events', () => {
    const yaml = relay();
    expect(yaml).toContain("workflows: ['PR Governance', 'CI']");
    expect(yaml).toContain('types: [completed]');
    expect(yaml).toContain("github.event.action == 'completed'");
    expect(yaml).toContain("github.event.workflow_run.path == '.github/workflows/ci.yml'");
    expect(yaml).toContain("github.event.workflow_run.event == 'push'");
    expect(yaml).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(yaml).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(yaml).toContain("sourceRun.path !== '.github/workflows/ci.yml'");
    expect(yaml).toContain("sourceRun.event !== 'push'");
    expect(yaml).toContain("sourceRun.head_branch !== 'main'");
    expect(yaml).toContain("sourceRun.status !== 'completed'");
    expect(yaml).toContain('Number(sourceRun.run_attempt) < 1');
  });

  it('requires the completed CI run to contain a successful verified Render deployment job', () => {
    const yaml = relay();
    expect(yaml).toContain("job.name === 'Deployment verifiziert / Render-Produktion'");
    expect(yaml).toContain("deployJob.status !== 'completed' || deployJob.conclusion !== 'success'");
    expect(yaml).toContain("core.setOutput('verified_deploy', 'false')");
    expect(yaml).toContain("core.setOutput('verified_deploy', 'true')");
    expect(yaml).toContain('CI completed without a verified production deployment; no PR convergence dispatch.');
  });

  it('keeps PR Governance completion read-only and event-bound', () => {
    const yaml = relay();
    expect(yaml).toContain('observe-pr-governance:');
    expect(yaml).toContain("github.event.workflow_run.path == '.github/workflows/pr-governance.yml'");
    expect(yaml).toContain("github.event.workflow_run.event == 'pull_request'");
    expect(yaml).toContain('pull-requests: read');
    expect(yaml).not.toContain('pull-requests: write');
    expect(yaml).toContain('Single-writer authority bestätigen');
  });

  it('delegates verified production movement to the leading writer instead of mutating PR bodies', () => {
    const yaml = relay();
    expect(yaml).toContain("workflow_id: 'pr-decision-reconciler.yml'");
    expect(yaml).toContain("ref: 'main'");
    expect(yaml).toContain("inputs: { pr_number: '' }");
    expect(yaml).toContain('Verified post-deploy event delegated to the single PR Decision Evidence Reconciler writer.');
    expect(yaml).not.toContain('updatePrProductionBaseline.mjs');
    expect(yaml).not.toContain('repairLegacyPrBodyStructure.mjs');
    expect(yaml).not.toContain('validatePrBody.mjs');
    expect(yaml).not.toContain('capital-ai-pr-writer-');
  });

  it('owns only the permissions required to verify CI and dispatch the leading workflow', () => {
    const yaml = relay();
    expect(yaml).toContain('permissions: {}');
    expect(yaml).toContain('actions: write');
    expect(yaml).toContain('contents: read');
    expect(yaml).not.toContain('contents: write');
    expect(yaml).not.toContain('pull-requests: write');
    expect(yaml).not.toContain('actions/checkout@');
    expect(yaml).not.toContain('actions/setup-node@');
    expect(yaml).toContain('actions/github-script@3a2844b7e9c422d3c10d287c895573f7108da1b3');
  });

  it('serializes relay evidence by immutable source-run identity without cancelling accepted events', () => {
    const yaml = relay();
    expect(yaml).toContain('group: pr-production-baseline-relay-${{ github.event.workflow_run.id }}-${{ github.event.workflow_run.run_attempt }}-${{ github.event.action }}');
    expect(yaml).toContain('cancel-in-progress: false');
    expect(yaml).not.toContain("'main-deploy'");
    expect(yaml).not.toContain('max-parallel: 1');
  });

  it('leaves structure, baseline and Decision/Evidence projection with PR Decision Evidence Reconciler', () => {
    const yaml = leading();
    expect(yaml).toContain('# Leading PR self-healing body chain.');
    expect(yaml).toContain('pull-requests: write');
    expect(yaml).toContain('group: capital-ai-pr-writer-${{ matrix.pr_number }}');
    expect(yaml).toContain('PR_BASELINE_OUTPUT:');
    expect(yaml).toContain('PR_CHECK_CLASS:');
    expect(yaml).toContain('node scripts/pr/reconcilePrDecisionEvidence.mjs');
  });

  it('does not reintroduce the retired post-deploy per-PR mutation loop', () => {
    const yaml = relay();
    expect(yaml).not.toContain("state: 'open'");
    expect(yaml).not.toContain("base: 'main'");
    expect(yaml).not.toContain('matrix.base_sha');
    expect(yaml).not.toContain('matrix.head_sha');
    expect(yaml).not.toContain('BASELINE_CHANGED');
    expect(yaml).not.toContain('PR_BODY_REPAIRED');
    expect(yaml).not.toContain('POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun');
  });
});
