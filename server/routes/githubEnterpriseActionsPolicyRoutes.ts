import { Router } from 'express';
import { checkAdminAccess } from '../../src/platform/Security/authMiddleware';
import { OWNER_ONLY_ROLES } from '../../src/platform/Security/types';
import { loadGitHubEnterpriseActionsPolicySnapshot } from '../githubEnterpriseActionsPolicyProjection';

export const githubEnterpriseActionsPolicyRouter = Router();

githubEnterpriseActionsPolicyRouter.get('/actions-policy', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const authz = await checkAdminAccess(
    req,
    'github-enterprise-actions-policy:read',
    OWNER_ONLY_ROLES,
  );
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Zugriff verweigert.', reason: authz.reason });
  }

  try {
    const snapshot = await loadGitHubEnterpriseActionsPolicySnapshot();
    return res.status(snapshot.status === 'PASS' ? 200 : 206).json(snapshot);
  } catch (error) {
    console.error('[GITHUB-ENTERPRISE-ACTIONS-PROJECTION] read failed', {
      message: error instanceof Error ? error.message : 'unknown error',
    });
    return res.status(503).json({
      schemaVersion: 'github-enterprise-actions-policy/1.0.0',
      role: 'NON_AUTHORIZING_READ_ONLY_PROJECTION',
      status: 'EVIDENCE_UNAVAILABLE',
      message: 'GitHub Enterprise Actions Policy ist derzeit nicht lesbar.',
    });
  }
});
