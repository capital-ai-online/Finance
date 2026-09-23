import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const postMergePath = path.join(root, '.github/workflows/pr-production-baseline-post-merge-refresh.yml');
const leadingWriterPath = path.join(root, '.github/workflows/pr-decision-reconciler.yml');

const readPostMerge = () => fs.readFileSync(postMergePath, 'utf8');
const readLeadingWriter = () => fs.readFileSync(leadingWriterPath, 'utf8');

describe('production baseline post-merge observer', () => {
  it('binds only to the trusted post-correlation branch-sync workflow', () => {
    const yaml = readPostMerge();
    expect(yaml).toContain("workflows: ['Agenten-PR-Branches synchronisieren']");
    expect(yaml).toContain("github.event.workflow_run.path == '.github/workflows/sync-agent-pr-branches.yml'");
    expect(yaml).toContain("github.event.workflow_run.event == 'workflow_run'");
    expect(yaml).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(yaml).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(yaml).not.toContain('pull_request_target');
  });

  it('is observer-only and owns no PR-body or repository mutation authority', () => {
    const yaml = readPostMerge();
    expect(yaml).toContain('# Compatibility observer only.');
    expect(yaml).toContain('Single-writer handoff bestätigen');
    expect(yaml).toContain('No PR body mutation here.');
    expect(yaml).toContain('permissions: {}');
    expect(yaml).toContain('contents: read');
    expect(yaml).not.toContain('pull-requests: write');
    expect(yaml).not.toContain('contents: write');
    expect(yaml).not.toContain('actions: write');
    expect(yaml).not.toContain('repairLegacyPrBodyStructure.mjs');
    expect(yaml).not.toContain('updatePrProductionBaseline.mjs');
    expect(yaml).not.toContain('productionPreflight.mjs');
    expect(yaml).not.toContain('validatePrBody.mjs');
  });

  it('does not recreate the retired post-merge FIFO PR-body writer architecture', () => {
    const yaml = readPostMerge();
    expect(yaml).not.toContain('capital-ai-pr-writer-');
    expect(yaml).not.toContain('matrix.pr_number');
    expect(yaml).not.toContain('max-parallel: 1');
    expect(yaml).not.toContain('const ordered = [...pulls].sort');
    expect(yaml).not.toContain("fetch('https://capital-ai.online/healthz'");
    expect(yaml).not.toContain('POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun');
  });

  it('leaves all PR-body convergence authority with PR Decision Evidence Reconciler', () => {
    const observer = readPostMerge();
    const leading = readLeadingWriter();

    expect(observer).toContain('their exact-head completion events are converged only by PR Decision Evidence Reconciler');
    expect(leading).toContain('# Leading PR self-healing body chain.');
    expect(leading).toContain('pull-requests: write');
    expect(leading).toContain('group: capital-ai-pr-writer-${{ matrix.pr_number }}');
    expect(leading).toContain('node scripts/pr/reconcilePrDecisionEvidence.mjs');
    expect(leading).toContain('PR_BASELINE_OUTPUT:');
    expect(leading).toContain('PR_CHECK_CLASS:');
  });

  it('keeps the observer serialized per source run without cancelling accepted evidence', () => {
    const yaml = readPostMerge();
    expect(yaml).toContain(
      'group: pr-production-baseline-post-merge-observer-${{ github.event.workflow_run.id }}-${{ github.event.workflow_run.run_attempt }}',
    );
    expect(yaml).toContain('cancel-in-progress: false');
  });

  it('keeps the single-writer architecture fail-closed instead of silently restoring legacy duties', () => {
    const yaml = readPostMerge();
    expect(yaml).not.toContain('Kanonische PR-Body-Struktur deterministisch reparieren');
    expect(yaml).not.toContain('Kanonischen Baseline-Block atomar aktualisieren');
    expect(yaml).not.toContain('Geänderten PR-Body oder Baseline an exakte Governance binden');
    expect(yaml).not.toContain('PR-Scope für deterministischen Template-Fix klassifizieren');
    expect(yaml).not.toContain('EXPECTED_PRODUCTION_SHA');
  });
});
