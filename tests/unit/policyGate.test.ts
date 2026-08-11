import { describe, it, expect } from 'vitest';
import { evaluateAgentPolicy, evaluateReadPolicy, evaluateWritePolicy } from '../../src/platform/Compliance/PolicyGate';
import { CAPABILITIES } from '../../src/platform/Security/capabilities';
import { AGENT_CAPABILITIES } from '../../src/platform/Security/agentIam';

describe('Compliance PolicyGate (ESS-0018 Phase 2)', () => {
  it('allows only the explicitly allowlisted write capabilities', () => {
    expect(evaluateWritePolicy(CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_DISABLE).verdict).toBe('ALLOW');
    expect(evaluateWritePolicy(CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_RESEND_CONFIRMATION).verdict).toBe('ALLOW');
  });

  it('denies a read capability when evaluated as a write (no cross-allowlist leakage)', () => {
    expect(evaluateWritePolicy(CAPABILITIES.ADMIN_DIAGNOSTICS_READ).verdict).toBe('DENY');
  });

  it('denies any capability that is not on the write allowlist, including a raw-SQL-shaped one', () => {
    expect(evaluateWritePolicy('supabase.sql.execute').verdict).toBe('DENY');
    expect(evaluateWritePolicy('supabase.admin.project.delete').verdict).toBe('DENY');
  });

  it('allows the two allowlisted read capabilities', () => {
    expect(evaluateReadPolicy(CAPABILITIES.ADMIN_DIAGNOSTICS_READ).verdict).toBe('ALLOW');
    expect(evaluateReadPolicy(CAPABILITIES.ADMIN_SUBSCRIPTION_STATUS_READ).verdict).toBe('ALLOW');
  });

  it('denies a write capability when evaluated as a read', () => {
    expect(evaluateReadPolicy(CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_DISABLE).verdict).toBe('DENY');
  });
});

describe('Compliance PolicyGate (M4 Agent IAM)', () => {
  const principal = {
    humanActorId: 'owner-1',
    appId: 'claude-client',
    agentId: 'agent-1',
    sessionId: 'session-1',
    requestId: 'request-1',
    credentialHolderId: 'github-tool',
    provider: 'anthropic',
  } as const;

  it('exposes the provider-neutral deny-by-default Agent IAM decision', () => {
    expect(evaluateAgentPolicy({
      principal,
      capability: AGENT_CAPABILITIES.PR,
      grantedCapabilities: [AGENT_CAPABILITIES.PR],
      riskClass: 'MEDIUM',
      environment: 'development',
      targetResource: 'github:SvenKulessa/Finance',
    }).verdict).toBe('ALLOW');

    expect(evaluateAgentPolicy({
      principal,
      capability: AGENT_CAPABILITIES.PR,
      grantedCapabilities: [AGENT_CAPABILITIES.COMMIT],
      riskClass: 'MEDIUM',
      environment: 'development',
      targetResource: 'github:SvenKulessa/Finance',
    }).verdict).toBe('DENY');
  });

  it('keeps MERGE outside the agent runtime policy surface', () => {
    expect(evaluateAgentPolicy({
      principal,
      capability: 'MERGE',
      grantedCapabilities: [...Object.values(AGENT_CAPABILITIES)],
      riskClass: 'CRITICAL',
      environment: 'production',
      targetResource: 'github:SvenKulessa/Finance',
    }).verdict).toBe('DENY');
  });
});
