import type { Express, Request, Response, NextFunction } from 'express';
import { getCleanEnv } from '../env';
import { getServerSupabase, isSupabaseConfigured } from '../db';

const PRODUCTION_ORIGINS = [
  'https://capital-ai.online',
  'https://www.capital-ai.online',
];

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

  if (isLocalDevOrigin(origin)) return true;
  const aiStudioOrigin = getCleanEnv('AI_STUDIO_ORIGIN');
  return Boolean(aiStudioOrigin && origin === aiStudioOrigin);
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
    const xff = req.headers['x-forwarded-for'];
    const ip = typeof xff === 'string'
      ? xff.split(',')[0].trim()
      : (req.socket?.remoteAddress || 'unknown');

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
 * ADR-0009 CORS boundary extracted without changing policy semantics.
 *
 * Production accepts only the two explicit CAPITAL-AI origins. Development may
 * additionally accept localhost/127.0.0.1 and one explicitly configured
 * AI_STUDIO_ORIGIN. Unknown origins never receive ACAO credentials.
 */
export function registerCorsMiddleware(
  app: Express,
  options: { isProduction: boolean; logger: CorsLogger },
): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (origin) {
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

        if (req.method === 'OPTIONS') {
          return res.status(403).json({ error: 'Origin nicht erlaubt.' });
        }
      }
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }

    next();
  });
}
