import type { Express, Request, Response, NextFunction } from 'express';
import { getServerSupabase, isSupabaseConfigured } from '../db';
import { getClientIp } from '../../src/platform/Security/rateLimiter';
import { CAPITAL_AI_PUBLIC_HOSTS } from '../../src/platform/Security/edgeTrust';

const PRODUCTION_ORIGINS = CAPITAL_AI_PUBLIC_HOSTS.map((host) => `https://${host}`);

export interface CorsLogger {
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export function isLocalDevOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function isOriginAllowed(origin: string, isProduction: boolean): boolean {
  if (PRODUCTION_ORIGINS.includes(origin)) return true;
  if (isProduction) return false;

  return isLocalDevOrigin(origin);
}

async function logBlockedOrigin(origin: string, req: Request, logger: CorsLogger): Promise<void> {
  logger.warn('Blocked CORS Origin', {
    requestId: req.requestId,
    origin,
    path: req.originalUrl,
  });

  if (!isSupabaseConfigured()) return;

  try {
    const supabase = getServerSupabase();
    const ip = getClientIp(req);

    await supabase.from('security_events').insert({
      event_type: 'suspicious_request',
      ip_address: ip,
      user_agent: req.headers['user-agent'] || null,
      endpoint: req.originalUrl,
      outcome: 'blocked',
      reason: `Blocked CORS Origin: ${origin}`,
    });
  } catch (error) {
    logger.error('security_events-Insert fehlgeschlagen', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * ADR-0009 CORS boundary.
 *
 * Production accepts only the canonical CAPITAL-AI browser origins. Development may
 * additionally accept localhost/127.0.0.1. A disallowed Origin is rejected server-side for
 * every HTTP method rather than relying on the browser to hide the response. Requests without
 * an Origin remain valid for non-browser integrations such as Stripe webhooks and health probes.
 */
export function registerCorsMiddleware(
  app: Express,
  options: { isProduction: boolean; logger: CorsLogger },
): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (origin) {
      res.vary('Origin');

      if (isOriginAllowed(origin, options.isProduction)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        logBlockedOrigin(origin, req, options.logger).catch((error) => {
          options.logger.error('logBlockedOrigin fehlgeschlagen', {
            requestId: req.requestId,
            error: error instanceof Error ? error.message : String(error),
          });
        });

        return res.status(403).json({ error: 'Origin nicht erlaubt.' });
      }
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature, x-step-up-token');
    res.setHeader('Access-Control-Max-Age', '600');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  });
}
