/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

// M8 Provider-neutral Control Plane. Owner 2026-08-16: canonical DEVELOPMENT Chain / AI value-chain
// providers are ChatGPT, Claude and Grok. Google AI Studio and NotebookLM are NOT part of the active
// value chain. Gemini has no registry profile and remains RETIRED/BLOCKED.

export const PROVIDER_PLANES = {
  RESEARCH: 'research',
  DEVELOPMENT: 'development',
  EXECUTION: 'execution',
  RESEARCH_AND_EXECUTION: 'research_and_execution',
} as const;

export type ProviderPlane = typeof PROVIDER_PLANES[keyof typeof PROVIDER_PLANES];

const RESEARCH_PLANE_CEILING: ReadonlySet<AgentCapability> = new Set([
  AGENT_CAPABILITIES.READ,
  AGENT_CAPABILITIES.ANALYZE,
]);

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

/** Canonical active DEVELOPMENT Chain / AI value-chain providers (Owner 2026-08-16). */
export const CANONICAL_VALUE_CHAIN_PROVIDER_IDS = Object.freeze([
  'chatgpt-github-connector',
  'claude-code-cli',
  'grok-xai-connector',
] as const);

export type CanonicalValueChainProviderId = typeof CANONICAL_VALUE_CHAIN_PROVIDER_IDS[number];

/** Retired / non-chain aliases. Lookups resolve to DENY / RETIRED. */
export const RETIRED_PROVIDER_ALIASES = Object.freeze([
  'google-ai-studio',
  'notebooklm',
  'gemini',
] as const);

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
  'grok-xai-connector': profile({
    appId: 'grok-xai-connector',
    provider: 'xai',
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
    authenticationSource: 'Grok GitHub Connector / SuperGrok session (xAI); repository grants are host-side, not model identity',
    toolTransport: 'GitHub MCP / Grok Chat connector / work-claims',
    sandboxBoundary: 'same CONTROL-PLANE policy as ChatGPT/Claude; model name never elevates authority',
    dataRetention: 'no repository secret values ever included in issue/PR/commit content',
    killSwitchProcedure: 'revoke host-side connector grant; disable any REM bound to grok-xai-connector; no in-repo secret to rotate for interactive Grok sessions',
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
  auditCorrelationId?: string;
  envelopeId?: string;
  seenEnvelopeIds?: ReadonlySet<string>;
  registry?: Readonly<Record<string, Readonly<ProviderProfile>>>;
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
  registry?: Readonly<Record<string, Readonly<ProviderProfile>>>;
}

export type ProviderProfileScopeDecision =
  | { verdict: 'ALLOW'; profile: Readonly<ProviderProfile> }
  | { verdict: 'DENY'; reason: string; riskClass: AgentRiskClass; layer: 'PROVIDER_PROFILE'; capability?: AgentCapability };

export function checkProviderProfileScope(
  request: Readonly<ProviderProfileScopeCheckRequest>,
): ProviderProfileScopeDecision {
  if ((RETIRED_PROVIDER_ALIASES as readonly string[]).includes(request.appId)) {
    return deny(
      `Provider-Alias ${request.appId} ist retired und nicht Teil der aktiven DEVELOPMENT/AI-Wertschöpfungskette (Owner 2026-08-16: ChatGPT, Claude, Grok).`,
      request.riskClass,
    );
  }
  const resolved = (request.registry ?? PROVIDER_PROFILES)[request.appId];
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

export interface ProviderCutoverEvidence {
  realCallerVerified: boolean;
  canonicalControlPlanePathVerified: boolean;
  providerSpecificBypassDenied: boolean;
  auditCorrelationVerified: boolean;
  rollbackToReadOnlyVerified: boolean;
  externalHostConfigurationVerified: boolean;
}

const PROVIDER_CUTOVER_EVIDENCE_KEYS: readonly (keyof ProviderCutoverEvidence)[] = Object.freeze([
  'realCallerVerified',
  'canonicalControlPlanePathVerified',
  'providerSpecificBypassDenied',
  'auditCorrelationVerified',
  'rollbackToReadOnlyVerified',
  'externalHostConfigurationVerified',
]);

export type ProviderCutoverReadinessDecision =
  | { status: 'READY'; profile: Readonly<ProviderProfile> }
  | { status: 'NOT_APPLICABLE'; profile: Readonly<ProviderProfile>; reason: string }
  | { status: 'BLOCKED'; reason: string; missingEvidence: readonly (keyof ProviderCutoverEvidence)[] }
  | { status: 'RETIRED'; reason: string };

export function evaluateProviderCutoverReadiness(
  appId: string,
  evidence: Readonly<ProviderCutoverEvidence>,
  registry: Readonly<Record<string, Readonly<ProviderProfile>>> = PROVIDER_PROFILES,
): ProviderCutoverReadinessDecision {
  if ((RETIRED_PROVIDER_ALIASES as readonly string[]).includes(appId)) {
    return {
      status: 'RETIRED',
      reason: `Provider-Alias ${appId} ist aus der aktiven DEVELOPMENT/AI-Wertschöpfungskette entfernt (Owner 2026-08-16: ChatGPT, Claude, Grok).`,
    };
  }

  const resolved = registry[appId];
  if (!resolved) {
    return {
      status: 'BLOCKED',
      reason: `Unbekanntes Provider-Profil: ${appId}.`,
      missingEvidence: [],
    };
  }

  const canMutate = resolved.allowedCapabilities.some(capability =>
    MUTATING_CAPABILITIES.has(capability),
  );
  if (!canMutate) {
    return {
      status: 'NOT_APPLICABLE',
      profile: resolved,
      reason: `Provider-Profil ${appId} besitzt keine mutierende Capability und benötigt keinen privilegierten Cutover.`,
    };
  }

  const missingEvidence = PROVIDER_CUTOVER_EVIDENCE_KEYS.filter(key => evidence[key] !== true);
  if (missingEvidence.length > 0) {
    return {
      status: 'BLOCKED',
      reason: `M8-Cutover für ${appId} ist ohne vollständige Caller-, Control-Plane-, Bypass-, Audit-, Rollback- und Host-Evidence blockiert.`,
      missingEvidence: Object.freeze(missingEvidence),
    };
  }

  return { status: 'READY', profile: resolved };
}

export function getCanonicalValueChainProviderInventory(
  registry: Readonly<Record<string, Readonly<ProviderProfile>>> = PROVIDER_PROFILES,
): {
  expected: readonly CanonicalValueChainProviderId[];
  present: CanonicalValueChainProviderId[];
  missing: CanonicalValueChainProviderId[];
  complete: boolean;
} {
  const present = CANONICAL_VALUE_CHAIN_PROVIDER_IDS.filter(id => registry[id] !== undefined);
  const missing = CANONICAL_VALUE_CHAIN_PROVIDER_IDS.filter(id => registry[id] === undefined);
  return {
    expected: CANONICAL_VALUE_CHAIN_PROVIDER_IDS,
    present: [...present],
    missing: [...missing],
    complete: missing.length === 0,
  };
}
