// M9 (ADR-0063, docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md "Assurance Domain 7:
// Break-Glass") — Owner-ACCEPTED design, docs/evidence/m9/M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md.
//
// Scope of this module (explicitly, per the accepted proposal's own scope note): the pure
// policy/logic layer only. It issues and validates an ephemeral, tightly bounded
// RoadmapExecutionMandate that then flows through the EXACT SAME REM/IAM/Audit pipeline every
// other mandate in this codebase already uses (evaluateSystemadminRoadmapAuthorization,
// authorizeSystemadminAuditedExecution) — break-glass is additive, never a parallel bypass
// codepath. This module does NOT expose any HTTP endpoint and is not wired into
// server.application.ts; making it reachable is a separate, separately-authorized step (mirroring
// M10's own phased sequencing).
//
// Callers MUST verify a fresh Owner AAL2 step-up (server/stepUp.ts, purpose
// 'break-glass-activation', same pattern as M5A runbook §B4 "Step-up") themselves before calling
// activateBreakGlass() — this module never performs authentication itself, only enforces that the
// caller already asserts it did (stepUpVerified: true).
import { randomBytes } from 'node:crypto';
import { AGENT_CAPABILITIES, isKnownAgentCapability, type AgentCapability } from './agentIam';
import {
  ROADMAP_EXECUTION_MUTATION_CLASSES,
  RESERVED_MUTATION_CLASSES,
  SYSTEMADMIN_AGENT_ID,
  SYSTEMADMIN_BASE_BRANCH,
  SYSTEMADMIN_OWNER_ACTOR_ID,
  SYSTEMADMIN_REPOSITORY,
  validateRoadmapExecutionMandate,
  type RoadmapExecutionMandate,
} from './roadmapExecutionMandate';

/** Hard cap, not caller-adjustable: two orders of magnitude shorter than a typical 7-day REM. */
export const MAX_BREAK_GLASS_DURATION_MS = 30 * 60 * 1000;

/**
 * Allowlist, not a denylist: MERGE is not a known AgentCapability at all and is therefore already
 * structurally unreachable (isKnownAgentCapability). PRODUCTION_MUTATION and DEPLOY_REQUEST ARE
 * known capabilities but are deliberately excluded here even though nothing else in this module
 * would otherwise stop them - break-glass must never reach production or deployment.
 */
const BREAK_GLASS_ELIGIBLE_CAPABILITIES: ReadonlySet<AgentCapability> = new Set([
  AGENT_CAPABILITIES.READ,
  AGENT_CAPABILITIES.ANALYZE,
  AGENT_CAPABILITIES.PLAN,
  AGENT_CAPABILITIES.BRANCH,
  AGENT_CAPABILITIES.COMMIT,
  AGENT_CAPABILITIES.PR,
  AGENT_CAPABILITIES.CI_REQUEST,
]);

export interface BreakGlassActivationRequest {
  ownerActorId: string;
  capability: string;
  targetResource: string;
  reason: string;
  roadmapItem: string;
  /**
   * The break-glass proposal scopes activation by capability+target; the shared REM structure
   * additionally requires a non-empty path allowlist. Deliberately required here rather than
   * defaulted to a wildcard - narrower is safer for an emergency-only mechanism, and a bare '**'
   * wildcard is already structurally rejected by the shared isSafeRepoPath() the final
   * self-validation step below reuses unchanged.
   */
  allowedPaths: readonly string[];
  /** Caller-asserted proof that a fresh AAL2 step-up was independently verified. Never trust text. */
  stepUpVerified: boolean;
  now?: string | number | Date;
}

export type BreakGlassActivationResult =
  | { verdict: 'DENY'; reason: string }
  | { verdict: 'ALLOW'; mandate: Readonly<RoadmapExecutionMandate> };

function nowMs(value: BreakGlassActivationRequest['now']): number {
  if (value === undefined) return Date.now();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return Date.parse(value);
}

function deny(reason: string): BreakGlassActivationResult {
  return { verdict: 'DENY', reason };
}

function freshMandateId(issuedAtMs: number): string {
  // MANDATE_ID_PATTERN (roadmapExecutionMandate.ts) requires ^REM-[A-Z0-9][A-Z0-9._-]{3,63}$ -
  // reused unchanged rather than relaxed, so a break-glass mandate is indistinguishable in shape
  // from any other REM the existing validator already accepts.
  const suffix = randomBytes(6).toString('hex').toUpperCase();
  return `REM-BREAK-GLASS-${issuedAtMs}-${suffix}`;
}

/**
 * Issues a new, single-capability, single-target, short-lived REM mandate. Returns DENY (never
 * throws) for any policy violation; the constructed mandate is additionally self-validated through
 * validateRoadmapExecutionMandate() before being returned, so a defect in this function's own
 * construction logic fails closed here rather than surfacing later as a silently-accepted mandate.
 */
export function activateBreakGlass(
  request: Readonly<BreakGlassActivationRequest>,
): BreakGlassActivationResult {
  if (!request.stepUpVerified) {
    return deny('Break-Glass erfordert einen frischen, verifizierten Owner-AAL2-Step-up.');
  }
  if (request.ownerActorId !== SYSTEMADMIN_OWNER_ACTOR_ID) {
    return deny('Break-Glass kann nur vom kanonischen Owner aktiviert werden.');
  }
  if (
    !isKnownAgentCapability(request.capability)
    || !BREAK_GLASS_ELIGIBLE_CAPABILITIES.has(request.capability)
  ) {
    return deny(`Capability ${request.capability} ist für Break-Glass nicht zulässig.`);
  }
  if (!request.reason?.trim()) {
    return deny('Break-Glass erfordert eine explizite Begründung.');
  }
  if (!request.targetResource?.trim()) {
    return deny('Break-Glass erfordert ein exaktes Ziel.');
  }
  if (!request.roadmapItem?.trim()) {
    return deny('Break-Glass erfordert ein zugeordnetes Roadmap-Item.');
  }
  if (!Array.isArray(request.allowedPaths) || request.allowedPaths.length === 0) {
    return deny('Break-Glass erfordert eine explizite, nicht leere Pfad-Allowlist.');
  }

  const issuedAtMs = nowMs(request.now);
  if (!Number.isFinite(issuedAtMs)) return deny('Ungültiger Aktivierungszeitpunkt.');
  const expiresAtMs = issuedAtMs + MAX_BREAK_GLASS_DURATION_MS;
  const capability = request.capability as AgentCapability;
  const mandateId = freshMandateId(issuedAtMs);

  const candidate: RoadmapExecutionMandate = {
    mandateId,
    status: 'OWNER_APPROVED',
    ownerActorId: SYSTEMADMIN_OWNER_ACTOR_ID,
    subjectAgentId: SYSTEMADMIN_AGENT_ID,
    repository: SYSTEMADMIN_REPOSITORY,
    baseBranch: SYSTEMADMIN_BASE_BRANCH,
    roadmapItems: [request.roadmapItem],
    authorityRefs: [
      'docs/evidence/m9/M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md',
      'docs/adr/ADR-0063-agent-assurance-incident-break-glass.md',
    ],
    allowedCapabilities: [capability],
    allowedPaths: [...request.allowedPaths],
    allowedTargets: [request.targetResource],
    maxRiskClass: 'MEDIUM',
    allowedMutationClasses: [ROADMAP_EXECUTION_MUTATION_CLASSES.REPOSITORY],
    prohibitedMutationClasses: [...RESERVED_MUTATION_CLASSES],
    validFrom: new Date(issuedAtMs).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
    maxOpenPullRequests: 1,
    ciBudgetPolicyRef: 'docs/governance/GITHUB_ACTIONS_BUDGET_POLICY.md',
    killSwitch: {
      enabled: true,
      revocationAuthority: SYSTEMADMIN_OWNER_ACTOR_ID,
      reason: `break-glass: ${request.reason.trim()}`,
    },
    requiredPreflight: ['security', 'overlap', 'tests', 'rollback'],
    requiredEvidence: ['mandateId', 'auditReference'],
    // The Owner's fresh AAL2 step-up (verified by the caller before this function is ever
    // reached) IS the approval evidence for a break-glass mandate - there is no separate,
    // pre-existing PR-reviewed approval artifact the way a normal REM has one.
    approvalEvidenceRef: `break-glass-owner-stepup:${mandateId}`,
  };

  const validation = validateRoadmapExecutionMandate(candidate);
  if ('errors' in validation) {
    // Should be unreachable - constructed entirely from this function's own trusted literals and
    // validated inputs above. Fails closed rather than ever returning a malformed ALLOW mandate.
    return deny(`Break-Glass-Mandat-Konstruktion intern ungültig: ${validation.errors.join(' | ')}`);
  }
  return { verdict: 'ALLOW', mandate: validation.mandate };
}

/**
 * A break-glass mandate has no separate "revoked" field on the shared RoadmapExecutionMandate
 * shape (deliberately - it must stay structurally indistinguishable from any other REM for the
 * shared validator/authorization chain to accept it unchanged). Revocation is therefore an
 * external fact the caller tracks (e.g. a persisted flag) and passes in here, exactly mirroring
 * how killSwitchActive is caller-supplied rather than mandate-embedded.
 */
export function isBreakGlassMandateActive(
  mandate: Readonly<Pick<RoadmapExecutionMandate, 'validFrom' | 'expiresAt'>>,
  revoked: boolean,
  now?: BreakGlassActivationRequest['now'],
): boolean {
  if (revoked) return false;
  const currentMs = nowMs(now);
  if (!Number.isFinite(currentMs)) return false;
  return currentMs >= Date.parse(mandate.validFrom) && currentMs < Date.parse(mandate.expiresAt);
}
