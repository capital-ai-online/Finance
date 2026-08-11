// ESS-0018 Phase 2 / ADR-0051 / ADR-0046: Admin/Support/Diagnostics endpoints. Two authorization
// layers on every route: (1) coarse role check, (2) fine-grained capability check inside
// AdminDiagnosticsAgent. Every write path requires an explicit approval artefact.

import express from 'express';
import { checkAdminAccess, requireStepUp } from '../src/platform/Security/authMiddleware';
import { DIAGNOSTIC_ZONE_ROLES, OPERATIONS_ZONE_ROLES, OWNER_ONLY_ROLES } from '../src/platform/Security/types';
import { AdminDiagnosticsAgent } from '../src/agents/adminDiagnosticsAgent';
import { grantCapability, revokeCapability, isKnownCapability } from '../src/platform/Security/capabilities';
import { issueApproval } from '../src/platform/Security/approvals';
import { logSystemEvent } from './systemEvents';

export const adminDiagnosticsRouter = express.Router();

const agent = new AdminDiagnosticsAgent();

async function requireOwnerWithStepUp(req: express.Request, res: express.Response, zone: string): Promise<{ userId: string; actorLabel: string } | null> {
  const authz = await checkAdminAccess(req, zone, OWNER_ONLY_ROLES);
  if (!authz.authorized || !authz.userId) {
    res.status(403).json({ error: 'Access Denied: Restricted to the CAPITAL-AI owner.', reason: authz.reason });
    return null;
  }
  const stepUpOk = await requireStepUp(req);
  if (!stepUpOk) {
    res.status(428).json({ error: 'Diese Aktion erfordert einen frischen Step-Up-Nachweis (TOTP).', code: 'step_up_required' });
    return null;
  }
  return { userId: authz.userId, actorLabel: authz.actorLabel || authz.userId };
}

// ---- Reads (diagnostic roles + capability grant) -----------------------------------------------

adminDiagnosticsRouter.get('/', async (req, res) => {
  const authz = await checkAdminAccess(req, 'admin-diagnostics:read', DIAGNOSTIC_ZONE_ROLES);
  if (!authz.authorized || !authz.userId) {
    return res.status(403).json({ error: 'Access Denied: Diagnose-Rolle erforderlich.', reason: authz.reason });
  }

  const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
  const email = typeof req.query.email === 'string' ? req.query.email : undefined;
  try {
    const result = await agent.readDiagnostics(authz.userId, { userId, email });
    if (result.authorized === false) {
      return res.status(403).json({ error: 'Capability nicht erteilt.', capability: result.capability });
    }
    logSystemEvent('ORCHESTRATOR', 'Admin Diagnostics Read', authz.actorLabel || 'unknown', `userId=${userId ?? '-'} email=${email ?? '-'}`, 'SUCCESS');
    res.json(result.data);
  } catch (err: any) {
    res.status(400).json({ error: 'Diagnostics-Anfrage fehlgeschlagen', message: err?.message || String(err) });
  }
});

adminDiagnosticsRouter.get('/providers', async (req, res) => {
  const authz = await checkAdminAccess(req, 'admin-diagnostics:providers-read', DIAGNOSTIC_ZONE_ROLES);
  if (!authz.authorized || !authz.userId) {
    return res.status(403).json({ error: 'Access Denied: Diagnose-Rolle erforderlich.', reason: authz.reason });
  }

  try {
    const result = await agent.readProviderHealth(authz.userId);
    if (result.authorized === false) {
      return res.status(403).json({ error: 'Capability nicht erteilt.', capability: result.capability });
    }
    logSystemEvent('ORCHESTRATOR', 'Provider Diagnostics Read', authz.actorLabel || 'unknown', `providers=${result.data.length}`, 'SUCCESS');
    res.json({ providers: result.data });
  } catch (err: any) {
    res.status(400).json({ error: 'Provider-Diagnose fehlgeschlagen', message: err?.message || String(err) });
  }
});

adminDiagnosticsRouter.get('/alert-subscriptions/:id/preview', async (req, res) => {
  const authz = await checkAdminAccess(req, 'admin-diagnostics:alert-subscription-preview', DIAGNOSTIC_ZONE_ROLES);
  if (!authz.authorized || !authz.userId) {
    return res.status(403).json({ error: 'Access Denied: Diagnose-Rolle erforderlich.', reason: authz.reason });
  }
  try {
    const result = await agent.previewAlertSubscriptionDisable(authz.userId, req.params.id);
    if (result.authorized === false) {
      return res.status(403).json({ error: 'Capability nicht erteilt.', capability: result.capability });
    }
    if (!result.preview) {
      return res.status(404).json({ error: 'Alert-Abo nicht gefunden.' });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: 'Preview fehlgeschlagen', message: err?.message || String(err) });
  }
});

adminDiagnosticsRouter.get('/alert-subscriptions/:id/confirmation-preview', async (req, res) => {
  const authz = await checkAdminAccess(req, 'admin-diagnostics:alert-subscription-confirmation-preview', DIAGNOSTIC_ZONE_ROLES);
  if (!authz.authorized || !authz.userId) {
    return res.status(403).json({ error: 'Access Denied: Diagnose-Rolle erforderlich.', reason: authz.reason });
  }
  try {
    const result = await agent.previewAlertSubscriptionResendConfirmation(authz.userId, req.params.id);
    if (result.authorized === false) {
      return res.status(403).json({ error: 'Capability nicht erteilt.', capability: result.capability });
    }
    if (!result.preview) {
      return res.status(404).json({ error: 'Alert-Abo nicht gefunden.' });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: 'Preview fehlgeschlagen', message: err?.message || String(err) });
  }
});

// ---- Capability grant/revoke (OWNER + fresh Step-up) -------------------------------------------

adminDiagnosticsRouter.post('/capabilities/grant', async (req, res) => {
  const owner = await requireOwnerWithStepUp(req, res, 'admin-diagnostics:capability-grant');
  if (!owner) return;

  const { capability, granteeUserId, expiresAt, reason } = req.body || {};
  if (!isKnownCapability(capability) || typeof granteeUserId !== 'string' || !granteeUserId) {
    return res.status(400).json({ error: 'capability (bekannter Wert) und granteeUserId erforderlich.' });
  }

  const result = await grantCapability({ capability, granteeUserId, grantedByUserId: owner.userId, expiresAt, reason });
  if (!result) return res.status(500).json({ error: 'Grant konnte nicht gespeichert werden.' });

  logSystemEvent('SECURITY', 'Capability Granted', owner.actorLabel, `capability=${capability} grantee=${granteeUserId} grantId=${result.id}`, 'SUCCESS');
  res.json({ grantId: result.id });
});

adminDiagnosticsRouter.post('/capabilities/revoke', async (req, res) => {
  const owner = await requireOwnerWithStepUp(req, res, 'admin-diagnostics:capability-revoke');
  if (!owner) return;

  const { grantId } = req.body || {};
  if (typeof grantId !== 'string' || !grantId) {
    return res.status(400).json({ error: 'grantId erforderlich.' });
  }

  const revoked = await revokeCapability(grantId, owner.userId);
  logSystemEvent('SECURITY', 'Capability Revoked', owner.actorLabel, `grantId=${grantId} success=${revoked}`, revoked ? 'SUCCESS' : 'WARNING');
  res.json({ revoked });
});

// ---- Approval issuance (OWNER + fresh Step-up) --------------------------------------------------

adminDiagnosticsRouter.post('/approvals', async (req, res) => {
  const owner = await requireOwnerWithStepUp(req, res, 'admin-diagnostics:approval-issue');
  if (!owner) return;

  const { action, planHash, targetResource, expectedFingerprint } = req.body || {};
  if (typeof action !== 'string' || typeof planHash !== 'string' || typeof targetResource !== 'string') {
    return res.status(400).json({ error: 'action, planHash und targetResource erforderlich.' });
  }

  const result = await issueApproval({
    actorUserId: owner.userId,
    action,
    planHash,
    targetResource,
    expectedFingerprint,
  });
  if (!result) return res.status(500).json({ error: 'Approval konnte nicht ausgestellt werden.' });

  logSystemEvent('SECURITY', 'Approval Issued', owner.actorLabel, `action=${action} target=${targetResource} approvalId=${result.id}`, 'SUCCESS');
  res.json(result);
});

// ---- Writes (operations roles + capability + consumed approval) --------------------------------

adminDiagnosticsRouter.post('/alert-subscriptions/:id/disable', async (req, res) => {
  const authz = await checkAdminAccess(req, 'admin-diagnostics:alert-subscription-disable', OPERATIONS_ZONE_ROLES);
  if (!authz.authorized || !authz.userId) {
    return res.status(403).json({ error: 'Access Denied: Operations-Rolle erforderlich.', reason: authz.reason });
  }

  const { approvalId, expectedFingerprint } = req.body || {};
  if (typeof approvalId !== 'string' || !approvalId || typeof expectedFingerprint !== 'string' || !expectedFingerprint) {
    return res.status(400).json({
      error: 'approvalId und expectedFingerprint erforderlich - zuerst GET .../preview aufrufen und ein Approval ueber POST /api/admin/approvals einholen.',
    });
  }

  try {
    const result = await agent.applyAlertSubscriptionDisable(authz.userId, { id: req.params.id, expectedFingerprint, approvalId });
    if (result.authorized === false) {
      return res.status(403).json({ error: 'Capability nicht erteilt.', capability: result.capability });
    }

    logSystemEvent(
      'ORCHESTRATOR',
      'Alert Subscription Disable',
      authz.actorLabel || 'unknown',
      `id=${req.params.id} outcome=${result.outcome.status}`,
      result.outcome.status === 'APPLIED' ? 'SUCCESS' : 'WARNING'
    );

    if (result.outcome.status === 'DENIED_POLICY' || result.outcome.status === 'DENIED_APPROVAL') {
      return res.status(403).json(result.outcome);
    }
    res.json(result.outcome);
  } catch (err: any) {
    res.status(400).json({ error: 'Disable fehlgeschlagen', message: err?.message || String(err) });
  }
});

adminDiagnosticsRouter.post('/alert-subscriptions/:id/resend-confirmation', async (req, res) => {
  const authz = await checkAdminAccess(req, 'admin-diagnostics:alert-subscription-resend-confirmation', OPERATIONS_ZONE_ROLES);
  if (!authz.authorized || !authz.userId) {
    return res.status(403).json({ error: 'Access Denied: Operations-Rolle erforderlich.', reason: authz.reason });
  }

  const { approvalId, expectedFingerprint } = req.body || {};
  if (typeof approvalId !== 'string' || !approvalId || typeof expectedFingerprint !== 'string' || !expectedFingerprint) {
    return res.status(400).json({
      error: 'approvalId und expectedFingerprint erforderlich - zuerst GET .../confirmation-preview aufrufen und ein Approval ueber POST /api/admin/approvals einholen.',
    });
  }

  try {
    const result = await agent.applyAlertSubscriptionResendConfirmation(authz.userId, { id: req.params.id, expectedFingerprint, approvalId });
    if (result.authorized === false) {
      return res.status(403).json({ error: 'Capability nicht erteilt.', capability: result.capability });
    }

    logSystemEvent(
      'ORCHESTRATOR',
      'Alert Subscription Resend Confirmation',
      authz.actorLabel || 'unknown',
      `id=${req.params.id} outcome=${result.outcome.status}`,
      result.outcome.status === 'APPLIED' ? 'SUCCESS' : 'WARNING'
    );

    if (result.outcome.status === 'DENIED_POLICY' || result.outcome.status === 'DENIED_APPROVAL') {
      return res.status(403).json(result.outcome);
    }
    res.json(result.outcome);
  } catch (err: any) {
    res.status(400).json({ error: 'Resend fehlgeschlagen', message: err?.message || String(err) });
  }
});
