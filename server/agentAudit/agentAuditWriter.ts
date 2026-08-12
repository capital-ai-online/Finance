import { getPrivilegedServerSupabase } from '../db';
import { redactTelemetryValue } from '../../src/platform/Telemetry/redaction';

const OMITTED = '[OMITTED]';
const PROHIBITED_PAYLOAD_KEY = /(^|[_-])(prompt|full[_-]?prompt|diff|full[_-]?diff|raw[_-]?(body|request|response)|request[_-]?body|response[_-]?body)($|[_-])/i;
const AUDIT_REFERENCE_KEY = 'authorizationAuditReference';
const AUDIT_REFERENCE_VALUE = /^supabase:agent_audit_events:[A-Za-z0-9_-]+$/;

export type AgentAuditDecision = 'ALLOW' | 'DENY';
export type AgentAuditResult = 'SUCCESS' | 'DENIED' | 'ERROR' | 'PENDING';

export interface AgentAuditEventInput {
  requestId: string;
  traceId: string;
  spanId?: string;
  humanActorId: string;
  appId: string;
  agentId: string;
  provider?: string;
  model?: string;
  capability: string;
  riskClass: string;
  policyId: string;
  decision: AgentAuditDecision;
  approvalId?: string;
  toolId?: string;
  repository?: string;
  prNumber?: number;
  workflowRunId?: string;
  artifactDigest?: string;
  deploymentId?: string;
  runtimeVersion?: string;
  result: AgentAuditResult;
  rollbackReference?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

function requireNonEmpty(name: string, value: string): string {
  const clean = value?.trim();
  if (!clean) throw new Error(`[AgentAudit][SECURITY] ${name} is required.`);
  return clean;
}

function omitProhibitedPayloads(value: unknown, key = ''): unknown {
  if (PROHIBITED_PAYLOAD_KEY.test(key)) return OMITTED;
  if (Array.isArray(value)) return value.map(item => omitProhibitedPayloads(item));
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      output[childKey] = omitProhibitedPayloads(childValue, childKey);
    }
    return output;
  }
  return value;
}

function redactAgentAuditValue(value: unknown, key = ''): unknown {
  if (key === AUDIT_REFERENCE_KEY) {
    return typeof value === 'string' && AUDIT_REFERENCE_VALUE.test(value)
      ? value
      : '[REDACTED]';
  }
  if (Array.isArray(value)) return value.map(item => redactAgentAuditValue(item));
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      output[childKey] = redactAgentAuditValue(childValue, childKey);
    }
    return output;
  }
  return redactTelemetryValue(value, key);
}

export function sanitizeAgentAuditMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  if (!metadata) return {};
  const withoutPayloads = omitProhibitedPayloads(metadata) as Record<string, unknown>;
  return redactAgentAuditValue(withoutPayloads) as Record<string, unknown>;
}

/**
 * ADR-0059 durable audit writer.
 *
 * The privileged Supabase client is intentionally server-only. The database table itself is
 * append-only and grants service_role only SELECT + INSERT. Any persistence error is propagated
 * so a caller cannot silently claim durable audit evidence that was never written.
 */
export async function writeAgentAuditEvent(input: Readonly<AgentAuditEventInput>): Promise<string> {
  const row = {
    occurred_at: input.occurredAt ?? new Date().toISOString(),
    request_id: requireNonEmpty('requestId', input.requestId),
    trace_id: requireNonEmpty('traceId', input.traceId),
    span_id: input.spanId?.trim() || null,
    actor_id: requireNonEmpty('humanActorId', input.humanActorId),
    app_id: requireNonEmpty('appId', input.appId),
    agent_id: requireNonEmpty('agentId', input.agentId),
    provider: input.provider?.trim() || null,
    model: input.model?.trim() || null,
    capability: requireNonEmpty('capability', input.capability),
    risk_class: requireNonEmpty('riskClass', input.riskClass),
    policy_id: requireNonEmpty('policyId', input.policyId),
    decision: input.decision,
    approval_id: input.approvalId?.trim() || null,
    tool_id: input.toolId?.trim() || null,
    repository: input.repository?.trim() || null,
    pr_number: input.prNumber ?? null,
    workflow_run_id: input.workflowRunId?.trim() || null,
    artifact_digest: input.artifactDigest?.trim() || null,
    deployment_id: input.deploymentId?.trim() || null,
    runtime_version: input.runtimeVersion?.trim() || null,
    result: input.result,
    rollback_reference: input.rollbackReference?.trim() || null,
    metadata: sanitizeAgentAuditMetadata(input.metadata),
  };

  const supabase = getPrivilegedServerSupabase();
  const { data, error } = await supabase
    .from('agent_audit_events')
    .insert(row)
    .select('id')
    .single();

  if (error || !data?.id) {
    const detail = error?.message || 'insert returned no audit id';
    throw new Error(`[AgentAudit][SECURITY] durable audit persistence failed: ${detail}`);
  }

  return `supabase:agent_audit_events:${data.id}`;
}
