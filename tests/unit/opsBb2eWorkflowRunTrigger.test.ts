import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  resolve(process.cwd(), '.github/workflows/ops-bb2e-workflow-run-trigger.yml'),
  'utf8',
);

describe('OPS BB-2E workflow_run trigger', () => {
  it('runs only after the trusted main branch-sync workflow completes successfully', () => {
    expect(workflow).toContain('workflow_run:');
    expect(workflow).toContain("workflows: ['Agenten-PR-Branches synchronisieren']");
    expect(workflow).toContain('types: [completed]');
    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain('github.event.workflow_run.repository.full_name == github.repository');
    expect(workflow).toContain('github.event.workflow_run.head_repository.full_name == github.repository');
    expect(workflow).toContain(
      "github.event.workflow_run.path == '.github/workflows/sync-agent-pr-branches.yml'",
    );
    expect(workflow).toContain("github.event.workflow_run.event == 'push'");
    expect(workflow).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(workflow).toContain("github.event.workflow_run.conclusion == 'success'");
  });

  it('keeps the privileged trigger API-only and least-privileged', () => {
    expect(workflow).toContain('permissions: {}');
    expect(workflow).toContain('actions: write');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('pull-requests: read');
    expect(workflow).not.toContain('contents: write');
    expect(workflow).not.toContain('actions/checkout@');
    expect(workflow).not.toContain('git push');
    expect(workflow).not.toContain('npm ci');
    expect(workflow).not.toContain('run: |');
    expect(workflow).toContain(
      'actions/github-script@3a2844b7e9c422d3c10d287c895573f7108da1b3',
    );
  });

  it('hard-binds the source and downstream workflow identities', () => {
    expect(workflow).toContain(
      'SOURCE_WORKFLOW_PATH: .github/workflows/sync-agent-pr-branches.yml',
    );
    expect(workflow).toContain('DOWNSTREAM_WORKFLOW: ops-ast-grep-source-patch.yml');
    expect(workflow).toContain(
      'TARGET_BRANCH: agent/frontend-bb-2e-dashboard-drawer-20260910',
    );
    expect(workflow).toContain('TARGET_FILE: src/components/Dashboard.tsx');
  });

  it('requires source-run SHA to still equal current main before dispatch', () => {
    expect(workflow).toContain('const sourceSha = normalizeSha(sourceRun.head_sha);');
    expect(workflow).toContain("branch: 'main'");
    expect(workflow).toContain('if (sourceSha !== mainSha)');
    expect(workflow).toContain('kein BB-2E Dispatch');
  });

  it('re-reads and validates the exact FE head instead of trusting a stored SHA', () => {
    expect(workflow).toContain('branch: targetBranch');
    expect(workflow).toContain('const feHead = normalizeSha(target.commit?.sha);');
    expect(workflow).toContain("if (!/^[0-9a-f]{40}$/.test(feHead))");
    expect(workflow).not.toContain('ae85bfbcbf6cee7c4eaeb8b09e7da8106954914b');
  });

  it('does not cut over a branch that already has an open PR', () => {
    expect(workflow).toContain("state: 'open'");
    expect(workflow).toContain('head: `${context.repo.owner}:${targetBranch}`');
    expect(workflow).toContain('if (openTargetPrs.length > 0)');
    expect(workflow).toContain('kein automatischer Cutover');
  });

  it('fails closed if the existing BB-2E workflow contract drifts', () => {
    expect(workflow).toContain('`.github/workflows/${downstreamWorkflow}`');
    expect(workflow).toContain("'workflow_dispatch:'");
    expect(workflow).toContain("'expected_head_sha:'");
    expect(workflow).toContain("'confirm_apply:'");
    expect(workflow).toContain('`TARGET_BRANCH: ${targetBranch}`');
    expect(workflow).toContain("'inputs.confirm_apply == true'");
    expect(workflow).toContain('Downstream-Workflow driftet');
  });

  it('is idempotent when legacy markers are gone or a downstream run is active', () => {
    expect(workflow).toContain("'menuOpen'");
    expect(workflow).toContain("'setMenuOpen'");
    expect(workflow).toContain("'DashboardExpandedSection'");
    expect(workflow).toContain("'Slide-out Retractable Hamburger Drawer Navigation'");
    expect(workflow).toContain("const activeStatuses = ['queued', 'in_progress'];");
    expect(workflow).toContain('kein erneuter Dispatch');
    expect(workflow).toContain('kein doppelter Dispatch');
  });

  it('dispatches the existing source-patch workflow on main with the freshly read FE head', () => {
    expect(workflow).toContain('github.rest.actions.createWorkflowDispatch');
    expect(workflow).toContain('workflow_id: downstreamWorkflow');
    expect(workflow).toContain("ref: 'main'");
    expect(workflow).toContain('expected_head_sha: feHead');
    expect(workflow).toContain("confirm_apply: 'true'");
  });
});
