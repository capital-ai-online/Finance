// M9 (ADR-0063) Break-Glass — Owner-ACCEPTED design,
// docs/evidence/m9/M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md, live-wiring step. Reuses the
// established Owner+step-up pattern from server/adminDiagnostics.ts (requireOwnerWithStepUp)
// rather than inventing a new auth mechanism.
//
// Scope of this file: activation, revocation and status of an ephemeral break-glass
// RoadmapExecutionMandate. Revocation state is deliberately kept in-memory (this deployment is a
// single Render web-service instance, matching rateLimiter.ts's own documented single-instance
// assumption) rather than a new Supabase table - a new table is a production schema mutation with
// its own lifecycle (Policy -> Grant -> Approval -> Dry-run -> Apply -> Verify -> Audit) that does
// not belong inside this step. A restarted server loses in-memory revocation state, which is an
// acceptable property for a mechanism whose mandates already expire within 30 minutes by design.
import express from 'express';
import { checkAdminAccess, requireStepUp } from '../../src/platform/Security/authMiddleware';
import { OWNER_ONLY_ROLES } from '../../src/platform/Security/types';
import {
  activateBreakGlass,
  isBreakGlassMandateActive,
  type BreakGlassActivationRequest,
} from '../../src/platform/Security/breakGlass';
import { SYSTEMADMIN_OWNER_ACTOR_ID } from '../../src/platform/Security/roadmapExecutionMandate';
import { writeAgentAuditEvent } from '../agentAudit/agentAuditWriter';
import { checkRateLimit, getClientIp } from '../../src/platform/Security/rateLimiter';

export const breakGlassRouter = express.Router();

interface StoredMandateEntry {
  mandate: BreakGlassActivationResultMandate;
  revoked: boolean;
}

type BreakGlassActivationResultMandate = Extract<
  ReturnType<typeof activateBreakGlass>,
  { verdict: 'ALLOW' }
>['mandate'];

// Module-scoped, single-instance store - see file header for why this is intentionally not a
// Supabase table.
const activeMandates = new Map<string, StoredMandateEntry>();

async function requireOwnerWithStepUp(
  req: express.Request,
  res: express.Response,
  zone: string,
): Promise<{ userId: string; actorLabel: string } | null> {
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

function requestId(): string {
  return `break-glass-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

breakGlassRouter.post('/activate', async (req, res) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`break-glass-activate:${ip}`, 5, 5 * 60_000)) {
    return res.status(429).json({ error: 'Zu viele Versuche. Bitte 5 Minuten warten.' });
  }

  const owner = await requireOwnerWithStepUp(req, res, 'systemadmin:break-glass-activate');
  if (!owner) return;

  const { capability, targetResource, reason, roadmapItem, allowedPaths } = req.body || {};
  const activationRequest: BreakGlassActivationRequest = {
    ownerActorId: SYSTEMADMIN_OWNER_ACTOR_ID,
    capability: typeof capability === 'string' ? capability : '',
    targetResource: typeof targetResource === 'string' ? targetResource : '',
    reason: typeof reason === 'string' ? reason : '',
    roadmapItem: typeof roadmapItem === 'string' ? roadmapItem : '',
    allowedPaths: Array.isArray(allowedPaths) ? allowedPaths.filter((p): p is string => typeof p === 'string') : [],
    stepUpVerified: true,
  };

  const result = activateBreakGlass(activationRequest);
  const traceId = requestId();

  if (result.verdict === 'DENY') {
    await writeAgentAuditEvent({
      requestId: traceId,
      traceId,
      humanActorId: owner.userId,
      appId: 'break-glass-console',
      agentId: 'break-glass-console',
      intent: 'break_glass_activation',
      scope: { targetResource: activationRequest.targetResource, roadmapItem: activationRequest.roadmapItem },
      capability: activationRequest.capability || 'UNKNOWN',
      riskClass: 'MEDIUM',
      policyId: 'ADR-0063/M9-BREAK-GLASS',
      decision: 'DENY',
      result: 'DENIED',
      metadata: { reason: result.reason },
    }).catch(() => {});
    return res.status(403).json({ error: result.reason });
  }

  activeMandates.set(result.mandate.mandateId, { mandate: result.mandate, revoked: false });

  await writeAgentAuditEvent({
    requestId: traceId,
    traceId,
    humanActorId: owner.userId,
    appId: 'break-glass-console',
    agentId: 'break-glass-console',
    intent: 'break_glass_activation',
    scope: {
      mandateId: result.mandate.mandateId,
      targetResource: result.mandate.allowedTargets[0],
      capability: result.mandate.allowedCapabilities[0],
      roadmapItem: result.mandate.roadmapItems[0],
      expiresAt: result.mandate.expiresAt,
    },
    capability: result.mandate.allowedCapabilities[0],
    riskClass: 'MEDIUM',
    policyId: 'ADR-0063/M9-BREAK-GLASS',
    decision: 'ALLOW',
    result: 'SUCCESS',
    metadata: { reason: activationRequest.reason },
  }).catch(() => {});

  res.json({ mandate: result.mandate });
});

breakGlassRouter.post('/revoke', async (req, res) => {
  const owner = await requireOwnerWithStepUp(req, res, 'systemadmin:break-glass-revoke');
  if (!owner) return;

  const { mandateId } = req.body || {};
  if (typeof mandateId !== 'string' || !mandateId) {
    return res.status(400).json({ error: 'mandateId erforderlich.' });
  }

  const entry = activeMandates.get(mandateId);
  if (!entry) {
    return res.status(404).json({ error: 'Kein aktives Break-Glass-Mandat mit dieser mandateId gefunden.' });
  }
  entry.revoked = true;

  const traceId = requestId();
  await writeAgentAuditEvent({
    requestId: traceId,
    traceId,
    humanActorId: owner.userId,
    appId: 'break-glass-console',
    agentId: 'break-glass-console',
    intent: 'break_glass_revocation',
    scope: { mandateId },
    capability: entry.mandate.allowedCapabilities[0],
    riskClass: 'MEDIUM',
    policyId: 'ADR-0063/M9-BREAK-GLASS',
    decision: 'ALLOW',
    result: 'SUCCESS',
  }).catch(() => {});

  res.json({ revoked: true });
});

breakGlassRouter.get('/status/:mandateId', async (req, res) => {
  const authz = await checkAdminAccess(req, 'systemadmin:break-glass-status', OWNER_ONLY_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to the CAPITAL-AI owner.', reason: authz.reason });
  }

  const entry = activeMandates.get(req.params.mandateId);
  if (!entry) {
    return res.status(404).json({ error: 'Kein Mandat mit dieser mandateId gefunden.' });
  }
  const active = isBreakGlassMandateActive(entry.mandate, entry.revoked);
  res.json({ active, revoked: entry.revoked, expiresAt: entry.mandate.expiresAt });
});
