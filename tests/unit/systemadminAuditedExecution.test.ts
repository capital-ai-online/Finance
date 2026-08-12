import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AGENT_CAPABILITIES } from '../../src/platform/Security/agentIam';
import {
  ROADMAP_EXECUTION_MUTATION_CLASSES,
  SYSTEMADMIN_AGENT_ID,
  SYSTEMADMIN_BASE_BRANCH,
  SYSTEMADMIN_OWNER_ACTOR_ID,
  SYSTEMADMIN_REPOSITORY,
  type RoadmapExecutionMutationClass,
  type SystemadminRoadmapAuthorizationRequest,
} from '../../src/platform/Security/roadmapExecutionMandate';
import {
  SYSTEMADMIN_CHAT_APP_ID,
  SYSTEMADMIN_CHAT_CAPABILITIES,
  type SystemadminChatExecutionCheckpoint,
} from '../../src/platform/Security/systemadminExecutionProfile';

const mocks = vi.hoisted(() => {
  const single = vi.fn();
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn((_payload: Record<string, unknown>) => ({ select }));
  const from = vi.fn(() => ({ insert }));
  return { single, select, insert, from, getPrivilegedServerSupabase: vi.fn(() => ({ from })) };
});

vi.mock('../../server/db', () => ({ getPrivilegedServerSupabase: mocks.getPrivilegedServerSupabase }));

import {
  SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS,
  authorizeSystemadminAuditedExecution,
  recordSystemadminAuditedOutcome,
} from '../../server/agentAudit/systemadminAuditedExecution';

const prohibitedMutationClasses: readonly RoadmapExecutionMutationClass[] = [
  ROADMAP_EXECUTION_MUTATION_CLASSES.MERGE,
  ROADMAP_EXECUTION_MUTATION_CLASSES.REPOSITORY_PROTECTION_WEAKENING,
  ROADMAP_EXECUTION_MUTATION_CLASSES.OWNER_IAM_ELEVATION,
  ROADMAP_EXECUTION_MUTATION_CLASSES.OWNER_MFA_OR_BREAK_GLASS,
  ROADMAP_EXECUTION_MUTATION_CLASSES.SECRET_DISCLOSURE,
  ROADMAP_EXECUTION_MUTATION_CLASSES.UNRESTRICTED_CREDENTIAL_ROTATION,
  ROADMAP_EXECUTION_MUTATION_CLASSES.DESTRUCTIVE_PRODUCTION_DATA,
  ROADMAP_EXECUTION_MUTATION_CLASSES.LIVE_BILLING_MONEY_OR_ENTITLEMENT,
  ROADMAP_EXECUTION_MUTATION_CLASSES.PRODUCTION_RESOURCE_DELETION,
  ROADMAP_EXECUTION_MUTATION_CLASSES.DNS_TLS_DOMAIN_OWNERSHIP,
  ROADMAP_EXECUTION_MUTATION_CLASSES.SECURITY_CONTROL_DISABLEMENT,
  ROADMAP_EXECUTION_MUTATION_CLASSES.SELF_MANDATE_EXPANSION,
];

const principal = Object.freeze({
  humanActorId: SYSTEMADMIN_OWNER_ACTOR_ID,
  appId: SYSTEMADMIN_CHAT_APP_ID,
  agentId: SYSTEMADMIN_AGENT_ID,
  sessionId: 'sa3-session-1',
  requestId: 'sa3-request-1',
  credentialHolderId: 'github-connector-host',
  provider: 'openai',
  model: 'metadata-only',
});

const baseCheckpoint: Readonly<SystemadminChatExecutionCheckpoint> = Object.freeze({
  sa1VerifiedPass: true,
  mainResolved: true,
  roadmapResolved: true,
  securityPreflightPassed: true,
  overlapCheckPassed: true,
  checkClassResolved: true,
  rollbackDefined: true,
  testsDefined: true,
  freshBranchCreated: true,
  branchName: 'agent/sa4-pilot-example',
  implementationComplete: true,
  targetedValidationPassed: true,
  pullRequestOpen: false,
  currentHeadSha: '0123456789abcdef0123456789abcdef01234567',
});

function authorization(
  capability: string = AGENT_CAPABILITIES.PR,
  requestedPaths: readonly string[] = ['src/services/example.ts', 'tests/unit/example.test.ts'],
): SystemadminRoadmapAuthorizationRequest {
  return {
    principal,
    capability,
    riskClass: 'HIGH',
    environment: 'development',
    targetResource: 'github:SvenKulessa/Finance',
    mandate: {
      mandateId: 'REM-SA3-AUDIT-001',
      status: 'OWNER_APPROVED',
      ownerActorId: SYSTEMADMIN_OWNER_ACTOR_ID,
      subjectAgentId: SYSTEMADMIN_AGENT_ID,
      repository: SYSTEMADMIN_REPOSITORY,
      baseBranch: SYSTEMADMIN_BASE_BRANCH,
      roadmapItems: ['SA4-PILOT-EXAMPLE'],
      authorityRefs: [
        '.ai/skills/ESS-0021-Systemadmin-Roadmap-Executor.md',
        'docs/adr/ADR-0065-systemadmin-roadmap-execution-mandate.md',
      ],
      allowedCapabilities: [...SYSTEMADMIN_CHAT_CAPABILITIES],
      allowedPaths: [...requestedPaths],
      allowedTargets: ['github:SvenKulessa/Finance'],
      maxRiskClass: 'HIGH',
      allowedMutationClasses: [ROADMAP_EXECUTION_MUTATION_CLASSES.REPOSITORY],
      prohibitedMutationClasses,
      validFrom: '2026-08-12T00:00:00.000Z',
      expiresAt: '2026-08-19T00:00:00.000Z',
      maxOpenPullRequests: 1,
      ciBudgetPolicyRef: 'docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md',
      killSwitch: { enabled: true, revocationAuthority: SYSTEMADMIN_OWNER_ACTOR_ID },
      requiredPreflight: ['security', 'overlap', 'tests', 'rollback'],
      requiredEvidence: ['mandateId', 'auditReference', 'branch', 'commit', 'pr'],
      approvalEvidenceRef: 'owner-approved-rem-sa3-test',
    },
    execution: {
      roadmapItem: 'SA4-PILOT-EXAMPLE',
      repository: SYSTEMADMIN_REPOSITORY,
      baseBranch: SYSTEMADMIN_BASE_BRANCH,
      requestedPaths,
      mutationClass: ROADMAP_EXECUTION_MUTATION_CLASSES.REPOSITORY,
      openSystemadminPullRequests: 0,
      pullRequestOperation: 'CREATE',
      openPullRequestChangedPaths: [],
      ciBudgetExceeded: false,
      unchangedHeadAlreadyValidated: false,
      now: '2026-08-12T06:30:00.000Z',
    },
  };
}

const auditContext = {
  traceId: '0123456789abcdef0123456789abcdef',
  policyId: 'ADR-0059/ADR-0065/SA3',
  toolId: 'github.pr.create',
  runtimeVersion: '0.6.0',
  metadata: { prompt: 'must not persist', purpose: 'sa3-audit-test' },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.single.mockResolvedValue({ data: { id: 'sa3-auth-1' }, error: null });
});

describe('SA3 Systemadmin audited execution', () => {
  it('returns an execution permit only after durable authorization evidence exists', async () => {
    const result = await authorizeSystemadminAuditedExecution({
      authorization: authorization(),
      checkpoint: baseCheckpoint,
    }, auditContext);

    expect(result.decision).toMatchObject({ verdict: 'ALLOW', mandateId: 'REM-SA3-AUDIT-001' });
    expect(result.auditReference).toBe('supabase:agent_audit_events:sa3-auth-1');
    expect(result.executionPermit).toMatchObject({
      mandateId: 'REM-SA3-AUDIT-001',
      auditBoundExecutionPermitted: true,
      authorizationAuditReference: 'supabase:agent_audit_events:sa3-auth-1',
      requiresHumanMerge: true,
      liveMutationPermitted: false,
    });
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      human_actor_id: null,
      intent: 'systemadmin_authorization',
      authorization_decision: 'ALLOW',
      result: 'PENDING',
      repository: SYSTEMADMIN_REPOSITORY,
      branch: 'agent/sa4-pilot-example',
      commit_sha: '0123456789abcdef0123456789abcdef01234567',
      attributes: expect.objectContaining({
        eventType: 'systemadmin_authorization',
        mandateId: 'REM-SA3-AUDIT-001',
        roadmapItem: 'SA4-PILOT-EXAMPLE',
        prompt: '[OMITTED]',
        humanActorExternalId: SYSTEMADMIN_OWNER_ACTOR_ID,
      }),
      scope: expect.objectContaining({
        mandateId: 'REM-SA3-AUDIT-001',
        roadmapItem: 'SA4-PILOT-EXAMPLE',
        repository: SYSTEMADMIN_REPOSITORY,
      }),
    }));
  });

  it('fails closed before returning a permit when audit persistence is unavailable', async () => {
    mocks.single.mockResolvedValue({ data: null, error: { message: 'audit store unavailable' } });

    await expect(authorizeSystemadminAuditedExecution({
      authorization: authorization(),
      checkpoint: baseCheckpoint,
    }, auditContext)).rejects.toThrow('durable audit persistence failed');
  });

  it('denies and audits attempts to rewrite the SA2/SA3 control plane', async () => {
    const protectedPath = SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS[2];
    const result = await authorizeSystemadminAuditedExecution({
      authorization: authorization(AGENT_CAPABILITIES.PR, [protectedPath]),
      checkpoint: baseCheckpoint,
    }, auditContext);

    expect(result.decision.verdict).toBe('DENY');
    expect(result.executionPermit).toBeUndefined();
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      authorization_decision: 'DENY',
      result: 'DENIED',
    }));
  });

  it('keeps MERGE and production capabilities outside the audited permit path', async () => {
    const merge = await authorizeSystemadminAuditedExecution({
      authorization: authorization('MERGE', []),
      checkpoint: baseCheckpoint,
    }, auditContext);
    expect(merge.decision.verdict).toBe('DENY');
    expect(merge.executionPermit).toBeUndefined();

    const production = await authorizeSystemadminAuditedExecution({
      authorization: authorization(AGENT_CAPABILITIES.PRODUCTION_MUTATION, []),
      checkpoint: baseCheckpoint,
    }, auditContext);
    expect(production.decision.verdict).toBe('DENY');
    expect(production.executionPermit).toBeUndefined();
  });

  it('records terminal outcome as a second correlated append-only event', async () => {
    mocks.single
      .mockResolvedValueOnce({ data: { id: 'sa3-auth-1' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'sa3-outcome-1' }, error: null });

    const authorizationResult = await authorizeSystemadminAuditedExecution({
      authorization: authorization(),
      checkpoint: baseCheckpoint,
    }, auditContext);
    const outcome = await recordSystemadminAuditedOutcome({
      authorization: authorizationResult,
      result: 'SUCCESS',
      branchName: 'agent/sa4-pilot-example',
      commitSha: '89abcdef0123456789abcdef0123456789abcdef',
      pullRequestNumber: 218,
      metadata: { response_body: { secret: 'must not persist' }, operation: 'create-pr' },
    });

    expect(outcome).toBe('supabase:agent_audit_events:sa3-outcome-1');
    expect(mocks.insert).toHaveBeenCalledTimes(2);
    expect(mocks.insert.mock.calls[1]?.[0]).toEqual(expect.objectContaining({
      intent: 'systemadmin_execution_outcome',
      authorization_decision: 'ALLOW',
      result: 'SUCCESS',
      branch: 'agent/sa4-pilot-example',
      commit_sha: '89abcdef0123456789abcdef0123456789abcdef',
      pull_request_number: 218,
      attributes: expect.objectContaining({
        eventType: 'systemadmin_execution_outcome',
        authorizationAuditReference: 'supabase:agent_audit_events:sa3-auth-1',
        mandateId: 'REM-SA3-AUDIT-001',
        response_body: '[OMITTED]',
        commitSha: '89abcdef0123456789abcdef0123456789abcdef',
      }),
    }));
  });

  it('refuses an outcome when no audited ALLOW permit exists', async () => {
    const denied = await authorizeSystemadminAuditedExecution({
      authorization: authorization('MERGE', []),
      checkpoint: baseCheckpoint,
    }, auditContext);

    await expect(recordSystemadminAuditedOutcome({
      authorization: denied,
      result: 'SUCCESS',
    })).rejects.toThrow('outcome requires an audited ALLOW permit');
  });
});
