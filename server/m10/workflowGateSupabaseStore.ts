// M10 Controlled Cutover — server-side single-use gate for dispatched GitHub Actions runs.
//
// The high-entropy Phase-5 consumptionId acts as a one-time capability. A workflow_dispatch run
// must present it together with exact trusted PR context before any expensive CI step. The caller
// re-resolves the current GitHub base/head/file-set/diff immediately before this store check. The
// only winner atomically transitions the durable consumption PENDING -> DISPATCHED through the
// existing Phase-5 RPC; replays and manually fabricated dispatches fail closed.
import { getPrivilegedServerSupabase, isPrivilegedSupabaseConfigured } from '../db';

export interface M10WorkflowGateInput {
  consumptionId: string;
  approvalId: string;
  repository: string;
  prNumber: number;
  baseSha: string;
  headSha: string;
  changedFileSetHash: string;
  diffReviewDigest: string;
  authorizationDigest: string;
  action: 'AUTHORIZE_PR_CI';
}

export type M10WorkflowGateClaimResult =
  | { status: 'CLAIMED' }
  | {
      status:
        | 'DENY_UNKNOWN_CONSUMPTION'
        | 'DENY_CONTEXT_MISMATCH'
        | 'DENY_ALREADY_FINALIZED'
        | 'DENY_STORE_UNAVAILABLE'
        | 'DENY_AUDIT_UNAVAILABLE';
      reason: string;
    };

interface ConsumptionRow {
  consumption_id: string;
  approval_id: string;
  repository: string;
  pr_number: number;
  head_sha: string;
  authorization_digest: string;
  dispatch_state: 'PENDING' | 'DISPATCHED' | 'FAILED_UNCERTAIN';
}

interface ApprovalRow {
  approval_id: string;
  repository: string;
  pr_number: number;
  base_sha: string;
  head_sha: string;
  changed_file_set_hash: string;
  diff_review_digest: string;
  authorization_digest: string;
  action: 'AUTHORIZE_PR_CI';
  consumed_at: string | null;
}

export async function claimM10WorkflowGate(
  input: Readonly<M10WorkflowGateInput>,
  beforeFinalize?: () => Promise<void>,
): Promise<M10WorkflowGateClaimResult> {
  if (!isPrivilegedSupabaseConfigured()) {
    return { status: 'DENY_STORE_UNAVAILABLE', reason: 'Privileged M10 store is unavailable.' };
  }

  const supabase = getPrivilegedServerSupabase();
  const { data: consumptionData, error: consumptionError } = await supabase
    .from('m10_ci_consumptions')
    .select('consumption_id, approval_id, repository, pr_number, head_sha, authorization_digest, dispatch_state')
    .eq('consumption_id', input.consumptionId)
    .maybeSingle();

  if (consumptionError) {
    return { status: 'DENY_STORE_UNAVAILABLE', reason: `M10 consumption lookup failed: ${consumptionError.message}` };
  }
  if (!consumptionData) {
    return { status: 'DENY_UNKNOWN_CONSUMPTION', reason: 'Unknown M10 CI consumption capability.' };
  }

  const consumption = consumptionData as ConsumptionRow;
  if (consumption.dispatch_state !== 'PENDING') {
    return { status: 'DENY_ALREADY_FINALIZED', reason: 'M10 CI consumption capability is no longer redeemable.' };
  }

  if (
    consumption.approval_id !== input.approvalId
    || consumption.repository !== input.repository
    || consumption.pr_number !== input.prNumber
    || consumption.head_sha !== input.headSha
    || consumption.authorization_digest !== input.authorizationDigest
  ) {
    return { status: 'DENY_CONTEXT_MISMATCH', reason: 'M10 CI consumption context mismatch.' };
  }

  const { data: approvalData, error: approvalError } = await supabase
    .from('m10_approval_evidence')
    .select('approval_id, repository, pr_number, base_sha, head_sha, changed_file_set_hash, diff_review_digest, authorization_digest, action, consumed_at')
    .eq('approval_id', input.approvalId)
    .maybeSingle();

  if (approvalError) {
    return { status: 'DENY_STORE_UNAVAILABLE', reason: `M10 approval lookup failed: ${approvalError.message}` };
  }
  if (!approvalData) {
    return { status: 'DENY_CONTEXT_MISMATCH', reason: 'M10 approval evidence is missing for the consumption.' };
  }

  const approval = approvalData as ApprovalRow;
  if (
    !approval.consumed_at
    || approval.repository !== input.repository
    || approval.pr_number !== input.prNumber
    || approval.base_sha !== input.baseSha
    || approval.head_sha !== input.headSha
    || approval.changed_file_set_hash !== input.changedFileSetHash
    || approval.diff_review_digest !== input.diffReviewDigest
    || approval.authorization_digest !== input.authorizationDigest
    || approval.action !== input.action
  ) {
    return { status: 'DENY_CONTEXT_MISMATCH', reason: 'M10 approval evidence does not match the current trusted workflow-gate context.' };
  }

  if (beforeFinalize) {
    try {
      await beforeFinalize();
    } catch (err: any) {
      return {
        status: 'DENY_AUDIT_UNAVAILABLE',
        reason: `M10 workflow gate audit persistence failed: ${err?.message || String(err)}`,
      };
    }
  }

  // The existing Phase-5 RPC is the atomic single winner. A concurrent replay sees false after the
  // first caller transitions PENDING -> DISPATCHED and therefore cannot enter the expensive path.
  const { data: finalized, error: finalizeError } = await supabase.rpc('finalize_m10_ci_dispatch', {
    p_consumption_id: input.consumptionId,
    p_terminal_state: 'DISPATCHED',
    p_failure_reason: null,
  });

  if (finalizeError) {
    return { status: 'DENY_STORE_UNAVAILABLE', reason: `M10 workflow gate finalization failed: ${finalizeError.message}` };
  }
  if (finalized !== true) {
    return { status: 'DENY_ALREADY_FINALIZED', reason: 'M10 CI consumption capability lost the atomic redemption race.' };
  }

  return { status: 'CLAIMED' };
}
