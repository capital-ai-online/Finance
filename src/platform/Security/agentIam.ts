// ESS-0019 / ADR-0058: provider-neutral Agent IAM contract.
// Provider/model metadata is deliberately non-authoritative. Authorization is based on an
// attributable principal, an explicit capability grant, target/environment context and risk.

export const AGENT_CAPABILITIES = {
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

export type AgentCapability = typeof AGENT_CAPABILITIES[keyof typeof AGENT_CAPABILITIES];
export type AgentRiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AgentEnvironment = 'development' | 'staging' | 'production';

const KNOWN_CAPABILITIES: ReadonlySet<string> = new Set(Object.values(AGENT_CAPABILITIES));
const MUTATING_CAPABILITIES: ReadonlySet<AgentCapability> = new Set([
  AGENT_CAPABILITIES.BRANCH,
  AGENT_CAPABILITIES.COMMIT,
  AGENT_CAPABILITIES.PR,
  AGENT_CAPABILITIES.CI_REQUEST,
  AGENT_CAPABILITIES.DEPLOY_REQUEST,
  AGENT_CAPABILITIES.PRODUCTION_MUTATION,
]);

const RISK_ORDER: Readonly<Record<AgentRiskClass, number>> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

const MINIMUM_RISK_BY_CAPABILITY: Readonly<Record<AgentCapability, AgentRiskClass>> = {
  READ: 'LOW',
  ANALYZE: 'LOW',
  PLAN: 'LOW',
  BRANCH: 'MEDIUM',
  COMMIT: 'MEDIUM',
  PR: 'MEDIUM',
  CI_REQUEST: 'MEDIUM',
  DEPLOY_REQUEST: 'HIGH',
  PRODUCTION_MUTATION: 'CRITICAL',
};

export interface AgentPrincipalContext {
  humanActorId: string;
  appId: string;
  agentId: string;
  sessionId: string;
  requestId: string;
  credentialHolderId: string;
  provider?: string;
  model?: string;
}

export interface AgentApprovalEvidence {
  approvalId: string;
  approvedByHumanActorId: string;
  capability: AgentCapability;
  targetResource: string;
  expiresAt: string;
  stepUpVerified: boolean;
}

export interface AgentAuthorizationRequest {
  principal: Readonly<AgentPrincipalContext>;
  capability: string;
  grantedCapabilities: readonly AgentCapability[];
  /** Contextual risk may elevate, but never lower, the canonical capability minimum. */
  riskClass: AgentRiskClass;
  environment: AgentEnvironment;
  targetResource: string;
  approval?: Readonly<AgentApprovalEvidence>;
  killSwitchActive?: boolean;
}

export type AgentAuthorizationDecision =
  | { verdict: 'ALLOW'; reason: string; capability: AgentCapability; riskClass: AgentRiskClass }
  | { verdict: 'DENY'; reason: string; capability?: AgentCapability; riskClass: AgentRiskClass };

export function isKnownAgentCapability(value: string): value is AgentCapability {
  return KNOWN_CAPABILITIES.has(value);
}

export function minimumRiskForCapability(capability: AgentCapability): AgentRiskClass {
  return MINIMUM_RISK_BY_CAPABILITY[capability];
}

function effectiveRiskFor(capability: AgentCapability, contextualRisk: AgentRiskClass): AgentRiskClass {
  const minimum = MINIMUM_RISK_BY_CAPABILITY[capability];
  return RISK_ORDER[contextualRisk] >= RISK_ORDER[minimum] ? contextualRisk : minimum;
}

function hasCompletePrincipal(principal: Readonly<AgentPrincipalContext>): boolean {
  return [
    principal.humanActorId,
    principal.appId,
    principal.agentId,
    principal.sessionId,
    principal.requestId,
    principal.credentialHolderId,
  ].every(value => typeof value === 'string' && value.trim().length > 0);
}

function deny(reason: string, riskClass: AgentRiskClass, capability?: AgentCapability): AgentAuthorizationDecision {
  return { verdict: 'DENY', reason, riskClass, ...(capability ? { capability } : {}) };
}

/**
 * Deny-by-default authorization for provider-neutral agent execution.
 *
 * There is deliberately no MERGE capability. A string such as "MERGE" is therefore unknown and
 * denied. Human/Owner merge authorization remains outside the agent runtime capability model.
 */
export function evaluateAgentAuthorization(request: Readonly<AgentAuthorizationRequest>): AgentAuthorizationDecision {
  if (!hasCompletePrincipal(request.principal)) {
    return deny('Principal-Kontext ist unvollständig; Attribution ist verpflichtend.', request.riskClass);
  }

  if (!isKnownAgentCapability(request.capability)) {
    return deny(`Unbekannte oder nicht agentisch freigegebene Capability: ${request.capability}.`, request.riskClass);
  }
  const capability = request.capability;
  const effectiveRisk = effectiveRiskFor(capability, request.riskClass);

  if (!request.targetResource || !request.targetResource.trim()) {
    return deny('Zielressource fehlt.', effectiveRisk, capability);
  }

  if (!request.grantedCapabilities.includes(capability)) {
    return deny(`Capability ${capability} wurde dem Principal nicht explizit gewährt.`, effectiveRisk, capability);
  }

  if (request.killSwitchActive && MUTATING_CAPABILITIES.has(capability)) {
    return deny('Agent-Kill-Switch ist aktiv; mutierende Capability wird verweigert.', effectiveRisk, capability);
  }

  if (request.environment === 'development' && capability === AGENT_CAPABILITIES.PRODUCTION_MUTATION) {
    return deny('Development-Principal darf keine Production-Mutation ausführen.', effectiveRisk, capability);
  }

  if (effectiveRisk === 'HIGH' || effectiveRisk === 'CRITICAL') {
    const approval = request.approval;
    if (!approval) {
      return deny(`${effectiveRisk}-Aktion benötigt explizite Human-/Step-up-Evidence.`, effectiveRisk, capability);
    }
    if (
      !approval.approvalId ||
      approval.approvedByHumanActorId !== request.principal.humanActorId ||
      approval.capability !== capability ||
      approval.targetResource !== request.targetResource
    ) {
      return deny('Approval-Evidence ist nicht exakt an Actor, Capability und Ziel gebunden.', effectiveRisk, capability);
    }
    if (
      approval.approvedByHumanActorId === request.principal.agentId ||
      approval.approvedByHumanActorId === request.principal.appId ||
      approval.approvedByHumanActorId === request.principal.credentialHolderId
    ) {
      return deny('Agent/App/Credential-Principal darf sich nicht selbst freigeben.', effectiveRisk, capability);
    }
    const expiresAtMs = Date.parse(approval.expiresAt);
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
      return deny('Approval-Evidence ist abgelaufen oder ungültig.', effectiveRisk, capability);
    }
    if (!approval.stepUpVerified) {
      return deny(`${effectiveRisk}-Aktion benötigt verifizierte Step-up-Evidence.`, effectiveRisk, capability);
    }
  }

  return {
    verdict: 'ALLOW',
    reason: 'Explizite Capability, vollständige Attribution und risikoadäquate Evidence sind vorhanden.',
    capability,
    riskClass: effectiveRisk,
  };
}
