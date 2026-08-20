import express from 'express';
import { checkAdminAccess } from '../src/platform/Security/authMiddleware';
import { DIAGNOSTIC_ZONE_ROLES } from '../src/platform/Security/types';
import { readQualityCenterReport } from '../src/platform/Quality/Operations/QualityCenterSnapshotStore';

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
  const snapshot = readQualityCenterReport(process.cwd());
  if (!snapshot) {
    return res.status(503).json({
      error: 'Quality Center Snapshot ist nicht verfügbar.',
      code: 'quality_snapshot_not_available',
    });
  }

  res.setHeader('X-Quality-Snapshot-Source', snapshot.sourcePath);
  return res.json(snapshot.report);
});
