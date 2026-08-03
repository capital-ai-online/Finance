import express from 'express';
import { checkRateLimit, getClientIp } from '../../platform/Security/rateLimiter';
import { createLogger } from '../../../server/logger';

const logger = createLogger('global-rate-limit');

export function installGlobalRateLimit(app: express.Express): void {
  app.use((req, res, next) => {
    const ip = getClientIp(req as any);
    if (!checkRateLimit(`global:${ip}`, 300, 60_000)) {
      logger.warn('Globales Rate-Limit erreicht', {
        requestId: req.requestId,
        ip,
        path: req.originalUrl,
      });
      return res.status(429).json({ error: 'Zu viele Anfragen. Bitte später erneut versuchen.' });
    }
    next();
  });
}
