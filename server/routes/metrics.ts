import { Router } from 'express';
import { getCleanEnv } from '../env';
import { renderMetrics } from '../metrics';

/**
 * Fail-closed Prometheus metrics endpoint.
 *
 * The token contract is intentionally unchanged from server.ts: without a
 * configured METRICS_TOKEN, the endpoint is disabled; a mismatched token is
 * rejected. No token value is ever logged or returned.
 */
export function createMetricsRouter(): Router {
  const router = Router();

  router.get('/metrics', (req, res) => {
    const expectedToken = getCleanEnv('METRICS_TOKEN');
    if (!expectedToken) {
      return res.status(403).json({ error: 'METRICS_TOKEN nicht konfiguriert - /metrics ist deaktiviert.' });
    }

    const providedToken = req.headers['x-metrics-token'];
    if (providedToken !== expectedToken) {
      return res.status(403).json({ error: 'Zugriff verweigert.' });
    }

    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return res.send(renderMetrics());
  });

  return router;
}
