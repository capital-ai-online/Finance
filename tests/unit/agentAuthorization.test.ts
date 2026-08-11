import { describe, expect, it } from 'vitest';
import {
  AGENT_EXECUTION_CAPABILITIES,
  authorizeAgentAction,
  type AgentExecutionPrincipal,
} from '../../src/platform/Security/agentAuthorization';

const principal: AgentExecutionPrincipal = {
  humanActorId: 'owner-1',
  clientId: 'chatgpt',
  agentSessionId: 'session-1',
  credentialHolderId: 'github-app-credential',
  provider: 'openai',
  model: 'gpt',
};

describe('authorizeAgentAction', () => {
  it('allows a granted low-risk capability', () => {
    expect(authorizeAgentAction({
      principal,
      capability: AGENT_EXECUTION_CAPABILITIES.READ,
      riskClass: 'LOW',
      grantedCapabilities: [AGENT_EXECUTION_CAPABILITIES.READ],
    })).toEqual({ allowed: true, reason: 'ALLOW', effectiveRiskClass: 'LOW' });
  });

  it('denies missing grants fail-closed', () => {
    expect(authorizeAgentAction({
      principal,
      capability: AGENT_EXECUTION_CAPABILITIES.COMMIT,
      riskClass: 'MEDIUM',
      grantedCapabilities: [],
    }).reason).toBe('CAPABILITY_NOT_GRANTED');
  });

  it('denies unknown capabilities, including MERGE', () => {
    expect(authorizeAgentAction({
      principal,
      capability: 'MERGE',
      riskClass: 'HIGH',
      grantedCapabilities: [],
    }).reason).toBe('UNKNOWN_CAPABILITY');
  });

  it('requires human approval for high-risk actions', () => {
    expect(authorizeAgentAction({
      principal,
      capability: AGENT_EXECUTION_CAPABILITIES.DEPLOY_REQUEST,
      riskClass: 'HIGH',
      grantedCapabilities: [AGENT_EXECUTION_CAPABILITIES.DEPLOY_REQUEST],
    }).reason).toBe('HUMAN_APPROVAL_REQUIRED');
  });

  it('requires step-up for critical production mutation', () => {
    expect(authorizeAgentAction({
      principal,
      capability: AGENT_EXECUTION_CAPABILITIES.PRODUCTION_MUTATION,
      riskClass: 'CRITICAL',
      grantedCapabilities: [AGENT_EXECUTION_CAPABILITIES.PRODUCTION_MUTATION],
      approval: {
        approvedByHumanActorId: principal.humanActorId,
        approvalId: 'approval-1',
        stepUpVerified: false,
      },
    }).reason).toBe('STEP_UP_REQUIRED');
  });

  it('allows critical production mutation only with matching human approval and step-up', () => {
    expect(authorizeAgentAction({
      principal,
      capability: AGENT_EXECUTION_CAPABILITIES.PRODUCTION_MUTATION,
      riskClass: 'CRITICAL',
      grantedCapabilities: [AGENT_EXECUTION_CAPABILITIES.PRODUCTION_MUTATION],
      approval: {
        approvedByHumanActorId: principal.humanActorId,
        approvalId: 'approval-1',
        stepUpVerified: true,
      },
    })).toEqual({ allowed: true, reason: 'ALLOW', effectiveRiskClass: 'CRITICAL' });
  });

  it('rejects incomplete execution identity', () => {
    expect(authorizeAgentAction({
      principal: { ...principal, agentSessionId: '' },
      capability: AGENT_EXECUTION_CAPABILITIES.READ,
      riskClass: 'LOW',
      grantedCapabilities: [AGENT_EXECUTION_CAPABILITIES.READ],
    }).reason).toBe('INVALID_PRINCIPAL');
  });
});
