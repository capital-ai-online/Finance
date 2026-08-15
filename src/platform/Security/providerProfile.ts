import {
  AGENT_CAPABILITIES,
  evaluateAgentAuthorization,
  isKnownAgentCapability,
  type AgentAuthorizationDecision,
  type AgentCapability,
  type AgentEnvironment,
  type AgentPrincipalContext,
  type AgentApprovalEvidence,
  type AgentRiskClass,
} from './agentIam';

// M8 (Agent Cutover, ADR-0062, docs/runbooks/M8_AGENT_CUTOVER.md, ESS-0019,
// docs/architecture/ai-agent/AI_AGENT_PROVIDER_PROFILE_CONTRACT.md). Provider-neutral Control
// Plane, Phase 1 (Provider Profile Implementation). Composes with - never replaces - the M4
// evaluateAgentAuthorization kernel, exactly the way roadmapExecutionMandate.ts (SA1) already
// does for the Systemadmin agent. A provider profile can only narrow the capability surface an
// appId may request; it can never grant a capability agentIam.ts itself would deny.
//
// M8 Phase 0 found that this pattern is already proven end-to-end for exactly one provider/
// transport (GitHub Actions OIDC host, Systemadmin agent, BRANCH capability). ChatGPT, Google AI
// Studio and NotebookLM had no code-level profile at all before this module - only prose in the
// Provider Profile Contract doc. Phase 0 also found the single largest bypass: a live interactive
// session's own MCP tool calls (this session included) are not mediated by agentIam.ts at all -
// that tool grant comes from the outer CCR/session runtime, not from anything in this repository,
// so this module cannot close it by itself (see docs/evidence/m8/M8_PHASE0_PROVIDER_INVENTORY_EVIDENCE.md).

export const PROVIDER_PLANES = {
  RESEARCH: 'research',
  DEVELOPMENT: 'development',
  EXECUTION: 'execution',
  RESEARCH_AND_EXECUTION: 'research_and_execution',
} as const;

export type ProviderPlane = typeof PROVIDER_PLANES[keyof typeof PROVIDER_PLANES];

// "Research/briefing/notebook profiles receive READ/ANALYZE only" (M8 runbook, Provider Roles).
const RESEARCH_PLANE_CEILING: ReadonlySet<AgentCapability> = new Set([
  AGENT_CAPABILITIES.READ,
  AGENT_CAPABILITIES.ANALYZE,
]);

// Capabilities that change repository/platform state; mirrors agentIam.ts's own MUTATING_CAPABILITIES
// (not exported there). Used only for this layer's audit-correlation/replay checks - the final
// mutating/non-mutating decision always remains agentIam.ts's.
const MUTATING_CAPABILITIES: ReadonlySet<AgentCapability> = new Set([
  AGENT_CAPABILITIES.BRANCH,
  AGENT_CAPABILITIES.COMMIT,
  AGENT_CAPABILITIES.PR,
  AGENT_CAPABILITIES.CI_REQUEST,
  AGENT_CAPABILITIES.DEPLOY_REQUEST,
  AGENT_CAPABILITIES.PRODUCTION_MUTATION,
]);

export interface ProviderProfile {
  appId: string;
  provider: string;
  plane: ProviderPlane;
  allowedCapabilities: readonly AgentCapability[];
  authenticationSource: string;
  toolTransport: string;
  sandboxBoundary: string;
  dataRetention: string;
  killSwitchProcedure: string;
}

function profile(input: ProviderProfile): Readonly<ProviderProfile> {
  if (input.plane === PROVIDER_PLANES.RESEARCH) {
    const overreach = input.allowedCapabilities.find(c => !RESEARCH_PLANE_CEILING.has(c));
    if (overreach) {
      throw new Error(`Research-plane profile ${input.appId} darf keine mutierende Capability enthalten: ${overreach}.`);
    }
  }
  return Object.freeze({ ...input, allowedCapabilities: Object.freeze([...input.allowedCapabilities]) });
}

// Every documented provider from AI_AGENT_PROVIDER_PROFILE_CONTRACT.md. Google AI Studio and
// NotebookLM have no real execution transport in this repository yet (Phase 0 finding) - their
// allowedCapabilities are deliberately conservative until a real transport exists and its own
// scoped decision widens them.
export const PROVIDER_PROFILES: Readonly<Record<string, Readonly<ProviderProfile>>> = Object.freeze({
  'chatgpt-github-connector': profile({
    appId: 'chatgpt-github-connector',
    provider: 'openai',
    plane: PROVIDER_PLANES.RESEARCH_AND_EXECUTION,
    allowedCapabilities: [
      AGENT_CAPABILITIES.READ,
      AGENT_CAPABILITIES.ANALYZE,
      AGENT_CAPABILITIES.PLAN,
      AGENT_CAPABILITIES.BRANCH,
      AGENT_CAPABILITIES.COMMIT,
      AGENT_CAPABILITIES.PR,
      AGENT_CAPABILITIES.CI_REQUEST,
    ],
    authenticationSource: 'GitHub Actions OIDC via SA3B/SA4 execution host (issue-triggered, no direct connector write path)',
    toolTransport: 'GitHub connector / MCP / Apps',
    sandboxBoundary: 'GitHub Actions ephemeral runner, no persisted credentials',
    dataRetention: 'no repository secret values ever included in issue/PR content',
    killSwitchProcedure: 'disable REM-SA3B-PROBE-001.json killSwitch.enabled or deactivate the workflow if: guard',
  }),
  'claude-code-cli': profile({
    appId: 'claude-code-cli',
    provider: 'anthropic',
    plane: PROVIDER_PLANES.EXECUTION,
    allowedCapabilities: [
      AGENT_CAPABILITIES.READ,
      AGENT_CAPABILITIES.ANALYZE,
      AGENT_CAPABILITIES.PLAN,
      AGENT_CAPABILITIES.BRANCH,
      AGENT_CAPABILITIES.COMMIT,
      AGENT_CAPABILITIES.PR,
      AGENT_CAPABILITIES.CI_REQUEST,
    ],
    authenticationSource: 'CCR/session runtime credentials (outside this repository\'s control)',
    toolTransport: 'permission modes / allowed tools / MCP',
    sandboxBoundary: 'bypass-permissions prohibited for production per AI_AGENT_PROVIDER_PROFILE_CONTRACT.md',
    dataRetention: 'no repository secret values ever included in commit/PR content',
    killSwitchProcedure: 'revoke/narrow the interactive session\'s tool grant at the CCR/environment level; no in-repo credential to disable',
  }),
  'google-ai-studio': profile({
    appId: 'google-ai-studio',
    provider: 'google',
    plane: PROVIDER_PLANES.DEVELOPMENT,
    allowedCapabilities: [AGENT_CAPABILITIES.READ, AGENT_CAPABILITIES.ANALYZE, AGENT_CAPABILITIES.PLAN],
    authenticationSource: 'not yet integrated - no real execution transport exists in this repository (Phase 0 finding)',
    toolTransport: 'function calls executed by application (documented only)',
    sandboxBoundary: 'managed sandbox allowed only as isolated execution',
    dataRetention: 'Stripe/Supabase/Render external mutations remain Handoff-controlled, never direct from this plane',
    killSwitchProcedure: 'no live integration to disable; widening this profile requires its own scoped decision first',
  }),
  notebooklm: profile({
    appId: 'notebooklm',
    provider: 'google',
    plane: PROVIDER_PLANES.RESEARCH,
    allowedCapabilities: [AGENT_CAPABILITIES.READ, AGENT_CAPABILITIES.ANALYZE],
    authenticationSource: 'not yet integrated - no real execution transport exists in this repository (Phase 0 finding)',
    toolTransport: 'source-grounded notebook, no mutation tools',
    sandboxBoundary: 'Research & Evidence Plane only',
    dataRetention: 'read-only; no mutation tools ever exposed',
    killSwitchProcedure: 'no live integration to disable',
  }),
});

export interface ProviderScopedAuthorizationRequest {
  appId: string;
  principal: Readonly<AgentPrincipalContext>;
  capability: string;
  riskClass: AgentRiskClass;
  environment: AgentEnvironment;
  targetResource: string;
  approval?: Readonly<AgentApprovalEvidence>;
  killSwitchActive?: boolean;
  /** Preserves M5 audit correlation: required for every mutating capability request. */
  auditCorrelationId?: string;
  /** Idempotency/replay control for mutation, mirrors the M7 Mutation Handoff idempotencyKey pattern. */
  envelopeId?: string;
  seenEnvelopeIds?: ReadonlySet<string>;
}

export type ProviderScopedAuthorizationDecision =
  (AgentAuthorizationDecision & { layer: 'PROVIDER_PROFILE' | 'AGENT_IAM' });

function deny(
  reason: string,
  riskClass: AgentRiskClass,
  capability?: AgentCapability,
): { verdict: 'DENY'; reason: string; riskClass: AgentRiskClass; layer: 'PROVIDER_PROFILE'; capability?: AgentCapability } {
  return { verdict: 'DENY', reason, riskClass, layer: 'PROVIDER_PROFILE', ...(capability ? { capability } : {}) };
}

export interface ProviderProfileScopeCheckRequest {
  appId: string;
  principal: Readonly<Pick<AgentPrincipalContext, 'appId'>>;
  capability: string;
  riskClass: AgentRiskClass;
  auditCorrelationId?: string;
  envelopeId?: string;
  seenEnvelopeIds?: ReadonlySet<string>;
}

export type ProviderProfileScopeDecision =
  | { verdict: 'ALLOW'; profile: Readonly<ProviderProfile> }
  | { verdict: 'DENY'; reason: string; riskClass: AgentRiskClass; layer: 'PROVIDER_PROFILE'; capability?: AgentCapability };

// Pure profile-narrowing pre-check: unknown appId, principal/profile mismatch, capability outside
// the profile's allowlist, missing audit correlation on a mutating request, and replayed envelopes.
// Deliberately does NOT call agentIam.ts - composing this with an authorization chain that already
// evaluates agentIam.ts itself (e.g. the SA1/SA2/SA3 Systemadmin chain) must never re-run the IAM
// check a second time with an independently reconstructed (and therefore potentially inconsistent)
// approval object. Callers that have no existing IAM chain of their own should use
// evaluateProviderScopedAuthorization below instead, which composes this check with agentIam.ts.
export function checkProviderProfileScope(
  request: Readonly<ProviderProfileScopeCheckRequest>,
): ProviderProfileScopeDecision {
  const resolved = PROVIDER_PROFILES[request.appId];
  if (!resolved) {
    return deny(`Unbekanntes Provider-Profil: ${request.appId}.`, request.riskClass);
  }
  if (request.principal.appId !== request.appId) {
    return deny('Principal-appId stimmt nicht mit dem angeforderten Provider-Profil überein.', request.riskClass);
  }
  if (!isKnownAgentCapability(request.capability)) {
    return deny(`Unbekannte Capability: ${request.capability}.`, request.riskClass);
  }
  const capability = request.capability;
  if (!resolved.allowedCapabilities.includes(capability)) {
    return deny(
      `Capability ${capability} liegt außerhalb des Provider-Profils ${resolved.appId} (Plane: ${resolved.plane}).`,
      request.riskClass,
      capability,
    );
  }

  if (MUTATING_CAPABILITIES.has(capability)) {
    if (!request.auditCorrelationId || !request.auditCorrelationId.trim()) {
      return deny('Keine Audit-Korrelations-ID für mutierende Capability vorhanden.', request.riskClass, capability);
    }
    if (request.envelopeId && request.seenEnvelopeIds?.has(request.envelopeId)) {
      return deny(`Mutation-Envelope ${request.envelopeId} wurde bereits verarbeitet (Replay).`, request.riskClass, capability);
    }
  }

  return { verdict: 'ALLOW', profile: resolved };
}

// Canonical M8 entry point for callers with no authorization chain of their own: composes the
// profile pre-check with agentIam.ts (never replaces it). Unknown appId, capability mismatch,
// missing audit correlation on a mutating request, and replayed envelopes are all denied here,
// before reaching agentIam.ts at all.
export function evaluateProviderScopedAuthorization(
  request: Readonly<ProviderScopedAuthorizationRequest>,
): ProviderScopedAuthorizationDecision {
  const scope = checkProviderProfileScope(request);
  if (scope.verdict === 'DENY') return scope;

  const iamDecision = evaluateAgentAuthorization({
    principal: request.principal,
    capability: request.capability,
    grantedCapabilities: scope.profile.allowedCapabilities,
    riskClass: request.riskClass,
    environment: request.environment,
    targetResource: request.targetResource,
    approval: request.approval,
    killSwitchActive: request.killSwitchActive,
  });

  return { ...iamDecision, layer: 'AGENT_IAM' };
}
