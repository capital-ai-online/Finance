/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// M8 Provider Equivalence (docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md, "M8 Provider
// Equivalence Trace"): "production mutation requires exact approved Handoff plus separately verified
// execution permission."
//
// Until now that sentence had no machine gate behind it. Two concrete holes made it prose only:
//
//   1. developmentChainMutationHandoff.ts accepts ANY non-empty executorAgentId, while
//      .ai/contracts/development-chain-mutation-handoff.schema.json pins the field to a single
//      const. A Handoff naming an arbitrary executor - including an AI provider that no Owner ever
//      bound to a mutation path - passed the TypeScript gate but violated the machine contract.
//   2. providerProfile.ts gates mutating capabilities on an audit-correlation id and a replay check
//      only. Nothing anywhere required a Handoff to exist before a provider-scoped production
//      mutation, so "exact approved Handoff" was never a precondition any code could observe.
//
// This module closes both holes as a NARROWING wrapper: it can only turn an ALLOW from the existing
// gates into a DENY, never the reverse, and it grants no capability to anyone. It answers exactly
// one question - does an exact, Owner-approved Handoff exist for THIS acting provider, on THIS
// baseline, for THIS operation and target - and it is the check a mutation executor would have to
// pass before any platform side effect.
//
// Today's answer for every AI provider in the registry is DENY, for a structural reason rather than
// a policy toggle: no registered mutation executor binds to a provider profile that holds
// DEPLOY_REQUEST or PRODUCTION_MUTATION. For claude-code-cli the denial is one step earlier still -
// no registered executor binds to it at all, which is the code-level statement of the BLOCKED
// finding in docs/architecture/M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md. An exact Owner-approved Claude
// Handoff therefore cannot exist yet, and this module makes that decidable instead of asserted.

import {
  evaluateMutationHandoffExecution,
  validateMutationHandoff,
  type MutationExecutionActor,
} from './developmentChainMutationHandoff';
import {
  checkProviderProfileScope,
  PROVIDER_PROFILES,
  type ProviderProfile,
} from './providerProfile';
import { AGENT_CAPABILITIES, type AgentCapability } from './agentIam';

/** Provider profile id of the Anthropic execution plane, for callers asserting the Claude case. */
export const CLAUDE_PROVIDER_APP_ID = 'claude-code-cli';

/**
 * How a Handoff's executorAgentId is allowed to reach a real actor.
 *
 * `HUMAN_OWNER` is the M7 path that actually happened: the Owner performs the Render mutation
 * personally, exactly per runbook, with no AI provider in the execution path
 * (docs/runbooks/M7_DEPLOY_HOOK_ROTATION_HANDOFF.md, M7_ROLLBACK_VERIFICATION_HANDOFF.md).
 *
 * `AGENT` binds an executor to exactly one provider profile. The SA3B/SA4 GitHub Actions host is
 * the only such executor, and its appId literal is `chatgpt-github-connector` - not an interactive
 * ChatGPT session (docs/evidence/m8/M8_I1_CUTOVER_READINESS_MATRIX_AND_EXIT_GATE_SYNC_EVIDENCE.md
 * §3.1).
 */
export type MutationExecutorBinding =
  | { kind: 'HUMAN_OWNER'; providerAppId: null }
  | { kind: 'AGENT'; providerAppId: string };

/**
 * Every executorAgentId this repository recognises. An executor absent from this registry cannot
 * carry a Handoff, which is what replaces the "any non-empty string" hole in the structural
 * validator. Adding an entry is an Owner decision, not an agent's.
 */
export const MUTATION_EXECUTOR_BINDINGS: Readonly<Record<string, MutationExecutorBinding>> =
  Object.freeze({
    'capital-ai-systemadmin-roadmap-executor': Object.freeze({
      kind: 'AGENT',
      providerAppId: 'chatgpt-github-connector',
    }) as MutationExecutorBinding,
    'render-manual-owner-execution': Object.freeze({
      kind: 'HUMAN_OWNER',
      providerAppId: null,
    }) as MutationExecutorBinding,
  });

/**
 * The capability a mutationClass implies. DEPLOYMENT is a deploy request; every other class of the
 * Handoff Contract describes an external platform side effect and therefore demands the strictest
 * capability the IAM kernel knows.
 */
const MUTATION_CLASS_CAPABILITY: Readonly<Record<string, AgentCapability>> = Object.freeze({
  DEPLOYMENT: AGENT_CAPABILITIES.DEPLOY_REQUEST,
  REPOSITORY: AGENT_CAPABILITIES.PRODUCTION_MUTATION,
  PLATFORM_CONFIG: AGENT_CAPABILITIES.PRODUCTION_MUTATION,
  IDENTITY: AGENT_CAPABILITIES.PRODUCTION_MUTATION,
  BILLING: AGENT_CAPABILITIES.PRODUCTION_MUTATION,
  DATA: AGENT_CAPABILITIES.PRODUCTION_MUTATION,
  DNS_TLS: AGENT_CAPABILITIES.PRODUCTION_MUTATION,
});

export type OwnerApprovedHandoffDenyStage =
  | 'HANDOFF_STRUCTURE'
  | 'EXECUTOR_BINDING'
  | 'PROVIDER_BINDING'
  | 'PROVIDER_CAPABILITY'
  | 'BASELINE_DRIFT'
  | 'HANDOFF_EXECUTION';

export interface OwnerApprovedHandoffRequest {
  /**
   * Provider profile acting right now, or null when the Owner executes personally. An AI provider
   * must name itself here; omitting it in order to borrow the human-reserved path is exactly the
   * escalation this gate denies.
   */
  providerAppId: string | null;
  handoff: unknown;
  actor: Readonly<MutationExecutionActor>;
  attemptedOperation: string;
  attemptedTargetResource: string;
  /** Commit the executor is really standing on. Compared against the Handoff's pinned baseSha. */
  currentBaseSha: string;
  auditPermitRef?: string | null;
  now?: string | number | Date;
  seenIdempotencyKeys?: ReadonlySet<string>;
  executorBindings?: Readonly<Record<string, MutationExecutorBinding>>;
  providerRegistry?: Readonly<Record<string, Readonly<ProviderProfile>>>;
}

export type OwnerApprovedHandoffDecision =
  | {
      verdict: 'ALLOW';
      reason: string;
      contractId: string;
      executorBinding: MutationExecutorBinding;
    }
  | {
      verdict: 'DENY';
      reason: string;
      stage: OwnerApprovedHandoffDenyStage;
      contractId?: string;
    };

function deny(
  stage: OwnerApprovedHandoffDenyStage,
  reason: string,
  contractId?: string,
): OwnerApprovedHandoffDecision {
  return { verdict: 'DENY', reason, stage, ...(contractId ? { contractId } : {}) };
}

/**
 * Fail-closed answer to "liegt ein exakter Owner-genehmigter Handoff für diesen Aufrufer vor?".
 *
 * Never called by a live executor today - no autonomous platform-mutation host exists - but this is
 * the precondition such a host would have to satisfy, and the reason the M8 equivalence claim can
 * now be tested rather than only read.
 */
export function evaluateOwnerApprovedHandoff(
  request: Readonly<OwnerApprovedHandoffRequest>,
): OwnerApprovedHandoffDecision {
  const validation = validateMutationHandoff(request.handoff);
  if ('errors' in validation) {
    return deny('HANDOFF_STRUCTURE', `Handoff-Struktur ungueltig: ${validation.errors.join(' | ')}`);
  }
  const handoff = validation.handoff;
  const bindings = request.executorBindings ?? MUTATION_EXECUTOR_BINDINGS;

  // Unregistered executor -> DENY. Closes the structural validator's "any non-empty string".
  const binding = bindings[handoff.executorAgentId];
  if (!binding) {
    return deny(
      'EXECUTOR_BINDING',
      `executorAgentId ${handoff.executorAgentId} ist kein registrierter Mutation-Executor dieses Repositories.`,
      handoff.contractId,
    );
  }

  // Provider riding a Handoff bound to someone else -> DENY, in both directions: an AI provider may
  // not borrow the Owner-reserved manual path, and no provider may act on another's Handoff.
  const actingProviderAppId = request.providerAppId ?? null;
  if (binding.kind === 'HUMAN_OWNER') {
    if (actingProviderAppId !== null) {
      return deny(
        'PROVIDER_BINDING',
        `Handoff ${handoff.contractId} ist Human/Owner-reserviert; Provider ${actingProviderAppId} darf ihn nicht ausfuehren.`,
        handoff.contractId,
      );
    }
  } else if (actingProviderAppId !== binding.providerAppId) {
    return deny(
      'PROVIDER_BINDING',
      `Handoff ${handoff.contractId} ist an Provider ${binding.providerAppId} gebunden, ausgefuehrt wird als ${actingProviderAppId ?? 'Human/Owner'}.`,
      handoff.contractId,
    );
  }

  // Provider profile lacking the capability the mutation implies -> DENY. This is where every AI
  // provider currently stops: no profile in the registry holds DEPLOY_REQUEST or
  // PRODUCTION_MUTATION, so no agent can execute a platform Handoff regardless of its approval.
  if (binding.kind === 'AGENT') {
    const requiredCapability = MUTATION_CLASS_CAPABILITY[handoff.mutationClass];
    if (!requiredCapability) {
      return deny(
        'PROVIDER_CAPABILITY',
        `mutationClass ${handoff.mutationClass} hat keine zugeordnete Capability.`,
        handoff.contractId,
      );
    }
    const scope = checkProviderProfileScope({
      appId: binding.providerAppId,
      principal: { appId: binding.providerAppId },
      capability: requiredCapability,
      riskClass: handoff.riskClass as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      auditCorrelationId: request.auditPermitRef ?? undefined,
      registry: request.providerRegistry ?? PROVIDER_PROFILES,
    });
    if (scope.verdict === 'DENY') {
      return deny('PROVIDER_CAPABILITY', scope.reason, handoff.contractId);
    }
  }

  // Baseline drift -> DENY. The Contract calls base drift invalidating; nothing enforced it before.
  if (request.currentBaseSha !== handoff.baseSha) {
    return deny(
      'BASELINE_DRIFT',
      `Baseline-Drift: Handoff ist an ${handoff.baseSha} gebunden, ausgefuehrt wird auf ${request.currentBaseSha || '(leer)'}.`,
      handoff.contractId,
    );
  }

  // Owner identity, approval evidence, expiry, exact target, replay and operation allowlist stay
  // with the existing M7 gate - this wrapper never re-implements or relaxes them.
  const execution = evaluateMutationHandoffExecution({
    handoff: request.handoff,
    actor: request.actor,
    attemptedOperation: request.attemptedOperation,
    attemptedTargetResource: request.attemptedTargetResource,
    auditPermitRef: request.auditPermitRef,
    now: request.now,
    seenIdempotencyKeys: request.seenIdempotencyKeys,
  });
  if (execution.verdict === 'DENY') {
    return deny('HANDOFF_EXECUTION', execution.reason, handoff.contractId);
  }

  return {
    verdict: 'ALLOW',
    reason: `Exakter Owner-genehmigter Handoff ${handoff.contractId} liegt fuer ${actingProviderAppId ?? 'Human/Owner'} vor.`,
    contractId: handoff.contractId,
    executorBinding: binding,
  };
}

/**
 * Provider-level projection: which registered executors, if any, could ever carry a platform Handoff
 * for this provider. An empty `executors` list means no exact Owner-approved Handoff can exist for
 * the provider at all - the current state for claude-code-cli.
 */
export function getProviderHandoffBindingProjection(
  providerAppId: string,
  bindings: Readonly<Record<string, MutationExecutorBinding>> = MUTATION_EXECUTOR_BINDINGS,
): { providerAppId: string; executors: readonly string[]; handoffReachable: boolean } {
  const executors = Object.keys(bindings).filter(
    executorAgentId => bindings[executorAgentId].providerAppId === providerAppId,
  );
  return {
    providerAppId,
    executors: Object.freeze(executors),
    handoffReachable: executors.length > 0,
  };
}
