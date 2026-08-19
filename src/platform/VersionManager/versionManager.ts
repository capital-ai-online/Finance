import express from 'express';
import { checkAdminAccess } from '../Security/authMiddleware';
import { SUPERVISOR_ZONE_ROLES } from '../Security/types';
import { readPlatformVersionProjection } from '../Release/Services/platformVersionControlPlane';

/**
 * Legacy HTTP compatibility adapter.
 *
 * Platform-version authority and release mutation live in src/platform/Release.
 * This router intentionally exposes only an authenticated read-only projection.
 */
export const versionManagerRouter = express.Router();

async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authz = await checkAdminAccess(req, 'version-manager', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.' });
  }
  next();
}

versionManagerRouter.get('/version', requireAdmin, (_req, res) => {
  try {
    const state = readPlatformVersionProjection(process.cwd());
    res.json({
      success: true,
      state,
      workspace: {
        source: 'release-control-plane-read-only',
        mutationAuthority: 'controlled-release-version-gate',
      },
    });
  } catch (error) {
    console.error('[VersionManagerProjection] Failed to resolve platform version projection:', error);
    res.status(503).json({
      success: false,
      error: 'Platform version projection is unavailable because its authority contract could not be verified.',
      code: 'PLATFORM_VERSION_AUTHORITY_UNAVAILABLE',
    });
  }
});
