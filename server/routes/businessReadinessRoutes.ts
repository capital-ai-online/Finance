import { Router } from 'express';
import { probeBusinessReadiness } from '../runtime/businessReadiness';

export function createBusinessReadinessRouter(): Router {
  const router = Router();

  // Full diagnostic projection without changing Render's liveness semantics.
  // Always 200 so operators can inspect every blocking boolean even while degraded.
  router.get('/healthz/readiness', async (_req, res) => {
    try {
      const snapshot = await probeBusinessReadiness();
      res.status(200).json(snapshot);
    } catch (error) {
      res.status(200).json({
        status: 'not-ready',
        ready: false,
        checkedAt: new Date().toISOString(),
        error: 'readiness-probe-failed',
      });
    }
  });

  // Strict business-readiness gate for operational checks and release verification.
  // This endpoint is intentionally NOT configured as Render healthCheckPath.
  router.get('/readyz', async (_req, res) => {
    try {
      const snapshot = await probeBusinessReadiness();
      res.status(snapshot.ready ? 200 : 503).json(snapshot);
    } catch (error) {
      res.status(503).json({
        status: 'not-ready',
        ready: false,
        checkedAt: new Date().toISOString(),
        error: 'readiness-probe-failed',
      });
    }
  });

  return router;
}
