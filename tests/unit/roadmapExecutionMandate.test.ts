import { describe, expect, it } from 'vitest';
import { evaluateSystemadminRoadmapPolicy } from '../../src/platform/Compliance/PolicyGate';
import { AGENT_CAPABILITIES } from '../../src/platform/Security/agentIam';
import {
  ROADMAP_EXECUTION_MUTATION_CLASSES,
  SYSTEMADMIN_AGENT_ID,
  validateRoadmapExecutionMandate,
  type RoadmapExecutionMandate,
  type SystemadminRoadmapAuthorizationRequest,
  type SystemadminRoadmapExecutionContext,
} from '../../src/platform/Security/roadmapExecutionMandate';

const principal = Object.freeze({
  humanActorId: 'SvenKulessa',
  appId: 'chatgpt-capital-ai',
  agentId: SYSTEMADMIN_AGENT_ID,
  sessionId: 'session-sa1',
  requestId: 'request-sa1',
  credentialHolderId: 'github-connector',
  provider: 'openai',
  model: 'metadata-only',
});

const prohibitedMutationClasses = [
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
] as const;

const mandate: RoadmapExecutionMandate = {
  mandateId: 'REM-SA1-PILOT-001',
  status: 'OWNER_APPROVED',
  ownerActorId: 'SvenKulessa',
  subjectAgentId: SYSTEMADMIN_AGENT_ID,
  repository: 'SvenKulessa/Finance',
  baseBranch: 'main',
  roadmapItems: ['SA1-TEST-WORK-PACKAGE'],
  authorityRefs: [
    '.ai/skills/ESS-0021-Systemadmin-Roadmap-Executor.md',
    'docs/adr/ADR-0065-systemadmin-roadmap-execution-mandate.md',
  ],
  allowedCapabilities: [
    AGENT_CAPABILITIES.READ,
    AGENT_CAPABILITIES.ANALYZE,
    AGENT_CAPABILITIES.PLAN,
    AGENT_CAPABILITIES.BRANCH,
    AGENT_CAPABILITIES.COMMIT,
    AGENT_CAPABILITIES.PR,
    AGENT_CAPABILITIES.CI_REQUEST,
  ],
  allowedPaths: ['src/services/**', 'tests/**', 'docs/evidence/**'],
  allowedTargets: ['github:SvenKulessa/Finance'],
  maxRiskClass: 'HIGH',
  allowedMutationClasses: [
    ROADMAP_EXECUTION_MUTATION_CLASSES.REPOSITORY,
    ROADMAP_EXECUTION_MUTATION_CLASSES.NON_PRODUCTION_CONFIG,
  ],
  prohibitedMutationClasses,
  validFrom: '2026-08-12T00:00:00.000Z',
  expiresAt: '2099-01-01T00:00:00.000Z',
  maxOpenPullRequests: 1,
  ciBudgetPolicyRef: 'docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md',
  killSwitch: {
    enabled: true,
    revocationAuthority: 'SvenKulessa',
  },
  requiredPreflight: ['resolve main', 'inspect overlap'],
  requiredEvidence: ['mandateId', 'branch', 'commit', 'PR'],
  approvalEvidenceRef: 'owner-approval:REM-SA1-PILOT-001',
};

const baseExecution: SystemadminRoadmapExecutionContext = {
  roadmapItem: 'SA1-TEST-WORK-PACKAGE',
  repository: 'SvenKulessa/Finance',
  baseBranch: 'main',
  requestedPaths: ['src/services/example.ts'],
  mutationClass: ROADMAP_EXECUTION_MUTATION_CLASSES.REPOSITORY,
  openSystemadminPullRequests: 0,
  pullRequestOperation: 'CREATE',
  openPullRequestChangedPaths: [],
  now: '2026-08-12T06:00:00.000Z',
};

function request(
  capability: string = AGENT_CAPABILITIES.PR,
  execution: Partial<SystemadminRoadmapExecutionContext> = {},
  overrides: Partial<SystemadminRoadmapAuthorizationRequest> = {},
): SystemadminRoadmapAuthorizationRequest {
  return {
    principal,
    capability,
    riskClass: 'HIGH',
    environment: 'development',
    targetResource: 'github:SvenKulessa/Finance',
    mandate,
    execution: { ...baseExecution, ...execution },
    ...overrides,
  };
}

describe('SA1 Roadmap Execution Mandate validator', () => {
  it('accepts the canonical Owner-approved REM structure', () => {
    expect(validateRoadmapExecutionMandate(mandate)).toMatchObject({ valid: true });
  });

  it('rejects unknown fields, missing authority refs and missing approval evidence', () => {
    expect(validateRoadmapExecutionMandate({ ...mandate, unexpectedAuthority: true }))
      .toMatchObject({ valid: false });
    expect(validateRoadmapExecutionMandate({ ...mandate, authorityRefs: [] }))
      .toMatchObject({ valid: false });
    expect(validateRoadmapExecutionMandate({ ...mandate, approvalEvidenceRef: undefined }))
      .toMatchObject({ valid: false });
  });

  it('rejects unsafe allowlist paths and incomplete reserved-mutation denylist', () => {
    expect(validateRoadmapExecutionMandate({ ...mandate, allowedPaths: ['../src/**'] }))
      .toMatchObject({ valid: false });
    expect(validateRoadmapExecutionMandate({
      ...mandate,
      prohibitedMutationClasses: [ROADMAP_EXECUTION_MUTATION_CLASSES.MERGE],
    })).toMatchObject({ valid: false });
  });
});

describe('SA1 Systemadmin REM enforcement', () => {
  it('allows a scoped HIGH repository PR through REM + existing Agent IAM', () => {
    expect(evaluateSystemadminRoadmapPolicy(request())).toMatchObject({
      verdict: 'ALLOW',
      capability: AGENT_CAPABILITIES.PR,
      riskClass: 'HIGH',
      mandateId: mandate.mandateId,
      layer: 'AGENT_IAM',
    });
  });

  it('denies missing, draft, revoked and expired mandate authority', () => {
    expect(evaluateSystemadminRoadmapPolicy({ ...request(), mandate: undefined }).verdict).toBe('DENY');
    expect(evaluateSystemadminRoadmapPolicy({ ...request(), mandate: { ...mandate, status: 'DRAFT' } }).verdict).toBe('DENY');
    expect(evaluateSystemadminRoadmapPolicy({ ...request(), mandate: { ...mandate, status: 'REVOKED' } }).verdict).toBe('DENY');
    expect(evaluateSystemadminRoadmapPolicy({
      ...request(),
      mandate: { ...mandate, expiresAt: '2026-08-12T01:00:00.000Z' },
    }).verdict).toBe('DENY');
  });

  it('binds authority to exact Owner, Systemadmin principal, repository and roadmap item', () => {
    expect(evaluateSystemadminRoadmapPolicy({
      ...request(),
      principal: { ...principal, humanActorId: 'other-owner' },
    }).verdict).toBe('DENY');
    expect(evaluateSystemadminRoadmapPolicy({
      ...request(),
      principal: { ...principal, agentId: 'other-agent' },
    }).verdict).toBe('DENY');
    expect(evaluateSystemadminRoadmapPolicy(request(undefined, { repository: 'Other/Repo' })).verdict).toBe('DENY');
    expect(evaluateSystemadminRoadmapPolicy(request(undefined, { roadmapItem: 'SA2' })).verdict).toBe('DENY');
  });

  it('denies unknown or non-granted capabilities and keeps MERGE outside Agent IAM', () => {
    expect(evaluateSystemadminRoadmapPolicy(request('UNKNOWN')).verdict).toBe('DENY');
    expect(evaluateSystemadminRoadmapPolicy(request('MERGE')).verdict).toBe('DENY');
    expect(evaluateSystemadminRoadmapPolicy({
      ...request(AGENT_CAPABILITIES.PR),
      mandate: {
        ...mandate,
        allowedCapabilities: [AGENT_CAPABILITIES.READ],
      },
    }).verdict).toBe('DENY');
  });

  it('technically blocks DEPLOY_REQUEST and PRODUCTION_MUTATION in SA1', () => {
    const expandedMandate = {
      ...mandate,
      allowedCapabilities: [
        ...mandate.allowedCapabilities,
        AGENT_CAPABILITIES.DEPLOY_REQUEST,
        AGENT_CAPABILITIES.PRODUCTION_MUTATION,
      ],
      allowedMutationClasses: [
        ...mandate.allowedMutationClasses,
        ROADMAP_EXECUTION_MUTATION_CLASSES.BOUNDED_REVERSIBLE_PRODUCTION,
      ],
      maxRiskClass: 'CRITICAL',
    } as const;

    expect(evaluateSystemadminRoadmapPolicy({
      ...request(AGENT_CAPABILITIES.DEPLOY_REQUEST),
      mandate: expandedMandate,
      environment: 'production',
    }).verdict).toBe('DENY');
    expect(evaluateSystemadminRoadmapPolicy({
      ...request(AGENT_CAPABILITIES.PRODUCTION_MUTATION, {
        mutationClass: ROADMAP_EXECUTION_MUTATION_CLASSES.BOUNDED_REVERSIBLE_PRODUCTION,
      }),
      mandate: expandedMandate,
      environment: 'production',
    }).verdict).toBe('DENY');
  });

  it('denies risk above the mandate maximum', () => {
    expect(evaluateSystemadminRoadmapPolicy({
      ...request(),
      riskClass: 'CRITICAL',
    }).verdict).toBe('DENY');
  });

  it('enforces exact target and path allowlists and rejects traversal', () => {
    expect(evaluateSystemadminRoadmapPolicy({
      ...request(),
      targetResource: 'github:Other/Repo',
    }).verdict).toBe('DENY');
    expect(evaluateSystemadminRoadmapPolicy(request(undefined, {
      requestedPaths: ['src/platform/Security/other.ts'],
    })).verdict).toBe('DENY');
    expect(evaluateSystemadminRoadmapPolicy(request(undefined, {
      requestedPaths: ['../src/services/example.ts'],
    })).verdict).toBe('DENY');
  });

  it('prevents the Systemadmin agent from modifying its own trust-root paths', () => {
    const selfAuthorityMandate = {
      ...mandate,
      allowedPaths: [...mandate.allowedPaths, 'AGENTS.md'],
    };
    expect(evaluateSystemadminRoadmapPolicy({
      ...request(undefined, { requestedPaths: ['AGENTS.md'] }),
      mandate: selfAuthorityMandate,
    }).verdict).toBe('DENY');
  });

  it('denies every reserved Human/Owner mutation class', () => {
    for (const mutationClass of prohibitedMutationClasses) {
      expect(evaluateSystemadminRoadmapPolicy(request(AGENT_CAPABILITIES.COMMIT, {
        mutationClass,
      })).verdict).toBe('DENY');
    }
  });

  it('requires repository mutation classification for mutating capabilities', () => {
    expect(evaluateSystemadminRoadmapPolicy(request(AGENT_CAPABILITIES.COMMIT, {
      mutationClass: undefined,
    })).verdict).toBe('DENY');
  });

  it('denies exact concurrent-writer path overlap', () => {
    expect(evaluateSystemadminRoadmapPolicy(request(undefined, {
      openPullRequestChangedPaths: ['src/services/example.ts'],
    })).verdict).toBe('DENY');
  });

  it('enforces the maximum number of open Systemadmin PRs on CREATE but permits UPDATE', () => {
    expect(evaluateSystemadminRoadmapPolicy(request(undefined, {
      openSystemadminPullRequests: 1,
      pullRequestOperation: 'CREATE',
    })).verdict).toBe('DENY');
    expect(evaluateSystemadminRoadmapPolicy(request(undefined, {
      openSystemadminPullRequests: 1,
      pullRequestOperation: 'UPDATE',
    })).verdict).toBe('ALLOW');
  });

  it('fails closed when the kill-switch mechanism is disabled', () => {
    expect(evaluateSystemadminRoadmapPolicy({
      ...request(),
      mandate: {
        ...mandate,
        killSwitch: { ...mandate.killSwitch, enabled: false },
      },
    }).verdict).toBe('DENY');
  });

  // M8 (ADR-0062, "rollback-to-read-only"). mandate.killSwitch.enabled=false denies everything,
  // including READ - too strict to prove "restore read-only operation" specifically.
  // killSwitchActive is the distinct, narrower lever: mutations denied, read access retained.
  it('rolls back to read-only: denies mutating capabilities but keeps READ/ANALYZE/PLAN available', () => {
    const rolledBack = { ...request(AGENT_CAPABILITIES.BRANCH, {}, { killSwitchActive: true }) };
    for (const mutating of [
      AGENT_CAPABILITIES.BRANCH,
      AGENT_CAPABILITIES.COMMIT,
      AGENT_CAPABILITIES.PR,
      AGENT_CAPABILITIES.CI_REQUEST,
    ]) {
      expect(evaluateSystemadminRoadmapPolicy({ ...rolledBack, capability: mutating }).verdict).toBe('DENY');
    }
    for (const readOnly of [AGENT_CAPABILITIES.READ, AGENT_CAPABILITIES.ANALYZE, AGENT_CAPABILITIES.PLAN]) {
      expect(evaluateSystemadminRoadmapPolicy({ ...rolledBack, capability: readOnly }).verdict).toBe('ALLOW');
    }
  });

  it('leaves normal operation unaffected when killSwitchActive is absent (default off)', () => {
    expect(evaluateSystemadminRoadmapPolicy(request(AGENT_CAPABILITIES.BRANCH)).verdict).toBe('ALLOW');
  });

  it('denies redundant or over-budget CI requests', () => {
    expect(evaluateSystemadminRoadmapPolicy(request(AGENT_CAPABILITIES.CI_REQUEST, {
      ciBudgetExceeded: true,
    })).verdict).toBe('DENY');
    expect(evaluateSystemadminRoadmapPolicy(request(AGENT_CAPABILITIES.CI_REQUEST, {
      unchangedHeadAlreadyValidated: true,
    })).verdict).toBe('DENY');
  });
});
