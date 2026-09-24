import { Router } from 'express';
import { checkAdminAccess } from '../../src/platform/Security/authMiddleware';
import { OWNER_ONLY_ROLES } from '../../src/platform/Security/types';
import { loadGoogleAnalyticsReadSnapshot } from '../googleAnalyticsReadProjection';

export const googleAnalyticsReadRouter = Router();

googleAnalyticsReadRouter.get('/readback', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const authz = await checkAdminAccess(
    req,
    'google-analytics-readback:read',
    OWNER_ONLY_ROLES,
  );
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }

  try {
    const snapshot = await loadGoogleAnalyticsReadSnapshot();
    return res.status(snapshot.status === 'PASS' ? 200 : 206).json(snapshot);
  } catch {
    console.error('[GA4-READBACK] provider read failed');
    return res.status(503).json({
      schemaVersion: 'google-analytics-render-readback/1.0.0',
      role: 'NON_AUTHORIZING_READ_ONLY_PROJECTION',
      status: 'EVIDENCE_UNAVAILABLE',
      message: 'Google Analytics ist derzeit nicht über den Render-Readback lesbar.',
    });
  }
});
