// Audit ARCH-AUDIT-0002 (Kapitel 11, S4): zentraler strukturierter Logger und Correlation-ID.
// O1 Observability Baseline: bestehendes Logging bleibt Authority; Telemetry erweitert es um
// Redaction, kanonische Wertschöpfungs-Metadaten und Request-Dauer statt ein paralleles
// Logging-System einzuführen.

import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { attachSecurityResponseContext } from './securityResponse';
import { getDeploymentIdentity } from './deploymentIdentity';
import { redactTelemetryAttributes, TELEMETRY_SCHEMA_VERSION } from '../src/platform/Telemetry';
import { getClientIp } from '../src/platform/Security/rateLimiter';
import { buildTelemetryClientContext } from './telemetryClientContext';

declare global {
  namespace Express {
    interface Request {
      /** Correlation-ID fuer diesen Request, siehe requestContext()-Middleware unten. */
      requestId: string;
    }
  }
}

export type LogLevel = 'info' | 'warn' | 'error';

interface LogFields {
  scope: string;
  requestId?: string;
  [key: string]: unknown;
}

function write(level: LogLevel, fields: LogFields, message: string) {
  const deployment = getDeploymentIdentity();
  const safeFields = redactTelemetryAttributes(fields) ?? fields;
  const entry = {
    timestamp: new Date().toISOString(),
    telemetrySchemaVersion: TELEMETRY_SCHEMA_VERSION,
    level,
    service: 'capital-ai',
    environment: process.env.NODE_ENV || 'unknown',
    version: deployment.version,
    commitSha: deployment.commitSha || undefined,
    ...safeFields,
    message,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function createLogger(scope: string, requestId?: string) {
  return {
    info: (message: string, meta?: Record<string, unknown>) => write('info', { scope, requestId, ...meta }, message),
    warn: (message: string, meta?: Record<string, unknown>) => write('warn', { scope, requestId, ...meta }, message),
    error: (message: string, meta?: Record<string, unknown>) => write('error', { scope, requestId, ...meta }, message),
  };
}

function resolveRequestId(req: Request): string {
  const incoming = req.headers['x-request-id'];
  if (
    typeof incoming === 'string'
    && incoming.length > 0
    && incoming.length <= 128
    && /^[A-Za-z0-9._:-]+$/.test(incoming)
  ) return incoming;
  return crypto.randomUUID();
}

function outcomeForStatus(statusCode: number): 'success' | 'failure' | 'denied' {
  if (statusCode >= 500) return 'failure';
  if (statusCode === 401 || statusCode === 403 || statusCode === 429) return 'denied';
  return 'success';
}

/**
 * Früher Request-Hook für Correlation-ID, Deployment-Evidence und Security-Context.
 * O1 ergänzt eine standardisierte Abschlussmessung. Query-Strings und Request-Bodies werden
 * absichtlich nicht geloggt, um Secret-/PII-Leakage in Operational Telemetry zu vermeiden.
 */
export function requestContext(req: Request, res: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint();
  req.requestId = resolveRequestId(req);
  res.setHeader('x-request-id', req.requestId);

  const deployment = getDeploymentIdentity();
  res.setHeader('x-capital-ai-version', deployment.version);
  if (deployment.commitSha) res.setHeader('x-capital-ai-commit', deployment.commitSha);
  if (deployment.branch) res.setHeader('x-capital-ai-branch', deployment.branch);
  if (deployment.repoSlug) res.setHeader('x-capital-ai-repo', deployment.repoSlug);
  res.setHeader('x-capital-ai-provider', deployment.provider);

  attachSecurityResponseContext(req, res);

  res.once('finish', () => {
    if (req.path === '/healthz') return;
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const level: LogLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    // F-02: Korrelationsmerkmale über die kanonische getClientIp()-Boundary. Pseudonymisiert,
    // weil die Render-App-Logs eine Drittanbieter-Senke ohne projekteigene Retention-Kontrolle
    // sind - siehe server/telemetryClientContext.ts.
    const client = buildTelemetryClientContext(getClientIp(req as any), req.headers['user-agent']);
    createLogger('http', req.requestId)[level]('Request abgeschlossen', {
      eventName: 'request.completed',
      signal: 'metric',
      stage: 'request-intake',
      outcome: outcomeForStatus(res.statusCode),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(3)),
      clientIpHash: client.clientIpHash,
      clientNetwork: client.clientNetwork,
      userAgent: client.userAgent,
    });
  });

  next();
}
