// ESS-0018 Phase 2 / ADR-0051: Compliance's policy-verdict surface for governed agent actions.
// M4 / ESS-0019 / ADR-0058 adds a provider-neutral Agent IAM layer above the existing
// tool-specific allowlists. Provider/model names remain metadata and never grant authority.
// SA1 / ESS-0021 / ADR-0065 adds a separate, bounded REM layer for the Systemadmin profile.

import { CAPABILITIES, type Capability, isKnownCapability } from '../Security/capabilities';
import {
  evaluateAgentAuthorization,
  type AgentAuthorizationDecision,
  type AgentAuthorizationRequest,
} from '../Security/agentIam';
import {
  evaluateSystemadminRoadmapAuthorization,
  type SystemadminRoadmapAuthorizationDecision,
  type SystemadminRoadmapAuthorizationRequest,
} from '../Security/roadmapExecutionMandate';

export interface PolicyVerdict {
  verdict: 'ALLOW' | 'DENY';
  reason: string;
}

/**
 * Write capabilities explicitly permitted to reach Apply. Everything else - including any
 * capability not in CAPABILITIES at all, and explicitly `supabase.sql.execute`-shaped names -
 * is DENY. There is no default-allow path.
 */
const WRITE_CAPABILITY_ALLOWLIST: ReadonlySet<Capability> = new Set([
  CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_DISABLE,
  CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_RESEND_CONFIRMATION,
]);

const READ_CAPABILITY_ALLOWLIST: ReadonlySet<Capability> = new Set([
  CAPABILITIES.ADMIN_DIAGNOSTICS_READ,
  CAPABILITIES.ADMIN_SUBSCRIPTION_STATUS_READ,
]);

export function evaluateReadPolicy(capability: string): PolicyVerdict {
  if (!isKnownCapability(capability) || !READ_CAPABILITY_ALLOWLIST.has(capability)) {
    return { verdict: 'DENY', reason: `Capability "${capability}" ist keine freigegebene Lese-Capability.` };
  }
  return { verdict: 'ALLOW', reason: 'Capability ist in der Lese-Allowlist.' };
}

export function evaluateWritePolicy(capability: string): PolicyVerdict {
  if (!isKnownCapability(capability) || !WRITE_CAPABILITY_ALLOWLIST.has(capability)) {
    return { verdict: 'DENY', reason: `Capability "${capability}" ist keine freigegebene Schreib-Capability.` };
  }
  return { verdict: 'ALLOW', reason: 'Capability ist in der Schreib-Allowlist.' };
}

/**
 * Canonical M4 entry point for provider-neutral execution authorization.
 *
 * This check is intentionally separate from the ESS-0018 tool allowlists above. A future or
 * existing agent action must pass BOTH the generic Agent IAM decision and its domain/tool policy.
 * This prevents a provider label, a broad tool grant or a successful CI result from becoming an
 * implicit application-level privilege.
 */
export function evaluateAgentPolicy(request: Readonly<AgentAuthorizationRequest>): AgentAuthorizationDecision {
  return evaluateAgentAuthorization(request);
}

/**
 * Canonical SA1 entry point for the Systemadmin Roadmap Executor.
 *
 * This does not replace evaluateAgentPolicy. The REM validator first restricts the action to an
 * Owner-approved roadmap/path/target/risk scope and then composes with the unchanged M4 Agent IAM.
 * DEPLOY_REQUEST, PRODUCTION_MUTATION, MERGE and self-modification of the Systemadmin trust root
 * remain fail-closed in SA1.
 */
export function evaluateSystemadminRoadmapPolicy(
  request: Readonly<SystemadminRoadmapAuthorizationRequest>,
): SystemadminRoadmapAuthorizationDecision {
  return evaluateSystemadminRoadmapAuthorization(request);
}
