// Audit ARCH-AUDIT-0002 (Kapitel 11, S4): Es gab bisher kein Logger-Framework, keine Log-
// Level, kein einheitliches Format und keine Correlation-IDs - 279 console.*-Aufrufe verteilt
// ueber server/ und server.ts, jeder mit eigenem Ad-hoc-Format. Bewusst KEINE externe
// Logging-Bibliothek (pino/winston) eingefuehrt: das Projekt hat an anderer Stelle bereits
// bewusst gegen zusaetzliche Abhaengigkeiten fuer kleine, gut spezifizierte Probleme
// entschieden (siehe src/platform/Security/totp.ts). Dieses Modul strukturiert stattdessen die
// bestehende console.*-Ausgabe: einheitliches Format (Timestamp, Level, Scope, optionale
// Request-ID, Message, Meta) plus eine Middleware, die jedem Request eine Correlation-ID
// zuweist und als `x-request-id`-Header zurueckgibt.
//
// Migration ist bewusst schrittweise: neue und sicherheitsrelevante Logs (IAM, Step-Up,
// globaler Fehlerhandler) nutzen dieses Modul; die uebrigen bestehenden console.*-Aufrufe
// bleiben zunaechst unveraendert (Folgearbeit, kein Big-Bang-Rewrite von ~279 Aufrufstellen).

import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

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
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    ...fields,
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

/**
 * Weist jedem eingehenden Request eine Correlation-ID zu (aus x-request-id, falls von einem
 * vorgelagerten Proxy/Load-Balancer bereits gesetzt, sonst neu generiert) und spiegelt sie im
 * Response-Header - damit laesst sich ein Request ueber Logzeilen mehrerer Module hinweg
 * (CORS-Block, IAM-Pruefung, Route-Handler, Fehlerbehandlung) zusammenfuehren.
 */
export function requestContext(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers['x-request-id'];
  req.requestId = (typeof incoming === 'string' && incoming.length > 0) ? incoming : crypto.randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
}
