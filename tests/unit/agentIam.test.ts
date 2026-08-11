import { describe, expect, it } from 'vitest';
import {
  AGENT_CAPABILITIES,
  evaluateAgentAuthorization,
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

describe('M4 provider-neutral Agent IAM', () => {
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

  it('blocks production mutation from a development principal even when explicitly granted', () => {
    expect(evaluateAgentAuthorization(request('PRODUCTION_MUTATION', [AGENT_CAPABILITIES.PRODUCTION_MUTATION], {
      environment: 'development',
      riskClass: 'CRITICAL',
      approval: {
        approvalId: 'approval-1',
        approvedByHumanActorId: 'owner-1',
        capability: AGENT_CAPABILITIES.PRODUCTION_MUTATION,
        targetResource: 'github:SvenKulessa/Finance',
        expiresAt: '2099-01-01T00:00:00.000Z',
        stepUpVerified: true,
      },
    })).verdict).toBe('DENY');
  });

  it('requires exact current Human/Step-up evidence for HIGH and CRITICAL actions', () => {
    const critical = request('PRODUCTION_MUTATION', [AGENT_CAPABILITIES.PRODUCTION_MUTATION], {
      environment: 'production',
      riskClass: 'CRITICAL',
    });
    expect(evaluateAgentAuthorization(critical).verdict).toBe('DENY');
    expect(evaluateAgentAuthorization({
      ...critical,
      approval: {
        approvalId: 'approval-1',
        approvedByHumanActorId: 'owner-1',
        capability: AGENT_CAPABILITIES.PRODUCTION_MUTATION,
        targetResource: 'github:SvenKulessa/Finance',
        expiresAt: '2099-01-01T00:00:00.000Z',
        stepUpVerified: true,
      },
    }).verdict).toBe('ALLOW');
  });

  it('rejects mismatched, expired, non-step-up and self-issued approval evidence', () => {
    const base = request('DEPLOY_REQUEST', [AGENT_CAPABILITIES.DEPLOY_REQUEST], {
      environment: 'production',
      riskClass: 'HIGH',
    });
    const approval = {
      approvalId: 'approval-1',
      approvedByHumanActorId: 'owner-1',
      capability: AGENT_CAPABILITIES.DEPLOY_REQUEST,
      targetResource: 'github:SvenKulessa/Finance',
      expiresAt: '2099-01-01T00:00:00.000Z',
      stepUpVerified: true,
    } as const;

    expect(evaluateAgentAuthorization({ ...base, approval: { ...approval, targetResource: 'render:other' } }).verdict).toBe('DENY');
    expect(evaluateAgentAuthorization({ ...base, approval: { ...approval, expiresAt: '2000-01-01T00:00:00.000Z' } }).verdict).toBe('DENY');
    expect(evaluateAgentAuthorization({ ...base, approval: { ...approval, stepUpVerified: false } }).verdict).toBe('DENY');
    expect(evaluateAgentAuthorization({
      ...base,
      principal: { ...principal, agentId: 'owner-1' },
      approval,
    }).verdict).toBe('DENY');
  });

  it('kill switch denies mutating capabilities but preserves explicitly granted READ', () => {
    expect(evaluateAgentAuthorization(request('COMMIT', [AGENT_CAPABILITIES.COMMIT], { killSwitchActive: true })).verdict).toBe('DENY');
    expect(evaluateAgentAuthorization(request('READ', [AGENT_CAPABILITIES.READ], { killSwitchActive: true })).verdict).toBe('ALLOW');
  });
});
