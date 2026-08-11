// ADR-0058 / ESS-0019 — provider-neutral Agent Control Plane authorization.
// This layer does not replace domain-specific grants (for example Supabase capabilities).
// It decides whether an AI execution principal may request a DevelopmentChain capability at all.

export const AGENT_EXECUTION_CAPABILITIES = {
  READ: 'READ',
  ANALYZE: 'ANALYZE',
  PLAN: 'PLAN',
  BRANCH: 'BRANCH',
  COMMIT: 'COMMIT',
  PR: 'PR',
  CI_REQUEST: 'CI_REQUEST',
  DEPLOY_REQUEST: 'DEPLOY_REQUEST',
  PRODUCTION_MUTATION: 'PRODUCTION_MUTATION',
} as const;

export type AgentExecutionCapability =
  typeof AGENT_EXECUTION_CAPABILITIES[keyof typeof AGENT_EXECUTION_CAPABILITIES];

export const AGENT_RISK_CLASSES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type AgentRiskClass = typeof AGENT_RISK_CLASSES[keyof typeof AGENT_RISK_CLASSES];

export interface AgentExecutionPrincipal {
  humanActorId: string;
  clientId: string;
  agentSessionId: string;
  credentialHolderId: string;
  provider?: string;
  model?: string;
}

export interface HumanApprovalEvidence {
  approvedByHumanActorId: string;
  approvalId: string;
  stepUpVerified?: boolean;
}

export interface AgentAuthorizationRequest {
  principal: AgentExecutionPrincipal;
  capability: AgentExecutionCapability | string;
  riskClass: AgentRiskClass;
  grantedCapabilities: readonly AgentExecutionCapability[];
  approval?: HumanApprovalEvidence;
}

export type AgentAuthorizationReason =
  | 'ALLOW'
  | 'INVALID_PRINCIPAL'
  | 'UNKNOWN_CAPABILITY'
  | 'CAPABILITY_NOT_GRANTED'
  | 'RISK_TOO_LOW_FOR_CAPABILITY'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'STEP_UP_REQUIRED'
  | 'SELF_APPROVAL_FORBIDDEN';

export interface AgentAuthorizationDecision {
  allowed: boolean;
  reason: AgentAuthorizationReason;
  effectiveRiskClass: AgentRiskClass;
}

const KNOWN_CAPABILITIES = new Set<string>(Object.values(AGENT_EXECUTION_CAPABILITIES));

const RISK_ORDER: Record<AgentRiskClass, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

const MINIMUM_RISK_BY_CAPABILITY: Partial<Record<AgentExecutionCapability, AgentRiskClass>> = {
  DEPLOY_REQUEST: 'HIGH',
  PRODUCTION_MUTATION: 'CRITICAL',
};

function validPrincipal(principal: AgentExecutionPrincipal): boolean {
  return Boolean(
    principal.humanActorId?.trim() &&
    principal.clientId?.trim() &&
    principal.agentSessionId?.trim() &&
    principal.credentialHolderId?.trim()
  );
}

function maxRisk(left: AgentRiskClass, right: AgentRiskClass): AgentRiskClass {
  return RISK_ORDER[left] >= RISK_ORDER[right] ? left : right;
}

/**
 * Provider-neutral, deny-by-default authorization.
 *
 * Important: MERGE is intentionally not an AgentExecutionCapability. Merge remains a separate
 * Human/Owner-controlled transition enforced by repository governance. An AI client can prepare
 * and validate a PR but cannot obtain a grant that represents MERGE.
 */
export function authorizeAgentAction(request: AgentAuthorizationRequest): AgentAuthorizationDecision {
  const minimumRisk = KNOWN_CAPABILITIES.has(request.capability)
    ? MINIMUM_RISK_BY_CAPABILITY[request.capability as AgentExecutionCapability] ?? request.riskClass
    : request.riskClass;
  const effectiveRiskClass = maxRisk(request.riskClass, minimumRisk);

  if (!validPrincipal(request.principal)) {
    return { allowed: false, reason: 'INVALID_PRINCIPAL', effectiveRiskClass };
  }

  if (!KNOWN_CAPABILITIES.has(request.capability)) {
    return { allowed: false, reason: 'UNKNOWN_CAPABILITY', effectiveRiskClass };
  }

  const capability = request.capability as AgentExecutionCapability;
  if (!request.grantedCapabilities.includes(capability)) {
    return { allowed: false, reason: 'CAPABILITY_NOT_GRANTED', effectiveRiskClass };
  }

  const requiredRisk = MINIMUM_RISK_BY_CAPABILITY[capability];
  if (requiredRisk && RISK_ORDER[request.riskClass] < RISK_ORDER[requiredRisk]) {
    return { allowed: false, reason: 'RISK_TOO_LOW_FOR_CAPABILITY', effectiveRiskClass };
  }

  if (effectiveRiskClass === 'HIGH' || effectiveRiskClass === 'CRITICAL') {
    if (!request.approval?.approvalId?.trim()) {
      return { allowed: false, reason: 'HUMAN_APPROVAL_REQUIRED', effectiveRiskClass };
    }
    if (request.approval.approvedByHumanActorId !== request.principal.humanActorId) {
      return { allowed: false, reason: 'SELF_APPROVAL_FORBIDDEN', effectiveRiskClass };
    }
  }

  if (effectiveRiskClass === 'CRITICAL' && request.approval?.stepUpVerified !== true) {
    return { allowed: false, reason: 'STEP_UP_REQUIRED', effectiveRiskClass };
  }

  return { allowed: true, reason: 'ALLOW', effectiveRiskClass };
}

export function isAgentExecutionCapability(value: string): value is AgentExecutionCapability {
  return KNOWN_CAPABILITIES.has(value);
}
