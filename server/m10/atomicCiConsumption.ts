// M10 (ADR-0066, ESS-0022) Phase 5 — Atomic CI Consumption.
//
// Security objective: one verified Owner approval may authorize at most one expensive CI dispatch
// for the exact currently-resolved PR head. The function below deliberately has no retry loop: an
// uncertain external dispatch outcome is terminal and requires human recovery/reconciliation.
import { generateOpaqueToken } from '../../src/platform/Security/secretCrypto';
import type { M10ApprovalEvidence } from './assertionVerification';
import { resolveTrustedPrState, type GithubApiFetch } from './githubPrStateResolver';
import { resolveTrustedM10DispatchRef } from './githubPrDispatchRef';

export interface M10CiConsumptionEvidence {
  consumptionId: string;
  approvalId: string;
  repository: string;
  prNumber: number;
  headSha: string;
  authorizationDigest: string;
  consumedAt: string;
  dispatchState: 'PENDING' | 'DISPATCHED' | 'FAILED_UNCERTAIN';
}

export type M10ConsumptionClaimResult =
  | { status: 'CLAIMED'; consumptionId: string; consumedAt: string }
  | { status: 'DEDUPE_HEAD' | 'DEDUPE_APPROVAL'; reason?: string }
  | { status: 'DENY_UNKNOWN_APPROVAL' | 'DENY_CONTEXT_MISMATCH' | 'DENY_STORE_UNAVAILABLE'; reason?: string };

export interface M10ConsumableApprovalStore {
  get(approvalId: string): Promise<Readonly<M10ApprovalEvidence> | null>;
  claim(input: Readonly<{
    approvalId: string;
    consumptionId: string;
    expectedRepository: string;
    expectedPrNumber: number;
    expectedHeadSha: string;
    expectedAuthorizationDigest: string;
  }>): Promise<M10ConsumptionClaimResult>;
  finalizeDispatch(
    consumptionId: string,
    terminalState: 'DISPATCHED' | 'FAILED_UNCERTAIN',
    failureReason?: string,
  ): Promise<boolean>;
}

export interface M10CiDispatchRequest {
  consumptionId: string;
  approvalId: string;
  repository: string;
  prNumber: number;
  baseSha: string;
  headSha: string;
  headRef: string;
  authorizationDigest: string;
  action: 'AUTHORIZE_PR_CI';
}

export interface M10CiDispatcher {
  /**
   * Must perform exactly one external dispatch attempt per invocation and MUST NOT retry internally.
   * Network ambiguity is represented as an exception or accepted=false and is terminal for the
   * current consumption record until explicit human recovery reconciles GitHub state.
   */
  dispatch(request: Readonly<M10CiDispatchRequest>): Promise<Readonly<{ accepted: boolean; reference?: string }>>;
}

export interface ConsumeM10ApprovalDeps {
  githubApiFetch: GithubApiFetch;
  approvalStore: M10ConsumableApprovalStore;
  dispatcher: M10CiDispatcher;
}

export type ConsumeM10ApprovalResult =
  | { verdict: 'DISPATCH_ACCEPTED'; consumption: Readonly<M10CiConsumptionEvidence>; dispatchReference?: string }
  | { verdict: 'DEDUPE'; reason: string }
  | { verdict: 'DENY'; reason: string }
  | { verdict: 'DISPATCH_UNCERTAIN'; consumptionId: string; reason: string };

function sameApprovalContext(
  approval: Readonly<M10ApprovalEvidence>,
  current: Readonly<{
    ownerId: string;
    repository: string;
    prNumber: number;
    baseBranch: string;
    baseSha: string;
    headSha: string;
    canonicalChangedFileSetHash: string;
    canonicalDiffReviewDigest: string;
    action: 'AUTHORIZE_PR_CI';
  }>,
): boolean {
  return approval.ownerId === current.ownerId
    && approval.context.ownerId === current.ownerId
    && approval.context.repository === current.repository
    && approval.context.prNumber === current.prNumber
    && approval.context.baseBranch === current.baseBranch
    && approval.context.baseSha === current.baseSha
    && approval.context.headSha === current.headSha
    && approval.context.canonicalChangedFileSetHash === current.canonicalChangedFileSetHash
    && approval.context.canonicalDiffReviewDigest === current.canonicalDiffReviewDigest
    && approval.context.action === current.action;
}

function boundedReason(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw.slice(0, 500);
}

/**
 * Phase 5 + Controlled-Cutover execution order is intentionally fixed:
 * 1. load immutable Phase-4 approval evidence;
 * 2. re-resolve authoritative GitHub PR state;
 * 3. reject any base/head/file-set/diff drift;
 * 4. resolve the current same-repository PR head branch and require it to still point at headSha;
 * 5. atomically claim the approval + exact PR head in durable storage;
 * 6. issue one and only one external CI dispatch attempt against that exact branch ref;
 * 7. keep the consumption PENDING until the dispatched workflow redeems its single-use
 *    consumptionId through the server-side workflow gate before any expensive CI step.
 *
 * There is no automatic retry after step 5. A network-ambiguous dispatch could already have reached
 * GitHub; retrying would violate the at-most-one expensive CI invariant. Recovery must first inspect
 * GitHub state and proceed through a separate Human-controlled path.
 */
export async function consumeM10ApprovalForCi(
  approvalId: string,
  deps: Readonly<ConsumeM10ApprovalDeps>,
): Promise<ConsumeM10ApprovalResult> {
  let approval: Readonly<M10ApprovalEvidence> | null;
  try {
    approval = await deps.approvalStore.get(approvalId);
  } catch (err) {
    return { verdict: 'DENY', reason: `M10-Approval konnte nicht geladen werden: ${boundedReason(err)}` };
  }

  if (!approval) return { verdict: 'DENY', reason: 'Unbekannte M10-Approval-Evidence.' };
  if (approval.consumedAt) return { verdict: 'DEDUPE', reason: 'M10-Approval wurde bereits für CI verbraucht.' };

  const resolved = await resolveTrustedPrState(
    { repository: approval.context.repository, prNumber: approval.context.prNumber },
    { githubApiFetch: deps.githubApiFetch },
  );
  if (resolved.verdict === 'DENY') return { verdict: 'DENY', reason: resolved.reason };

  if (!sameApprovalContext(approval, resolved.state)) {
    return { verdict: 'DENY', reason: 'PR-/Owner-Zustand hat sich seit Owner-Approval geändert; CI wird nicht gestartet.' };
  }

  const dispatchRef = await resolveTrustedM10DispatchRef(
    {
      repository: resolved.state.repository,
      prNumber: resolved.state.prNumber,
      expectedHeadSha: resolved.state.headSha,
    },
    deps.githubApiFetch,
  );
  if (dispatchRef.verdict === 'DENY') return { verdict: 'DENY', reason: dispatchRef.reason };

  const consumptionId = generateOpaqueToken(16);
  let claim: M10ConsumptionClaimResult;
  try {
    claim = await deps.approvalStore.claim({
      approvalId: approval.approvalId,
      consumptionId,
      expectedRepository: resolved.state.repository,
      expectedPrNumber: resolved.state.prNumber,
      expectedHeadSha: resolved.state.headSha,
      expectedAuthorizationDigest: approval.authorizationDigest,
    });
  } catch (err) {
    return { verdict: 'DENY', reason: `M10-Approval konnte nicht atomar konsumiert werden: ${boundedReason(err)}` };
  }

  if (claim.status === 'DEDUPE_HEAD' || claim.status === 'DEDUPE_APPROVAL') {
    return {
      verdict: 'DEDUPE',
      reason: claim.status === 'DEDUPE_HEAD'
        ? 'Für diesen exakten PR-Head wurde bereits ein M10-CI-Lauf beansprucht.'
        : 'Diese M10-Approval-Evidence wurde bereits verbraucht.',
    };
  }

  if (claim.status !== 'CLAIMED') {
    return { verdict: 'DENY', reason: claim.reason || `M10-Consumption-Claim abgelehnt: ${claim.status}` };
  }

  const evidence: M10CiConsumptionEvidence = {
    consumptionId: claim.consumptionId,
    approvalId: approval.approvalId,
    repository: resolved.state.repository,
    prNumber: resolved.state.prNumber,
    headSha: resolved.state.headSha,
    authorizationDigest: approval.authorizationDigest,
    consumedAt: claim.consumedAt,
    dispatchState: 'PENDING',
  };

  let dispatch: Readonly<{ accepted: boolean; reference?: string }>;
  try {
    dispatch = await deps.dispatcher.dispatch({
      consumptionId: evidence.consumptionId,
      approvalId: approval.approvalId,
      repository: resolved.state.repository,
      prNumber: resolved.state.prNumber,
      baseSha: resolved.state.baseSha,
      headSha: resolved.state.headSha,
      headRef: dispatchRef.headRef,
      authorizationDigest: approval.authorizationDigest,
      action: 'AUTHORIZE_PR_CI',
    });
  } catch (err) {
    const reason = `GitHub-CI-Dispatch ist nach atomarem Verbrauch unklar: ${boundedReason(err)}`;
    try {
      await deps.approvalStore.finalizeDispatch(evidence.consumptionId, 'FAILED_UNCERTAIN', reason);
    } catch {
      // The approval is already durably consumed. Never retry dispatch merely because audit finalize failed.
    }
    return { verdict: 'DISPATCH_UNCERTAIN', consumptionId: evidence.consumptionId, reason };
  }

  if (!dispatch.accepted) {
    const reason = 'GitHub-CI-Dispatch wurde nicht eindeutig akzeptiert; automatischer Retry ist gesperrt.';
    try {
      await deps.approvalStore.finalizeDispatch(evidence.consumptionId, 'FAILED_UNCERTAIN', reason);
    } catch {
      // Same invariant as above: uncertain external outcome remains terminal until human reconciliation.
    }
    return { verdict: 'DISPATCH_UNCERTAIN', consumptionId: evidence.consumptionId, reason };
  }

  // Do NOT mark DISPATCHED here. A manual workflow_dispatch must never be able to bypass WebAuthn
  // simply by copying public PR metadata. The dispatched workflow has to redeem this high-entropy,
  // single-use consumptionId through the production workflow gate before any expensive step. That
  // gate performs the only PENDING -> DISPATCHED transition; a replay loses the atomic race.
  return {
    verdict: 'DISPATCH_ACCEPTED',
    consumption: evidence,
    dispatchReference: dispatch.reference,
  };
}
