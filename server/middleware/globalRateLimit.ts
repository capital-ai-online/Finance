import type { Express, Request, Response, NextFunction } from 'express';
import { checkRateLimit, getClientIp } from '../../src/platform/Security/rateLimiter';

export interface RateLimitLogger {
  warn(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Registers the existing process-local global request limiter.
 *
 * IMPORTANT: call this only after Stripe raw-body webhook routes have been
 * registered. The legacy server.ts intentionally excludes those webhook routes
 * from this limiter by ordering, and that invariant must remain unchanged.
 */
export function registerGlobalRateLimit(app: Express, logger: RateLimitLogger): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req as any);
    if (!checkRateLimit(`global:${ip}`, 300, 60_000)) {
      logger.warn('Globales Rate-Limit erreicht', {
        requestId: req.requestId,
        ip,
        path: req.originalUrl,
      });
      return res.status(429).json({ error: 'Zu viele Anfragen. Bitte kurz warten.' });
    }
    next();
  });
}
