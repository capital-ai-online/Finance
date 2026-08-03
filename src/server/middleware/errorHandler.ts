import express from 'express';
import { createLogger } from '../../../server/logger';

const logger = createLogger('express-error-handler');

export function installErrorHandler(app: express.Express): void {
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unbehandelter Route-Fehler', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      error: err?.message || String(err),
    });

    if (res.headersSent) return next(err);
    return res.status(500).json({ error: 'Interner Serverfehler.' });
  });
}
