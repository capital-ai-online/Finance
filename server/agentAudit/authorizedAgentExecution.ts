import {
  evaluateAgentPolicy,
} from '../../src/platform/Compliance/PolicyGate';
import type {
  AgentAuthorizationDecision,
  AgentAuthorizationRequest,
} from '../../src/platform/Security/agentIam';
import {
  writeAgentAuditEvent,
  type AgentAuditEventInput,
  type AgentAuditResult,
} from './agentAuditWriter';

export interface AgentExecutionAuditContext {
  traceId: string;
  spanId?: string;
  policyId: string;
  toolId?: string;
  repository?: string;
  prNumber?: number;
  workflowRunId?: string;
  artifactDigest?: string;
  deploymentId?: string;
  runtimeVersion?: string;
  rollbackReference?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditedAgentAuthorization {
  decision: AgentAuthorizationDecision;
  auditReference: string;
}

export interface AgentExecutionOutcomeInput {
  authorization: Readonly<AuditedAgentAuthorization>;
  request: Readonly<AgentAuthorizationRequest>;
  context: Readonly<AgentExecutionAuditContext>;
  result: Extract<AgentAuditResult, 'SUCCESS' | 'ERROR'>;
  metadata?: Record<string, unknown>;
}

function resultFromDecision(decision: AgentAuthorizationDecision): AgentAuditResult {
  return decision.verdict === 'ALLOW' ? 'PENDING' : 'DENIED';
}

function buildBaseEvent(
  request: Readonly<AgentAuthorizationRequest>,
  context: Readonly<AgentExecutionAuditContext>,
  decision: Readonly<AgentAuthorizationDecision>,
): Omit<AgentAuditEventInput, 'result' | 'metadata'> {
  return {
    requestId: request.principal.requestId,
    traceId: context.traceId,
    spanId: context.spanId,
    humanActorId: request.principal.humanActorId,
    appId: request.principal.appId,
    agentId: request.principal.agentId,
    provider: request.principal.provider,
    model: request.principal.model,
    capability: decision.capability ?? request.capability,
    riskClass: decision.riskClass,
    policyId: context.policyId,
    decision: decision.verdict,
    approvalId: request.approval?.approvalId,
    toolId: context.toolId,
    repository: context.repository,
    prNumber: context.prNumber,
    workflowRunId: context.workflowRunId,
    artifactDigest: context.artifactDigest,
    deploymentId: context.deploymentId,
    runtimeVersion: context.runtimeVersion,
    rollbackReference: context.rollbackReference,
  };
}

/**
 * Canonical server-side M5 entry point for agent authorization decisions.
 *
 * Authorization remains provider-neutral in PolicyGate. This server adapter persists the decision
 * as immutable ADR-0059 evidence and returns an auditReference for operational telemetry. Durable
 * audit failure is fail-closed: callers receive an exception instead of an unaudited authorization.
 */
export async function evaluateAndAuditAgentPolicy(
  request: Readonly<AgentAuthorizationRequest>,
  context: Readonly<AgentExecutionAuditContext>,
): Promise<AuditedAgentAuthorization> {
  const decision = evaluateAgentPolicy(request);

  const auditReference = await writeAgentAuditEvent({
    ...buildBaseEvent(request, context, decision),
    result: resultFromDecision(decision),
    metadata: {
      ...context.metadata,
      eventType: 'authorization',
      authorizationReason: decision.reason,
      environment: request.environment,
      targetResource: request.targetResource,
      sessionId: request.principal.sessionId,
      credentialHolderId: request.principal.credentialHolderId,
    },
  });

  return { decision, auditReference };
}

/**
 * Records the terminal SUCCESS/ERROR state as a second append-only event.
 *
 * The durable store must never be UPDATEd to complete an execution. The outcome instead keeps the
 * same request/trace/principal/policy correlation and points back to the authorization event. This
 * preserves append-only evidence while making authorization -> execution result reconstructable.
 */
export async function recordAgentExecutionOutcome(
  input: Readonly<AgentExecutionOutcomeInput>,
): Promise<string> {
  if (input.authorization.decision.verdict !== 'ALLOW') {
    throw new Error('[AgentAudit][SECURITY] execution outcome cannot be recorded for a denied authorization.');
  }
  if (!input.authorization.auditReference?.trim()) {
    throw new Error('[AgentAudit][SECURITY] authorization auditReference is required for execution outcome.');
  }

  return writeAgentAuditEvent({
    ...buildBaseEvent(input.request, input.context, input.authorization.decision),
    result: input.result,
    metadata: {
      ...input.context.metadata,
      ...input.metadata,
      eventType: 'execution_outcome',
      authorizationAuditReference: input.authorization.auditReference,
      environment: input.request.environment,
      targetResource: input.request.targetResource,
    },
  });
}
