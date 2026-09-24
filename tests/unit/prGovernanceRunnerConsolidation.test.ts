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

function workflowStep(yaml: string, name: string): string {
  const marker = `      - name: ${name}\n`;
  const start = yaml.indexOf(marker);
  if (start < 0) return '';
  const next = yaml.indexOf('\n      - name:', start + marker.length);
  return yaml.slice(start, next < 0 ? yaml.length : next);
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

  it('does not retrigger Required Governance for body-only Evidence edits and keeps merge-group runner-free', () => {
    const yaml = workflow();
    expect(yaml).toContain('types: [opened, reopened, synchronize, ready_for_review]');
    expect(yaml).not.toContain('ready_for_review, edited');
    expect(yaml).not.toContain("github.event.action != 'edited'");
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

  it('uses the stable PR contract and keeps a bounded bootstrap only for a trusted-main validator without static-contract support', () => {
    const yaml = workflow();
    const bodyStep = workflowStep(yaml, 'Stabilen PR-Vertrag fail-closed prüfen');
    const liveSnapshotGuard = "if: steps.snapshot.outputs.current_snapshot == 'true'";

    expect(yaml).not.toContain('name: Produktions-Baseline über trusted-main Policy erzeugen');
    expect(yaml).not.toContain('run: node ../policy/scripts/pr/productionPreflight.mjs');
    expect(bodyStep).toContain("validator='../policy/scripts/pr/validatePrBody.mjs'");
    expect(bodyStep).toContain("if grep -q 'PR_BODY_VALIDATION_MODE' \"$validator\"; then");
    expect(bodyStep).toContain('node "$validator"');
    expect(bodyStep).toContain('node ../policy/scripts/pr/productionPreflight.mjs');
    expect(bodyStep).toContain('Bootstrap: trusted main unterstützt static-contract noch nicht');
    expect(bodyStep).toContain('PR_BODY_VALIDATION_MODE: static-contract');
    expect(bodyStep).not.toContain('PR_BASELINE_OUTPUT');
    expect(bodyStep).toContain(liveSnapshotGuard);
    expect(countMatches(bodyStep, /^\s*if:/gm)).toBe(1);
    expect(bodyStep).not.toContain('M10');
    expect(yaml).not.toContain('agent/fix-unit-invariants-m10-bypass');
  });

  it('deduplicates governance by exact code snapshot rather than PR-body action', () => {
    const yaml = workflow();
    expect(yaml).toContain("format('pr-governance-pr-{0}-{1}-{2}', github.event.pull_request.number, github.event.pull_request.head.sha, github.event.pull_request.base.sha)");
    expect(yaml).not.toContain('github.event.action)');
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
