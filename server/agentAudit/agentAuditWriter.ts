import { getPrivilegedServerSupabase } from '../db';
import { redactTelemetryValue } from '../../src/platform/Telemetry/redaction';

const OMITTED = '[OMITTED]';
const PROHIBITED_PAYLOAD_KEY = /(^|[_-])(prompt|full[_-]?prompt|diff|full[_-]?diff|raw[_-]?(body|request|response)|request[_-]?body|response[_-]?body)($|[_-])/i;
const AUDIT_REFERENCE_KEY = 'authorizationAuditReference';
const AUDIT_REFERENCE_VALUE = /^supabase:agent_audit_events:[A-Za-z0-9_-]+$/;
const UUID_VALUE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  intent: string;
  scope: Record<string, unknown>;
  capability: string;
  riskClass: string;
  policyId: string;
  policyVersion?: string;
  decision: AgentAuditDecision;
  approvalId?: string;
  stepUpReference?: string;
  toolId?: string;
  repository?: string;
  branch?: string;
  commitSha?: string;
  prNumber?: number;
  workflowRunId?: string;
  artifactDigest?: string;
  deploymentId?: string;
  runtimeVersion?: string;
  result: AgentAuditResult;
  errorCode?: string;
  rollbackReference?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

function requireNonEmpty(name: string, value: string): string {
  const clean = value?.trim();
  if (!clean) throw new Error(`[AgentAudit][SECURITY] ${name} is required.`);
  return clean;
}

function optionalText(value?: string): string | null {
  return value?.trim() || null;
}

function optionalUuid(value?: string): string | null {
  const clean = value?.trim();
  return clean && UUID_VALUE.test(clean) ? clean : null;
}

/**
 * Same camelCase-boundary fix as src/platform/Telemetry/redaction.ts's normalizeKeyForMatching
 * (M9 Secret/Exfiltration drill finding, 2026-08-16): PROHIBITED_PAYLOAD_KEY anchors on
 * `[_-]`/string-boundary, so a prefixed key like `fullRequestBody` would otherwise slip past
 * unredacted while `full_request_body` would not.
 */
function normalizeKeyForMatching(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
}

function omitProhibitedPayloads(value: unknown, key = ''): unknown {
  if (PROHIBITED_PAYLOAD_KEY.test(normalizeKeyForMatching(key))) return OMITTED;
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
 * The privileged Supabase client is intentionally server-only. The production schema is owned by
 * `20260811230540_m5_agent_audit_events.sql`; this adapter must map to that contract exactly rather
 * than inventing application-only column aliases. The table itself is append-only and grants
 * service_role only SELECT + INSERT. Any persistence error is propagated so a caller cannot
 * silently claim durable audit evidence that was never written.
 *
 * `humanActorId`, `approvalId` and `stepUpReference` may originate in external control planes.
 * UUID-valued identifiers are mapped to the corresponding database UUID columns. Non-UUID values
 * are never coerced or fabricated; they remain attributable in sanitized `attributes` instead.
 */
export async function writeAgentAuditEvent(input: Readonly<AgentAuditEventInput>): Promise<string> {
  const humanActorUuid = optionalUuid(input.humanActorId);
  const approvalUuid = optionalUuid(input.approvalId);
  const stepUpUuid = optionalUuid(input.stepUpReference);
  const attributes = sanitizeAgentAuditMetadata({
    ...input.metadata,
    ...(!humanActorUuid ? { humanActorExternalId: input.humanActorId } : {}),
    ...(input.approvalId && !approvalUuid ? { approvalExternalId: input.approvalId } : {}),
    ...(input.stepUpReference && !stepUpUuid ? { stepUpExternalId: input.stepUpReference } : {}),
  });

  const row = {
    occurred_at: input.occurredAt ?? new Date().toISOString(),
    request_id: requireNonEmpty('requestId', input.requestId),
    trace_id: requireNonEmpty('traceId', input.traceId),
    span_id: optionalText(input.spanId),
    human_actor_id: humanActorUuid,
    app_id: requireNonEmpty('appId', input.appId),
    agent_id: requireNonEmpty('agentId', input.agentId),
    provider: optionalText(input.provider),
    model: optionalText(input.model),
    intent: requireNonEmpty('intent', input.intent),
    scope: sanitizeAgentAuditMetadata(input.scope),
    capability: requireNonEmpty('capability', input.capability),
    risk_class: requireNonEmpty('riskClass', input.riskClass),
    policy_id: requireNonEmpty('policyId', input.policyId),
    policy_version: optionalText(input.policyVersion),
    authorization_decision: input.decision,
    approval_reference: approvalUuid,
    step_up_reference: stepUpUuid,
    tool_name: optionalText(input.toolId),
    repository: optionalText(input.repository),
    branch: optionalText(input.branch),
    commit_sha: optionalText(input.commitSha),
    pull_request_number: input.prNumber ?? null,
    ci_run_id: optionalText(input.workflowRunId),
    artifact_digest: optionalText(input.artifactDigest),
    deployment_id: optionalText(input.deploymentId),
    runtime_version: optionalText(input.runtimeVersion),
    result: input.result,
    error_code: optionalText(input.errorCode),
    rollback_reference: optionalText(input.rollbackReference),
    attributes: attributes,
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
