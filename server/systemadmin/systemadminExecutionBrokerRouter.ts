import express from 'express';
import { createLogger } from '../logger';
import { rateLimitMiddleware } from '../../src/platform/Security/safeIo';
import {
  authorizeSystemadminAuditedExecution,
  recordSystemadminAuditedOutcome,
  type SystemadminAuditedAuthorization,
} from '../agentAudit/systemadminAuditedExecution';
import type { SystemadminChatExecutionCheckpoint } from '../../src/platform/Security/systemadminExecutionProfile';
import type { SystemadminRoadmapAuthorizationRequest } from '../../src/platform/Security/roadmapExecutionMandate';
import {
  SYSTEMADMIN_GITHUB_SA3B_WORKFLOW_REF,
  SYSTEMADMIN_GITHUB_SA4_WORKFLOW_REF,
  SYSTEMADMIN_GITHUB_WORK_PACKAGE_RUNNER_WORKFLOW_REF,
  verifyGitHubActionsOidcToken,
  type VerifiedGitHubActionsIdentity,
} from './githubActionsOidc';

const logger = createLogger('systemadmin-execution-broker');
const router = express.Router();
router.use(rateLimitMiddleware({ name: 'systemadmin-execution-broker', maxRequests: 30, windowMs: 60_000 }));

const SA3B_MANDATE = 'REM-SA3B-PROBE-001';
const SA4_MANDATE = 'REM-SA4-PILOT-001';
/**
 * ADR-0074: every REM authored for the generalized work-package catalog host must carry this
 * exact mandateId prefix. The broker never looks up individual work-package mandates by name —
 * it only checks that the OIDC-verified workflow is the one generic runner AND the presented
 * mandateId is reserved for that family. Per-work-package scoping (which file, which content)
 * is enforced entirely inside src/platform/Security/roadmapExecutionMandate.ts's REM_SCOPE layer
 * against that mandate's own allowedPaths/allowedCapabilities — this prefix check only binds the
 * *family* of mandates to the *one* workflow identity allowed to use them.
 */
const WORK_PACKAGE_MANDATE_PREFIX = 'REM-WORKPACKAGE-';

function isWorkPackageMandate(mandateId: string): boolean {
  return mandateId.startsWith(WORK_PACKAGE_MANDATE_PREFIX) && mandateId.length > WORK_PACKAGE_MANDATE_PREFIX.length;
}

function bearerToken(header: string | undefined): string {
  if (!header?.startsWith('Bearer ')) return '';
  return header.slice(7).trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

async function verifyHost(req: express.Request): Promise<VerifiedGitHubActionsIdentity> {
  const token = bearerToken(req.headers.authorization);
  return verifyGitHubActionsOidcToken(token);
}

function hostTraceId(identity: VerifiedGitHubActionsIdentity): string {
  return `github-actions:${identity.runId}`;
}

function mandateIdFromAuthorization(authorization: SystemadminRoadmapAuthorizationRequest): string {
  const mandate = authorization.mandate;
  return isRecord(mandate) && typeof mandate.mandateId === 'string' ? mandate.mandateId : '';
}

function expectedMandateForWorkflow(workflowRef: string): string | null {
  if (workflowRef === SYSTEMADMIN_GITHUB_SA3B_WORKFLOW_REF) return SA3B_MANDATE;
  if (workflowRef === SYSTEMADMIN_GITHUB_SA4_WORKFLOW_REF) return SA4_MANDATE;
  return null;
}

function workflowMatchesMandate(identity: VerifiedGitHubActionsIdentity, mandateId: string): boolean {
  if (identity.workflowRef === SYSTEMADMIN_GITHUB_WORK_PACKAGE_RUNNER_WORKFLOW_REF) {
    return isWorkPackageMandate(mandateId);
  }
  return expectedMandateForWorkflow(identity.workflowRef) === mandateId;
}

function executionStageForMandate(mandateId: string): 'SA4' | 'SA3B' | 'WORKPACKAGE' {
  if (mandateId === SA4_MANDATE) return 'SA4';
  if (isWorkPackageMandate(mandateId)) return 'WORKPACKAGE';
  return 'SA3B';
}

function policyIdForMandate(mandateId: string): string {
  const stage = executionStageForMandate(mandateId);
  if (stage === 'SA4') return 'ADR-0059/ADR-0065/ADR-0067/ADR-0068/SA4';
  if (stage === 'WORKPACKAGE') return 'ADR-0059/ADR-0065/ADR-0067/ADR-0074/WORKPACKAGE';
  return 'ADR-0059/ADR-0065/ADR-0067/SA3B';
}

router.post('/authorize', async (req, res) => {
  let identity: VerifiedGitHubActionsIdentity;
  try {
    identity = await verifyHost(req);
  } catch (error) {
    logger.warn('OIDC host verification denied', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(401).json({ error: 'execution-host-not-authorized' });
  }

  if (!isRecord(req.body)
    || !positiveInteger(req.body.issueNumber)
    || !isRecord(req.body.authorization)
    || !isRecord(req.body.checkpoint)) {
    return res.status(400).json({ error: 'invalid-execution-request' });
  }

  const authorization = req.body.authorization as unknown as SystemadminRoadmapAuthorizationRequest;
  const checkpoint = req.body.checkpoint as unknown as SystemadminChatExecutionCheckpoint;
  const mandateId = mandateIdFromAuthorization(authorization);

  if (!workflowMatchesMandate(identity, mandateId)) {
    return res.status(403).json({ error: 'workflow-mandate-binding-mismatch' });
  }
  if (authorization.principal.humanActorId !== identity.actor) {
    return res.status(403).json({ error: 'actor-binding-mismatch' });
  }
  if (authorization.principal.requestId !== `issue-${req.body.issueNumber}-run-${identity.runId}`) {
    return res.status(403).json({ error: 'request-binding-mismatch' });
  }

  try {
    const result = await authorizeSystemadminAuditedExecution(
      { authorization, checkpoint },
      {
        traceId: hostTraceId(identity),
        policyId: policyIdForMandate(mandateId),
        toolId: identity.workflowRef === SYSTEMADMIN_GITHUB_SA4_WORKFLOW_REF
          ? 'github-actions-systemadmin-sa4-host'
          : identity.workflowRef === SYSTEMADMIN_GITHUB_WORK_PACKAGE_RUNNER_WORKFLOW_REF
            ? 'github-actions-systemadmin-workpackage-host'
            : 'github-actions-systemadmin-host',
        workflowRunId: identity.runId,
        rollbackReference: `issue:${req.body.issueNumber}`,
        metadata: {
          executionHost: 'github-actions',
          executionStage: executionStageForMandate(mandateId),
          issueNumber: req.body.issueNumber,
          oidcSubject: identity.subject,
          repositoryId: identity.repositoryId,
          workflowRef: identity.workflowRef,
          workflowSha: identity.workflowSha,
          hostSha: identity.sha,
          runAttempt: identity.runAttempt,
        },
      },
    );

    return res.status(result.decision.verdict === 'ALLOW' ? 200 : 403).json(result);
  } catch (error) {
    logger.error('Systemadmin authorization broker failed closed', {
      requestId: req.requestId,
      runId: identity.runId,
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(503).json({ error: 'audit-authorization-unavailable' });
  }
});

router.post('/outcome', async (req, res) => {
  let identity: VerifiedGitHubActionsIdentity;
  try {
    identity = await verifyHost(req);
  } catch (error) {
    logger.warn('OIDC outcome host verification denied', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(401).json({ error: 'execution-host-not-authorized' });
  }

  if (!isRecord(req.body)
    || !positiveInteger(req.body.issueNumber)
    || !isRecord(req.body.authorization)
    || (req.body.result !== 'SUCCESS' && req.body.result !== 'ERROR')) {
    return res.status(400).json({ error: 'invalid-outcome-request' });
  }

  const authorization = req.body.authorization as unknown as SystemadminAuditedAuthorization;
  const mandateId = authorization.executionPermit?.mandateId ?? authorization.decision.mandateId ?? '';
  if (!workflowMatchesMandate(identity, mandateId)) {
    return res.status(403).json({ error: 'outcome-workflow-mandate-binding-mismatch' });
  }
  if (authorization.traceId !== hostTraceId(identity)) {
    return res.status(403).json({ error: 'host-trace-mismatch' });
  }
  if (authorization.executionPermit?.requestId !== `issue-${req.body.issueNumber}-run-${identity.runId}`) {
    return res.status(403).json({ error: 'outcome-request-binding-mismatch' });
  }

  try {
    const auditReference = await recordSystemadminAuditedOutcome({
      authorization,
      result: req.body.result,
      ...(typeof req.body.branchName === 'string' ? { branchName: req.body.branchName } : {}),
      ...(typeof req.body.commitSha === 'string' ? { commitSha: req.body.commitSha } : {}),
      ...(positiveInteger(req.body.pullRequestNumber)
        ? { pullRequestNumber: req.body.pullNumber }
        : {}),
      workflowRunId: identity.runId,
      policyId: policyIdForMandate(mandateId),
      metadata: {
        executionHost: 'github-actions',
        executionStage: executionStageForMandate(mandateId),
        issueNumber: req.body.issueNumber,
        oidcSubject: identity.subject,
        workflowRef: identity.workflowRef,
        workflowSha: identity.workflowSha,
        hostSha: identity.sha,
      },
    });
    return res.status(200).json({ auditReference });
  } catch (error) {
    logger.error('Systemadmin outcome broker failed closed', {
      requestId: req.requestId,
      runId: identity.runId,
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(503).json({ error: 'audit-outcome-unavailable' });
  }
});

export const systemadminExecutionBrokerRouter = router;
