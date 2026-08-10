// ESS-0018 Phase 2 / ADR-0051: Approval-artifact implementation. Real, working version of the
// contract that CAPITAL-AI's Google-Analytics-Provisioner spec (docs/architecture/
// CAPITAL_AI_ENTERPRISE_GOOGLE_ANALYTICS_MCP_IMPLEMENTATION.md §25 "AnalyticsApproval") only ever
// documented. Single-use, short-lived, bound to exactly the action + plan hash it was issued
// for - a valid approval for one plan can never authorize a different plan.

import crypto from 'crypto';
import { getPrivilegedServerSupabase, isPrivilegedSupabaseConfigured } from '../../../server/db';

const APPROVAL_TTL_MS = 10 * 60_000;

/**
 * Deterministic plan hash so an approval can only be consumed for the exact proposed change it
 * was issued for. Callers build `plan` from the concrete parameters of the write (e.g.
 * { action, targetResource, expectedFingerprint }) - never from free text.
 */
export function computePlanHash(plan: Record<string, unknown>): string {
  const normalized = JSON.stringify(plan, Object.keys(plan).sort());
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export interface IssueApprovalInput {
  actorUserId: string;
  action: string;
  planHash: string;
  targetResource: string;
  expectedFingerprint?: string;
  stepUpEvidenceId?: string;
}

/**
 * Issues a new approval artifact. Callers MUST already have verified OWNER role + fresh TOTP
 * step-up before calling this (same separation of concerns as grantCapability()).
 */
export async function issueApproval(input: IssueApprovalInput): Promise<{ id: string; expiresAt: string } | null> {
  if (!isPrivilegedSupabaseConfigured()) return null;

  const expiresAt = new Date(Date.now() + APPROVAL_TTL_MS).toISOString();
  const supabase = getPrivilegedServerSupabase();
  const { data, error } = await supabase
    .from('agent_action_approvals')
    .insert({
      actor_user_id: input.actorUserId,
      action: input.action,
      plan_hash: input.planHash,
      target_resource: input.targetResource,
      expected_fingerprint: input.expectedFingerprint ?? null,
      step_up_evidence_id: input.stepUpEvidenceId ?? null,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error(`[Approvals][ERROR] issueApproval fehlgeschlagen: ${error?.message}`);
    return null;
  }
  return { id: data.id, expiresAt };
}

export type ApprovalConsumptionResult = 'CONSUMED' | 'NOT_FOUND' | 'EXPIRED_OR_ALREADY_CONSUMED' | 'PLAN_MISMATCH';

/**
 * Atomically consumes an approval artifact - single-use via `UPDATE ... WHERE consumed_at IS
 * NULL AND expires_at > now()`, the same race-safe pattern authMiddleware.ts's requireStepUp()
 * uses for step_up_tokens. Verifies the approval was issued for this exact action + planHash
 * before consuming it, so an approval can never be replayed against a different proposed change.
 */
export async function consumeApproval(
  approvalId: string,
  action: string,
  planHash: string
): Promise<ApprovalConsumptionResult> {
  if (!isPrivilegedSupabaseConfigured()) return 'NOT_FOUND';

  const supabase = getPrivilegedServerSupabase();
  const { data: existing, error: lookupError } = await supabase
    .from('agent_action_approvals')
    .select('id, action, plan_hash, consumed_at, expires_at')
    .eq('id', approvalId)
    .maybeSingle();

  if (lookupError || !existing) return 'NOT_FOUND';
  if (existing.action !== action || existing.plan_hash !== planHash) return 'PLAN_MISMATCH';

  const nowIso = new Date().toISOString();
  const { data: consumed, error: consumeError } = await supabase
    .from('agent_action_approvals')
    .update({ consumed_at: nowIso, consumed_result: 'CONSUMED' })
    .eq('id', approvalId)
    .is('consumed_at', null)
    .gt('expires_at', nowIso)
    .select('id')
    .maybeSingle();

  if (consumeError) {
    console.error(`[Approvals][ERROR] consumeApproval fehlgeschlagen: ${consumeError.message}`);
    return 'NOT_FOUND';
  }
  return consumed ? 'CONSUMED' : 'EXPIRED_OR_ALREADY_CONSUMED';
}
