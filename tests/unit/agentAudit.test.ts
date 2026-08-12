import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AGENT_CAPABILITIES, type AgentAuthorizationRequest } from '../../src/platform/Security/agentIam';

const mocks = vi.hoisted(() => {
  const single = vi.fn();
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn((_payload: Record<string, unknown>) => ({ select }));
  const from = vi.fn(() => ({ insert }));
  const getPrivilegedServerSupabase = vi.fn(() => ({ from }));
  return { single, select, insert, from, getPrivilegedServerSupabase };
});

vi.mock('../../server/db', () => ({
  getPrivilegedServerSupabase: mocks.getPrivilegedServerSupabase,
}));

import {
  sanitizeAgentAuditMetadata,
  writeAgentAuditEvent,
} from '../../server/agentAudit/agentAuditWriter';
import {
  evaluateAndAuditAgentPolicy,
  recordAgentExecutionOutcome,
} from '../../server/agentAudit/authorizedAgentExecution';

const baseEvent = {
  requestId: 'request-1',
  traceId: '0123456789abcdef0123456789abcdef',
  spanId: '0123456789abcdef',
  humanActorId: 'owner-1',
  appId: 'chatgpt-client',
  agentId: 'agent-1',
  provider: 'openai',
  model: 'metadata-only',
  capability: 'READ',
  riskClass: 'LOW',
  policyId: 'ADR-0059',
  decision: 'ALLOW' as const,
  repository: 'SvenKulessa/Finance',
  result: 'PENDING' as const,
};

function agentRequest(): AgentAuthorizationRequest {
  return {
    principal: {
      humanActorId: 'owner-1',
      appId: 'chatgpt-client',
      agentId: 'agent-1',
      sessionId: 'session-1',
      requestId: 'request-1',
      credentialHolderId: 'github-tool-identity',
      provider: 'openai',
      model: 'metadata-only',
    },
    capability: AGENT_CAPABILITIES.READ,
    grantedCapabilities: [AGENT_CAPABILITIES.READ],
    riskClass: 'LOW',
    environment: 'production',
    targetResource: 'github:SvenKulessa/Finance',
  };
}

const auditContext = {
  traceId: baseEvent.traceId,
  spanId: baseEvent.spanId,
  policyId: 'ADR-0058/0059',
  toolId: 'github.read',
  repository: 'SvenKulessa/Finance',
  prNumber: 210,
  runtimeVersion: '0.6.0',
  metadata: { prompt: 'must never persist', purpose: 'roadmap-evidence' },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.single.mockResolvedValue({ data: { id: 'audit-123' }, error: null });
});

describe('M5 agent audit writer', () => {
  it('redacts secrets/PII and omits prohibited prompt/diff/raw-body payloads', () => {
    const sanitized = sanitizeAgentAuditMetadata({
      authorization: 'Bearer super-secret-token',
      email: 'owner@example.com',
      prompt: 'complete private prompt',
      diff: '+ secret code',
      request_body: { password: 'pw', safe: 'kept' },
      safe: { label: 'retained' },
    });

    expect(sanitized).toEqual({
      authorization: '[REDACTED]',
      email: '[REDACTED]',
      prompt: '[OMITTED]',
      diff: '[OMITTED]',
      request_body: '[OMITTED]',
      safe: { label: 'retained' },
    });
  });

  it('persists complete correlation metadata and returns an auditReference', async () => {
    const reference = await writeAgentAuditEvent({
      ...baseEvent,
      workflowRunId: '31550995195',
      runtimeVersion: '0.6.0',
      metadata: { authorization: 'Bearer hidden', safe: 'visible' },
    });

    expect(reference).toBe('supabase:agent_audit_events:audit-123');
    expect(mocks.from).toHaveBeenCalledWith('agent_audit_events');
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      request_id: baseEvent.requestId,
      trace_id: baseEvent.traceId,
      span_id: baseEvent.spanId,
      actor_id: baseEvent.humanActorId,
      app_id: baseEvent.appId,
      agent_id: baseEvent.agentId,
      capability: 'READ',
      risk_class: 'LOW',
      policy_id: 'ADR-0059',
      repository: 'SvenKulessa/Finance',
      workflow_run_id: '31550995195',
      metadata: { authorization: '[REDACTED]', safe: 'visible' },
    }));
  });

  it('fails closed when durable audit persistence fails', async () => {
    mocks.single.mockResolvedValue({ data: null, error: { message: 'database unavailable' } });

    await expect(writeAgentAuditEvent(baseEvent))
      .rejects.toThrow('durable audit persistence failed: database unavailable');
  });

  it('audits authorization and terminal outcome as two correlated append-only events', async () => {
    mocks.single
      .mockResolvedValueOnce({ data: { id: 'auth-1' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'outcome-1' }, error: null });

    const request = agentRequest();
    const authorization = await evaluateAndAuditAgentPolicy(request, auditContext);
    const outcomeReference = await recordAgentExecutionOutcome({
      authorization,
      request,
      context: auditContext,
      result: 'SUCCESS',
      metadata: { response_body: { should: 'not persist' }, operation: 'repository-read' },
    });

    expect(authorization.decision).toMatchObject({ verdict: 'ALLOW', capability: 'READ', riskClass: 'LOW' });
    expect(authorization.auditReference).toBe('supabase:agent_audit_events:auth-1');
    expect(outcomeReference).toBe('supabase:agent_audit_events:outcome-1');
    expect(mocks.insert).toHaveBeenCalledTimes(2);

    expect(mocks.insert.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
      request_id: 'request-1',
      trace_id: baseEvent.traceId,
      decision: 'ALLOW',
      result: 'PENDING',
      tool_id: 'github.read',
      pr_number: 210,
      metadata: expect.objectContaining({
        eventType: 'authorization',
        prompt: '[OMITTED]',
        environment: 'production',
      }),
    }));

    expect(mocks.insert.mock.calls[1]?.[0]).toEqual(expect.objectContaining({
      request_id: 'request-1',
      trace_id: baseEvent.traceId,
      decision: 'ALLOW',
      result: 'SUCCESS',
      metadata: expect.objectContaining({
        eventType: 'execution_outcome',
        authorizationAuditReference: 'supabase:agent_audit_events:auth-1',
        prompt: '[OMITTED]',
        response_body: '[OMITTED]',
        operation: 'repository-read',
      }),
    }));
  });

  it('refuses an outcome for a denied authorization', async () => {
    const denied = await evaluateAndAuditAgentPolicy({
      ...agentRequest(),
      grantedCapabilities: [],
    }, auditContext);

    await expect(recordAgentExecutionOutcome({
      authorization: denied,
      request: agentRequest(),
      context: auditContext,
      result: 'SUCCESS',
    })).rejects.toThrow('cannot be recorded for a denied authorization');
  });
});
