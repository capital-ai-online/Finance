import express from 'express';
import { createLogger } from '../logger';
import { enqueueOutboxJob } from '../outbox';
import { rateLimitMiddleware } from '../../src/platform/Security/safeIo';
import { verifyGitHubBillingAlertOidcToken } from '../billing/githubBillingAlertOidc';
import { GITHUB_BILLING_ALERT_RECIPIENT } from '../billing/githubBillingAlertMailer';

const logger = createLogger('github-billing-alert');
export const githubBillingAlertRouter = express.Router();

githubBillingAlertRouter.use(
  rateLimitMiddleware({ name: 'github-billing-alert', maxRequests: 12, windowMs: 60_000 }),
);

function bearerToken(header: string | undefined): string {
  return header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validFingerprint(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function validReport(value: unknown): value is Record<string, unknown> {
  if (!record(value)) return false;
  if (value.schemaVersion !== '1.0.0') return false;
  if (value.emailRequired !== true) return false;
  if (value.recipient !== GITHUB_BILLING_ALERT_RECIPIENT) return false;
  if (value.mode !== 'test' && value.mode !== 'monitor') return false;
  if (!validFingerprint(value.alertFingerprint)) return false;
  if (!Array.isArray(value.rows) || value.rows.length > 500) return false;
  if (!Array.isArray(value.alertRows) || value.alertRows.length > 500) return false;
  if (!Array.isArray(value.detailRows) || value.detailRows.length > 1000) return false;
  if (!Array.isArray(value.alertDetailRows) || value.alertDetailRows.length > 1000) return false;
  if (!Array.isArray(value.potentialCostSurfaces) || value.potentialCostSurfaces.length > 100) return false;
  if (typeof value.generatedAt !== 'string' || !Number.isFinite(Date.parse(value.generatedAt))) return false;
  return true;
}

githubBillingAlertRouter.post('/email', async (req, res) => {
  let identity;
  try {
    identity = await verifyGitHubBillingAlertOidcToken(bearerToken(req.headers.authorization));
  } catch (error) {
    logger.warn('Billing alert OIDC denied', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(401).json({ error: 'billing-alert-host-not-authorized' });
  }

  if (!record(req.body) || !validReport(req.body.report)) {
    return res.status(400).json({ error: 'invalid-billing-alert-report' });
  }

  const report = req.body.report;
  if (identity.eventName === 'schedule' && report.mode !== 'monitor') {
    return res.status(403).json({ error: 'scheduled-run-must-use-monitor-mode' });
  }

  const cycle = record(report.cycle) ? report.cycle : {};
  const cycleRef = `${String(cycle.year || 'unknown')}-${String(cycle.month || 'unknown')}`;
  const fingerprint = report.alertFingerprint as string;
  const idempotencyKey = report.mode === 'test'
    ? `github_billing_cost_test:${identity.runId}:${fingerprint}`
    : `github_billing_cost_alert:${cycleRef}:${fingerprint}`;

  try {
    const result = await enqueueOutboxJob({
      jobType: 'github_billing_cost_alert_mail',
      idempotencyKey,
      payload: { report },
      maxAttempts: 5,
    });
    logger.info('Billing alert mail accepted', {
      requestId: req.requestId,
      runId: identity.runId,
      eventName: identity.eventName,
      mode: report.mode,
      enqueued: result.enqueued,
    });
    return res.status(202).json({
      accepted: true,
      enqueued: result.enqueued,
      duplicate: !result.enqueued,
    });
  } catch (error) {
    logger.error('Billing alert enqueue failed closed', {
      requestId: req.requestId,
      runId: identity.runId,
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(503).json({ error: 'billing-alert-enqueue-unavailable' });
  }
});
