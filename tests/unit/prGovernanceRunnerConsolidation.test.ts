import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/pr-governance.yml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

function countMatches(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}

describe('P1 PR governance runner consolidation', () => {
  it('uses exactly one Ubuntu runner job for pull-request governance', () => {
    const yaml = workflow();
    expect(yaml).toContain('  governance:\n');
    expect(yaml).not.toContain('  check-cost-gate:\n');
    expect(yaml).not.toContain('  repository-conventions-advisory:\n');
    expect(yaml).not.toContain('  workflow-security:\n');
    expect(yaml).not.toContain('  pr-template-contract:\n');
    expect(countMatches(yaml, /^\s+runs-on:\s+ubuntu-latest$/gm)).toBe(1);
  });

  it('preserves pull-request events including edited and keeps merge-group runner-free', () => {
    const yaml = workflow();
    expect(yaml).toContain('types: [opened, reopened, synchronize, ready_for_review, edited]');
    expect(yaml).toContain("if: github.event_name == 'pull_request'");
    expect(yaml).toContain('merge_group:');
  });

  it('keeps the 3000-minute advisory cost gate without creating authorization authority', () => {
    const yaml = workflow();
    expect(yaml).toContain("BUDGET_MINUTES: '3000'");
    expect(yaml).toContain("REACTIVATE_AT: '2026-09-01T00:00:00Z'");
    expect(yaml).toContain('github.rest.actions.listWorkflowRunsForRepo');
    expect(yaml).toContain("steps.cost_gate.outputs.gate_active != 'true'");
    expect(yaml).toContain('M10 bleibt davon vollständig getrennt');
  });

  it('uses one trusted-main and one candidate checkout for all governance checks', () => {
    const yaml = workflow();
    expect(countMatches(yaml, /uses:\s+actions\/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8/g)).toBe(2);
    expect(yaml).toContain('ref: main\n          path: policy');
    expect(yaml).toContain('ref: ${{ github.event.pull_request.head.sha }}\n          path: candidate');
    expect(yaml).toContain('git fetch --no-tags ../policy main:refs/remotes/origin/main');
  });

  it('classifies scope with trusted-main code instead of PR-controlled classifier code', () => {
    const yaml = workflow();
    expect(yaml).toContain('run: node ../policy/scripts/pr/classifyPrScope.mjs');
    expect(yaml).not.toContain('run: node scripts/pr/classifyPrScope.mjs');
  });

  it('preserves fail-closed changed-workflow validation from trusted main', () => {
    const yaml = workflow();
    expect(yaml).toContain("steps.scope.outputs.workflow_security == 'true'");
    expect(yaml).toContain('run: node "$POLICY_ROOT/scripts/security/verifyChangedWorkflowSecurity.mjs"');
    expect(yaml).toContain('PR_BASE_REF: origin/main');
    expect(yaml).toContain('PR_HEAD_REF: HEAD');
  });

  it('preserves the canonical production baseline and PR-body contract', () => {
    const yaml = workflow();
    expect(yaml).toContain('run: node ../policy/scripts/pr/productionPreflight.mjs');
    expect(yaml).toContain('run: node ../policy/scripts/pr/validatePrBody.mjs');
    expect(yaml).toContain("github.event.pull_request.head.ref != 'agent/fix-unit-invariants-m10-bypass'");
  });

  it('keeps governance permissions read-only and never runs a second build/test pipeline', () => {
    const yaml = workflow();
    expect(yaml).toContain('actions: read');
    expect(yaml).toContain('contents: read');
    expect(yaml).toContain('pull-requests: read');
    expect(yaml).not.toContain('actions: write');
    expect(yaml).not.toContain('contents: write');
    expect(yaml).not.toContain('pull-requests: write');
    expect(yaml).not.toContain('npm test');
    expect(yaml).not.toContain('npm run build');
  });
});
