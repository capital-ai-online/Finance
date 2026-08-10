/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ESS-0018 Phase 2 / ADR-0051: Admin/Support/Diagnostics agent. Deterministic ops orchestration
// (no LLM call - unlike ScoreExplainabilityAgent, there is nothing here that benefits from
// natural-language generation; the value is the governance chain, not an explanation). Every
// method re-checks the specific capability required before touching a tool, on top of the
// coarse role check (checkAdminAccess) the HTTP layer already performs - this is the
// fine-grained half of ESS-0018's dual-layer authorization design.

import { CAPABILITIES, checkCapability } from '../platform/Security/capabilities';
import { computePlanHash } from '../platform/Security/approvals';
import { executeApprovedSupervisedAction } from '../platform/Supervisor/supervisor';
import {
  getAdminDiagnostics,
  getAlertSubscriptionPreview,
  disableAlertSubscription,
  getAlertSubscriptionConfirmationPreview,
  resendAlertSubscriptionConfirmation,
  type AdminDiagnosticsRequest,
  type AdminDiagnosticsResult,
  type AlertSubscriptionPreview,
  type AlertSubscriptionConfirmationPreview,
  type ResendAlertSubscriptionConfirmationResult,
} from '../services/agentTools/supabaseAdminDiagnosticsTool';

export type CapabilityDeniedResult = { authorized: false; capability: string };

export class AdminDiagnosticsAgent {
  public async readDiagnostics(
    actorUserId: string,
    request: AdminDiagnosticsRequest
  ): Promise<{ authorized: true; data: AdminDiagnosticsResult } | CapabilityDeniedResult> {
    const allowed = await checkCapability(actorUserId, CAPABILITIES.ADMIN_DIAGNOSTICS_READ);
    if (!allowed) {
      const denied: CapabilityDeniedResult = { authorized: false, capability: CAPABILITIES.ADMIN_DIAGNOSTICS_READ };
      return denied;
    }
    const data = await getAdminDiagnostics(request);
    return { authorized: true as const, data };
  }

  /** Read-only preview of a proposed alert-subscription disable + the plan hash an owner must
   * cite when issuing an approval for it. No approval consumed here. */
  public async previewAlertSubscriptionDisable(
    actorUserId: string,
    id: string
  ): Promise<
    | { authorized: true; preview: AlertSubscriptionPreview; action: string; planHash: string }
    | CapabilityDeniedResult
    | { authorized: true; preview: null }
  > {
    const allowed = await checkCapability(actorUserId, CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_DISABLE);
    if (!allowed) {
      const denied: CapabilityDeniedResult = { authorized: false, capability: CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_DISABLE };
      return denied;
    }

    const preview = await getAlertSubscriptionPreview(id);
    if (!preview) return { authorized: true as const, preview: null };

    const action = 'supabase.admin.alert_subscription.disable';
    const planHash = computePlanHash({ action, id: preview.id, expectedFingerprint: preview.fingerprint });
    return { authorized: true as const, preview, action, planHash };
  }

  /** Apply. Requires a caller-supplied, already-issued approvalId bound to exactly this
   * action+planHash (issued via POST /api/admin/approvals after an owner reviewed the preview
   * above). */
  public async applyAlertSubscriptionDisable(
    actorUserId: string,
    request: { id: string; expectedFingerprint: string; approvalId: string }
  ): Promise<
    | { authorized: true; outcome: Awaited<ReturnType<typeof executeApprovedSupervisedAction>> }
    | CapabilityDeniedResult
  > {
    const allowed = await checkCapability(actorUserId, CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_DISABLE);
    if (!allowed) {
      const denied: CapabilityDeniedResult = { authorized: false, capability: CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_DISABLE };
      return denied;
    }

    const action = 'supabase.admin.alert_subscription.disable';
    const planHash = computePlanHash({ action, id: request.id, expectedFingerprint: request.expectedFingerprint });

    const outcome = await executeApprovedSupervisedAction({
      taskName: 'admin-diagnostics:alert-subscription-disable',
      action,
      capability: CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_DISABLE,
      planHash,
      approvalId: request.approvalId,
      actorUserId,
      targetResource: `alert_subscriptions:${request.id}`,
      fn: () => disableAlertSubscription({ id: request.id, expectedFingerprint: request.expectedFingerprint }),
    });

    return { authorized: true as const, outcome };
  }

  /** Read-only preview of a proposed confirmation resend + the plan hash an owner must cite when
   * issuing an approval for it. No approval consumed here. */
  public async previewAlertSubscriptionResendConfirmation(
    actorUserId: string,
    id: string
  ): Promise<
    | { authorized: true; preview: AlertSubscriptionConfirmationPreview; action: string; planHash: string }
    | CapabilityDeniedResult
    | { authorized: true; preview: null }
  > {
    const allowed = await checkCapability(actorUserId, CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_RESEND_CONFIRMATION);
    if (!allowed) {
      const denied: CapabilityDeniedResult = { authorized: false, capability: CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_RESEND_CONFIRMATION };
      return denied;
    }

    const preview = await getAlertSubscriptionConfirmationPreview(id);
    if (!preview) return { authorized: true as const, preview: null };

    const action = 'supabase.admin.alert_subscription.resend_confirmation';
    const planHash = computePlanHash({ action, id: preview.id, expectedFingerprint: preview.fingerprint });
    return { authorized: true as const, preview, action, planHash };
  }

  /** Apply. Requires a caller-supplied, already-issued approvalId bound to exactly this
   * action+planHash (issued via POST /api/admin/approvals after an owner reviewed the preview
   * above). */
  public async applyAlertSubscriptionResendConfirmation(
    actorUserId: string,
    request: { id: string; expectedFingerprint: string; approvalId: string }
  ): Promise<
    | { authorized: true; outcome: Awaited<ReturnType<typeof executeApprovedSupervisedAction<ResendAlertSubscriptionConfirmationResult>>> }
    | CapabilityDeniedResult
  > {
    const allowed = await checkCapability(actorUserId, CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_RESEND_CONFIRMATION);
    if (!allowed) {
      const denied: CapabilityDeniedResult = { authorized: false, capability: CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_RESEND_CONFIRMATION };
      return denied;
    }

    const action = 'supabase.admin.alert_subscription.resend_confirmation';
    const planHash = computePlanHash({ action, id: request.id, expectedFingerprint: request.expectedFingerprint });

    const outcome = await executeApprovedSupervisedAction({
      taskName: 'admin-diagnostics:alert-subscription-resend-confirmation',
      action,
      capability: CAPABILITIES.ADMIN_ALERT_SUBSCRIPTION_RESEND_CONFIRMATION,
      planHash,
      approvalId: request.approvalId,
      actorUserId,
      targetResource: `alert_subscriptions:${request.id}`,
      fn: () => resendAlertSubscriptionConfirmation({ id: request.id, expectedFingerprint: request.expectedFingerprint }),
    });

    return { authorized: true as const, outcome };
  }
}
