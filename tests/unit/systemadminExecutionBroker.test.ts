import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SA3B_WORKFLOW_REF = 'SvenKulessa/Finance/.github/workflows/systemadmin-roadmap-executor.yml@refs/heads/main';
const SA4_WORKFLOW_REF = 'SvenKulessa/Finance/.github/workflows/systemadmin-sa4-pilot.yml@refs/heads/main';
const WORK_PACKAGE_WORKFLOW_REF = 'SvenKulessa/Finance/.github/workflows/systemadmin-work-package-runner.yml@refs/heads/main';

const mocks = vi.hoisted(() => ({
  verifyGitHubActionsOidcToken: vi.fn(),
  authorizeSystemadminAuditedExecution: vi.fn(),
  recordSystemadminAuditedOutcome: vi.fn(),
}));

vi.mock('../../server/systemadmin/githubActionsOidc', () => ({
  SYSTEMADMIN_GITHUB_SA3B_WORKFLOW_REF: 'SvenKulessa/Finance/.github/workflows/systemadmin-roadmap-executor.yml@refs/heads/main',
  SYSTEMADMIN_GITHUB_SA4_WORKFLOW_REF: 'SvenKulessa/Finance/.github/workflows/systemadmin-sa4-pilot.yml@refs/heads/main',
  SYSTEMADMIN_GITHUB_WORK_PACKAGE_RUNNER_WORKFLOW_REF: 'SvenKulessa/Finance/.github/workflows/systemadmin-work-package-runner.yml@refs/heads/main',
  verifyGitHubActionsOidcToken: mocks.verifyGitHubActionsOidcToken,
}));
vi.mock('../../server/agentAudit/systemadminAuditedExecution', () => ({
  authorizeSystemadminAuditedExecution: mocks.authorizeSystemadminAuditedExecution,
  recordSystemadminAuditedOutcome: mocks.recordSystemadminAuditedOutcome,
}));

import { systemadminExecutionBrokerRouter } from '../../server/systemadmin/systemadminExecutionBrokerRouter';

const identity = Object.freeze({
  issuer: 'https://token.actions.githubusercontent.com',
  audience: 'capital-ai-systemadmin-execution',
  subject: 'repo:SvenKulessa/Finance:ref:refs/heads/main',
  actor: 'SvenKulessa',
  actorId: '84307769',
  repository: 'SvenKulessa/Finance',
  repositoryId: '1284319285',
  repositoryOwnerId: '84307769',
  eventName: 'issues',
  ref: 'refs/heads/main',
  sha: '0123456789abcdef0123456789abcdef01234567',
  workflow: 'Systemadmin Roadmap Execution Host',
  workflowRef: SA3B_WORKFLOW_REF,
  workflowSha: '0123456789abcdef0123456789abcdef01234567',
  runId: '42',
  runNumber: '1',
  runAttempt: '1',
  issuedAt: 1,
  expiresAt: 2,
});

const decision = {
  verdict: 'ALLOW' as const,
  reason: 'allowed',
  riskClass: 'MEDIUM' as const,
  layer: 'REM_POLICY' as const,
  capability: 'BRANCH' as const,
  mandateId: 'REM-SA3B-PROBE-001',
  liveMutationPermitted: false,
};

function authorizationBody(actor = 'SvenKulessa', mandateId = 'REM-SA3B-PROBE-001') {
  return {
    issueNumber: 7,
    authorization: {
      principal: {
        humanActorId: actor,
        appId: 'chatgpt-github-connector',
        agentId: 'capital-ai-systemadmin-roadmap-executor',
        sessionId: 'github-issue-7',
        requestId: 'issue-7-run-42',
        credentialHolderId: 'github-actions-oidc',
      },
      capability: 'BRANCH',
      riskClass: 'MEDIUM',
      environment: 'development',
      targetResource: 'github:SvenKulessa/Finance',
      mandate: { mandateId },
      execution: {},
    },
    checkpoint: {},
  };
}

async function request(path: string, body: unknown, authorization = 'Bearer oidc-test') {
  const app = express();
  app.use(express.json());
  app.use('/api/internal/systemadmin-execution', systemadminExecutionBrokerRouter);
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const value = app.listen(0, '127.0.0.1', () => resolve(value));
  });
  try {
    const address = server.address() as AddressInfo;
    return await fetch(`http://127.0.0.1:${address.port}/api/internal/systemadmin-execution${path}`, {
      method: 'POST',
      headers: { Authorization: authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifyGitHubActionsOidcToken.mockResolvedValue(identity);
  mocks.authorizeSystemadminAuditedExecution.mockResolvedValue({
    decision,
    auditReference: 'supabase:agent_audit_events:auth-1',
    traceId: 'github-actions:42',
    executionPermit: {
      mandateId: 'REM-SA3B-PROBE-001',
      requestId: 'issue-7-run-42',
      authorizationAuditReference: 'supabase:agent_audit_events:auth-1',
      auditBoundExecutionPermitted: true,
    },
  });
  mocks.recordSystemadminAuditedOutcome.mockResolvedValue('supabase:agent_audit_events:outcome-1');
});

afterEach(() => vi.restoreAllMocks());

describe('Systemadmin execution broker', () => {
  it('rejects requests when GitHub Actions OIDC is invalid', async () => {
    mocks.verifyGitHubActionsOidcToken.mockRejectedValue(new Error('invalid oidc'));
    const response = await request('/authorize', authorizationBody());
    expect(response.status).toBe(401);
    expect(mocks.authorizeSystemadminAuditedExecution).not.toHaveBeenCalled();
  });

  it('binds the requested Human actor to the verified GitHub actor', async () => {
    const response = await request('/authorize', authorizationBody('other-user'));
    expect(response.status).toBe(403);
    expect(mocks.authorizeSystemadminAuditedExecution).not.toHaveBeenCalled();
  });

  it('rejects a requestId not bound to issue number and workflow run', async () => {
    const body = authorizationBody();
    body.authorization.principal.requestId = 'unbound-request';
    const response = await request('/authorize', body);
    expect(response.status).toBe(403);
    expect(mocks.authorizeSystemadminAuditedExecution).not.toHaveBeenCalled();
  });

  it('binds SA3B workflow to SA3B mandate and rejects SA4 mandate substitution', async () => {
    const response = await request('/authorize', authorizationBody('SvenKulessa', 'REM-SA4-PILOT-001'));
    expect(response.status).toBe(403);
    expect(mocks.authorizeSystemadminAuditedExecution).not.toHaveBeenCalled();
  });

  it('accepts the SA4 mandate only from the exact SA4 workflow', async () => {
    mocks.verifyGitHubActionsOidcToken.mockResolvedValue({
      ...identity,
      workflow: 'Systemadmin SA4 Bounded Pilot',
      workflowRef: SA4_WORKFLOW_REF,
    });
    mocks.authorizeSystemadminAuditedExecution.mockResolvedValue({
      decision: { ...decision, mandateId: 'REM-SA4-PILOT-001' },
      auditReference: 'supabase:agent_audit_events:auth-sa4',
      traceId: 'github-actions:42',
      executionPermit: {
        mandateId: 'REM-SA4-PILOT-001',
        requestId: 'issue-7-run-42',
        authorizationAuditReference: 'supabase:agent_audit_events:auth-sa4',
        auditBoundExecutionPermitted: true,
      },
    });
    const response = await request('/authorize', authorizationBody('SvenKulessa', 'REM-SA4-PILOT-001'));
    expect(response.status).toBe(200);
    const call = mocks.authorizeSystemadminAuditedExecution.mock.calls[0];
    expect(call?.[1]).toMatchObject({
      policyId: 'ADR-0059/ADR-0065/ADR-0067/ADR-0068/SA4',
      toolId: 'github-actions-systemadmin-sa4-host',
    });
  });

  it('accepts a REM-WORKPACKAGE-* mandate only from the exact work-package runner workflow', async () => {
    mocks.verifyGitHubActionsOidcToken.mockResolvedValue({
      ...identity,
      workflow: 'Systemadmin Work-Package Runner',
      workflowRef: WORK_PACKAGE_WORKFLOW_REF,
    });
    mocks.authorizeSystemadminAuditedExecution.mockResolvedValue({
      decision: { ...decision, mandateId: 'REM-WORKPACKAGE-GEN-PROOF-001' },
      auditReference: 'supabase:agent_audit_events:auth-workpackage',
      traceId: 'github-actions:42',
      executionPermit: {
        mandateId: 'REM-WORKPACKAGE-GEN-PROOF-001',
        requestId: 'issue-7-run-42',
        authorizationAuditReference: 'supabase:agent_audit_events:auth-workpackage',
        auditBoundExecutionPermitted: true,
      },
    });
    const response = await request('/authorize', authorizationBody('SvenKulessa', 'REM-WORKPACKAGE-GEN-PROOF-001'));
    expect(response.status).toBe(200);
    const call = mocks.authorizeSystemadminAuditedExecution.mock.calls[0];
    expect(call?.[1]).toMatchObject({
      policyId: 'ADR-0059/ADR-0065/ADR-0067/ADR-0074/WORKPACKAGE',
      toolId: 'github-actions-systemadmin-workpackage-host',
    });
  });

  it('rejects a SA3B/SA4 mandate presented from the work-package runner workflow', async () => {
    mocks.verifyGitHubActionsOidcToken.mockResolvedValue({
      ...identity,
      workflow: 'Systemadmin Work-Package Runner',
      workflowRef: WORK_PACKAGE_WORKFLOW_REF,
    });
    const response = await request('/authorize', authorizationBody('SvenKulessa', 'REM-SA4-PILOT-001'));
    expect(response.status).toBe(403);
    expect(mocks.authorizeSystemadminAuditedExecution).not.toHaveBeenCalled();
  });

  it('rejects a REM-WORKPACKAGE-* mandate presented from the SA3B or SA4 workflow', async () => {
    const response = await request('/authorize', authorizationBody('SvenKulessa', 'REM-WORKPACKAGE-GEN-PROOF-001'));
    expect(response.status).toBe(403);
    expect(mocks.authorizeSystemadminAuditedExecution).not.toHaveBeenCalled();
  });

  it('rejects a mandateId that merely starts with the reserved prefix but has no suffix', async () => {
    mocks.verifyGitHubActionsOidcToken.mockResolvedValue({
      ...identity,
      workflow: 'Systemadmin Work-Package Runner',
      workflowRef: WORK_PACKAGE_WORKFLOW_REF,
    });
    const response = await request('/authorize', authorizationBody('SvenKulessa', 'REM-WORKPACKAGE-'));
    expect(response.status).toBe(403);
    expect(mocks.authorizeSystemadminAuditedExecution).not.toHaveBeenCalled();
  });

  it('returns audited authorization only after the exact host binding passed', async () => {
    const response = await request('/authorize', authorizationBody());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      auditReference: 'supabase:agent_audit_events:auth-1',
      decision: { verdict: 'ALLOW', capability: 'BRANCH' },
      executionPermit: { auditBoundExecutionPermitted: true },
    });
    expect(mocks.authorizeSystemadminAuditedExecution).toHaveBeenCalledTimes(1);
  });

  it('fails closed with 503 when durable authorization cannot be persisted', async () => {
    mocks.authorizeSystemadminAuditedExecution.mockRejectedValue(new Error('audit unavailable'));
    const response = await request('/authorize', authorizationBody());
    expect(response.status).toBe(503);
  });

  it('binds terminal outcome to the same workflow run, issue request and mandate', async () => {
    const authorization = {
      decision,
      auditReference: 'supabase:agent_audit_events:auth-1',
      traceId: 'github-actions:42',
      executionPermit: { mandateId: 'REM-SA3B-PROBE-001', requestId: 'issue-7-run-42' },
    };
    const response = await request('/outcome', { issueNumber: 7, authorization, result: 'SUCCESS' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ auditReference: 'supabase:agent_audit_events:outcome-1' });
    expect(mocks.recordSystemadminAuditedOutcome).toHaveBeenCalledTimes(1);
    expect(mocks.recordSystemadminAuditedOutcome.mock.calls[0]?.[0]).toMatchObject({
      policyId: 'ADR-0059/ADR-0065/ADR-0067/SA3B',
    });
  });

  it('rejects outcome replay from a different workflow trace', async () => {
    const authorization = {
      decision,
      auditReference: 'supabase:agent_audit_events:auth-1',
      traceId: 'github-actions:other-run',
      executionPermit: { mandateId: 'REM-SA3B-PROBE-001', requestId: 'issue-7-run-42' },
    };
    const response = await request('/outcome', { issueNumber: 7, authorization, result: 'SUCCESS' });
    expect(response.status).toBe(403);
    expect(mocks.recordSystemadminAuditedOutcome).not.toHaveBeenCalled();
  });

  it('rejects an SA4 outcome presented by the SA3B workflow', async () => {
    const authorization = {
      decision: { ...decision, mandateId: 'REM-SA4-PILOT-001' },
      auditReference: 'supabase:agent_audit_events:auth-sa4',
      traceId: 'github-actions:42',
      executionPermit: { mandateId: 'REM-SA4-PILOT-001', requestId: 'issue-7-run-42' },
    };
    const response = await request('/outcome', { issueNumber: 7, authorization, result: 'SUCCESS' });
    expect(response.status).toBe(403);
    expect(mocks.recordSystemadminAuditedOutcome).not.toHaveBeenCalled();
  });
});
