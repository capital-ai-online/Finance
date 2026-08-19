// M10 (ADR-0066, ESS-0022) Phase 3 live-wiring — the real, authenticated HTTP endpoint an Owner's
// browser talks to when registering a passkey. Reuses the established Owner+step-up guard pattern
// from server/adminDiagnostics.ts / server/systemadmin/breakGlassRouter.ts rather than inventing a
// new auth mechanism, and the M9 Independent-Evidence-Review purpose-filter fix (each action below
// passes its own already-unique zone string as the requireStepUp() purpose).
//
// This router is code an agent built to assist the Owner - it does not and cannot perform an
// enrollment itself. Every mutating enrollment route requires a live, already-authenticated Owner
// session plus a fresh TOTP step-up. M10 CI authorization uses the enrolled passkey itself.
import express from 'express';
import { checkAdminAccess, requireStepUp } from '../../src/platform/Security/authMiddleware';
import { OWNER_ONLY_ROLES } from '../../src/platform/Security/types';
import { SYSTEMADMIN_OWNER_ACTOR_ID } from '../../src/platform/Security/roadmapExecutionMandate';
import {
  beginM10CredentialEnrollment,
  completeM10CredentialEnrollment,
  revokeM10Credential,
} from './credentialEnrollment';
import {
  createSupabaseM10CredentialStore,
  createSupabaseM10RegistrationChallengeStore,
} from './credentialEnrollmentSupabaseStore';
import { writeAgentAuditEvent } from '../agentAudit/agentAuditWriter';
import { checkRateLimit, getClientIp } from '../../src/platform/Security/rateLimiter';
import { m10ShadowAuthorizationRouter } from './shadowAuthorizationRouter';
import { m10AuthoritativeAuthorizationRouter } from './authoritativeAuthorizationRouter';

export const m10CredentialEnrollmentRouter = express.Router();

const challengeStore = createSupabaseM10RegistrationChallengeStore();
const credentialStore = createSupabaseM10CredentialStore();

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
  const stepUpOk = await requireStepUp(req, zone);
  if (!stepUpOk) {
    res.status(428).json({ error: 'Diese Aktion erfordert einen frischen Step-Up-Nachweis (TOTP).', code: 'step_up_required' });
    return null;
  }
  return { userId: authz.userId, actorLabel: authz.actorLabel || authz.userId };
}

function requestId(): string {
  return `m10-enroll-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

m10CredentialEnrollmentRouter.post('/begin', async (req, res) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`m10-enroll-begin:${ip}`, 5, 5 * 60_000)) {
    return res.status(429).json({ error: 'Zu viele Versuche. Bitte 5 Minuten warten.' });
  }

  const owner = await requireOwnerWithStepUp(req, res, 'systemadmin:m10-passkey-enroll-begin');
  if (!owner) return;

  const result = await beginM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, { challengeStore, credentialStore });
  const traceId = requestId();

  if (result.verdict === 'DENY') {
    await writeAgentAuditEvent({
      requestId: traceId,
      traceId,
      humanActorId: owner.userId,
      appId: 'm10-passkey-console',
      agentId: 'm10-passkey-console',
      intent: 'm10_credential_enrollment_begin',
      scope: {},
      capability: 'OWNER_CREDENTIAL_ENROLLMENT',
      riskClass: 'MEDIUM',
      policyId: 'ADR-0066/ESS-0022/M10-PHASE3',
      decision: 'DENY',
      result: 'DENIED',
      metadata: { reason: result.reason },
    }).catch(() => {});
    return res.status(403).json({ error: result.reason });
  }

  await writeAgentAuditEvent({
    requestId: traceId,
    traceId,
    humanActorId: owner.userId,
    appId: 'm10-passkey-console',
    agentId: 'm10-passkey-console',
    intent: 'm10_credential_enrollment_begin',
    scope: { challengeId: result.challengeId },
    capability: 'OWNER_CREDENTIAL_ENROLLMENT',
    riskClass: 'MEDIUM',
    policyId: 'ADR-0066/ESS-0022/M10-PHASE3',
    decision: 'ALLOW',
    result: 'SUCCESS',
  }).catch(() => {});

  res.json({ options: result.options });
});

m10CredentialEnrollmentRouter.post('/complete', async (req, res) => {
  const owner = await requireOwnerWithStepUp(req, res, 'systemadmin:m10-passkey-enroll-complete');
  if (!owner) return;

  const { challengeId, response } = req.body || {};
  if (typeof challengeId !== 'string' || !challengeId || !response || typeof response !== 'object') {
    return res.status(400).json({ error: 'challengeId und response sind erforderlich.' });
  }

  const result = await completeM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, challengeId, response, {
    challengeStore,
    credentialStore,
  });
  const traceId = requestId();

  if (result.verdict === 'DENY') {
    await writeAgentAuditEvent({
      requestId: traceId,
      traceId,
      humanActorId: owner.userId,
      appId: 'm10-passkey-console',
      agentId: 'm10-passkey-console',
      intent: 'm10_credential_enrollment_complete',
      scope: { challengeId },
      capability: 'OWNER_CREDENTIAL_ENROLLMENT',
      riskClass: 'MEDIUM',
      policyId: 'ADR-0066/ESS-0022/M10-PHASE3',
      decision: 'DENY',
      result: 'DENIED',
      metadata: { reason: result.reason },
    }).catch(() => {});
    return res.status(403).json({ error: result.reason });
  }

  await writeAgentAuditEvent({
    requestId: traceId,
    traceId,
    humanActorId: owner.userId,
    appId: 'm10-passkey-console',
    agentId: 'm10-passkey-console',
    intent: 'm10_credential_enrollment_complete',
    scope: { challengeId, credentialId: result.credential.credentialId },
    capability: 'OWNER_CREDENTIAL_ENROLLMENT',
    riskClass: 'MEDIUM',
    policyId: 'ADR-0066/ESS-0022/M10-PHASE3',
    decision: 'ALLOW',
    result: 'SUCCESS',
  }).catch(() => {});

  res.json({ credential: result.credential });
});

m10CredentialEnrollmentRouter.post('/revoke', async (req, res) => {
  const owner = await requireOwnerWithStepUp(req, res, 'systemadmin:m10-passkey-enroll-revoke');
  if (!owner) return;

  const { credentialId } = req.body || {};
  if (typeof credentialId !== 'string' || !credentialId) {
    return res.status(400).json({ error: 'credentialId erforderlich.' });
  }

  const result = await revokeM10Credential(SYSTEMADMIN_OWNER_ACTOR_ID, credentialId, { credentialStore });
  const traceId = requestId();

  await writeAgentAuditEvent({
    requestId: traceId,
    traceId,
    humanActorId: owner.userId,
    appId: 'm10-passkey-console',
    agentId: 'm10-passkey-console',
    intent: 'm10_credential_revocation',
    scope: { credentialId },
    capability: 'OWNER_CREDENTIAL_ENROLLMENT',
    riskClass: 'MEDIUM',
    policyId: 'ADR-0066/ESS-0022/M10-PHASE3',
    decision: result.verdict === 'REVOKED' ? 'ALLOW' : 'DENY',
    result: result.verdict === 'REVOKED' ? 'SUCCESS' : 'DENIED',
    metadata: result.verdict === 'DENY' ? { reason: result.reason } : undefined,
  }).catch(() => {});

  if (result.verdict === 'DENY') {
    return res.status(404).json({ error: result.reason });
  }
  res.json({ revoked: true });
});

m10CredentialEnrollmentRouter.get('/credentials', async (req, res) => {
  const authz = await checkAdminAccess(req, 'systemadmin:m10-passkey-enroll-list', OWNER_ONLY_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to the CAPITAL-AI owner.', reason: authz.reason });
  }
  const credentials = await credentialStore.listActiveForOwner(SYSTEMADMIN_OWNER_ACTOR_ID);
  res.json({ credentials });
});

// Shadow remains a non-authoritative diagnostic/evidence surface. It cannot consume or dispatch CI.
m10CredentialEnrollmentRouter.use('/shadow', m10ShadowAuthorizationRouter);

// Controlled Cutover authoritative path. Human merge remains a separate GitHub action outside M10.
m10CredentialEnrollmentRouter.use('/authorize', m10AuthoritativeAuthorizationRouter);
