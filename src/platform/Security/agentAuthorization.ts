// ESS-0019 / ADR-0058 — provider-neutral Agent IAM authorization core.
// This layer sits above provider-specific tooling and existing ESS-0018 Supabase grants.
// It never grants a provider or model implicit trust and is intentionally deny-by-default.

export const AGENT_CAPABILITIES = [
  'READ',
  'ANALYZE',
  'PLAN',
  'BRANCH',
  'COMMIT',
  'PR',
  'CI_REQUEST',
  'DEPLOY_REQUEST',
  'PRODUCTION_MUTATION',
] as const;

export type AgentCapability = (typeof AGENT_CAPABILITIES)[number];
export type AgentRiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AgentIdentityContext {
  humanActorId: string;
  appId: string;
  agentId: string;
  sessionId: string;
  toolCredentialHolderId: string;
  provider?: string;
  model?: string;
}

export interface AgentApprovalArtifact {
  approvedByHumanActorId: string;
  subjectAgentId: string;
  capability: AgentCapability;
  stepUpVerified: boolean;
  expiresAt: string;
}

export interface AgentAuthorizationRequest {
  identity: AgentIdentityContext;
  capability: AgentCapability;
  grantedCapabilities: readonly AgentCapability[];
  approval?: AgentApprovalArtifact | null;
}

export interface AgentAuthorizationDecision {
  allowed: boolean;
  riskClass: AgentRiskClass;
  reason:
    | 'ALLOW'
    | 'INVALID_IDENTITY'
    | 'UNKNOWN_CAPABILITY'
    | 'CAPABILITY_NOT_GRANTED'
    | 'HUMAN_APPROVAL_REQUIRED'
    | 'SELF_APPROVAL_FORBIDDEN'
    | 'APPROVAL_HUMAN_ACTOR_MISMATCH'
    | 'APPROVAL_SUBJECT_MISMATCH'
    | 'APPROVAL_CAPABILITY_MISMATCH'
    | 'APPROVAL_EXPIRED'
    | 'STEP_UP_REQUIRED';
}

const CAPABILITY_RISK: Readonly<Record<AgentCapability, AgentRiskClass>> = {
  READ: 'LOW',
  ANALYZE: 'LOW',
  PLAN: 'MEDIUM',
  BRANCH: 'MEDIUM',
  COMMIT: 'HIGH',
  PR: 'HIGH',
  CI_REQUEST: 'HIGH',
  DEPLOY_REQUEST: 'HIGH',
  PRODUCTION_MUTATION: 'CRITICAL',
};

const HIGH_RISK = new Set<AgentRiskClass>(['HIGH', 'CRITICAL']);

export function isAgentCapability(value: string): value is AgentCapability {
  return (AGENT_CAPABILITIES as readonly string[]).includes(value);
}

export function getAgentCapabilityRisk(capability: AgentCapability): AgentRiskClass {
  return CAPABILITY_RISK[capability];
}

export function isCompleteAgentIdentity(identity: AgentIdentityContext): boolean {
  return [
    identity.humanActorId,
    identity.appId,
    identity.agentId,
    identity.sessionId,
    identity.toolCredentialHolderId,
  ].every((value) => typeof value === 'string' && value.trim().length > 0);
}

/**
 * MERGE is deliberately not an AgentCapability. It is a Human/Owner-controlled transition
 * governed by HUMAN_OWNER_PR_APPROVAL_POLICY.md and therefore cannot be granted to an agent.
 */
export function isHumanOnlyTransition(action: string): boolean {
  return action === 'MERGE';
}

export function authorizeAgentCapability(
  request: AgentAuthorizationRequest,
  now: Date = new Date(),
): AgentAuthorizationDecision {
  const riskClass = getAgentCapabilityRisk(request.capability);

  if (!isCompleteAgentIdentity(request.identity)) {
    return { allowed: false, riskClass, reason: 'INVALID_IDENTITY' };
  }

  if (!isAgentCapability(request.capability)) {
    return { allowed: false, riskClass, reason: 'UNKNOWN_CAPABILITY' };
  }

  if (!request.grantedCapabilities.includes(request.capability)) {
    return { allowed: false, riskClass, reason: 'CAPABILITY_NOT_GRANTED' };
  }

  if (!HIGH_RISK.has(riskClass)) {
    return { allowed: true, riskClass, reason: 'ALLOW' };
  }

  const approval = request.approval;
  if (!approval) {
    return { allowed: false, riskClass, reason: 'HUMAN_APPROVAL_REQUIRED' };
  }

  if (approval.approvedByHumanActorId === request.identity.agentId) {
    return { allowed: false, riskClass, reason: 'SELF_APPROVAL_FORBIDDEN' };
  }

  if (approval.approvedByHumanActorId !== request.identity.humanActorId) {
    return { allowed: false, riskClass, reason: 'APPROVAL_HUMAN_ACTOR_MISMATCH' };
  }

  if (approval.subjectAgentId !== request.identity.agentId) {
    return { allowed: false, riskClass, reason: 'APPROVAL_SUBJECT_MISMATCH' };
  }

  if (approval.capability !== request.capability) {
    return { allowed: false, riskClass, reason: 'APPROVAL_CAPABILITY_MISMATCH' };
  }

  const expiresAt = Date.parse(approval.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= now.getTime()) {
    return { allowed: false, riskClass, reason: 'APPROVAL_EXPIRED' };
  }

  if (riskClass === 'CRITICAL' && !approval.stepUpVerified) {
    return { allowed: false, riskClass, reason: 'STEP_UP_REQUIRED' };
  }

  return { allowed: true, riskClass, reason: 'ALLOW' };
}
