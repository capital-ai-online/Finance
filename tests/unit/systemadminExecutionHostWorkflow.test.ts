import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = path.join(process.cwd(), '.github/workflows/systemadmin-roadmap-executor.yml');

function workflow(): string {
  return fs.readFileSync(workflowPath, 'utf8');
}

describe('SA3B Systemadmin GitHub Actions execution host contract', () => {
  it('uses Owner issue ingress and OIDC but does not expose merge/PR/deploy permissions', () => {
    const yaml = workflow();
    expect(yaml).toContain('issues:');
    expect(yaml).toContain('types: [opened]');
    expect(yaml).toContain("github.event.issue.user.login == 'SvenKulessa'");
    expect(yaml).toContain("startsWith(github.event.issue.title, '[SA3B-PROBE]')");
    expect(yaml).toContain('id-token: write');
    expect(yaml).toContain('contents: write');
    expect(yaml).toContain('issues: write');
    expect(yaml).not.toContain('pull-requests: write');
    expect(yaml).not.toContain('deployments: write');
    expect(yaml).not.toContain('workflow_dispatch:');
  });

  it('checks out trusted main without persistent credentials and never runs issue content as shell', () => {
    const yaml = workflow();
    expect(yaml).toContain('ref: main');
    expect(yaml).toContain('persist-credentials: false');
    expect(yaml).toContain('SYSTEMADMIN_ISSUE_BODY: ${{ github.event.issue.body }}');
    expect(yaml).toContain('node scripts/systemadmin/validateExecutionIssue.mjs');
    expect(yaml).not.toContain('run: ${{ github.event.issue.body }}');
    expect(yaml).not.toContain('eval ');
    expect(yaml).not.toContain('git push');
  });

  it('places durable authorization before the sole branch side effect and outcome after it', () => {
    const yaml = workflow();
    const authorize = yaml.indexOf('/api/internal/systemadmin-execution/authorize');
    const branchWrite = yaml.indexOf('gh api --method POST "repos/${GITHUB_REPOSITORY}/git/refs"');
    const outcome = yaml.indexOf('/api/internal/systemadmin-execution/outcome');

    expect(authorize).toBeGreaterThan(-1);
    expect(branchWrite).toBeGreaterThan(authorize);
    expect(outcome).toBeGreaterThan(branchWrite);
    expect(yaml.indexOf('gh api --method POST "repos/${GITHUB_REPOSITORY}/git/refs"', branchWrite + 1))
      .toBe(-1);
  });

  it('keeps the pre-SA4 host limited to validated BRANCH probe requests', () => {
    const yaml = workflow();
    expect(yaml).toContain('REM-SA3B-PROBE-001.json');
    expect(yaml).toContain("capability: 'BRANCH'");
    expect(yaml).not.toContain("capability: 'COMMIT'");
    expect(yaml).not.toContain("capability: 'PR'");
    expect(yaml).not.toContain("capability: 'CI_REQUEST'");
    expect(yaml).not.toContain("capability: 'PRODUCTION_MUTATION'");
    expect(yaml).not.toContain('gh pr create');
  });

  it('rolls back a created probe branch if terminal audit evidence fails', () => {
    const yaml = workflow();
    const outcomeFailure = yaml.indexOf('Outcome-Evidence fehlgeschlagen');
    const deleteRef = yaml.lastIndexOf('gh api --method DELETE');
    expect(deleteRef).toBeGreaterThan(-1);
    expect(outcomeFailure).toBeGreaterThan(deleteRef);
  });
});