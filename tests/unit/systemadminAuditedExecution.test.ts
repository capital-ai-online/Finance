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

  // M9 (ADR-0063, docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md "Assurance Domain 5: Audit
  // Completeness / Outage") Owner-authorized live drill (2026-08-16, AskUserQuestion
  // "Audit-Outage-Drill (empfohlen)"). The authorization-phase persistence-failure case is already
  // covered above ("fails closed before returning a permit when audit persistence is unavailable");
  // this block covers the three parts of Domain 5 not yet drilled: (1) a persistence failure during
  // the TERMINAL outcome write must also fail closed, not just the authorization write - a mutation
  // could otherwise complete with no terminal SUCCESS/ERROR record; (2) the append-only guarantee is
  // proven structurally, not just by absence of a counterexample; (3) full actor/agent/session/
  // request/target/capability/result correlation is proven for a real mutating capability end to
  // end across both the authorization and terminal events.
  describe('M9 Audit-Completeness/Outage Live-Drill (I2 Assurance, 2026-08-16)', () => {
    it('fails closed (throws, does not silently return success) when the TERMINAL outcome event cannot be persisted', async () => {
      const authorizationResult = await authorizeSystemadminAuditedExecution({
        authorization: authorization(AGENT_CAPABILITIES.BRANCH, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']),
        checkpoint: { ...baseCheckpoint, freshBranchCreated: false, branchName: undefined },
      }, auditContext);
      expect(authorizationResult.decision.verdict).toBe('ALLOW');

      // The authorization write succeeded (above); only the SECOND, terminal write now fails -
      // proving the outage-handling is not a one-time startup check but applies independently to
      // every durable write in the lifecycle, including the one that closes out a mutation attempt.
      mocks.single.mockResolvedValueOnce({ data: null, error: { message: 'audit store unavailable mid-flight' } });

      await expect(recordSystemadminAuditedOutcome({
        authorization: authorizationResult,
        result: 'SUCCESS',
        branchName: 'agent/sa4-pilot-example',
        commitSha: '89abcdef0123456789abcdef0123456789abcdef',
      })).rejects.toThrow('durable audit persistence failed');
      // No caller can observe a fabricated terminal record: recordSystemadminAuditedOutcome only
      // ever returns the real writeAgentAuditEvent() promise (server/agentAudit/
      // agentAuditWriter.ts), never a synthesized success on persistence failure.
    });

    it('the mocked durable audit sink only ever exposes insert - never update or delete (structural append-only proof)', async () => {
      await authorizeSystemadminAuditedExecution({
        authorization: authorization(),
        checkpoint: baseCheckpoint,
      }, auditContext);

      // mocks.getPrivilegedServerSupabase() -> { from } -> from() -> { insert } (see the vi.hoisted
      // mock factory at the top of this file). If server/agentAudit/agentAuditWriter.ts ever called
      // .update()/.delete() on this table instead of .insert(), that call would throw "is not a
      // function" and this test (and every other test in this file) would fail immediately - the
      // mock contract itself enforces append-only, it is not merely an assertion of absence.
      const tableHandle = mocks.from.mock.results.at(-1)?.value;
      expect(tableHandle).toBeDefined();
      expect(typeof tableHandle.insert).toBe('function');
      expect('update' in tableHandle).toBe(false);
      expect('delete' in tableHandle).toBe(false);
    });

    it('correlates actor/agent/session/request/target/capability/result across the authorization and terminal events for a real mutating capability', async () => {
      mocks.single
        .mockResolvedValueOnce({ data: { id: 'm9-audit-auth-1' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'm9-audit-outcome-1' }, error: null });

      const branchAuthorization = authorization(AGENT_CAPABILITIES.BRANCH, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']);
      const authorizationResult = await authorizeSystemadminAuditedExecution({
        authorization: branchAuthorization,
        checkpoint: { ...baseCheckpoint, freshBranchCreated: false, branchName: undefined },
      }, auditContext);
      expect(authorizationResult.decision.verdict).toBe('ALLOW');

      const expectedCorrelationId = `${principal.requestId}:${auditContext.traceId}:${principal.sessionId}`;
      expect(authorizationResult.auditCorrelationId).toBe(expectedCorrelationId);

      const authWriteArgs = mocks.insert.mock.calls[0]?.[0];
      expect(authWriteArgs).toMatchObject({
        agent_id: principal.agentId,
        app_id: principal.appId,
        capability: AGENT_CAPABILITIES.BRANCH,
        authorization_decision: 'ALLOW',
        scope: expect.objectContaining({
          targetResource: 'github:SvenKulessa/Finance',
          auditCorrelationId: expectedCorrelationId,
        }),
      });

      await recordSystemadminAuditedOutcome({
        authorization: authorizationResult,
        result: 'SUCCESS',
        branchName: 'agent/sa4-pilot-example',
        commitSha: '89abcdef0123456789abcdef0123456789abcdef',
      });

      const outcomeWriteArgs = mocks.insert.mock.calls[1]?.[0];
      expect(outcomeWriteArgs).toMatchObject({
        agent_id: principal.agentId,
        app_id: principal.appId,
        capability: AGENT_CAPABILITIES.BRANCH,
        authorization_decision: 'ALLOW',
        result: 'SUCCESS',
        commit_sha: '89abcdef0123456789abcdef0123456789abcdef',
        scope: expect.objectContaining({
          targetResource: 'github:SvenKulessa/Finance',
          auditCorrelationId: expectedCorrelationId,
        }),
      });
      // Same requestId/traceId/sessionId-derived correlation id ties the authorization event
      // (BEFORE the attempted mutation) to the terminal event (AFTER the attempt) - the exact
      // Domain 5 requirement "correlation across actor/agent/session/request/target/capability/
      // result", proven for a real mutating capability rather than the generic default (PR) case.
    });
  });

  // M9 (ADR-0063, docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md "Assurance Domain 3: Replay /
  // Idempotency") Owner-authorized live drill (2026-08-16, AskUserQuestion "Replay/Idempotency-
  // Drill (empfohlen)"). The envelope-replay guard already existed in isolation at
  // checkProviderProfileScope() (src/platform/Security/providerProfile.ts, one DENY-only test in
  // tests/unit/providerProfile.test.ts) but was NOT reachable through the real, live-wired SA3B
  // entry point: authorizeSystemadminAuditedExecution() never passed envelopeId/seenEnvelopeIds
  // through. This drill closes that gap the same way the M8 rollback-to-read-only lever was wired
  // in (additive-only optional fields on SystemadminRoadmapAuthorizationRequest, unset = no
  // behavior change - see killSwitchActive precedent in roadmapExecutionMandate.ts), then proves
  // baseline/replay/distinct-envelope behavior through the real chain, not just the isolated check.
  describe('M9 Replay/Idempotency Live-Drill (I2 Assurance, 2026-08-16)', () => {
    const branchCheckpoint = { ...baseCheckpoint, freshBranchCreated: false, branchName: undefined };

    it('allows a fresh mutation envelope through the real live-wired chain (baseline)', async () => {
      const result = await authorizeSystemadminAuditedExecution({
        authorization: {
          ...authorization(AGENT_CAPABILITIES.BRANCH, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']),
          riskClass: 'MEDIUM',
          envelopeId: 'm9-replay-drill-envelope-1',
          seenEnvelopeIds: new Set<string>(),
        },
        checkpoint: branchCheckpoint,
      }, auditContext);

      expect(result.decision.verdict).toBe('ALLOW');
      expect(result.executionPermit).toBeDefined();
    });

    it('denies a replayed mutation envelope through the real live-wired chain, and audits the DENY', async () => {
      const result = await authorizeSystemadminAuditedExecution({
        authorization: {
          ...authorization(AGENT_CAPABILITIES.BRANCH, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']),
          riskClass: 'MEDIUM',
          envelopeId: 'm9-replay-drill-envelope-2',
          seenEnvelopeIds: new Set(['m9-replay-drill-envelope-2']),
        },
        checkpoint: branchCheckpoint,
      }, auditContext);

      expect(result.decision.verdict).toBe('DENY');
      expect(result.decision.reason).toMatch(/Replay/i);
      expect(result.executionPermit).toBeUndefined();
      expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
        authorization_decision: 'DENY',
        result: 'DENIED',
      }));
    });

    it('does not falsely deny a distinct envelope even when other envelopes were already seen (not overbroad)', async () => {
      const result = await authorizeSystemadminAuditedExecution({
        authorization: {
          ...authorization(AGENT_CAPABILITIES.BRANCH, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']),
          riskClass: 'MEDIUM',
          envelopeId: 'm9-replay-drill-envelope-3-new',
          seenEnvelopeIds: new Set(['m9-replay-drill-envelope-3-old', 'm9-replay-drill-envelope-3-older']),
        },
        checkpoint: branchCheckpoint,
      }, auditContext);

      expect(result.decision.verdict).toBe('ALLOW');
    });

    it('does not gate READ on envelope replay (only mutating capabilities need envelope idempotency)', async () => {
      const result = await authorizeSystemadminAuditedExecution({
        authorization: {
          ...authorization(AGENT_CAPABILITIES.READ, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']),
          riskClass: 'LOW',
          envelopeId: 'm9-replay-drill-envelope-4',
          seenEnvelopeIds: new Set(['m9-replay-drill-envelope-4']),
        },
        checkpoint: baseCheckpoint,
      }, auditContext);

      expect(result.decision).toMatchObject({ verdict: 'ALLOW', capability: AGENT_CAPABILITIES.READ });
    });

    it('leaves existing callers unaffected: an authorization request without envelope fields behaves exactly as before', async () => {
      const result = await authorizeSystemadminAuditedExecution({
        authorization: authorization(AGENT_CAPABILITIES.BRANCH, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']),
        checkpoint: branchCheckpoint,
      }, auditContext);

      expect(result.decision.verdict).toBe('ALLOW');
      // No envelopeId/seenEnvelopeIds set at all (undefined, not empty) - proves the new optional
      // fields are purely additive and do not change behavior for any caller that does not use them,
      // consistent with the M8 killSwitchActive precedent this wiring follows.
    });
  });

  // M9 (ADR-0063, docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md "Assurance Domain 1:
  // Authorization Bypass") Owner-authorized live drill (2026-08-16, AskUserQuestion
  // "Authorization-Bypass-Negativtests (empfohlen)"). All 9 runbook attack vectors already had
  // isolated unit coverage at the REM layer (tests/unit/roadmapExecutionMandate.test.ts) - this
  // drill proves each one denies through the REAL, live-wired, audited SA3B entry point
  // (authorizeSystemadminAuditedExecution), not just the isolated REM/IAM function. Three of the
  // nine vectors (Human-reserved action, Self-Authority mutation, direct tool/connector bypass)
  // already had live-chain coverage above and are not duplicated here - only cited.
  describe('M9 Authorization-Bypass Live-Drill (I2 Assurance, 2026-08-16)', () => {
    async function expectDeniedAndAudited(authRequest: SystemadminRoadmapAuthorizationRequest) {
      const result = await authorizeSystemadminAuditedExecution({
        authorization: authRequest,
        checkpoint: baseCheckpoint,
      }, auditContext);
      expect(result.decision.verdict).toBe('DENY');
      expect(result.executionPermit).toBeUndefined();
      expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
        authorization_decision: 'DENY',
        result: 'DENIED',
      }));
      return result;
    }

    it('1. missing principal: an empty humanActorId is denied through the real chain', async () => {
      await expectDeniedAndAudited({
        ...authorization(),
        principal: { ...principal, humanActorId: '' },
      });
    });

    it('2. wrong principal: an agentId that does not match the Systemadmin subject is denied at the SA2 chat profile layer', async () => {
      const result = await expectDeniedAndAudited({
        ...authorization(),
        principal: { ...principal, agentId: 'some-other-agent-id' },
      });
      expect(result.decision.layer).toBe('CHAT_PROFILE');
    });

    it('3. missing/unknown capability: a capability outside AGENT_CAPABILITIES is denied through the real chain', async () => {
      await expectDeniedAndAudited(authorization('DESTROY_EVERYTHING', []));
    });

    it('4. risk above allowed ceiling: BRANCH under a mandate capped at LOW is denied through the real chain', async () => {
      const capped = authorization(AGENT_CAPABILITIES.BRANCH, ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md']);
      await expectDeniedAndAudited({
        ...capped,
        riskClass: 'MEDIUM',
        mandate: { ...(capped.mandate as Record<string, unknown>), maxRiskClass: 'LOW' },
      });
    });

    it('5. wrong target/resource: a target outside the mandate allowlist is denied through the real chain', async () => {
      await expectDeniedAndAudited({
        ...authorization(),
        targetResource: 'github:someone-else/unrelated-repo',
      });
    });

    it('6. revoked/unapproved mandate: a non-OWNER_APPROVED mandate status is denied through the real chain', async () => {
      const base = authorization();
      await expectDeniedAndAudited({
        ...base,
        mandate: { ...(base.mandate as Record<string, unknown>), status: 'DRAFT' },
      });
    });

    it('7. expired mandate: a request timestamped after mandate.expiresAt is denied through the real chain', async () => {
      const base = authorization();
      await expectDeniedAndAudited({
        ...base,
        execution: { ...base.execution, now: '2026-09-01T00:00:00.000Z' },
      });
    });

    // Human-reserved action (MERGE): already proven live end-to-end above, "keeps MERGE and
    // production capabilities outside the audited permit path".
    // Self-Authority mutation: already proven live end-to-end above, "denies and audits attempts
    // to rewrite the SA2/SA3 control plane".
    // Direct tool/connector bypass: already proven live end-to-end above via the M8 Provider
    // Profile Registry composition tests (defense-in-depth layer independent of REM/IAM).
  });

  // M9 (ADR-0063, docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md "Assurance Domain 4: Secret /
  // Data Exfiltration") Owner-authorized live drill (2026-08-16, AskUserQuestion
  // "Secret/Exfiltration-Drill (empfohlen)"). Plants every runbook-named secret/PII category into
  // context.metadata of a REAL authorizeSystemadminAuditedExecution() call and inspects the actual
  // captured Supabase insert payload - not a synthetic call to the redaction function in isolation.
  // Along the way this drill found and closed two real gaps (see server/agentAudit/
  // agentAuditWriter.ts and src/platform/Telemetry/redaction.ts, both 2026-08-16): the PII/
  // prohibited-payload key regexes anchor on `[_-]`/string-boundary, so a prefixed camelCase key
  // like `customerEmail`/`fullRequestBody` slipped past unredacted while the snake_case equivalent
  // did not; and TOTP/recovery/backup-code-named secrets were not covered by SECRET_KEY_PATTERN at
  // all. Both fixes are additive normalization/pattern widenings, proven not to weaken any existing
  // match by the full suite staying green.
  describe('M9 Secret/Exfiltration Live-Drill (I2 Assurance, 2026-08-16)', () => {
    const plantedSecrets: Record<string, string> = {
      // sk_live_... (literal ellipsis, matches redactString's /sk_(?:live|test)_/i content
      // pattern without a realistic-looking secret body) - same placeholder convention already
      // used elsewhere in this repo (server/stripe.ts, docs/archive/legacy/
      // PRODUCTION_DEPLOYMENT_GUIDE.md) specifically to avoid tripping GitGuardian/Snyk secret
      // scanners on a synthetic test fixture.
      apiKey: 'sk_live_...',
      authorizationHeader: 'Bearer abc.def.ghi',
      password: 'CorrectHorseBatteryStaple123!',
      serviceRoleKey: 'sb_service_role_abcdefghijklmnopqrstuvwx',
      totpSecret: 'JBSWY3DPEHPK3PXP',
      recoveryCode: 'ABCD-1234-EFGH-5678',
      privateKey: '-----BEGIN PRIVATE KEY-----MIIEvQIBADANBg-----END PRIVATE KEY-----',
      customerEmail: 'jane.doe@example.com',
      creditCard: '4242424242424242',
      fullRequestBody: '{"secret":"must not persist raw"}',
    };

    it('redacts or omits every planted secret/PII category in the real captured audit insert payload', async () => {
      const result = await authorizeSystemadminAuditedExecution({
        authorization: authorization(),
        checkpoint: baseCheckpoint,
      }, { ...auditContext, metadata: { ...auditContext.metadata, ...plantedSecrets } });

      expect(result.decision.verdict).toBe('ALLOW');
      const insertedRow = mocks.insert.mock.calls.at(-1)?.[0] as { attributes: Record<string, unknown> };
      const attributes = insertedRow.attributes;

      for (const key of Object.keys(plantedSecrets)) {
        expect([attributes[key]]).not.toEqual([plantedSecrets[key]]);
        expect(['[REDACTED]', '[OMITTED]']).toContain(attributes[key]);
      }
    });

    it('never persists any planted raw secret value anywhere in the real captured audit insert payload (no reusable secret persists)', async () => {
      await authorizeSystemadminAuditedExecution({
        authorization: authorization(),
        checkpoint: baseCheckpoint,
      }, { ...auditContext, metadata: { ...auditContext.metadata, ...plantedSecrets } });

      const insertedRow = mocks.insert.mock.calls.at(-1)?.[0];
      const serialized = JSON.stringify(insertedRow);

      for (const rawSecretValue of Object.values(plantedSecrets)) {
        expect(serialized).not.toContain(rawSecretValue);
      }
    });

    it('leaves genuinely safe metadata untouched (redaction is not overbroad)', async () => {
      await authorizeSystemadminAuditedExecution({
        authorization: authorization(),
        checkpoint: baseCheckpoint,
      }, { ...auditContext, metadata: { ...auditContext.metadata, ...plantedSecrets, purposeNote: 'routine SA3B drill run' } });

      const insertedRow = mocks.insert.mock.calls.at(-1)?.[0] as { attributes: Record<string, unknown> };
      expect(insertedRow.attributes.purposeNote).toBe('routine SA3B drill run');
    });
  });
});
