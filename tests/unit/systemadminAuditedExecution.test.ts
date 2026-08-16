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
import { PROVIDER_PROFILES } from '../../src/platform/Security/providerProfile';

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
      auditCorrelationId: 'sa3-request-1:0123456789abcdef0123456789abcdef:sa3-session-1',
      requiresHumanMerge: true,
      liveMutationPermitted: false,
    });
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      human_actor_id: null,
      provider: 'openai',
      model: 'metadata-only',
      tool_name: 'github.pr.create',
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
        auditCorrelationId: 'sa3-request-1:0123456789abcdef0123456789abcdef:sa3-session-1',
        prompt: '[OMITTED]',
        humanActorExternalId: SYSTEMADMIN_OWNER_ACTOR_ID,
      }),
      scope: expect.objectContaining({
        mandateId: 'REM-SA3-AUDIT-001',
        roadmapItem: 'SA4-PILOT-EXAMPLE',
        repository: SYSTEMADMIN_REPOSITORY,
        auditCorrelationId: 'sa3-request-1:0123456789abcdef0123456789abcdef:sa3-session-1',
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
      provider: 'openai',
      model: 'metadata-only',
      tool_name: 'github.pr.create',
      attributes: expect.objectContaining({
        eventType: 'systemadmin_execution_outcome',
        authorizationAuditReference: 'supabase:agent_audit_events:sa3-auth-1',
        auditCorrelationId: 'sa3-request-1:0123456789abcdef0123456789abcdef:sa3-session-1',
        authorizationRequestId: '[REDACTED]',
        authorizationTraceId: '[REDACTED]',
        authorizationSessionId: '[REDACTED]',
        providerProfileId: SYSTEMADMIN_CHAT_APP_ID,
        mandateId: 'REM-SA3-AUDIT-001',
        response_body: '[OMITTED]',
        commitSha: '89abcdef0123456789abcdef0123456789abcdef',
      }),
    }));
  });

  it('fails closed when authorization correlation is changed before the outcome', async () => {
    const authorizationResult = await authorizeSystemadminAuditedExecution({
      authorization: authorization(),
      checkpoint: baseCheckpoint,
    }, auditContext);
    const tampered = {
      ...authorizationResult,
      auditCorrelationId: 'tampered:correlation:id',
    };

    await expect(recordSystemadminAuditedOutcome({
      authorization: tampered,
      result: 'SUCCESS',
    })).rejects.toThrow('authorization/outcome audit correlation mismatch');
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });

  it('requires request, trace and session identifiers before durable authorization evidence', async () => {
    const missingSession: SystemadminRoadmapAuthorizationRequest = {
      ...authorization(),
      principal: { ...principal, sessionId: '' },
    };

    await expect(authorizeSystemadminAuditedExecution({
      authorization: missingSession,
      checkpoint: baseCheckpoint,
    }, auditContext)).rejects.toThrow('sessionId is required for M8 audit correlation');
    expect(mocks.insert).not.toHaveBeenCalled();
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

  // M8 (ADR-0062): the generic Provider Profile Registry check now composes with SA2/SA1/M4 for
  // this real caller. It must only narrow, never widen, the pre-existing SA3B/SA4 behavior.
  describe('M8 Provider Profile Registry composition', () => {
    it('keeps the M8 chatgpt-github-connector profile capabilities in exact sync with the SA2 chat profile (Policy Equivalence)', () => {
      // If these two independently-maintained lists ever drift, the new PROVIDER_PROFILE layer
      // added below would start denying live SA3B/SA4 requests that SA2 itself still allows.
      expect([...PROVIDER_PROFILES['chatgpt-github-connector'].allowedCapabilities].sort())
        .toEqual([...SYSTEMADMIN_CHAT_CAPABILITIES].sort());
    });

    it('denies at the PROVIDER_PROFILE layer when no audit correlation id reaches the check (defense-in-depth ahead of the audit writer)', async () => {
      await expect(authorizeSystemadminAuditedExecution({
        authorization: authorization(),
        checkpoint: baseCheckpoint,
      }, { ...auditContext, traceId: '' })).rejects.toThrow();
      // The pre-existing audit writer already fails closed on a missing traceId; the new
      // PROVIDER_PROFILE check independently agrees no audit-bound execution may proceed either
      // way - see checkProviderProfileScope's own unit tests for the isolated DENY behavior.
    });

    it('still allows the real live SA3B capability (BRANCH, MEDIUM risk) through the added Provider Profile layer unchanged', async () => {
      const branchAuthorization: SystemadminRoadmapAuthorizationRequest = {
        ...authorization(AGENT_CAPABILITIES.BRANCH, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']),
        riskClass: 'MEDIUM',
      };
      const branchCheckpoint: Readonly<SystemadminChatExecutionCheckpoint> = {
        ...baseCheckpoint,
        freshBranchCreated: false,
        branchName: undefined,
        implementationComplete: false,
        targetedValidationPassed: false,
      };

      const result = await authorizeSystemadminAuditedExecution({
        authorization: branchAuthorization,
        checkpoint: branchCheckpoint,
      }, auditContext);

      expect(result.decision).toMatchObject({ verdict: 'ALLOW', capability: AGENT_CAPABILITIES.BRANCH, layer: 'REM_POLICY' });
      expect(result.executionPermit).toMatchObject({ capability: AGENT_CAPABILITIES.BRANCH, auditBoundExecutionPermitted: true });
    });

    // M8 (ADR-0062) Exit Gate item 6: "rollback-to-read-only is proven". Proven end-to-end
    // through the real, live-wired SA3B chain (SA3 -> SA2 -> SA1 -> M4), not just the isolated
    // roadmapExecutionMandate.ts unit tests. killSwitchActive is distinct from
    // mandate.killSwitch.enabled=false (which denies everything, including READ, and is already
    // covered by "denies and audits attempts to rewrite the SA2/SA3 control plane"-style tests) -
    // this proves the narrower "restore read-only operation" rollback the M8 runbook requires.
    describe('rollback-to-read-only (M8 Exit Gate item 6)', () => {
      it('denies the real live SA3B mutating capability (BRANCH) once rolled back', async () => {
        const rolledBackBranch: SystemadminRoadmapAuthorizationRequest = {
          ...authorization(AGENT_CAPABILITIES.BRANCH, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']),
          riskClass: 'MEDIUM',
          killSwitchActive: true,
        };
        const result = await authorizeSystemadminAuditedExecution({
          authorization: rolledBackBranch,
          checkpoint: { ...baseCheckpoint, freshBranchCreated: false, branchName: undefined },
        }, auditContext);

        expect(result.decision.verdict).toBe('DENY');
        expect(result.executionPermit).toBeUndefined();
      });

      it('keeps READ available through the same rolled-back chain (read-only, not fully cut off)', async () => {
        const rolledBackRead: SystemadminRoadmapAuthorizationRequest = {
          ...authorization(AGENT_CAPABILITIES.READ, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']),
          riskClass: 'LOW',
          killSwitchActive: true,
        };
        const result = await authorizeSystemadminAuditedExecution({
          authorization: rolledBackRead,
          checkpoint: baseCheckpoint,
        }, auditContext);

        expect(result.decision).toMatchObject({ verdict: 'ALLOW', capability: AGENT_CAPABILITIES.READ });
        expect(result.executionPermit).toMatchObject({ capability: AGENT_CAPABILITIES.READ, auditBoundExecutionPermitted: true });
      });
    });

    // M9 (ADR-0063, docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md "Assurance Domain 6: Kill
    // Switch") Owner-authorized live drill (2026-08-16, AskUserQuestion "Kill-Switch-Live-Drill
    // (empfohlen)"). Extends the M8 rollback-to-read-only proof above into an adversarial M9 drill
    // against the SAME real, live-wired SA3B chain: every real mutating capability is attempted
    // while the switch is active (not just BRANCH), non-mutating capabilities are proven to stay
    // available, a same-request control case proves the DENY is caused specifically by the switch
    // (not by an unrelated checkpoint condition), and a same-session before/after pair proves the
    // switch has no sticky/cached state - each request is evaluated fresh.
    describe('M9 Kill-Switch Live-Drill (I2 Assurance, 2026-08-16)', () => {
      // Each mutating capability has its own SA2 sequence preconditions (fresh branch, open PR,
      // ...). The checkpoint below is deliberately tailored per capability so that ONLY the kill
      // switch is the variable under test - if an unrelated checkpoint gap denied first instead,
      // this drill would not actually be testing the kill switch at all.
      const mutatingCapabilityCases = [
        {
          capability: AGENT_CAPABILITIES.BRANCH,
          checkpoint: { ...baseCheckpoint, freshBranchCreated: false, branchName: undefined },
        },
        {
          capability: AGENT_CAPABILITIES.COMMIT,
          checkpoint: baseCheckpoint,
        },
        {
          capability: AGENT_CAPABILITIES.PR,
          checkpoint: baseCheckpoint,
        },
        {
          capability: AGENT_CAPABILITIES.CI_REQUEST,
          checkpoint: { ...baseCheckpoint, pullRequestOpen: true, pullRequestNumber: 218 },
        },
      ] as const;

      it.each(mutatingCapabilityCases)(
        'denies real mutating capability $capability through the live chain while active, and audits the DENY',
        async ({ capability, checkpoint }) => {
          const request: SystemadminRoadmapAuthorizationRequest = {
            ...authorization(capability, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']),
            riskClass: 'MEDIUM',
            killSwitchActive: true,
          };
          const result = await authorizeSystemadminAuditedExecution({
            authorization: request,
            checkpoint,
          }, auditContext);

          expect(result.decision.verdict).toBe('DENY');
          expect(result.decision.reason).toMatch(/Kill-Switch/i);
          expect(result.executionPermit).toBeUndefined();
          expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
            authorization_decision: 'DENY',
            result: 'DENIED',
          }));
        },
      );

      const nonMutatingCapabilities = [
        AGENT_CAPABILITIES.READ,
        AGENT_CAPABILITIES.ANALYZE,
        AGENT_CAPABILITIES.PLAN,
      ] as const;

      it.each(nonMutatingCapabilities)(
        'keeps non-mutating capability %s allowed and audited through the same active kill switch',
        async (capability) => {
          const request: SystemadminRoadmapAuthorizationRequest = {
            ...authorization(capability, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']),
            riskClass: 'LOW',
            killSwitchActive: true,
          };
          const result = await authorizeSystemadminAuditedExecution({
            authorization: request,
            checkpoint: baseCheckpoint,
          }, auditContext);

          expect(result.decision).toMatchObject({ verdict: 'ALLOW', capability });
          expect(result.executionPermit).toMatchObject({ capability, auditBoundExecutionPermitted: true });
          expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
            authorization_decision: 'ALLOW',
          }));
        },
      );

      it('proves the DENY is caused specifically by the switch: the identical BRANCH request without it is ALLOW', async () => {
        const baseline: SystemadminRoadmapAuthorizationRequest = {
          ...authorization(AGENT_CAPABILITIES.BRANCH, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']),
          riskClass: 'MEDIUM',
        };
        const armed: SystemadminRoadmapAuthorizationRequest = { ...baseline, killSwitchActive: true };
        const branchCheckpoint = { ...baseCheckpoint, freshBranchCreated: false, branchName: undefined };

        const before = await authorizeSystemadminAuditedExecution({
          authorization: baseline,
          checkpoint: branchCheckpoint,
        }, auditContext);
        expect(before.decision.verdict).toBe('ALLOW');

        const during = await authorizeSystemadminAuditedExecution({
          authorization: armed,
          checkpoint: branchCheckpoint,
        }, auditContext);
        expect(during.decision.verdict).toBe('DENY');
      });

      it('has no sticky/cached denial state: deactivating within the same session immediately restores ALLOW on the very next request', async () => {
        const branchCheckpoint = { ...baseCheckpoint, freshBranchCreated: false, branchName: undefined };
        const armed: SystemadminRoadmapAuthorizationRequest = {
          ...authorization(AGENT_CAPABILITIES.BRANCH, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']),
          riskClass: 'MEDIUM',
          killSwitchActive: true,
        };
        const denied = await authorizeSystemadminAuditedExecution({
          authorization: armed,
          checkpoint: branchCheckpoint,
        }, auditContext);
        expect(denied.decision.verdict).toBe('DENY');

        const disarmed: SystemadminRoadmapAuthorizationRequest = { ...armed, killSwitchActive: false };
        const allowed = await authorizeSystemadminAuditedExecution({
          authorization: disarmed,
          checkpoint: branchCheckpoint,
        }, auditContext);
        expect(allowed.decision.verdict).toBe('ALLOW');
        // No mandate, checkpoint, code or config field changed between the two calls other than
        // the per-request boolean - activation/deactivation needs no policy weakening (M9 Kill
        // Switch expectation: "no policy weakening needed to activate/deactivate").
      });
    });
  });
});
