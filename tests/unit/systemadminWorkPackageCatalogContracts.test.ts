import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  evaluateSystemadminRoadmapAuthorization,
  validateRoadmapExecutionMandate,
  type SystemadminRoadmapAuthorizationRequest,
} from '../../src/platform/Security/roadmapExecutionMandate';
import { SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS } from '../../server/agentAudit/systemadminAuditedExecution';
import { lookupWorkPackage, knownWorkPackageIds } from '../../scripts/systemadmin/workPackages/registry.mjs';

const root = process.cwd();
const workflowPath = path.join(root, '.github/workflows/systemadmin-work-package-runner.yml');
const runnerPath = path.join(root, 'scripts/systemadmin/runWorkPackage.mjs');
const remPath = path.join(root, '.ai/mandates/REM-WORKPACKAGE-GEN-PROOF-001.json');
const sa1Path = path.join(root, 'src/platform/Security/roadmapExecutionMandate.ts');

const protectedWorkPackagePaths = [
  '.ai/mandates/REM-WORKPACKAGE-GEN-PROOF-001.json',
  '.github/workflows/systemadmin-work-package-runner.yml',
  'docs/adr/ADR-0074-generalized-systemadmin-work-package-catalog.md',
  'server/systemadmin/githubActionsOidc.ts',
  'server/systemadmin/systemadminExecutionBrokerRouter.ts',
  'scripts/systemadmin/validateWorkPackageIssue.mjs',
  'scripts/systemadmin/runWorkPackage.mjs',
  'scripts/systemadmin/workPackages/registry.mjs',
  'scripts/systemadmin/workPackages/generalizationProof.mjs',
] as const;

describe('Generalized Systemadmin work-package catalog contracts', () => {
  it('registers the generalization-proof work package and nothing else yet', () => {
    expect(knownWorkPackageIds()).toEqual(['GENERALIZATION-PROOF']);
    const entry = lookupWorkPackage('GENERALIZATION-PROOF');
    expect(entry).toMatchObject({
      workPackageId: 'GENERALIZATION-PROOF',
      mandateId: 'REM-WORKPACKAGE-GEN-PROOF-001',
      mandateFile: '.ai/mandates/REM-WORKPACKAGE-GEN-PROOF-001.json',
      roadmapItem: 'SYSTEMADMIN-WORK-PACKAGE-CATALOG-GENERALIZATION',
      targetPath: 'docs/evidence/systemadmin-work-packages/WORK_PACKAGE_GENERALIZATION_PROOF.md',
    });
    expect(lookupWorkPackage('DOES-NOT-EXIST')).toBeNull();
  });

  it('the catalog generator only produces trusted, deterministic content from bounded metadata', () => {
    const entry = lookupWorkPackage('GENERALIZATION-PROOF');
    const content = entry.generate({
      request: { mandateId: entry.mandateId, roadmapItem: entry.roadmapItem, baseSha: '0'.repeat(40), branchName: 'agent/systemadmin-work-package-gen-proof-1' },
      issueNumber: 999,
      runId: '123',
      branchAuth: 'supabase:agent_audit_events:branch-auth',
      branchOutcome: 'supabase:agent_audit_events:branch-outcome',
      commitAuth: 'supabase:agent_audit_events:commit-auth',
    });
    expect(content).toContain(entry.targetPath);
    expect(content).toContain('supabase:agent_audit_events:branch-auth');
    expect(content).toContain('HUMAN MERGE REQUIRED');
  });

  it('keeps the first catalog REM exact, Owner-approved (2026-08-15) and non-production', () => {
    const rem = JSON.parse(fs.readFileSync(remPath, 'utf8'));
    expect(validateRoadmapExecutionMandate(rem)).toMatchObject({ valid: true });
    expect(rem).toMatchObject({
      mandateId: 'REM-WORKPACKAGE-GEN-PROOF-001',
      status: 'OWNER_APPROVED',
      ownerActorId: 'SvenKulessa',
      repository: 'SvenKulessa/Finance',
      baseBranch: 'main',
      maxRiskClass: 'MEDIUM',
      maxOpenPullRequests: 1,
      approvalEvidenceRef: 'human-owner-chat-2026-08-15-workpackage-gen-proof',
    });
    expect(rem.allowedCapabilities).toEqual(['BRANCH', 'COMMIT', 'PR']);
    expect(rem.allowedPaths).toEqual(['docs/evidence/systemadmin-work-packages/WORK_PACKAGE_GENERALIZATION_PROOF.md']);
    expect(rem.allowedMutationClasses).toEqual(['REPOSITORY']);
    expect(rem.prohibitedMutationClasses).toContain('MERGE');
    expect(rem.prohibitedMutationClasses).toContain('SELF_MANDATE_EXPANSION');
    expect(Date.parse(rem.expiresAt) - Date.parse(rem.validFrom)).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000);
  });

  it('is now ALLOWED end-to-end by SA1 REM_SCOPE for BRANCH on the exact allowlisted path', () => {
    const rem = JSON.parse(fs.readFileSync(remPath, 'utf8'));
    const authRequest: SystemadminRoadmapAuthorizationRequest = {
      principal: {
        humanActorId: 'SvenKulessa',
        appId: 'chatgpt-github-connector',
        agentId: rem.subjectAgentId,
        sessionId: 'github-issue-999',
        requestId: 'issue-999-run-123',
        credentialHolderId: 'github-actions-oidc',
        provider: 'openai',
        model: 'non-authoritative-host-metadata',
      },
      capability: 'BRANCH',
      riskClass: 'MEDIUM',
      environment: 'development',
      targetResource: 'github:SvenKulessa/Finance',
      mandate: rem,
      execution: {
        roadmapItem: rem.roadmapItems[0],
        repository: 'SvenKulessa/Finance',
        baseBranch: 'main',
        requestedPaths: [],
        mutationClass: 'REPOSITORY',
        openSystemadminPullRequests: 0,
        openPullRequestChangedPaths: [],
        now: '2026-08-15T12:00:00.000Z',
      },
    };
    expect(evaluateSystemadminRoadmapAuthorization(authRequest)).toMatchObject({ verdict: 'ALLOW' });
  });

  it('still denies COMMIT outside the exact allowlisted path even though the mandate is approved', () => {
    const rem = JSON.parse(fs.readFileSync(remPath, 'utf8'));
    const authRequest: SystemadminRoadmapAuthorizationRequest = {
      principal: {
        humanActorId: 'SvenKulessa',
        appId: 'chatgpt-github-connector',
        agentId: rem.subjectAgentId,
        sessionId: 'github-issue-999',
        requestId: 'issue-999-run-123',
        credentialHolderId: 'github-actions-oidc',
      },
      capability: 'COMMIT',
      riskClass: 'MEDIUM',
      environment: 'development',
      targetResource: 'github:SvenKulessa/Finance',
      mandate: rem,
      execution: {
        roadmapItem: rem.roadmapItems[0],
        repository: 'SvenKulessa/Finance',
        baseBranch: 'main',
        requestedPaths: ['docs/evidence/systemadmin-work-packages/SOME_OTHER_FILE.md'],
        mutationClass: 'REPOSITORY',
        openSystemadminPullRequests: 0,
        openPullRequestChangedPaths: [],
        now: '2026-08-15T12:00:00.000Z',
      },
    };
    expect(evaluateSystemadminRoadmapAuthorization(authRequest)).toMatchObject({ verdict: 'DENY' });
  });

  it('places every work-package host/control-plane artifact inside both Systemadmin self-authority rings', () => {
    const sa1 = fs.readFileSync(sa1Path, 'utf8');
    for (const protectedPath of protectedWorkPackagePaths) {
      expect(SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS).toContain(protectedPath);
      expect(sa1, `SA1 trust root ${protectedPath}`).toContain(`'${protectedPath}'`);
    }
  });

  it('keeps permit-before-side-effect and deterministic-content ordering in the trusted runner', () => {
    const runner = fs.readFileSync(runnerPath, 'utf8');
    const oidc = runner.indexOf('const oidcToken = await requestOidcToken()');
    const branchAuth = runner.indexOf("capability: 'BRANCH'");
    const branchWrite = runner.indexOf("await githubApi('/git/refs'");
    const commitAuth = runner.indexOf("capability: 'COMMIT'");
    const commitWrite = runner.indexOf("method: 'PUT'");
    const prAuth = runner.indexOf("capability: 'PR'");
    const prWrite = runner.indexOf("await githubApi('/pulls'");

    for (const index of [oidc, branchAuth, branchWrite, commitAuth, commitWrite, prAuth, prWrite]) {
      expect(index).toBeGreaterThanOrEqual(0);
    }
    expect(branchAuth).toBeLessThan(branchWrite);
    expect(commitAuth).toBeLessThan(commitWrite);
    expect(prAuth).toBeLessThan(prWrite);
    expect(runner).toContain("import { lookupWorkPackage } from './workPackages/registry.mjs'");
    expect(runner).not.toContain('/merge');
    expect(runner).not.toContain('workflow_dispatch');
  });

  it('never imports from or writes the already-verified-pass SA4 pilot artifacts', () => {
    const runner = fs.readFileSync(runnerPath, 'utf8');
    expect(runner).not.toMatch(/from\s+['"].*runSa4Pilot/);
    expect(runner).not.toContain('SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md');
    const sa4Runner = fs.readFileSync(path.join(root, 'scripts/systemadmin/runSa4Pilot.mjs'), 'utf8');
    expect(sa4Runner).not.toMatch(/from\s+['"].*runWorkPackage/);
    expect(sa4Runner).not.toContain('workPackages/registry.mjs');
  });

  // Owner 2026-08-24: der Trigger wurde stillgelegt ("bitte deaktiviere die aktiven GitHub bot ...
  // diese erstellen jeweils Projekte, die ich erstmal beiseite gelegt habe"). Bis 2026-08-15 hat
  // dieser Test die Aktivierung festgeschrieben; er schreibt jetzt die Stilllegung fest, damit ein
  // Reaktivieren nicht unbemerkt durchrutscht. Alle uebrigen Zusicherungen - issue-only, exakter
  // Owner, kein dispatch/merge/CI_REQUEST - gelten unveraendert weiter.
  it('keeps the workflow stilled, issue-only, exact-owner and without CI/merge/dispatch (stilled 2026-08-24)', () => {
    const workflow = fs.readFileSync(workflowPath, 'utf8');
    expect(workflow).toContain('issues:');
    expect(workflow).toContain('if: >-');
    expect(workflow).toMatch(/if: >-\s*\n\s*false &&/);
    expect(workflow).toContain("github.event.issue.user.login == 'SvenKulessa'");
    expect(workflow).toContain("startsWith(github.event.issue.title, '[SYSTEMADMIN-WORK-PACKAGE]')");
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('pull-requests: write');
    expect(workflow).not.toContain('pull_request_target');
    expect(workflow).not.toContain('workflow_dispatch');
    expect(workflow).not.toContain('merge_pull_request');
    expect(workflow).not.toContain('CI_REQUEST');
  });
});
