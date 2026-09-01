import express from 'express';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { checkAdminAccess } from '../../src/platform/Security/authMiddleware';
import { OWNER_ONLY_ROLES } from '../../src/platform/Security/types';
import { ADR_0104_PROJECT_OPTIONS } from './adr0104ProjectSet';
import {
  createAdr0104AuthenticationChallenge,
  verifyAdr0104Authentication,
  type Adr0104ActivationRequest,
} from './ownerDeviceAuthorization';

export const ownerAuthorizationRouter = express.Router();

async function requireOwner(req: express.Request, res: express.Response): Promise<string | null> {
  const authz = await checkAdminAccess(req, 'owner-device-authorization', OWNER_ONLY_ROLES);
  if (!authz.authorized || !authz.userId) {
    res.status(403).json({ error: 'OWNER_REQUIRED' });
    return null;
  }
  return authz.userId;
}

ownerAuthorizationRouter.get('/adr-0104/projects', async (req, res) => {
  const ownerUserId = await requireOwner(req, res);
  if (!ownerUserId) return;
  res.json({
    minSelections: 1,
    maxSelections: 3,
    immutableAfterChallenge: true,
    projects: ADR_0104_PROJECT_OPTIONS,
  });
});

ownerAuthorizationRouter.post('/adr-0104/challenge', async (req, res) => {
  const ownerUserId = await requireOwner(req, res);
  if (!ownerUserId) return;

  const body = req.body as Partial<Adr0104ActivationRequest>;
  if (
    !body ||
    !['ADR-0104-S1', 'ADR-0104-S2', 'ADR-0104-S3'].includes(String(body.slotId)) ||
    !Array.isArray(body.projectIds) ||
    typeof body.initialActiveProjectId !== 'string' ||
    typeof body.chatBindingHash !== 'string' ||
    typeof body.currentMainSha !== 'string' ||
    !/^[0-9a-f]{40}$/.test(body.currentMainSha) ||
    !/^[0-9a-f]{32,128}$/i.test(body.chatBindingHash)
  ) {
    return res.status(400).json({ error: 'INVALID_ACTIVATION_REQUEST' });
  }

  try {
    const result = await createAdr0104AuthenticationChallenge(ownerUserId, body as Adr0104ActivationRequest);
    return res.status(201).json(result);
  } catch (error: any) {
    const reason = String(error?.message || 'OWNER_AUTH_CHALLENGE_FAILED');
    return res.status(reason.includes('PROJECT') ? 400 : 409).json({ error: reason });
  }
});

ownerAuthorizationRouter.post('/adr-0104/verify', async (req, res) => {
  const ownerUserId = await requireOwner(req, res);
  if (!ownerUserId) return;

  const challengeId = req.body?.challengeId;
  const response = req.body?.response as AuthenticationResponseJSON | undefined;
  if (typeof challengeId !== 'string' || !response || typeof response.id !== 'string') {
    return res.status(400).json({ error: 'INVALID_ASSERTION_REQUEST' });
  }

  try {
    const result = await verifyAdr0104Authentication(ownerUserId, challengeId, response);
    return res.json(result);
  } catch (error: any) {
    return res.status(403).json({ error: String(error?.message || 'OWNER_AUTH_DENIED') });
  }
});
