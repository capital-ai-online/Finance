import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflowPath = new URL('../../.github/workflows/post-merge-production-correlation.yml', import.meta.url);
const workflow = readFileSync(workflowPath, 'utf8');

describe('post-merge production correlation workflow', () => {
  it('runs on main pushes and keeps the bounded low-frequency correlation watch', () => {
    expect(workflow).toContain('push:');
    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain("cron: '7 * * * *'");
    expect(workflow).toContain('timeout-minutes: 12');
  });

  it('binds correlation to exact CURRENT_MAIN and the shared merge-cadence helper', () => {
    expect(workflow).toContain('Exakten CURRENT_MAIN binden');
    expect(workflow).toContain('fetch-depth: 0');
    expect(workflow).toContain('scripts/operations/mergeCadence.mjs');
    expect(workflow).toContain('CADENCE_ACTIVE:');
    expect(workflow).toContain('MERGE_ORDINAL:');
    expect(workflow).toContain('DEPLOY_PROGRESS:');
    expect(workflow).toContain('DEPLOY_REMAINING:');
  });

  it('preserves the legacy five-minute exact-main contract before cadence activation', () => {
    expect(workflow).toContain("SLA_MILLISECONDS: '300000'");
    expect(workflow).toContain("workflow_id: 'ci.yml'");
    expect(workflow).toContain("candidate.name === 'Deployment verifiziert / Render-Produktion'");
    expect(workflow).toContain("candidate.name === 'Render-Deployment für verifizierten main-Commit auslösen'");
    expect(workflow).toContain('Legacy deploy hook exceeded five-minute SLA.');
    expect(workflow).toContain('Legacy Production SHA does not equal CURRENT_MAIN');
  });

  it('treats healthy ancestor lag below a five-merge boundary as queued rather than drift', () => {
    expect(workflow).toContain("['CURRENT_MAIN', 'ANCESTOR', 'PRE_EPOCH'].includes(productionRelation)");
    expect(workflow).toContain("'DEPLOYMENT_QUEUED'");
    expect(workflow).toContain("'DEPLOYMENT_DUE'");
    expect(workflow).toContain('5-merge deployment boundary is due');
    expect(workflow).toContain('Expected cadence lag is not Production drift.');
  });

  it('deduplicates real production-drift issues and closes them after queued or converged recovery', () => {
    expect(workflow).toContain("DRIFT_ISSUE_TITLE: '[AUTO] Production drift — Render/Main correlation'");
    expect(workflow).toContain('CAPITAL_AI_PRODUCTION_DRIFT_AUTO');
    expect(workflow).toContain('github.rest.issues.create(');
    expect(workflow).toContain('github.rest.issues.update(');
    expect(workflow).toContain("state: 'closed'");
    expect(workflow).toContain('does not authorize Production mutation');
  });

  it('uses least privilege and immutable pinned actions', () => {
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('actions: read');
    expect(workflow).toContain('issues: write');
    expect(workflow).toContain('actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8');
    expect(workflow).toContain('actions/github-script@3a2844b7e9c422d3c10d287c895573f7108da1b3');
    expect(workflow).not.toContain('contents: write');
  });
});
