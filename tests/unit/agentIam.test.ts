import { describe, expect, it } from 'vitest';
import {
  AGENT_CAPABILITIES,
  evaluateAgentAuthorization,
  minimumRiskForCapability,
  type AgentAuthorizationRequest,
  type AgentCapability,
} from '../../src/platform/Security/agentIam';

const principal = Object.freeze({
  humanActorId: 'owner-1',
  appId: 'chatgpt-client',
  agentId: 'agent-1',
  sessionId: 'session-1',
  requestId: 'request-1',
  credentialHolderId: 'github-tool-identity',
  provider: 'openai',
  model: 'provider-metadata-only',
});

function request(
  capability: string,
  grantedCapabilities: readonly AgentCapability[],
  overrides: Partial<AgentAuthorizationRequest> = {},
): AgentAuthorizationRequest {
  return {
    principal,
    capability,
    grantedCapabilities,
    riskClass: 'LOW',
    environment: 'development',
    targetResource: 'github:SvenKulessa/Finance',
    ...overrides,
  };
}

const highApproval = {
  approvalId: 'approval-high',
  approvedByHumanActorId: 'owner-1',
  subjectAgentId: 'agent-1',
  capability: AGENT_CAPABILITIES.DEPLOY_REQUEST,
  targetResource: 'github:SvenKulessa/Finance',
  expiresAt: '2099-01-01T00:00:00.000Z',
  stepUpVerified: false,
} as const;

const criticalApproval = {
  approvalId: 'approval-critical',
  approvedByHumanActorId: 'owner-1',
  subjectAgentId: 'agent-1',
  capability: AGENT_CAPABILITIES.PRODUCTION_MUTATION,
  targetResource: 'github:SvenKulessa/Finance',
  expiresAt: '2099-01-01T00:00:00.000Z',
  stepUpVerified: true,
} as const;

describe('M4 provider-neutral Agent IAM', () => {
  it('keeps the canonical capability minimum-risk mapping stable', () => {
    expect(minimumRiskForCapability(AGENT_CAPABILITIES.READ)).toBe('LOW');
    expect(minimumRiskForCapability(AGENT_CAPABILITIES.COMMIT)).toBe('MEDIUM');
    expect(minimumRiskForCapability(AGENT_CAPABILITIES.DEPLOY_REQUEST)).toBe('HIGH');
    expect(minimumRiskForCapability(AGENT_CAPABILITIES.PRODUCTION_MUTATION)).toBe('CRITICAL');
  });

  it('allows only an explicitly granted exact capability', () => {
    expect(evaluateAgentAuthorization(request('READ', [AGENT_CAPABILITIES.READ])).verdict).toBe('ALLOW');
    expect(evaluateAgentAuthorization(request('ANALYZE', [AGENT_CAPABILITIES.READ])).verdict).toBe('DENY');
    expect(evaluateAgentAuthorization(request('PLAN', [AGENT_CAPABILITIES.ANALYZE])).verdict).toBe('DENY');
  });

  it('does not inherit COMMIT -> PR -> CI_REQUEST -> DEPLOY_REQUEST', () => {
    expect(evaluateAgentAuthorization(request('PR', [AGENT_CAPABILITIES.COMMIT])).verdict).toBe('DENY');
    expect(evaluateAgentAuthorization(request('CI_REQUEST', [AGENT_CAPABILITIES.PR])).verdict).toBe('DENY');
    expect(evaluateAgentAuthorization(request('DEPLOY_REQUEST', [AGENT_CAPABILITIES.CI_REQUEST])).verdict).toBe('DENY');
    expect(evaluateAgentAuthorization(request('PRODUCTION_MUTATION', [AGENT_CAPABILITIES.DEPLOY_REQUEST])).verdict).toBe('DENY');
  });

  it('never exposes MERGE as an agent capability', () => {
    expect(evaluateAgentAuthorization(request('MERGE', [...Object.values(AGENT_CAPABILITIES)])).verdict).toBe('DENY');
  });

  it('fails closed when attribution is incomplete', () => {
    expect(evaluateAgentAuthorization(request('READ', [AGENT_CAPABILITIES.READ], {
      principal: { ...principal, requestId: '' },
    })).verdict).toBe('DENY');
  });

  it('does not grant privilege from provider/model metadata', () => {
    expect(evaluateAgentAuthorization(request('COMMIT', [], {
      principal: { ...principal, provider: 'trusted-provider-name', model: 'owner-model' },
    })).verdict).toBe('DENY');
  });

  it('cannot under-classify deploy or production mutation risk', () => {
    const deploy = evaluateAgentAuthorization(request('DEPLOY_REQUEST', [AGENT_CAPABILITIES.DEPLOY_REQUEST], {
      environment: 'production',
      riskClass: 'LOW',
    }));
    expect(deploy.verdict).toBe('DENY');
    expect(deploy.riskClass).toBe('HIGH');

    const production = evaluateAgentAuthorization(request('PRODUCTION_MUTATION', [AGENT_CAPABILITIES.PRODUCTION_MUTATION], {
      environment: 'production',
      riskClass: 'LOW',
    }));
    expect(production.verdict).toBe('DENY');
    expect(production.riskClass).toBe('CRITICAL');
  });

  it('allows HIGH only with matching human approval and no mandatory step-up', () => {
    expect(evaluateAgentAuthorization(request('DEPLOY_REQUEST', [AGENT_CAPABILITIES.DEPLOY_REQUEST], {
      environment: 'production',
      riskClass: 'HIGH',
      approval: highApproval,
    }))).toMatchObject({ verdict: 'ALLOW', riskClass: 'HIGH' });
  });

  it('requires CRITICAL approval plus step-up', () => {
    const base = request('PRODUCTION_MUTATION', [AGENT_CAPABILITIES.PRODUCTION_MUTATION], {
      environment: 'production',
      riskClass: 'CRITICAL',
    });

    expect(evaluateAgentAuthorization({
      ...base,
      approval: { ...criticalApproval, stepUpVerified: false },
    }).verdict).toBe('DENY');

    expect(evaluateAgentAuthorization({ ...base, approval: criticalApproval }))
      .toMatchObject({ verdict: 'ALLOW', riskClass: 'CRITICAL' });
  });

  it('blocks production mutation from a development principal even when explicitly granted', () => {
    expect(evaluateAgentAuthorization(request('PRODUCTION_MUTATION', [AGENT_CAPABILITIES.PRODUCTION_MUTATION], {
      environment: 'development',
      riskClass: 'CRITICAL',
      approval: criticalApproval,
    })).verdict).toBe('DENY');
  });

  it('binds approval to the exact agent principal', () => {
    const base = request('DEPLOY_REQUEST', [AGENT_CAPABILITIES.DEPLOY_REQUEST], {
      environment: 'production',
      riskClass: 'HIGH',
    });

    expect(evaluateAgentAuthorization({
      ...base,
      approval: { ...highApproval, subjectAgentId: 'other-agent' },
    }).verdict).toBe('DENY');
  });

  it('rejects mismatched, expired and self-issued approval evidence', () => {
    const base = request('DEPLOY_REQUEST', [AGENT_CAPABILITIES.DEPLOY_REQUEST], {
      environment: 'production',
      riskClass: 'HIGH',
    });

    expect(evaluateAgentAuthorization({ ...base, approval: { ...highApproval, targetResource: 'render:other' } }).verdict).toBe('DENY');
    expect(evaluateAgentAuthorization({ ...base, approval: { ...highApproval, expiresAt: '2000-01-01T00:00:00.000Z' } }).verdict).toBe('DENY');
    expect(evaluateAgentAuthorization({
      ...base,
      principal: { ...principal, agentId: 'owner-1' },
      approval: { ...highApproval, subjectAgentId: 'owner-1' },
    }).verdict).toBe('DENY');
  });

  it('kill switch denies mutating capabilities but preserves explicitly granted READ', () => {
    expect(evaluateAgentAuthorization(request('COMMIT', [AGENT_CAPABILITIES.COMMIT], { killSwitchActive: true })).verdict).toBe('DENY');
    expect(evaluateAgentAuthorization(request('READ', [AGENT_CAPABILITIES.READ], { killSwitchActive: true })).verdict).toBe('ALLOW');
  });
});
