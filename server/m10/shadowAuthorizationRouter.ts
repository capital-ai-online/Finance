// M10 (ADR-0066, ESS-0022) Phase 6 — production Shadow Mode HTTP wiring.
//
// This router exercises the real Owner WebAuthn assertion path against live GitHub PR state while
// the simplified pre-M10 CI path remains authoritative. It never invokes Phase-5 CI consumption or
// any GitHub Actions trigger. Successful assertions persist only to m10_shadow_evaluations.
import express from 'express';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { checkAdminAccess } from '../../src/platform/Security/authMiddleware';
import { OWNER_ONLY_ROLES } from '../../src/platform/Security/types';
import {
  SYSTEMADMIN_OWNER_ACTOR_ID,
  SYSTEMADMIN_REPOSITORY,
} from '../../src/platform/Security/roadmapExecutionMandate';
import { generateOpaqueToken } from '../../src/platform/Security/secretCrypto';
import { checkRateLimit, getClientIp } from '../../src/platform/Security/rateLimiter';
import { writeAgentAuditEvent } from '../agentAudit/agentAuditWriter';
import { issueM10Challenge, M10_CHALLENGE_TTL_MS } from './challengeIssuance';
import { M10_RP_ID } from './credentialEnrollment';
import { verifyM10OwnerAssertion } from './assertionVerification';
import { createRealGithubApiFetch } from './githubPrStateResolver';
import {
  createSupabaseM10AssertionCredentialStore,
  createSupabaseM10AuthorizationChallengeStore,
} from './authorizationSupabaseStore';
import {
  createSupabaseM10ShadowApprovalStore,
  listRecentM10ShadowEvaluations,
} from './shadowApprovalSupabaseStore';

export const m10ShadowAuthorizationRouter = express.Router();

function configuredGithubToken(): string | null {
  const token = process.env.M10_GITHUB_TOKEN?.trim();
  return token || null;
}

function traceId(prefix: string): string {
  return `${prefix}-${generateOpaqueToken(12)}`;
}

async function requireOwner(req: express.Request, res: express.Response, zone: string) {
  const authz = await checkAdminAccess(req, zone, OWNER_ONLY_ROLES);
  if (!authz.authorized || !authz.userId) {
    res.status(403).json({ error: 'Access Denied: Restricted to the CAPITAL-AI owner.', reason: authz.reason });
    return null;
  }
  return authz;
}

/**
 * `issueM10Challenge()` already creates the canonical WebAuthn challenge as base64url bytes.
 * Pass that value directly to @simplewebauthn/browser. Sending it through a server-side options
 * generator as a custom string would UTF-8/base64url encode it again and break Phase-4
 * expectedChallenge equality.
 */
export async function buildM10ShadowAuthenticationOptions(
  challenge: string,
  credentials: readonly Readonly<{ credentialId: string; transports: readonly string[] }>[],
) {
  if (!challenge || credentials.length === 0) {
    throw new Error('M10 Shadow benötigt eine Challenge und mindestens ein aktives Owner-Credential.');
  }

  return {
    challenge,
    rpId: M10_RP_ID,
    timeout: M10_CHALLENGE_TTL_MS,
    userVerification: 'required' as const,
    allowCredentials: credentials.map(credential => ({
      id: credential.credentialId,
      transports: [...credential.transports] as any,
    })),
  };
}

m10ShadowAuthorizationRouter.get('/status', async (req, res) => {
  const owner = await requireOwner(req, res, 'systemadmin:m10-shadow-status');
  if (!owner) return;

  const credentialStore = createSupabaseM10AssertionCredentialStore();
  const [credentials, recent] = await Promise.all([
    credentialStore.listActiveForOwner(SYSTEMADMIN_OWNER_ACTOR_ID).catch(() => []),
    listRecentM10ShadowEvaluations(10).catch(() => []),
  ]);

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    mode: 'SHADOW',
    authoritativeForCi: false,
    dispatchEnabled: false,
    githubResolverConfigured: configuredGithubToken() !== null,
    activeOwnerCredentialCount: credentials.length,
    recent,
  });
});

m10ShadowAuthorizationRouter.post('/begin', async (req, res) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`m10-shadow-begin:${ip}`, 10, 5 * 60_000)) {
    return res.status(429).json({ error: 'Zu viele Shadow-Autorisierungsversuche. Bitte später erneut versuchen.' });
  }

  const owner = await requireOwner(req, res, 'systemadmin:m10-shadow-begin');
  if (!owner) return;

  const token = configuredGithubToken();
  if (!token) {
    return res.status(503).json({
      error: 'M10 Shadow ist fail-closed: M10_GITHUB_TOKEN ist im serverseitigen Runtime-Secret nicht konfiguriert.',
      code: 'm10_github_resolver_unavailable',
    });
  }

  const prNumber = Number(req.body?.prNumber);
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    return res.status(400).json({ error: 'Eine gültige positive PR-Nummer ist erforderlich.' });
  }

  const challengeStore = createSupabaseM10AuthorizationChallengeStore();
  const credentialStore = createSupabaseM10AssertionCredentialStore();
  const githubApiFetch = createRealGithubApiFetch(token);

  try {
    const credentials = await credentialStore.listActiveForOwner(SYSTEMADMIN_OWNER_ACTOR_ID);
    if (credentials.length === 0) {
      return res.status(409).json({ error: 'Kein aktives Owner-Passkey-Credential vorhanden.' });
    }

    const issued = await issueM10Challenge(
      { repository: SYSTEMADMIN_REPOSITORY, prNumber },
      { githubApiFetch, store: challengeStore },
    );
    if (issued.verdict === 'DENY') {
      return res.status(403).json({ error: issued.reason });
    }

    const options = await buildM10ShadowAuthenticationOptions(
      issued.challenge.challenge,
      credentials.map(c => ({ credentialId: c.credentialId, transports: c.transports })),
    );

    const auditTraceId = traceId('m10-shadow-begin');
    try {
      await writeAgentAuditEvent({
        requestId: auditTraceId,
        traceId: auditTraceId,
        humanActorId: owner.userId,
        appId: 'm10-passkey-console',
        agentId: 'm10-shadow-verifier',
        intent: 'm10_shadow_authorization_begin',
        scope: {
          repository: issued.challenge.context.repository,
          prNumber: issued.challenge.context.prNumber,
          baseSha: issued.challenge.context.baseSha,
          headSha: issued.challenge.context.headSha,
          challengeId: issued.challenge.challengeId,
        },
        capability: 'AUTHORIZE_PR_CI_SHADOW',
        riskClass: 'HIGH',
        policyId: 'ADR-0066/ESS-0022/M10-PHASE6',
        decision: 'ALLOW',
        repository: issued.challenge.context.repository,
        prNumber: issued.challenge.context.prNumber,
        commitSha: issued.challenge.context.headSha,
        result: 'PENDING',
        metadata: { authoritativeForCi: false, dispatchEnabled: false },
      });
    } catch {
      await challengeStore.revoke(issued.challenge.challengeId).catch(() => false);
      return res.status(503).json({ error: 'Shadow-Challenge wurde wegen fehlender Audit-Evidence widerrufen.' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      mode: 'SHADOW',
      authoritativeForCi: false,
      dispatchEnabled: false,
      challengeId: issued.challenge.challengeId,
      options,
      context: {
        repository: issued.challenge.context.repository,
        prNumber: issued.challenge.context.prNumber,
        baseBranch: issued.challenge.context.baseBranch,
        baseSha: issued.challenge.context.baseSha,
        headSha: issued.challenge.context.headSha,
      },
    });
  } catch (err: any) {
    return res.status(503).json({ error: `M10 Shadow konnte nicht gestartet werden: ${err?.message || String(err)}` });
  }
});

m10ShadowAuthorizationRouter.post('/complete', async (req, res) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`m10-shadow-complete:${ip}`, 10, 5 * 60_000)) {
    return res.status(429).json({ error: 'Zu viele Shadow-Verifikationsversuche. Bitte später erneut versuchen.' });
  }

  const owner = await requireOwner(req, res, 'systemadmin:m10-shadow-complete');
  if (!owner) return;

  const token = configuredGithubToken();
  if (!token) {
    return res.status(503).json({ error: 'M10 Shadow ist fail-closed: GitHub Resolver nicht konfiguriert.' });
  }

  const { challengeId, response } = req.body || {};
  if (typeof challengeId !== 'string' || !challengeId || !response || typeof response !== 'object') {
    return res.status(400).json({ error: 'challengeId und WebAuthn response sind erforderlich.' });
  }

  const result = await verifyM10OwnerAssertion(
    {
      ownerId: SYSTEMADMIN_OWNER_ACTOR_ID,
      challengeId,
      response: response as AuthenticationResponseJSON,
    },
    {
      githubApiFetch: createRealGithubApiFetch(token),
      challengeStore: createSupabaseM10AuthorizationChallengeStore(),
      credentialStore: createSupabaseM10AssertionCredentialStore(),
      approvalStore: createSupabaseM10ShadowApprovalStore(),
    },
  );

  const auditTraceId = traceId('m10-shadow-complete');
  if (result.verdict === 'DENY') {
    try {
      await writeAgentAuditEvent({
        requestId: auditTraceId,
        traceId: auditTraceId,
        humanActorId: owner.userId,
        appId: 'm10-passkey-console',
        agentId: 'm10-shadow-verifier',
        intent: 'm10_shadow_authorization_complete',
        scope: { challengeId },
        capability: 'AUTHORIZE_PR_CI_SHADOW',
        riskClass: 'HIGH',
        policyId: 'ADR-0066/ESS-0022/M10-PHASE6',
        decision: 'DENY',
        repository: SYSTEMADMIN_REPOSITORY,
        result: 'DENIED',
        metadata: { reason: result.reason, authoritativeForCi: false, dispatchEnabled: false },
      });
    } catch {
      return res.status(503).json({ error: 'Shadow-Verifikation abgelehnt; Audit-Evidence ist zusätzlich nicht verfügbar.' });
    }
    return res.status(403).json({ error: result.reason });
  }

  try {
    await writeAgentAuditEvent({
      requestId: auditTraceId,
      traceId: auditTraceId,
      humanActorId: owner.userId,
      appId: 'm10-passkey-console',
      agentId: 'm10-shadow-verifier',
      intent: 'm10_shadow_authorization_complete',
      scope: {
        challengeId: result.approval.challengeId,
        repository: result.approval.context.repository,
        prNumber: result.approval.context.prNumber,
        baseSha: result.approval.context.baseSha,
        headSha: result.approval.context.headSha,
      },
      capability: 'AUTHORIZE_PR_CI_SHADOW',
      riskClass: 'HIGH',
      policyId: 'ADR-0066/ESS-0022/M10-PHASE6',
      decision: 'ALLOW',
      approvalId: result.approval.approvalId,
      repository: result.approval.context.repository,
      prNumber: result.approval.context.prNumber,
      commitSha: result.approval.context.headSha,
      result: 'SUCCESS',
      metadata: { authoritativeForCi: false, dispatchEnabled: false, verdict: 'APPROVED_SHADOW' },
    });
  } catch {
    return res.status(503).json({
      error: 'WebAuthn Shadow-Assertion wurde kryptografisch verifiziert, aber Audit-Evidence konnte nicht bestätigt werden. Keine CI-Autorität wurde erzeugt.',
    });
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.json({
    verdict: 'APPROVED_SHADOW',
    authoritativeForCi: false,
    dispatchEnabled: false,
    context: {
      repository: result.approval.context.repository,
      prNumber: result.approval.context.prNumber,
      baseBranch: result.approval.context.baseBranch,
      baseSha: result.approval.context.baseSha,
      headSha: result.approval.context.headSha,
      approvedAt: result.approval.approvedAt,
    },
  });
});
