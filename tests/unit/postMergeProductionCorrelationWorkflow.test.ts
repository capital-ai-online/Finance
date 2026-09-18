import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflowPath = new URL('../../.github/workflows/post-merge-production-correlation.yml', import.meta.url);
const workflow = readFileSync(workflowPath, 'utf8');

describe('post-merge production correlation workflow', () => {
  it('runs on main pushes and keeps a low-frequency drift watch', () => {
    expect(workflow).toContain('push:');
    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain("cron: '7 * * * *'");
    expect(workflow).toContain('timeout-minutes: 7');
  });

  it('uses least-privilege permissions and pinned github-script', () => {
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('actions: read');
    expect(workflow).toContain('issues: write');
    expect(workflow).toContain('actions/github-script@3a2844b7e9c422d3c10d287c895573f7108da1b3');
    expect(workflow).not.toContain('actions/checkout@');
    expect(workflow).not.toContain('npm ci');
  });

  it('binds the five-minute SLA to the exact CI deploy-hook step and production identity', () => {
    expect(workflow).toContain("SLA_MILLISECONDS: '300000'");
    expect(workflow).toContain("workflow_id: 'ci.yml'");
    expect(workflow).toContain("candidate.name === 'Deployment verifiziert / Render-Produktion'");
    expect(workflow).toContain("candidate.name === 'Render-Deployment für verifizierten main-Commit auslösen'");
    expect(workflow).toContain("response.headers.get('x-capital-ai-commit')");
    expect(workflow).toContain("response.headers.get('x-capital-ai-branch')");
    expect(workflow).toContain("response.headers.get('x-capital-ai-repo')");
  });

  it('reads historical deploy evidence before polling so runner queue delay cannot create false drift', () => {
    const evidenceInit = "let ciEvidence = context.eventName === 'push'\n              ? await inspectCiDeployTrigger()";
    const pollingLoop = "while (Date.now() <= slaDeadlineMs)";
    expect(workflow).toContain(evidenceInit);
    expect(workflow.indexOf(evidenceInit)).toBeLessThan(workflow.indexOf(pollingLoop));
    expect(workflow).toContain('const triggerStarted = Boolean(ciEvidence.step?.started_at)');
    expect(workflow).toContain('const triggerDeltaMs = triggerStartedAt ? Date.parse(triggerStartedAt) - commitTimeMs : null');
    expect(workflow).toContain('triggerDeltaMs >= 0 && triggerDeltaMs <= slaMs');
  });

  it('deduplicates production-drift issues and closes them after recovery', () => {
    expect(workflow).toContain("DRIFT_ISSUE_TITLE: '[AUTO] Production drift — Render/Main correlation'");
    expect(workflow).toContain('CAPITAL_AI_PRODUCTION_DRIFT_AUTO');
    expect(workflow).toContain('github.rest.issues.create(');
    expect(workflow).toContain('github.rest.issues.update(');
    expect(workflow).toContain("state: 'closed'");
    expect(workflow).toContain('does not authorize production mutation');
  });
});
