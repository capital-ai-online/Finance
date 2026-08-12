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

function resultFromDecision(decision: AgentAuthorizationDecision): AgentAuditResult {
  return decision.verdict === 'ALLOW' ? 'PENDING' : 'DENIED';
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
  const capability = decision.capability ?? request.capability;

  const event: AgentAuditEventInput = {
    requestId: request.principal.requestId,
    traceId: context.traceId,
    spanId: context.spanId,
    humanActorId: request.principal.humanActorId,
    appId: request.principal.appId,
    agentId: request.principal.agentId,
    provider: request.principal.provider,
    model: request.principal.model,
    capability,
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
    result: resultFromDecision(decision),
    rollbackReference: context.rollbackReference,
    metadata: {
      ...context.metadata,
      authorizationReason: decision.reason,
      environment: request.environment,
      targetResource: request.targetResource,
      sessionId: request.principal.sessionId,
      credentialHolderId: request.principal.credentialHolderId,
    },
  };

  const auditReference = await writeAgentAuditEvent(event);
  return { decision, auditReference };
}
