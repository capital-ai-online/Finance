// ARCH-AUDIT-0002 (H4, Kapitel 4.4): Admin-Endpunkt fuer den Status der realen Supervisor-
// Komponente (src/platform/Supervisor/supervisor.ts) - Routing-Tabelle, echte
// Ausfuehrungshistorie (executeSupervised()), sowie eine explizite, ehrliche Aufschluesselung,
// welche der im Audit genannten Faehigkeiten tatsaechlich implementiert sind.

import express from 'express';
import { getSupervisorStatus } from '../src/platform/Supervisor/supervisor';
import { checkAdminAccess } from '../src/platform/Security/authMiddleware';
import { SUPERVISOR_ZONE_ROLES } from '../src/platform/Security/types';

export const supervisorRouter = express.Router();

supervisorRouter.get('/status', async (req, res) => {
  const authz = await checkAdminAccess(req, 'supervisor:status', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.', reason: authz.reason });
  }
  res.json(getSupervisorStatus());
});
