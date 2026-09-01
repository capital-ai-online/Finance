import express from 'express';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { checkAdminAccess } from '../../src/platform/Security/authMiddleware';
import { OWNER_ONLY_ROLES } from '../../src/platform/Security/types';
import { ADR_0104_PROJECT_OPTIONS } from './adr0104ProjectSet';
import {
  createAdr0104AuthenticationChallenge,
  verifyAdr0104Authentication,
  type Adr0104ActivationRequest,
} from './ownerDeviceAuthorization';
import {
  createOwnerDeviceRegistration,
  revokeOwnerDevice,
  verifyOwnerDeviceRegistration,
} from './ownerDeviceEnrollment';

export const ownerAuthorizationRouter = express.Router();

const isLowercaseHexDigest = (value: string, minLength: number, maxLength: number): boolean => {
  if (value.length < minLength || value.length > maxLength) return false;
  for (const character of value) {
    const isDigit = character >= '0' && character <= '9';
    const isLowercaseHexLetter = character >= 'a' && character <= 'f';
    if (!isDigit && !isLowercaseHexLetter) return false;
  }
  return true;
};

async function requireOwner(req: express.Request, res: express.Response): Promise<{ userId: string; actorLabel: string } | null> {
  const authz = await checkAdminAccess(req, 'owner-device-authorization', OWNER_ONLY_ROLES);
  if (!authz.authorized || !authz.userId) {
    res.status(403).json({ error: 'OWNER_REQUIRED' });
    return null;
  }
  return { userId: authz.userId, actorLabel: authz.actorLabel };
}

ownerAuthorizationRouter.get('/adr-0104/projects', async (req, res) => {
  const owner = await requireOwner(req, res);
  if (!owner) return;
  res.json({ minSelections: 1, maxSelections: 3, immutableAfterChallenge: true, projects: ADR_0104_PROJECT_OPTIONS });
});

ownerAuthorizationRouter.post('/devices/registration-options', async (req, res) => {
  const owner = await requireOwner(req, res);
  if (!owner) return;
  try {
    return res.status(201).json(await createOwnerDeviceRegistration(owner.userId, owner.actorLabel));
  } catch (error: any) {
    return res.status(409).json({ error: String(error?.message || 'OWNER_DEVICE_ENROLLMENT_FAILED') });
  }
});

ownerAuthorizationRouter.post('/devices/register', async (req, res) => {
  const owner = await requireOwner(req, res);
  if (!owner) return;
  const challengeId = req.body?.challengeId;
  const response = req.body?.response as RegistrationResponseJSON | undefined;
  if (typeof challengeId !== 'string' || !response || typeof response.id !== 'string') {
    return res.status(400).json({ error: 'INVALID_REGISTRATION_REQUEST' });
  }
  try {
    return res.status(201).json(await verifyOwnerDeviceRegistration(owner.userId, challengeId, response));
  } catch (error: any) {
    return res.status(403).json({ error: String(error?.message || 'OWNER_DEVICE_ENROLLMENT_DENIED') });
  }
});

ownerAuthorizationRouter.post('/devices/:credentialRecordId/revoke', async (req, res) => {
  const owner = await requireOwner(req, res);
  if (!owner) return;
  if (!/^[0-9a-f-]{36}$/i.test(req.params.credentialRecordId)) return res.status(400).json({ error: 'INVALID_CREDENTIAL_RECORD_ID' });
  try {
    return res.json(await revokeOwnerDevice(owner.userId, req.params.credentialRecordId));
  } catch (error: any) {
    return res.status(409).json({ error: String(error?.message || 'OWNER_DEVICE_REVOKE_FAILED') });
  }
});

ownerAuthorizationRouter.post('/adr-0104/challenge', async (req, res) => {
  const owner = await requireOwner(req, res);
  if (!owner) return;
  const body = req.body as Partial<Adr0104ActivationRequest>;
  const currentMainShaIsValid = typeof body.currentMainSha === 'string' && /^[0-9a-f]{40}$/.test(body.currentMainSha);
  const chatBindingHashIsValid = typeof body.chatBindingHash === 'string' && isLowercaseHexDigest(body.chatBindingHash, 32, 128);
  if (!body || !['ADR-0104-S1', 'ADR-0104-S2', 'ADR-0104-S3'].includes(String(body.slotId)) || !Array.isArray(body.projectIds) || typeof body.initialActiveProjectId !== 'string' || !currentMainShaIsValid || !chatBindingHashIsValid) {
    return res.status(400).json({ error: 'INVALID_ACTIVATION_REQUEST' });
  }
  try {
    return res.status(201).json(await createAdr0104AuthenticationChallenge(owner.userId, body as Adr0104ActivationRequest));
  } catch (error: any) {
    const reason = String(error?.message || 'OWNER_AUTH_CHALLENGE_FAILED');
    return res.status(reason.includes('PROJECT') ? 400 : 409).json({ error: reason });
  }
});

ownerAuthorizationRouter.post('/adr-0104/verify', async (req, res) => {
  const owner = await requireOwner(req, res);
  if (!owner) return;
  const challengeId = req.body?.challengeId;
  const response = req.body?.response as AuthenticationResponseJSON | undefined;
  if (typeof challengeId !== 'string' || !response || typeof response.id !== 'string') return res.status(400).json({ error: 'INVALID_ASSERTION_REQUEST' });
  try {
    return res.json(await verifyAdr0104Authentication(owner.userId, challengeId, response));
  } catch (error: any) {
    return res.status(403).json({ error: String(error?.message || 'OWNER_AUTH_DENIED') });
  }
});