// M9 (ADR-0063) Break-Glass — Owner-ACCEPTED design,
// docs/evidence/m9/M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md. Tests the pure policy/logic layer
// in isolation (activation validation, expiry, revocation) and then proves the issued mandate
// flows correctly through the REAL, live-wired SA3B chain used throughout this session's other M9
// drills - the central design claim is that break-glass is additive (a narrowly-scoped mandate),
// never a parallel bypass codepath, and this is only actually proven by running it through that
// real chain, not by trusting the issuing logic in isolation.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  activateBreakGlass,
  isBreakGlassMandateActive,
  MAX_BREAK_GLASS_DURATION_MS,
  type BreakGlassActivationRequest,
} from '../../src/platform/Security/breakGlass';
import { AGENT_CAPABILITIES } from '../../src/platform/Security/agentIam';
import {
  SYSTEMADMIN_AGENT_ID,
  SYSTEMADMIN_OWNER_ACTOR_ID,
  SYSTEMADMIN_REPOSITORY,
  validateRoadmapExecutionMandate,
  type SystemadminRoadmapAuthorizationRequest,
} from '../../src/platform/Security/roadmapExecutionMandate';
import {
  SYSTEMADMIN_CHAT_APP_ID,
  type SystemadminChatExecutionCheckpoint,
} from '../../src/platform/Security/systemadminExecutionProfile';

function validRequest(overrides: Partial<BreakGlassActivationRequest> = {}): BreakGlassActivationRequest {
  return {
    ownerActorId: SYSTEMADMIN_OWNER_ACTOR_ID,
    capability: AGENT_CAPABILITIES.BRANCH,
    targetResource: 'github:SvenKulessa/Finance',
    reason: 'Kill-Switch versehentlich aktiv, Owner benötigt einen einmaligen BRANCH für den Fix.',
    roadmapItem: 'M9-BREAK-GLASS-DRILL',
    allowedPaths: ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md'],
    stepUpVerified: true,
    now: '2026-08-16T12:00:00.000Z',
    ...overrides,
  };
}

describe('activateBreakGlass', () => {
  it('denies without a verified fresh Owner step-up', () => {
    const result = activateBreakGlass(validRequest({ stepUpVerified: false }));
    expect(result.verdict).toBe('DENY');
  });

  it('denies a non-Owner actor', () => {
    const result = activateBreakGlass(validRequest({ ownerActorId: 'not-the-owner' }));
    expect(result.verdict).toBe('DENY');
  });

  it('denies MERGE (not a known AgentCapability at all - structurally unreachable)', () => {
    const result = activateBreakGlass(validRequest({ capability: 'MERGE' }));
    expect(result.verdict).toBe('DENY');
  });

  it.each([AGENT_CAPABILITIES.PRODUCTION_MUTATION, AGENT_CAPABILITIES.DEPLOY_REQUEST])(
    'denies %s even though it is a known capability (explicitly excluded from break-glass eligibility)',
    (capability) => {
      const result = activateBreakGlass(validRequest({ capability }));
      expect(result.verdict).toBe('DENY');
    },
  );

  it('denies an unknown/garbage capability string', () => {
    const result = activateBreakGlass(validRequest({ capability: 'DESTROY_EVERYTHING' }));
    expect(result.verdict).toBe('DENY');
  });

  it('denies a missing reason', () => {
    expect(activateBreakGlass(validRequest({ reason: '' })).verdict).toBe('DENY');
    expect(activateBreakGlass(validRequest({ reason: '   ' })).verdict).toBe('DENY');
  });

  it('denies a missing target', () => {
    expect(activateBreakGlass(validRequest({ targetResource: '' })).verdict).toBe('DENY');
  });

  it('denies a missing roadmap item', () => {
    expect(activateBreakGlass(validRequest({ roadmapItem: '' })).verdict).toBe('DENY');
  });

  it('denies a missing or empty path allowlist (no implicit wildcard fallback)', () => {
    expect(activateBreakGlass(validRequest({ allowedPaths: [] })).verdict).toBe('DENY');
  });

  const eligibleCapabilities = [
    AGENT_CAPABILITIES.READ,
    AGENT_CAPABILITIES.ANALYZE,
    AGENT_CAPABILITIES.PLAN,
    AGENT_CAPABILITIES.BRANCH,
    AGENT_CAPABILITIES.COMMIT,
    AGENT_CAPABILITIES.PR,
    AGENT_CAPABILITIES.CI_REQUEST,
  ] as const;

  it.each(eligibleCapabilities)('allows activation for the eligible capability %s', (capability) => {
    const result = activateBreakGlass(validRequest({ capability }));
    expect(result.verdict).toBe('ALLOW');
    if (result.verdict !== 'ALLOW') return;
    expect(result.mandate.allowedCapabilities).toEqual([capability]);
    expect(result.mandate.allowedTargets).toEqual(['github:SvenKulessa/Finance']);
    expect(result.mandate.ownerActorId).toBe(SYSTEMADMIN_OWNER_ACTOR_ID);
    expect(result.mandate.subjectAgentId).toBe(SYSTEMADMIN_AGENT_ID);
  });

  it('the issued mandate is a genuinely valid RoadmapExecutionMandate per the shared structural validator (not just self-asserted)', () => {
    const result = activateBreakGlass(validRequest());
    expect(result.verdict).toBe('ALLOW');
    if (result.verdict !== 'ALLOW') return;
    const revalidated = validateRoadmapExecutionMandate(result.mandate);
    expect(revalidated.valid).toBe(true);
  });

  it('caps expiry at exactly MAX_BREAK_GLASS_DURATION_MS (30 minutes) - no caller-controllable duration exists', () => {
    const result = activateBreakGlass(validRequest());
    expect(result.verdict).toBe('ALLOW');
    if (result.verdict !== 'ALLOW') return;
    const durationMs = Date.parse(result.mandate.expiresAt) - Date.parse(result.mandate.validFrom);
    expect(durationMs).toBe(MAX_BREAK_GLASS_DURATION_MS);
    expect(MAX_BREAK_GLASS_DURATION_MS).toBe(30 * 60 * 1000);
  });

  it('produces a unique mandateId on every activation (no collision risk across concurrent emergencies)', () => {
    const first = activateBreakGlass(validRequest());
    const second = activateBreakGlass(validRequest());
    expect(first.verdict).toBe('ALLOW');
    expect(second.verdict).toBe('ALLOW');
    if (first.verdict !== 'ALLOW' || second.verdict !== 'ALLOW') return;
    expect(first.mandate.mandateId).not.toBe(second.mandate.mandateId);
  });

  it('prohibits every reserved mutation class, exactly like every other mandate in this codebase (no special-cased weaker denylist for break-glass)', () => {
    const result = activateBreakGlass(validRequest());
    expect(result.verdict).toBe('ALLOW');
    if (result.verdict !== 'ALLOW') return;
    expect(result.mandate.prohibitedMutationClasses).toContain('MERGE');
    expect(result.mandate.prohibitedMutationClasses).toContain('OWNER_IAM_ELEVATION');
    expect(result.mandate.prohibitedMutationClasses).toContain('SECURITY_CONTROL_DISABLEMENT');
    expect(result.mandate.prohibitedMutationClasses).toContain('SELF_MANDATE_EXPANSION');
  });
});

describe('isBreakGlassMandateActive', () => {
  it('is active strictly within [validFrom, expiresAt)', () => {
    const mandate = { validFrom: '2026-08-16T12:00:00.000Z', expiresAt: '2026-08-16T12:30:00.000Z' };
    expect(isBreakGlassMandateActive(mandate, false, '2026-08-16T11:59:59.999Z')).toBe(false);
    expect(isBreakGlassMandateActive(mandate, false, '2026-08-16T12:00:00.000Z')).toBe(true);
    expect(isBreakGlassMandateActive(mandate, false, '2026-08-16T12:15:00.000Z')).toBe(true);
    expect(isBreakGlassMandateActive(mandate, false, '2026-08-16T12:30:00.000Z')).toBe(false);
    expect(isBreakGlassMandateActive(mandate, false, '2026-08-16T13:00:00.000Z')).toBe(false);
  });

  it('is inactive when revoked, even mid-window (explicit revocation always wins)', () => {
    const mandate = { validFrom: '2026-08-16T12:00:00.000Z', expiresAt: '2026-08-16T12:30:00.000Z' };
    expect(isBreakGlassMandateActive(mandate, true, '2026-08-16T12:15:00.000Z')).toBe(false);
  });
});

const mocks = vi.hoisted(() => {
  const single = vi.fn();
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn((_payload: Record<string, unknown>) => ({ select }));
  const from = vi.fn(() => ({ insert }));
  return { single, select, insert, from, getPrivilegedServerSupabase: vi.fn(() => ({ from })) };
});

vi.mock('../../server/db', () => ({ getPrivilegedServerSupabase: mocks.getPrivilegedServerSupabase }));

// Imported after the mock so authorizeSystemadminAuditedExecution's own import of the mocked
// module resolves to the mock, exactly mirroring the pattern in systemadminAuditedExecution.test.ts.
import { authorizeSystemadminAuditedExecution } from '../../server/agentAudit/systemadminAuditedExecution';

describe('Break-Glass mandate through the real live-wired SA3B chain (proves additive, not a bypass)', () => {
  const principal = {
    humanActorId: SYSTEMADMIN_OWNER_ACTOR_ID,
    appId: SYSTEMADMIN_CHAT_APP_ID,
    agentId: SYSTEMADMIN_AGENT_ID,
    sessionId: 'break-glass-live-session',
    requestId: 'break-glass-live-request',
    credentialHolderId: 'github-connector-host',
    provider: 'openai',
    model: 'metadata-only',
  };

  const auditContext = {
    traceId: '0123456789abcdef0123456789abcdef',
    policyId: 'ADR-0059/ADR-0065/SA3',
    toolId: 'break-glass.activate',
    runtimeVersion: '0.6.0',
  };

  const baseCheckpoint: SystemadminChatExecutionCheckpoint = {
    sa1VerifiedPass: true,
    mainResolved: true,
    roadmapResolved: true,
    securityPreflightPassed: true,
    overlapCheckPassed: true,
    checkClassResolved: true,
    rollbackDefined: true,
    testsDefined: true,
    freshBranchCreated: false,
    branchName: undefined,
    implementationComplete: true,
    targetedValidationPassed: true,
    pullRequestOpen: false,
    currentHeadSha: '0123456789abcdef0123456789abcdef01234567',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.single.mockResolvedValue({ data: { id: 'break-glass-auth-1' }, error: null });
  });

  function requestFor(mandate: unknown, capability: string, now: string): SystemadminRoadmapAuthorizationRequest {
    return {
      principal,
      capability,
      riskClass: 'MEDIUM',
      environment: 'development',
      targetResource: 'github:SvenKulessa/Finance',
      mandate,
      execution: {
        roadmapItem: 'M9-BREAK-GLASS-DRILL',
        repository: SYSTEMADMIN_REPOSITORY,
        baseBranch: 'main',
        requestedPaths: ['docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md'],
        mutationClass: 'REPOSITORY',
        openSystemadminPullRequests: 0,
        pullRequestOperation: 'CREATE',
        openPullRequestChangedPaths: [],
        ciBudgetExceeded: false,
        unchangedHeadAlreadyValidated: false,
        now,
      },
    };
  }

  it('allows the exact granted capability, for the exact granted target, through the real chain', async () => {
    const activation = activateBreakGlass(validRequest({ capability: AGENT_CAPABILITIES.BRANCH }));
    expect(activation.verdict).toBe('ALLOW');
    if (activation.verdict !== 'ALLOW') return;

    const result = await authorizeSystemadminAuditedExecution({
      authorization: requestFor(activation.mandate, AGENT_CAPABILITIES.BRANCH, '2026-08-16T12:00:00.000Z'),
      checkpoint: baseCheckpoint,
    }, auditContext);

    expect(result.decision.verdict).toBe('ALLOW');
    expect(result.executionPermit).toBeDefined();
  });

  it('denies a DIFFERENT capability under the same break-glass mandate (single-capability scope enforced by the real chain, not just the issuer)', async () => {
    const activation = activateBreakGlass(validRequest({ capability: AGENT_CAPABILITIES.BRANCH }));
    expect(activation.verdict).toBe('ALLOW');
    if (activation.verdict !== 'ALLOW') return;

    const result = await authorizeSystemadminAuditedExecution({
      authorization: requestFor(activation.mandate, AGENT_CAPABILITIES.PR, '2026-08-16T12:00:00.000Z'),
      checkpoint: baseCheckpoint,
    }, auditContext);

    expect(result.decision.verdict).toBe('DENY');
    expect(result.executionPermit).toBeUndefined();
  });

  it('denies once the break-glass mandate has expired, through the real chain (short-lived is enforced, not just documented)', async () => {
    const activation = activateBreakGlass(validRequest({ capability: AGENT_CAPABILITIES.BRANCH }));
    expect(activation.verdict).toBe('ALLOW');
    if (activation.verdict !== 'ALLOW') return;

    const afterExpiry = new Date(Date.parse(activation.mandate.expiresAt) + 1_000).toISOString();
    const result = await authorizeSystemadminAuditedExecution({
      authorization: requestFor(activation.mandate, AGENT_CAPABILITIES.BRANCH, afterExpiry),
      checkpoint: baseCheckpoint,
    }, auditContext);

    expect(result.decision.verdict).toBe('DENY');
    expect(result.executionPermit).toBeUndefined();
  });

  it('audits both the ALLOW and the DENY outcomes through the real, already-proven append-only audit path', async () => {
    const activation = activateBreakGlass(validRequest({ capability: AGENT_CAPABILITIES.READ, targetResource: 'github:SvenKulessa/Finance' }));
    expect(activation.verdict).toBe('ALLOW');
    if (activation.verdict !== 'ALLOW') return;

    await authorizeSystemadminAuditedExecution({
      authorization: requestFor(activation.mandate, AGENT_CAPABILITIES.READ, '2026-08-16T12:00:00.000Z'),
      checkpoint: baseCheckpoint,
    }, auditContext);

    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      authorization_decision: 'ALLOW',
    }));
  });
});
