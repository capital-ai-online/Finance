import { describe, expect, it } from 'vitest';
import {
  authorizeAgentCapability,
  getAgentCapabilityRisk,
  isHumanOnlyTransition,
  type AgentAuthorizationRequest,
  type AgentIdentityContext,
} from '../../src/platform/Security/agentAuthorization';

const identity: AgentIdentityContext = {
  humanActorId: 'human:owner',
  appId: 'app:chatgpt',
  agentId: 'agent:repo-change',
  sessionId: 'session:123',
  toolCredentialHolderId: 'credential:github-app',
  provider: 'openai',
  model: 'gpt',
};

function request(overrides: Partial<AgentAuthorizationRequest> = {}): AgentAuthorizationRequest {
  return {
    identity,
    capability: 'READ',
    grantedCapabilities: ['READ'],
    approval: null,
    ...overrides,
  };
}

describe('agentAuthorization', () => {
  it('classifies canonical risk levels deterministically', () => {
    expect(getAgentCapabilityRisk('READ')).toBe('LOW');
    expect(getAgentCapabilityRisk('BRANCH')).toBe('MEDIUM');
    expect(getAgentCapabilityRisk('COMMIT')).toBe('HIGH');
    expect(getAgentCapabilityRisk('PRODUCTION_MUTATION')).toBe('CRITICAL');
  });

  it('denies an incomplete attributable identity', () => {
    const decision = authorizeAgentCapability(
      request({ identity: { ...identity, sessionId: '' } }),
    );

    expect(decision).toEqual({
      allowed: false,
      riskClass: 'LOW',
      reason: 'INVALID_IDENTITY',
    });
  });

  it('denies a capability that was not explicitly granted', () => {
    const decision = authorizeAgentCapability(
      request({ capability: 'PLAN', grantedCapabilities: ['READ'] }),
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('CAPABILITY_NOT_GRANTED');
  });

  it('allows low/medium capabilities only when explicitly granted', () => {
    expect(
      authorizeAgentCapability(
        request({ capability: 'PLAN', grantedCapabilities: ['PLAN'] }),
      ),
    ).toEqual({ allowed: true, riskClass: 'MEDIUM', reason: 'ALLOW' });
  });

  it('requires a human approval artifact for HIGH capabilities', () => {
    const decision = authorizeAgentCapability(
      request({ capability: 'COMMIT', grantedCapabilities: ['COMMIT'] }),
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('HUMAN_APPROVAL_REQUIRED');
  });

  it('rejects agent self-approval', () => {
    const decision = authorizeAgentCapability(
      request({
        capability: 'COMMIT',
        grantedCapabilities: ['COMMIT'],
        approval: {
          approvedByHumanActorId: identity.agentId,
          subjectAgentId: identity.agentId,
          capability: 'COMMIT',
          stepUpVerified: true,
          expiresAt: '2030-01-01T00:00:00.000Z',
        },
      }),
      new Date('2026-08-11T00:00:00.000Z'),
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('SELF_APPROVAL_FORBIDDEN');
  });

  it('rejects approval for another agent or capability', () => {
    const wrongAgent = authorizeAgentCapability(
      request({
        capability: 'COMMIT',
        grantedCapabilities: ['COMMIT'],
        approval: {
          approvedByHumanActorId: identity.humanActorId,
          subjectAgentId: 'agent:other',
          capability: 'COMMIT',
          stepUpVerified: true,
          expiresAt: '2030-01-01T00:00:00.000Z',
        },
      }),
      new Date('2026-08-11T00:00:00.000Z'),
    );

    expect(wrongAgent.reason).toBe('APPROVAL_SUBJECT_MISMATCH');

    const wrongCapability = authorizeAgentCapability(
      request({
        capability: 'COMMIT',
        grantedCapabilities: ['COMMIT'],
        approval: {
          approvedByHumanActorId: identity.humanActorId,
          subjectAgentId: identity.agentId,
          capability: 'PR',
          stepUpVerified: true,
          expiresAt: '2030-01-01T00:00:00.000Z',
        },
      }),
      new Date('2026-08-11T00:00:00.000Z'),
    );

    expect(wrongCapability.reason).toBe('APPROVAL_CAPABILITY_MISMATCH');
  });

  it('requires fresh step-up for CRITICAL production mutation', () => {
    const decision = authorizeAgentCapability(
      request({
        capability: 'PRODUCTION_MUTATION',
        grantedCapabilities: ['PRODUCTION_MUTATION'],
        approval: {
          approvedByHumanActorId: identity.humanActorId,
          subjectAgentId: identity.agentId,
          capability: 'PRODUCTION_MUTATION',
          stepUpVerified: false,
          expiresAt: '2030-01-01T00:00:00.000Z',
        },
      }),
      new Date('2026-08-11T00:00:00.000Z'),
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('STEP_UP_REQUIRED');
  });

  it('allows a properly approved high-risk capability', () => {
    const decision = authorizeAgentCapability(
      request({
        capability: 'CI_REQUEST',
        grantedCapabilities: ['CI_REQUEST'],
        approval: {
          approvedByHumanActorId: identity.humanActorId,
          subjectAgentId: identity.agentId,
          capability: 'CI_REQUEST',
          stepUpVerified: false,
          expiresAt: '2030-01-01T00:00:00.000Z',
        },
      }),
      new Date('2026-08-11T00:00:00.000Z'),
    );

    expect(decision).toEqual({ allowed: true, riskClass: 'HIGH', reason: 'ALLOW' });
  });

  it('keeps MERGE outside the agent capability namespace', () => {
    expect(isHumanOnlyTransition('MERGE')).toBe(true);
    expect(isHumanOnlyTransition('COMMIT')).toBe(false);
  });
});
