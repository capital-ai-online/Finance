import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateRoadmapExecutionMandate } from '../../src/platform/Security/roadmapExecutionMandate';
import { SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS } from '../../server/agentAudit/systemadminAuditedExecution';

const root = process.cwd();
const workflowPath = path.join(root, '.github/workflows/systemadmin-sa4-pilot.yml');
const runnerPath = path.join(root, 'scripts/systemadmin/runSa4Pilot.mjs');
const remPath = path.join(root, '.ai/mandates/REM-SA4-PILOT-001.json');
const sa1Path = path.join(root, 'src/platform/Security/roadmapExecutionMandate.ts');

const protectedSa4Paths = [
  '.ai/mandates/REM-SA4-PILOT-001.json',
  '.github/workflows/systemadmin-sa4-pilot.yml',
  'docs/adr/ADR-0068-first-bounded-autonomous-work-package.md',
  'server/systemadmin/githubActionsOidc.ts',
  'server/systemadmin/systemadminExecutionBrokerRouter.ts',
  'scripts/systemadmin/validateSa4PilotIssue.mjs',
  'scripts/systemadmin/runSa4Pilot.mjs',
] as const;

describe('SA4 bounded autonomous pilot contracts', () => {
  it('keeps the first pilot REM exact, Owner-approved and non-production', () => {
    const rem = JSON.parse(fs.readFileSync(remPath, 'utf8'));
    expect(validateRoadmapExecutionMandate(rem)).toMatchObject({ valid: true });
    expect(rem).toMatchObject({
      mandateId: 'REM-SA4-PILOT-001',
      status: 'OWNER_APPROVED',
      ownerActorId: 'SvenKulessa',
      repository: 'SvenKulessa/Finance',
      baseBranch: 'main',
      maxRiskClass: 'MEDIUM',
      maxOpenPullRequests: 1,
    });
    expect(rem.allowedCapabilities).toEqual(['BRANCH', 'COMMIT', 'PR']);
    expect(rem.allowedPaths).toEqual(['docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md']);
    expect(rem.allowedMutationClasses).toEqual(['REPOSITORY']);
    expect(rem.prohibitedMutationClasses).toContain('MERGE');
    expect(rem.prohibitedMutationClasses).toContain('SELF_MANDATE_EXPANSION');
    expect(Date.parse(rem.expiresAt) - Date.parse(rem.validFrom)).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000);
  });

  it('places every SA4 host/control-plane artifact inside both Systemadmin self-authority rings', () => {
    const sa1 = fs.readFileSync(sa1Path, 'utf8');
    for (const protectedPath of protectedSa4Paths) {
      expect(SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS).toContain(protectedPath);
      expect(sa1, `SA1 trust root ${protectedPath}`).toContain(`'${protectedPath}'`);
    }
  });

  it('keeps cleanup, permit-before-side-effect and deterministic-content ordering in the trusted runner', () => {
    const runner = fs.readFileSync(runnerPath, 'utf8');
    const cleanup = runner.indexOf("/git/ref/heads/${SA3B_PROBE_BRANCH}");
    const oidc = runner.indexOf('const oidcToken = await requestOidcToken()');
    const branchAuth = runner.indexOf("capability: 'BRANCH'");
    const branchWrite = runner.indexOf("await githubApi('/git/refs'");
    const commitAuth = runner.indexOf("capability: 'COMMIT'");
    const commitWrite = runner.indexOf("method: 'PUT'");
    const prAuth = runner.indexOf("capability: 'PR'");
    const prWrite = runner.indexOf("await githubApi('/pulls'");

    for (const index of [cleanup, oidc, branchAuth, branchWrite, commitAuth, commitWrite, prAuth, prWrite]) {
      expect(index).toBeGreaterThanOrEqual(0);
    }
    expect(cleanup).toBeLessThan(oidc);
    expect(branchAuth).toBeLessThan(branchWrite);
    expect(commitAuth).toBeLessThan(commitWrite);
    expect(prAuth).toBeLessThan(prWrite);
    expect(runner).toContain("const TARGET_PATH = 'docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md'");
    expect(runner).not.toContain('/merge');
    expect(runner).not.toContain('workflow_dispatch');
  });

  it('keeps the workflow issue-only, exact-owner and without autonomous CI or merge steps', () => {
    const workflow = fs.readFileSync(workflowPath, 'utf8');
    expect(workflow).toContain('issues:');
    expect(workflow).toContain("github.event.issue.user.login == 'SvenKulessa'");
    expect(workflow).toContain("startsWith(github.event.issue.title, '[SA4-PILOT]')");
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('pull-requests: write');
    expect(workflow).not.toContain('pull_request_target');
    expect(workflow).not.toContain('workflow_dispatch');
    expect(workflow).not.toContain('merge_pull_request');
    expect(workflow).not.toContain('CI_REQUEST');
  });
});
