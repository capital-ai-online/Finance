// M10 Controlled Cutover — authoritative Owner Passkey -> exact-head CI authorization.
//
// Owner browser path:
//   begin -> exact GitHub PR state challenge -> WebAuthn assertion -> immutable approval evidence
//   -> atomic Phase-5 consumption -> exactly one workflow_dispatch against the same PR branch.
//
// GitHub Actions path:
//   workflow_dispatch -> GitHub Actions OIDC + one-time consumption -> fresh GitHub PR-state/ref
//   resolution -> atomic PENDING -> DISPATCHED redemption -> only then expensive CI.
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
import { generateOpaqueToken, hashOpaqueToken } from '../../src/platform/Security/secretCrypto';
import { checkRateLimit, getClientIp } from '../../src/platform/Security/rateLimiter';
import { writeAgentAuditEvent } from '../agentAudit/agentAuditWriter';
import { issueM10Challenge } from './challengeIssuance';
import { verifyM10OwnerAssertion } from './assertionVerification';
import { createRealGithubApiFetch, resolveTrustedPrState } from './githubPrStateResolver';
import { resolveTrustedM10DispatchRef } from './githubPrDispatchRef';
import { verifyGithubActionsOidcToken } from './githubActionsOidc';
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
const M10_CI_WORKFLOW_PATH = '.github/workflows/ci.yml';
const M10_CI_WORKFLOW_NAME = 'CI';

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
      consumptionCapabilityHash: hashOpaqueToken(consumption.consumption.consumptionId),
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

// GitHub Actions has no CAPITAL-AI browser session. The gate therefore requires two independent
// workload proofs before touching the durable consumption: (1) a signed, short-lived GitHub Actions
// OIDC token bound to the exact repository/ref/head/run/workflow and (2) the unguessable, single-use
// M10 consumption capability. Current PR state is then re-resolved a final time before redemption.
m10AuthoritativeAuthorizationRouter.post('/workflow-gate', async (req, res) => {
  const ip = getClientIp(req as any);
  if (!checkRateLimit(`m10-workflow-gate:${ip}`, 30, 5 * 60_000)) {
    return res.status(429).json({ error: 'M10 workflow gate rate limit exceeded.' });
  }

  const body = req.body || {};
  const requested = {
    consumptionId: typeof body.consumptionId === 'string' ? body.consumptionId : '',
    approvalId: typeof body.approvalId === 'string' ? body.approvalId : '',
    repository: typeof body.repository === 'string' ? body.repository : '',
    prNumber: Number(body.prNumber),
    baseSha: typeof body.baseSha === 'string' ? body.baseSha : '',
    headSha: typeof body.headSha === 'string' ? body.headSha : '',
    authorizationDigest: typeof body.authorizationDigest === 'string' ? body.authorizationDigest : '',
    action: body.action,
  };
  const workflowRunId = typeof body.workflowRunId === 'string' ? body.workflowRunId : '';
  const workflowRef = typeof body.workflowRef === 'string' ? body.workflowRef : '';

  if (
    !requested.consumptionId || !requested.approvalId || requested.repository !== SYSTEMADMIN_REPOSITORY
    || !Number.isInteger(requested.prNumber) || requested.prNumber <= 0
    || !requested.baseSha || !requested.headSha || !/^[0-9a-f]{40}$/.test(requested.headSha)
    || !/^[0-9a-f]{64}$/.test(requested.authorizationDigest)
    || requested.action !== 'AUTHORIZE_PR_CI'
    || !/^\d{1,30}$/.test(workflowRunId)
    || !workflowRef.startsWith('refs/heads/')
  ) {
    return res.status(400).json({ error: 'Invalid M10 workflow gate context.' });
  }

  const authorization = req.get('authorization') || '';
  const oidcToken = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : '';
  if (!oidcToken) {
    return res.status(401).json({ error: 'GitHub Actions OIDC bearer token is required.', verdict: 'DENY' });
  }

  const oidc = await verifyGithubActionsOidcToken({
    token: oidcToken,
    repository: requested.repository,
    runId: workflowRunId,
    ref: workflowRef,
    headSha: requested.headSha,
    workflowFile: M10_CI_WORKFLOW_PATH,
    workflowName: M10_CI_WORKFLOW_NAME,
  });
  if (oidc.verdict === 'DENY') {
    return res.status(403).json({ error: oidc.reason, verdict: 'DENY' });
  }

  const githubToken = resolverToken();
  if (!githubToken) {
    return res.status(503).json({ error: 'M10 workflow gate is fail-closed: GitHub resolver is unavailable.' });
  }

  const githubApiFetch = createRealGithubApiFetch(githubToken);
  const current = await resolveTrustedPrState(
    { repository: requested.repository, prNumber: requested.prNumber },
    { githubApiFetch },
  );
  if (current.verdict === 'DENY') return res.status(403).json({ error: current.reason, verdict: 'DENY' });

  if (current.state.baseSha !== requested.baseSha || current.state.headSha !== requested.headSha) {
    return res.status(403).json({ error: 'PR base/head changed before CI workflow-gate redemption.', verdict: 'DENY' });
  }

  const trustedRef = await resolveTrustedM10DispatchRef(
    {
      repository: requested.repository,
      prNumber: requested.prNumber,
      expectedHeadSha: requested.headSha,
    },
    githubApiFetch,
  );
  if (trustedRef.verdict === 'DENY') return res.status(403).json({ error: trustedRef.reason, verdict: 'DENY' });
  if (workflowRef !== `refs/heads/${trustedRef.headRef}`) {
    return res.status(403).json({ error: 'Workflow ref does not match the current trusted PR head branch.', verdict: 'DENY' });
  }

  const gateInput = {
    consumptionId: requested.consumptionId,
    approvalId: requested.approvalId,
    repository: requested.repository,
    prNumber: requested.prNumber,
    baseSha: current.state.baseSha,
    headSha: current.state.headSha,
    changedFileSetHash: current.state.canonicalChangedFileSetHash,
    diffReviewDigest: current.state.canonicalDiffReviewDigest,
    authorizationDigest: requested.authorizationDigest,
    action: requested.action as 'AUTHORIZE_PR_CI',
  };
  const capabilityHash = hashOpaqueToken(requested.consumptionId);
  const oidcJtiHash = hashOpaqueToken(oidc.identity.jti);
  const gateTrace = traceId('m10-workflow-gate');

  const claim = await claimM10WorkflowGate(
    gateInput,
    async () => {
      await writeAgentAuditEvent({
        requestId: gateTrace,
        traceId: gateTrace,
        humanActorId: SYSTEMADMIN_OWNER_ACTOR_ID,
        appId: 'github-actions',
        agentId: 'm10-ci-workflow-gate',
        intent: 'm10_ci_workflow_gate_claim',
        scope: {
          repository: gateInput.repository,
          prNumber: gateInput.prNumber,
          baseSha: gateInput.baseSha,
          headSha: gateInput.headSha,
          consumptionCapabilityHash: capabilityHash,
          workflowRef,
          oidcJtiHash,
        },
        capability: 'AUTHORIZE_PR_CI',
        riskClass: 'HIGH',
        policyId: 'ADR-0066/ESS-0022/M10-CUTOVER',
        decision: 'ALLOW',
        approvalId: gateInput.approvalId,
        repository: gateInput.repository,
        prNumber: gateInput.prNumber,
        commitSha: gateInput.headSha,
        workflowRunId,
        result: 'PENDING',
        metadata: {
          singleUseWorkflowGate: true,
          currentPrStateReResolved: true,
          githubOidcVerified: true,
          githubActor: oidc.identity.actor,
          githubActorId: oidc.identity.actorId,
          githubRunAttempt: oidc.identity.runAttempt,
          runnerEnvironment: oidc.identity.runnerEnvironment,
        },
      });
    },
  );

  if (claim.status !== 'CLAIMED') {
    return res.status(claim.status === 'DENY_ALREADY_FINALIZED' ? 409 : 403).json({
      error: claim.reason,
      verdict: 'DENY',
    });
  }

  const successTrace = traceId('m10-workflow-gate-success');
  await writeAgentAuditEvent({
    requestId: successTrace,
    traceId: successTrace,
    humanActorId: SYSTEMADMIN_OWNER_ACTOR_ID,
    appId: 'github-actions',
    agentId: 'm10-ci-workflow-gate',
    intent: 'm10_ci_workflow_gate_claim',
    scope: {
      repository: gateInput.repository,
      prNumber: gateInput.prNumber,
      headSha: gateInput.headSha,
      consumptionCapabilityHash: capabilityHash,
      oidcJtiHash,
    },
    capability: 'AUTHORIZE_PR_CI',
    riskClass: 'HIGH',
    policyId: 'ADR-0066/ESS-0022/M10-CUTOVER',
    decision: 'ALLOW',
    approvalId: gateInput.approvalId,
    repository: gateInput.repository,
    prNumber: gateInput.prNumber,
    commitSha: gateInput.headSha,
    workflowRunId,
    result: 'SUCCESS',
    metadata: { singleUseWorkflowGate: true, currentPrStateReResolved: true, githubOidcVerified: true },
  }).catch(() => {});

  res.setHeader('Cache-Control', 'no-store');
  return res.json({
    verdict: 'AUTHORIZED',
    repository: gateInput.repository,
    prNumber: gateInput.prNumber,
    headSha: gateInput.headSha,
    action: gateInput.action,
  });
});
