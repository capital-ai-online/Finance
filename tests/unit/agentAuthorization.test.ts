import { describe, expect, it } from 'vitest';
import {
  AGENT_EXECUTION_CAPABILITIES,
  HUMAN_ONLY_TRANSITIONS,
  authorizeAgentExecution,
  riskClassForCapability,
  type AgentPrincipal,
} from '../../src/platform/Security/agentAuthorization';

const principal: AgentPrincipal = {
  humanActorId: 'owner-1',
  appId: 'chatgpt',
  agentId: 'capital-ai-coding-agent',
  sessionId: 'session-1',
  provider: 'openai',
  model: 'example-model',
};

describe('provider-neutral agent authorization', () => {
  it('denies an incomplete principal fail-closed', () => {
    const decision = authorizeAgentExecution({
      principal: { ...principal, humanActorId: '' },
      capability: AGENT_EXECUTION_CAPABILITIES.READ,
      grantedCapabilities: [AGENT_EXECUTION_CAPABILITIES.READ],
    });

    expect(decision.verdict).toBe('DENY');
    expect(decision.riskClass).toBe('CRITICAL');
  });

  it('denies capabilities that were not explicitly granted', () => {
    const decision = authorizeAgentExecution({
      principal,
      capability: AGENT_EXECUTION_CAPABILITIES.COMMIT,
      grantedCapabilities: [AGENT_EXECUTION_CAPABILITIES.READ],
    });

    expect(decision).toMatchObject({ verdict: 'DENY', riskClass: 'MEDIUM' });
  });

  it('does not allow provider/model metadata to grant authority', () => {
    const decision = authorizeAgentExecution({
      principal: { ...principal, provider: 'trusted-provider', model: 'trusted-model' },
      capability: AGENT_EXECUTION_CAPABILITIES.PR,
      grantedCapabilities: [],
    });

    expect(decision.verdict).toBe('DENY');
  });

  it('allows an explicitly granted low/medium action without step-up', () => {
    const decision = authorizeAgentExecution({
      principal,
      capability: AGENT_EXECUTION_CAPABILITIES.PR,
      grantedCapabilities: [AGENT_EXECUTION_CAPABILITIES.PR],
    });

    expect(decision).toMatchObject({ verdict: 'ALLOW', riskClass: 'MEDIUM' });
  });

  it('requires explicit approval for deployment requests', () => {
    const denied = authorizeAgentExecution({
      principal,
      capability: AGENT_EXECUTION_CAPABILITIES.DEPLOY_REQUEST,
      grantedCapabilities: [AGENT_EXECUTION_CAPABILITIES.DEPLOY_REQUEST],
    });
    const allowed = authorizeAgentExecution({
      principal,
      capability: AGENT_EXECUTION_CAPABILITIES.DEPLOY_REQUEST,
      grantedCapabilities: [AGENT_EXECUTION_CAPABILITIES.DEPLOY_REQUEST],
      explicitApproval: true,
    });

    expect(denied).toMatchObject({ verdict: 'DENY', riskClass: 'HIGH' });
    expect(allowed).toMatchObject({ verdict: 'ALLOW', riskClass: 'HIGH' });
  });

  it('requires approval and step-up for production mutation', () => {
    expect(authorizeAgentExecution({
      principal,
      capability: AGENT_EXECUTION_CAPABILITIES.PRODUCTION_MUTATION,
      grantedCapabilities: [AGENT_EXECUTION_CAPABILITIES.PRODUCTION_MUTATION],
      explicitApproval: true,
    }).verdict).toBe('DENY');

    expect(authorizeAgentExecution({
      principal,
      capability: AGENT_EXECUTION_CAPABILITIES.PRODUCTION_MUTATION,
      grantedCapabilities: [AGENT_EXECUTION_CAPABILITIES.PRODUCTION_MUTATION],
      explicitApproval: true,
      stepUpVerified: true,
    })).toMatchObject({ verdict: 'ALLOW', riskClass: 'CRITICAL' });
  });

  it('keeps MERGE outside the delegable agent capability set', () => {
    expect(HUMAN_ONLY_TRANSITIONS).toContain('MERGE');
    const decision = authorizeAgentExecution({
      principal,
      capability: 'MERGE',
      grantedCapabilities: Object.values(AGENT_EXECUTION_CAPABILITIES),
      explicitApproval: true,
      stepUpVerified: true,
    });

    expect(decision.verdict).toBe('DENY');
  });

  it('keeps the documented risk mapping stable', () => {
    expect(riskClassForCapability(AGENT_EXECUTION_CAPABILITIES.READ)).toBe('LOW');
    expect(riskClassForCapability(AGENT_EXECUTION_CAPABILITIES.COMMIT)).toBe('MEDIUM');
    expect(riskClassForCapability(AGENT_EXECUTION_CAPABILITIES.DEPLOY_REQUEST)).toBe('HIGH');
    expect(riskClassForCapability(AGENT_EXECUTION_CAPABILITIES.PRODUCTION_MUTATION)).toBe('CRITICAL');
  });
});
