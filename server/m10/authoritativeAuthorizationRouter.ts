// M10 Controlled Cutover — authoritative Owner Passkey -> exact-head CI authorization.
//
// Owner browser path:
//   begin -> exact GitHub PR state challenge -> WebAuthn assertion -> immutable approval evidence
//   -> atomic Phase-5 consumption -> exactly one workflow_dispatch against the same PR branch.
//
// GitHub Actions path:
//   workflow_dispatch -> POST /workflow-gate with the high-entropy consumptionId -> atomic
//   PENDING -> DISPATCHED redemption -> only then may expensive CI steps execute.
//
// Human merge remains separate. This router does not merge pull requests.
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
import { issueM10Challenge } from './challengeIssuance';
import { verifyM10OwnerAssertion } from './assertionVerification';
import { createRealGithubApiFetch } from './githubPrStateResolver';
import {
  createSupabaseM10ApprovalStore,
  createSupabaseM10AssertionCredentialStore,
  createSupabaseM10AuthorizationChallengeStore,
} from './authorizationSupabaseStore';
import { buildM10ShadowAuthenticationOptions } from './shadowAuthorizationRouter';
import { consumeM10ApprovalForCi } from './atomicCiConsumption';
import { createM10GithubActionsDispatcher } from './githubCiDispatcher';
import { claimM10WorkflowGate } from './workflowGateSupabaseStore';

export const m10AuthoritativeAuthorizationRouter = express.Router();

const M10_CI_WORKFLOW_FILE = 'ci.yml';

function resolverToken(): string | null {
  return process.env.M10_GITHUB_TOKEN?.trim() || null;
}

function dispatcherToken(): string | null {
  return process.env.M10_GITHUB_DISPATCH_TOKEN?.trim() || null;
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

m10AuthoritativeAuthorizationRouter.get('/status', async (req, res) => {
  const owner = await requireOwner(req, res, 'systemadmin:m10-authorize-status');
  if (!owner) return;

  const credentials = await createSupabaseM10AssertionCredentialStore()
    .listActiveForOwner(SYSTEMADMIN_OWNER_ACTOR_ID)
    .catch(() => []);

  res.setHeader('Cache-Control', 'no-store');
  return res.json({
    mode: 'AUTHORITATIVE',
    authoritativeForCi: true,
    dispatchEnabled: true,
    githubResolverConfigured: resolverToken() !== null,
    githubDispatcherConfigured: dispatcherToken() !== null,
    activeOwnerCredentialCount: credentials.length,
  });
});

m10AuthoritativeAuthorizationRouter.post('/begin', async (req, res) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`m10-authorize-begin:${ip}`, 10, 5 * 60_000)) {
    return res.status(429).json({ error: 'Zu viele M10-Autorisierungsversuche. Bitte später erneut versuchen.' });
  }

  const owner = await requireOwner(req, res, 'systemadmin:m10-authorize-begin');
  if (!owner) return;

  const githubToken = resolverToken();
  if (!githubToken) {
    return res.status(503).json({ error: 'M10 ist fail-closed: GitHub Resolver ist nicht konfiguriert.' });
  }
  if (!dispatcherToken()) {
    return res.status(503).json({ error: 'M10 ist fail-closed: GitHub Actions Dispatcher ist nicht konfiguriert.' });
  }

  const prNumber = Number(req.body?.prNumber);
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    return res.status(400).json({ error: 'Eine gültige positive PR-Nummer ist erforderlich.' });
  }

  const challengeStore = createSupabaseM10AuthorizationChallengeStore();
  const credentialStore = createSupabaseM10AssertionCredentialStore();

  try {
    const credentials = await credentialStore.listActiveForOwner(SYSTEMADMIN_OWNER_ACTOR_ID);
    if (credentials.length === 0) {
      return res.status(409).json({ error: 'Kein aktives Owner-Passkey-Credential vorhanden.' });
    }

    const issued = await issueM10Challenge(
      { repository: SYSTEMADMIN_REPOSITORY, prNumber },
      { githubApiFetch: createRealGithubApiFetch(githubToken), store: challengeStore },
    );
    if (issued.verdict === 'DENY') return res.status(403).json({ error: issued.reason });

    const options = await buildM10ShadowAuthenticationOptions(
      issued.challenge.challenge,
      credentials.map(c => ({ credentialId: c.credentialId, transports: c.transports })),
    );

    const auditId = traceId('m10-authorize-begin');
    try {
      await writeAgentAuditEvent({
        requestId: auditId,
        traceId: auditId,
        humanActorId: owner.userId,
        appId: 'm10-passkey-console',
        agentId: 'm10-authoritative-verifier',
        intent: 'm10_authorization_begin',
        scope: {
          repository: issued.challenge.context.repository,
          prNumber: issued.challenge.context.prNumber,
          baseSha: issued.challenge.context.baseSha,
          headSha: issued.challenge.context.headSha,
          challengeId: issued.challenge.challengeId,
        },
        capability: 'AUTHORIZE_PR_CI',
        riskClass: 'HIGH',
        policyId: 'ADR-0066/ESS-0022/M10-CUTOVER',
        decision: 'ALLOW',
        repository: issued.challenge.context.repository,
        prNumber: issued.challenge.context.prNumber,
        commitSha: issued.challenge.context.headSha,
        result: 'PENDING',
        metadata: { authoritativeForCi: true, dispatchEnabled: true },
      });
    } catch {
      await challengeStore.revoke(issued.challenge.challengeId).catch(() => false);
      return res.status(503).json({ error: 'M10-Challenge wurde wegen fehlender Audit-Evidence widerrufen.' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      mode: 'AUTHORITATIVE',
      authoritativeForCi: true,
      dispatchEnabled: true,
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
    return res.status(503).json({ error: `M10-Autorisierung konnte nicht gestartet werden: ${err?.message || String(err)}` });
  }
});

m10AuthoritativeAuthorizationRouter.post('/complete', async (req, res) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`m10-authorize-complete:${ip}`, 10, 5 * 60_000)) {
    return res.status(429).json({ error: 'Zu viele M10-Verifikationsversuche. Bitte später erneut versuchen.' });
  }

  const owner = await requireOwner(req, res, 'systemadmin:m10-authorize-complete');
  if (!owner) return;

  const githubToken = resolverToken();
  const dispatchToken = dispatcherToken();
  if (!githubToken || !dispatchToken) {
    return res.status(503).json({ error: 'M10 ist fail-closed: Resolver oder Dispatcher ist nicht konfiguriert.' });
  }

  const { challengeId, response } = req.body || {};
  if (typeof challengeId !== 'string' || !challengeId || !response || typeof response !== 'object') {
    return res.status(400).json({ error: 'challengeId und WebAuthn response sind erforderlich.' });
  }

  const approvalStore = createSupabaseM10ApprovalStore();
  const result = await verifyM10OwnerAssertion(
    {
      ownerId: SYSTEMADMIN_OWNER_ACTOR_ID,
      challengeId,
      response: response as AuthenticationResponseJSON,
    },
    {
      githubApiFetch: createRealGithubApiFetch(githubToken),
      challengeStore: createSupabaseM10AuthorizationChallengeStore(),
      credentialStore: createSupabaseM10AssertionCredentialStore(),
      approvalStore,
    },
  );

  if (result.verdict === 'DENY') {
    const denyAudit = traceId('m10-authorize-deny');
    await writeAgentAuditEvent({
      requestId: denyAudit,
      traceId: denyAudit,
      humanActorId: owner.userId,
      appId: 'm10-passkey-console',
      agentId: 'm10-authoritative-verifier',
      intent: 'm10_authorization_complete',
      scope: { challengeId },
      capability: 'AUTHORIZE_PR_CI',
      riskClass: 'HIGH',
      policyId: 'ADR-0066/ESS-0022/M10-CUTOVER',
      decision: 'DENY',
      repository: SYSTEMADMIN_REPOSITORY,
      result: 'DENIED',
      metadata: { reason: result.reason },
    }).catch(() => {});
    return res.status(403).json({ error: result.reason });
  }

  // Audit the human authorization before any CI consumption/dispatch. If durable audit is down,
  // fail closed even though the cryptographic approval evidence already exists.
  const approvalAudit = traceId('m10-authorize-approved');
  try {
    await writeAgentAuditEvent({
      requestId: approvalAudit,
      traceId: approvalAudit,
      humanActorId: owner.userId,
      appId: 'm10-passkey-console',
      agentId: 'm10-authoritative-verifier',
      intent: 'm10_authorization_complete',
      scope: {
        repository: result.approval.context.repository,
        prNumber: result.approval.context.prNumber,
        baseSha: result.approval.context.baseSha,
        headSha: result.approval.context.headSha,
      },
      capability: 'AUTHORIZE_PR_CI',
      riskClass: 'HIGH',
      policyId: 'ADR-0066/ESS-0022/M10-CUTOVER',
      decision: 'ALLOW',
      approvalId: result.approval.approvalId,
      repository: result.approval.context.repository,
      prNumber: result.approval.context.prNumber,
      commitSha: result.approval.context.headSha,
      result: 'SUCCESS',
      metadata: { authoritativeForCi: true, dispatchEnabled: true, verdict: 'APPROVED' },
    });
  } catch {
    return res.status(503).json({
      error: 'Passkey wurde verifiziert, aber die verpflichtende Audit-Evidence konnte nicht persistiert werden. CI bleibt gesperrt.',
    });
  }

  const consumption = await consumeM10ApprovalForCi(result.approval.approvalId, {
    githubApiFetch: createRealGithubApiFetch(githubToken),
    approvalStore,
    dispatcher: createM10GithubActionsDispatcher({
      token: dispatchToken,
      workflowFile: M10_CI_WORKFLOW_FILE,
    }),
  });

  if (consumption.verdict === 'DENY') return res.status(403).json({ error: consumption.reason });
  if (consumption.verdict === 'DEDUPE') return res.status(409).json({ error: consumption.reason, verdict: 'DEDUPE' });
  if (consumption.verdict === 'DISPATCH_UNCERTAIN') {
    return res.status(503).json({
      error: consumption.reason,
      verdict: 'DISPATCH_UNCERTAIN',
      consumptionId: consumption.consumptionId,
    });
  }

  const dispatchAudit = traceId('m10-dispatch-accepted');
  await writeAgentAuditEvent({
    requestId: dispatchAudit,
    traceId: dispatchAudit,
    humanActorId: owner.userId,
    appId: 'm10-passkey-console',
    agentId: 'm10-ci-dispatcher',
    intent: 'm10_ci_dispatch_accepted',
    scope: {
      repository: consumption.consumption.repository,
      prNumber: consumption.consumption.prNumber,
      headSha: consumption.consumption.headSha,
      consumptionId: consumption.consumption.consumptionId,
    },
    capability: 'AUTHORIZE_PR_CI',
    riskClass: 'HIGH',
    policyId: 'ADR-0066/ESS-0022/M10-CUTOVER',
    decision: 'ALLOW',
    approvalId: consumption.consumption.approvalId,
    repository: consumption.consumption.repository,
    prNumber: consumption.consumption.prNumber,
    commitSha: consumption.consumption.headSha,
    workflowRunId: consumption.dispatchReference,
    result: 'PENDING',
    metadata: { workflowGatePending: true },
  }).catch(() => {});

  res.setHeader('Cache-Control', 'no-store');
  return res.status(202).json({
    verdict: 'CI_DISPATCH_ACCEPTED',
    authoritativeForCi: true,
    dispatchEnabled: true,
    workflowGatePending: true,
    context: {
      repository: consumption.consumption.repository,
      prNumber: consumption.consumption.prNumber,
      headSha: consumption.consumption.headSha,
      consumedAt: consumption.consumption.consumedAt,
    },
  });
});

// GitHub Actions does not possess a CAPITAL-AI browser session. This endpoint is therefore a
// capability endpoint, not a user endpoint: the unguessable single-use consumptionId is the bearer
// capability and is atomically burned before the server returns 200. No raw credential material is
// accepted or returned.
m10AuthoritativeAuthorizationRouter.post('/workflow-gate', async (req, res) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`m10-workflow-gate:${ip}`, 30, 5 * 60_000)) {
    return res.status(429).json({ error: 'M10 workflow gate rate limit exceeded.' });
  }

  const body = req.body || {};
  const input = {
    consumptionId: typeof body.consumptionId === 'string' ? body.consumptionId : '',
    approvalId: typeof body.approvalId === 'string' ? body.approvalId : '',
    repository: typeof body.repository === 'string' ? body.repository : '',
    prNumber: Number(body.prNumber),
    baseSha: typeof body.baseSha === 'string' ? body.baseSha : '',
    headSha: typeof body.headSha === 'string' ? body.headSha : '',
    authorizationDigest: typeof body.authorizationDigest === 'string' ? body.authorizationDigest : '',
    action: body.action,
  };

  if (
    !input.consumptionId || !input.approvalId || input.repository !== SYSTEMADMIN_REPOSITORY
    || !Number.isInteger(input.prNumber) || input.prNumber <= 0
    || !input.baseSha || !input.headSha || !/^[0-9a-f]{64}$/.test(input.authorizationDigest)
    || input.action !== 'AUTHORIZE_PR_CI'
  ) {
    return res.status(400).json({ error: 'Invalid M10 workflow gate context.' });
  }

  const workflowRunId = typeof body.workflowRunId === 'string' ? body.workflowRunId.slice(0, 100) : undefined;
  const workflowRef = typeof body.workflowRef === 'string' ? body.workflowRef.slice(0, 300) : undefined;
  const gateTrace = traceId('m10-workflow-gate');

  const claim = await claimM10WorkflowGate(
    input as Parameters<typeof claimM10WorkflowGate>[0],
    async () => {
      await writeAgentAuditEvent({
        requestId: gateTrace,
        traceId: gateTrace,
        humanActorId: SYSTEMADMIN_OWNER_ACTOR_ID,
        appId: 'github-actions',
        agentId: 'm10-ci-workflow-gate',
        intent: 'm10_ci_workflow_gate_claim',
        scope: {
          repository: input.repository,
          prNumber: input.prNumber,
          baseSha: input.baseSha,
          headSha: input.headSha,
          consumptionId: input.consumptionId,
          workflowRef,
        },
        capability: 'AUTHORIZE_PR_CI',
        riskClass: 'HIGH',
        policyId: 'ADR-0066/ESS-0022/M10-CUTOVER',
        decision: 'ALLOW',
        approvalId: input.approvalId,
        repository: input.repository,
        prNumber: input.prNumber,
        commitSha: input.headSha,
        workflowRunId,
        result: 'PENDING',
        metadata: { singleUseWorkflowGate: true },
      });
    },
  );

  if (claim.status !== 'CLAIMED') {
    return res.status(claim.status === 'DENY_ALREADY_FINALIZED' ? 409 : 403).json({
      error: claim.reason,
      verdict: 'DENY',
    });
  }

  // Best-effort terminal audit; the pre-finalize audit plus immutable consumption transition are
  // already durable. A logging outage after the atomic claim must not re-open the one-time gate.
  const successTrace = traceId('m10-workflow-gate-success');
  await writeAgentAuditEvent({
    requestId: successTrace,
    traceId: successTrace,
    humanActorId: SYSTEMADMIN_OWNER_ACTOR_ID,
    appId: 'github-actions',
    agentId: 'm10-ci-workflow-gate',
    intent: 'm10_ci_workflow_gate_claim',
    scope: { repository: input.repository, prNumber: input.prNumber, headSha: input.headSha },
    capability: 'AUTHORIZE_PR_CI',
    riskClass: 'HIGH',
    policyId: 'ADR-0066/ESS-0022/M10-CUTOVER',
    decision: 'ALLOW',
    approvalId: input.approvalId,
    repository: input.repository,
    prNumber: input.prNumber,
    commitSha: input.headSha,
    workflowRunId,
    result: 'SUCCESS',
    metadata: { consumptionId: input.consumptionId, singleUseWorkflowGate: true },
  }).catch(() => {});

  res.setHeader('Cache-Control', 'no-store');
  return res.json({
    verdict: 'AUTHORIZED',
    repository: input.repository,
    prNumber: input.prNumber,
    headSha: input.headSha,
    action: input.action,
  });
});
