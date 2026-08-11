// ESS-0019 / ADR-0058 / M4: provider-neutral Agent Control Plane authorization contract.
// This layer is intentionally independent from provider names and from the Supabase-specific
// capability_grants implementation in capabilities.ts. It governs DevelopmentChain actions.

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

export type AgentRiskClass = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AgentPrincipal {
  /** Authenticated human on whose behalf the agent acts. */
  humanActorId: string;
  /** Stable application/client identity, e.g. chatgpt, claude-code, internal-control-plane. */
  appId: string;
  /** Stable logical agent identity, independent from model/provider. */
  agentId: string;
  /** Execution/session correlation identifier. */
  sessionId: string;
  /** Informational metadata only; MUST NOT grant authority. */
  provider?: string;
  model?: string;
}

export interface AgentAuthorizationRequest {
  principal: AgentPrincipal;
  capability: AgentExecutionCapability | string;
  grantedCapabilities: readonly AgentExecutionCapability[];
  explicitApproval?: boolean;
  stepUpVerified?: boolean;
}

export interface AgentAuthorizationDecision {
  verdict: 'ALLOW' | 'DENY';
  riskClass: AgentRiskClass;
  reason: string;
}

const CAPABILITY_RISK: Readonly<Record<AgentExecutionCapability, AgentRiskClass>> = {
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

const KNOWN_CAPABILITIES: ReadonlySet<string> = new Set(Object.values(AGENT_EXECUTION_CAPABILITIES));

export const HUMAN_ONLY_TRANSITIONS = ['MERGE'] as const;

export function isAgentExecutionCapability(value: string): value is AgentExecutionCapability {
  return KNOWN_CAPABILITIES.has(value);
}

export function riskClassForCapability(capability: AgentExecutionCapability): AgentRiskClass {
  return CAPABILITY_RISK[capability];
}

function hasCompletePrincipal(principal: AgentPrincipal): boolean {
  return [principal.humanActorId, principal.appId, principal.agentId, principal.sessionId]
    .every((value) => typeof value === 'string' && value.trim().length > 0);
}

/**
 * Deterministic, fail-closed authorization decision for provider-neutral agent execution.
 *
 * Security invariants:
 * - provider/model metadata never grants authority;
 * - unknown capabilities (including MERGE) are denied;
 * - the requested capability must be explicitly granted;
 * - HIGH/CRITICAL actions require explicit approval;
 * - CRITICAL production mutation additionally requires step-up verification;
 * - MERGE remains a human-only transition enforced by repository governance.
 */
export function authorizeAgentExecution(request: AgentAuthorizationRequest): AgentAuthorizationDecision {
  if (!hasCompletePrincipal(request.principal)) {
    return { verdict: 'DENY', riskClass: 'CRITICAL', reason: 'Unvollständige Agent-Principal-Bindung.' };
  }

  if (!isAgentExecutionCapability(request.capability)) {
    return { verdict: 'DENY', riskClass: 'CRITICAL', reason: `Unbekannte oder nicht delegierbare Capability: ${request.capability}.` };
  }

  const riskClass = riskClassForCapability(request.capability);

  if (!request.grantedCapabilities.includes(request.capability)) {
    return { verdict: 'DENY', riskClass, reason: `Capability ${request.capability} wurde nicht explizit gewährt.` };
  }

  if ((riskClass === 'HIGH' || riskClass === 'CRITICAL') && request.explicitApproval !== true) {
    return { verdict: 'DENY', riskClass, reason: `${riskClass}-Aktion benötigt eine explizite Freigabe.` };
  }

  if (riskClass === 'CRITICAL' && request.stepUpVerified !== true) {
    return { verdict: 'DENY', riskClass, reason: 'CRITICAL-Aktion benötigt zusätzlich verifiziertes Step-up.' };
  }

  return { verdict: 'ALLOW', riskClass, reason: 'Principal, Grant und risikobasierte Freigaben sind erfüllt.' };
}
