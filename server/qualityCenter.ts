import express from 'express';
import { checkAdminAccess } from '../src/platform/Security/authMiddleware';
import { DIAGNOSTIC_ZONE_ROLES } from '../src/platform/Security/types';
import { readQualityCenterReport } from '../src/platform/Quality/Operations/QualityCenterSnapshotStore';
import { readPlatformVersionProjection } from '../src/platform/Release/Services/platformVersionControlPlane';

export const qualityCenterRouter = express.Router();

qualityCenterRouter.get('/', async (req, res) => {
  const authz = await checkAdminAccess(req, 'quality-center:read', DIAGNOSTIC_ZONE_ROLES);
  if (!authz.authorized || !authz.userId) {
    return res.status(403).json({
      error: 'Access Denied: Diagnose-Rolle erforderlich.',
      reason: authz.reason,
    });
  }

  res.setHeader('Cache-Control', 'no-store');

  const release = readPlatformVersionProjection(process.cwd());
  const expectedSourceCommit = release.commitSha;
  if (typeof expectedSourceCommit !== 'string' || !/^[0-9a-f]{40}$/i.test(expectedSourceCommit)) {
    return res.status(503).json({
      error: 'Runtime Release Identity ist nicht verfügbar.',
      code: 'quality_release_identity_not_available',
    });
  }

  const snapshot = readQualityCenterReport(process.cwd(), expectedSourceCommit);
  if (!snapshot) {
    return res.status(503).json({
      error: 'Quality Center Snapshot ist nicht verfügbar oder stimmt nicht mit dem Runtime Release überein.',
      code: 'quality_snapshot_not_available',
    });
  }

  res.setHeader('X-Quality-Snapshot-Source', snapshot.sourcePath);
  res.setHeader('X-Quality-Source-Commit', expectedSourceCommit);
  return res.json(snapshot.report);
});
