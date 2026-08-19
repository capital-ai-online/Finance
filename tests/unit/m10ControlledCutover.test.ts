import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');
const router = fs.readFileSync(path.join(root, 'server/m10/authoritativeAuthorizationRouter.ts'), 'utf8');
const oidc = fs.readFileSync(path.join(root, 'server/m10/githubActionsOidc.ts'), 'utf8');

describe('M10 Controlled Cutover source contract', () => {
  it('places the authorization gate before checkout and binds the one-time bootstrap only to PR #429', () => {
    const gateIndex = workflow.indexOf('M10 CI-Autorisierung vor teuren Schritten prüfen');
    const checkoutIndex = workflow.indexOf('Repository auschecken');
    expect(gateIndex).toBeGreaterThan(-1);
    expect(checkoutIndex).toBeGreaterThan(gateIndex);
    expect(workflow).toContain("M10_BOOTSTRAP_PR: '429'");
    expect(workflow).toContain('normaler PR-Event ist keine Autorisierung für teure CI');
  });

  it('requires GitHub Actions OIDC plus workflow-gate redemption before expensive workflow steps', () => {
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('ACTIONS_ID_TOKEN_REQUEST_URL');
    expect(workflow).toContain('ACTIONS_ID_TOKEN_REQUEST_TOKEN');
    expect(workflow).toContain('audience=https%3A%2F%2Fcapital-ai.online%2Fm10-workflow-gate');
    expect(workflow).toContain('Authorization: Bearer $m10_oidc_token');
    expect(workflow).toContain('/api/m10/credential-enrollment/authorize/workflow-gate');
  });

  it('verifies workload identity before resolving/claiming the M10 workflow consumption', () => {
    const oidcVerifyIndex = router.indexOf('verifyGithubActionsOidcToken({');
    const currentPrIndex = router.indexOf('resolveTrustedPrState(', oidcVerifyIndex);
    const claimIndex = router.indexOf('claimM10WorkflowGate(', oidcVerifyIndex);
    expect(oidcVerifyIndex).toBeGreaterThan(-1);
    expect(currentPrIndex).toBeGreaterThan(oidcVerifyIndex);
    expect(claimIndex).toBeGreaterThan(currentPrIndex);
    expect(router).toContain("workflowFile: M10_CI_WORKFLOW_PATH");
    expect(router).toContain("workflowName: M10_CI_WORKFLOW_NAME");
  });

  it('pins the GitHub OIDC trust roots/audience and does not introduce a new long-lived workflow-gate secret', () => {
    expect(oidc).toContain("GITHUB_ACTIONS_OIDC_ISSUER = 'https://token.actions.githubusercontent.com'");
    expect(oidc).toContain("GITHUB_ACTIONS_OIDC_JWKS_URI = 'https://token.actions.githubusercontent.com/.well-known/jwks'");
    expect(oidc).toContain("M10_WORKFLOW_GATE_AUDIENCE = 'https://capital-ai.online/m10-workflow-gate'");
    expect(workflow).not.toContain('M10_WORKFLOW_GATE_SECRET');
  });

  it('does not reintroduce legacy emoji/checklist/reaction authorization into the cutover workflow', () => {
    expect(workflow).not.toMatch(/\bokay\b/i);
    expect(workflow).not.toContain('💪');
    expect(workflow).not.toMatch(/reaction/i);
    expect(workflow).not.toMatch(/viewed/i);
  });
});
