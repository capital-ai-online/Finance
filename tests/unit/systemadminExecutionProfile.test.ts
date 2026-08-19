import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  evaluateSystemadminChatExecutionProfile,
  prepareSystemadminChatAction,
  type SystemadminChatExecutionCheckpoint,
  type SystemadminChatExecutionProfileRequest,
} from '../../src/platform/Security/systemadminExecutionProfile';

const TEST_NOW = '2026-08-12T06:30:00.000Z';

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

const mandate = Object.freeze({
  mandateId: 'REM-SA2-CHAT-001',
  status: 'OWNER_APPROVED',
  ownerActorId: SYSTEMADMIN_OWNER_ACTOR_ID,
  subjectAgentId: SYSTEMADMIN_AGENT_ID,
  repository: SYSTEMADMIN_REPOSITORY,
  baseBranch: SYSTEMADMIN_BASE_BRANCH,
  roadmapItems: ['SA2-TEST-WORK-PACKAGE'],
  authorityRefs: [
    '.ai/skills/ESS-0021-Systemadmin-Roadmap-Executor.md',
    'docs/adr/ADR-0065-systemadmin-roadmap-execution-mandate.md',
  ],
  allowedCapabilities: [...SYSTEMADMIN_CHAT_CAPABILITIES],
  allowedPaths: ['src/services/**', 'tests/unit/**'],
  allowedTargets: ['github:SvenKulessa/Finance'],
  maxRiskClass: 'HIGH',
  allowedMutationClasses: [ROADMAP_EXECUTION_MUTATION_CLASSES.REPOSITORY],
  prohibitedMutationClasses,
  validFrom: '2026-08-12T00:00:00.000Z',
  expiresAt: '2026-08-19T00:00:00.000Z',
  maxOpenPullRequests: 1,
  ciBudgetPolicyRef: 'docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md',
  killSwitch: {
    enabled: true,
    revocationAuthority: SYSTEMADMIN_OWNER_ACTOR_ID,
  },
  requiredPreflight: ['security', 'overlap', 'tests', 'rollback'],
  requiredEvidence: ['mandateId', 'branch', 'commit', 'pr'],
  approvalEvidenceRef: 'owner-approved-rem-sa2-test',
} as const);

const principal = Object.freeze({
  humanActorId: SYSTEMADMIN_OWNER_ACTOR_ID,
  appId: SYSTEMADMIN_CHAT_APP_ID,
  agentId: SYSTEMADMIN_AGENT_ID,
  sessionId: 'chat-session-sa2',
  requestId: 'chat-request-sa2',
  credentialHolderId: 'github-connector-host',
  provider: 'openai',
  model: 'provider-metadata-only',
});

const checkpoint: Readonly<SystemadminChatExecutionCheckpoint> = Object.freeze({
  sa1VerifiedPass: true,
  mainResolved: true,
  roadmapResolved: true,
  securityPreflightPassed: true,
  overlapCheckPassed: true,
  checkClassResolved: true,
  rollbackDefined: true,
  testsDefined: true,
  freshBranchCreated: true,
  branchName: 'agent/sa2-test-work-package',
  implementationComplete: true,
  targetedValidationPassed: true,
  pullRequestOpen: false,
  currentHeadSha: '0123456789abcdef0123456789abcdef01234567',
});

function authorization(
  capability: string = AGENT_CAPABILITIES.PR,
  executionOverrides: Partial<SystemadminRoadmapAuthorizationRequest['execution']> = {},
): SystemadminRoadmapAuthorizationRequest {
  return {
    principal,
    capability,
    riskClass: 'HIGH',
    environment: 'development',
    targetResource: 'github:SvenKulessa/Finance',
    mandate,
    execution: {
      roadmapItem: 'SA2-TEST-WORK-PACKAGE',
      repository: SYSTEMADMIN_REPOSITORY,
      baseBranch: SYSTEMADMIN_BASE_BRANCH,
      requestedPaths: ['src/services/example.ts', 'tests/unit/example.test.ts'],
      mutationClass: ROADMAP_EXECUTION_MUTATION_CLASSES.REPOSITORY,
      openSystemadminPullRequests: 0,
      pullRequestOperation: 'CREATE',
      openPullRequestChangedPaths: [],
      ciBudgetExceeded: false,
      unchangedHeadAlreadyValidated: false,
      now: TEST_NOW,
      ...executionOverrides,
    },
  };
}

function profileRequest(
  capability: string = AGENT_CAPABILITIES.PR,
  checkpointOverrides: Partial<SystemadminChatExecutionCheckpoint> = {},
  authorizationOverrides: Partial<SystemadminRoadmapAuthorizationRequest> = {},
  mode: 'DRY_RUN' | 'LIVE' = 'DRY_RUN',
): SystemadminChatExecutionProfileRequest {
  return {
    mode,
    authorization: {
      ...authorization(capability),
      ...authorizationOverrides,
    },
    checkpoint: {
      ...checkpoint,
      ...checkpointOverrides,
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(TEST_NOW));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('SA2 Systemadmin Chat Execution Profile', () => {
  it('keeps the delegated capability surface exact and excludes deploy/production/merge', () => {
    expect(SYSTEMADMIN_CHAT_CAPABILITIES).toEqual([
      AGENT_CAPABILITIES.READ,
      AGENT_CAPABILITIES.ANALYZE,
      AGENT_CAPABILITIES.PLAN,
      AGENT_CAPABILITIES.BRANCH,
      AGENT_CAPABILITIES.COMMIT,
      AGENT_CAPABILITIES.PR,
      AGENT_CAPABILITIES.CI_REQUEST,
    ]);
    expect(SYSTEMADMIN_CHAT_CAPABILITIES).not.toContain(AGENT_CAPABILITIES.DEPLOY_REQUEST);
    expect(SYSTEMADMIN_CHAT_CAPABILITIES).not.toContain(AGENT_CAPABILITIES.PRODUCTION_MUTATION);
    expect(SYSTEMADMIN_CHAT_CAPABILITIES).not.toContain('MERGE');
  });

  it('prepares a secret-free immutable dry-run PR action envelope for a valid REM scope', () => {
    const prepared = prepareSystemadminChatAction(profileRequest());
    expect(prepared.decision).toMatchObject({
      verdict: 'ALLOW',
      capability: AGENT_CAPABILITIES.PR,
      mandateId: mandate.mandateId,
      liveMutationPermitted: false,
    });
    expect('envelope' in prepared).toBe(true);
    if ('envelope' in prepared) {
      expect(prepared.envelope).toMatchObject({
        mandateId: mandate.mandateId,
        roadmapItem: 'SA2-TEST-WORK-PACKAGE',
        appId: SYSTEMADMIN_CHAT_APP_ID,
        agentId: SYSTEMADMIN_AGENT_ID,
        requiresHumanMerge: true,
        liveMutationPermitted: false,
      });
      expect(Object.isFrozen(prepared.envelope)).toBe(true);
      expect(prepared.envelope).not.toHaveProperty('token');
      expect(prepared.envelope).not.toHaveProperty('secret');
      expect(prepared.envelope).not.toHaveProperty('credential');
    }
  });

  it('keeps live mutating execution disabled until SA3 audit correlation is VERIFIED PASS', () => {
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.PR,
      {},
      {},
      'LIVE',
    )).verdict).toBe('DENY');

    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.READ,
      {},
      {
        riskClass: 'LOW',
        execution: {
          ...authorization(AGENT_CAPABILITIES.READ).execution,
          requestedPaths: [],
          mutationClass: undefined,
        },
      },
      'LIVE',
    ))).toMatchObject({ verdict: 'ALLOW', liveMutationPermitted: true });
  });

  it('requires the exact ChatGPT execution client but never grants authority from provider metadata', () => {
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.PR,
      {},
      {
        principal: { ...principal, appId: 'unknown-client', provider: 'openai' },
      },
    )).verdict).toBe('DENY');

    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.PR,
      {},
      {
        principal: { ...principal, provider: 'arbitrary-provider-label', model: 'owner-model' },
      },
    )).verdict).toBe('ALLOW');
  });

  it('requires full security/roadmap preflight before BRANCH mutation', () => {
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.BRANCH,
      { freshBranchCreated: false, securityPreflightPassed: false },
    )).verdict).toBe('DENY');

    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.BRANCH,
      { freshBranchCreated: false },
    )).verdict).toBe('ALLOW');
  });

  it('requires a fresh agent branch and targeted validation before COMMIT', () => {
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.COMMIT,
      { branchName: 'main' },
    )).verdict).toBe('DENY');
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.COMMIT,
      { targetedValidationPassed: false },
    )).verdict).toBe('DENY');
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.COMMIT,
    )).verdict).toBe('ALLOW');
  });

  it('requires completed implementation, validation and current head before PR creation', () => {
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.PR,
      { implementationComplete: false },
    )).verdict).toBe('DENY');
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.PR,
      { currentHeadSha: '' },
    )).verdict).toBe('DENY');
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.PR,
      { pullRequestOpen: true },
    )).verdict).toBe('DENY');
  });

  it('requires an open PR and current head before CI_REQUEST', () => {
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.CI_REQUEST,
      { pullRequestOpen: false },
      {
        execution: {
          ...authorization(AGENT_CAPABILITIES.CI_REQUEST).execution,
          pullRequestOperation: 'UPDATE',
        },
      },
    )).verdict).toBe('DENY');

    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.CI_REQUEST,
      { pullRequestOpen: true, pullRequestNumber: 216 },
      {
        execution: {
          ...authorization(AGENT_CAPABILITIES.CI_REQUEST).execution,
          pullRequestOperation: 'UPDATE',
        },
      },
    )).verdict).toBe('ALLOW');
  });

  it('fails closed on credentials, prompt/tool scope elevation, unexpected production need and final Owner review', () => {
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.COMMIT,
      { credentialExposureDetected: true },
    )).verdict).toBe('DENY');
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.COMMIT,
      { untrustedScopeElevationDetected: true },
    )).verdict).toBe('DENY');
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.COMMIT,
      { productionMutationRequired: true },
    )).verdict).toBe('DENY');
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.COMMIT,
      { finalOwnerReviewStarted: true },
    )).verdict).toBe('DENY');
  });

  it('keeps MERGE, DEPLOY_REQUEST and PRODUCTION_MUTATION outside the SA2 profile', () => {
    expect(evaluateSystemadminChatExecutionProfile(profileRequest('MERGE')).verdict).toBe('DENY');
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.DEPLOY_REQUEST,
    )).verdict).toBe('DENY');
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.PRODUCTION_MUTATION,
    )).verdict).toBe('DENY');
  });

  it('still composes with SA1 target/path/CI-budget scope instead of bypassing it', () => {
    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.PR,
      {},
      { targetResource: 'github:Other/Repo' },
    )).verdict).toBe('DENY');

    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.PR,
      {},
      {
        execution: {
          ...authorization().execution,
          requestedPaths: ['src/platform/Security/other.ts'],
        },
      },
    )).verdict).toBe('DENY');

    expect(evaluateSystemadminChatExecutionProfile(profileRequest(
      AGENT_CAPABILITIES.CI_REQUEST,
      { pullRequestOpen: true, pullRequestNumber: 216 },
      {
        execution: {
          ...authorization(AGENT_CAPABILITIES.CI_REQUEST).execution,
          pullRequestOperation: 'UPDATE',
          ciBudgetExceeded: true,
        },
      },
    )).verdict).toBe('DENY');
  });
});
