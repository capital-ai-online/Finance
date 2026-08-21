import express from 'express';
import { getHygieneStatusData } from './documentHygiene';
import { checkAdminAccess } from '../src/platform/Security/authMiddleware';
import { SUPERVISOR_ZONE_ROLES } from '../src/platform/Security/types';
import { publishSystemAuditEvent } from '../src/platform/EventMesh/Services/SystemAuditBridge';
import {
  operationalSystemEventJournal,
  type SystemEvent,
} from './systemEvents/systemEventJournal';
import {
  orchestratorAgentRuntimeProjection,
  type OrchestratorAgentRuntimeView,
} from '../src/orchestrator/agentRuntimeProjection';

export type { SystemEvent } from './systemEvents/systemEventJournal';
export type Agent = OrchestratorAgentRuntimeView;

export const systemEventsRouter = express.Router();

/**
 * Bounded compatibility projection used by existing in-process callers.
 * This is explicitly ephemeral operational telemetry, not an audit/security/business-state source.
 */
export function getSystemEvents(): SystemEvent[] {
  return operationalSystemEventJournal.getRecent();
}

/**
 * Compatibility producer for existing call sites.
 *
 * `userEmail` and `ip` remain accepted so callers do not need a parallel migration, but they are
 * deliberately NOT persisted or exposed by the operational projection. Durable actor/security
 * evidence belongs to the existing security_events / ADR-0059 audit authorities.
 */
export function logSystemEvent(
  type: SystemEvent['type'],
  action: string,
  _userEmail: string,
  details: string,
  status: SystemEvent['status'],
  _ip?: string,
): void {
  operationalSystemEventJournal.record({
    type,
    action,
    details,
    status,
  });

  // ADR-0018 Event Mesh remains additive in-process telemetry only. The legacy event name
  // `SystemAuditEvent` is retained for catalog compatibility but does not create audit authority.
  try {
    publishSystemAuditEvent({ type, action, details, status });
  } catch (meshErr) {
    console.error('[EventMesh] Operational SystemAuditEvent konnte nicht veröffentlicht werden:', meshErr);
  }
}

systemEventsRouter.get('/system-events', async (req, res) => {
  const authz = await checkAdminAccess(req, 'system-events:read');
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators only.' });
  }

  const snapshot = await operationalSystemEventJournal.list(100);
  res.json({
    success: true,
    events: snapshot.events,
    journal: {
      durability: snapshot.durability,
      authority: snapshot.authority,
      auditAuthority: snapshot.auditAuthority,
      piiPersistence: snapshot.piiPersistence,
    },
  });
});

/**
 * Retired manual event mutation surface. Operational state must be runtime-derived; allowing an
 * admin form to create events would fabricate monitoring/compliance history.
 */
systemEventsRouter.post('/system-events', async (req, res) => {
  const authz = await checkAdminAccess(req, 'system-events:write');
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators only.' });
  }
  return res.status(409).json({
    error: 'Operational events are runtime-derived and cannot be manually registered.',
    code: 'RUNTIME_DERIVED_OPERATIONAL_EVENT_REQUIRED',
  });
});

systemEventsRouter.get('/doc-status', async (req, res) => {
  const authz = await checkAdminAccess(req, 'doc-status');
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators only.' });
  }

  try {
    const hygieneData = getHygieneStatusData();
    const recentLogsSummary = hygieneData.logs.slice(0, 10).map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      filePath: log.filePath,
      eventType: log.eventType,
      classification: log.classification,
      actionTaken: log.actionTaken,
      status: log.status,
      details: log.details,
    }));

    res.json({
      success: true,
      state: hygieneData.state,
      ticketsCount: hygieneData.tickets.length,
      recentLogsCount: hygieneData.logs.length,
      recentLogsSummary,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error fetching doc-status:', err);
    res.status(500).json({ error: `Failed to fetch document status: ${err.message || err}` });
  }
});

// -----------------------------------------------------------------------------
// Agent operational projection
// -----------------------------------------------------------------------------
// The existing orchestrator composition owns which agents actually exist. This HTTP layer only
// exposes a read projection of descriptors registered by constructed orchestrators; it does not
// maintain a second static registry or permit runtime registration.

export function getAgentsRegistry(): Agent[] {
  return orchestratorAgentRuntimeProjection.list();
}

systemEventsRouter.get('/agents', async (req, res) => {
  const authz = await checkAdminAccess(req, 'agents:read', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.' });
  }
  res.json({
    success: true,
    agents: getAgentsRegistry(),
    registryAuthority: 'orchestrator-runtime-composition',
  });
});

/**
 * Retired legacy mutation surface.
 *
 * The former implementation wrote docs/**, generated risk/change documents and allocated ADR
 * numbers by scanning filenames. That bypassed ADR-0096 namespace reservation, Documentary
 * maintenance and branch/PR governance. Agent architecture changes must now be prepared through
 * the repository control plane and reviewed before becoming runtime-visible.
 */
systemEventsRouter.post('/agents/register', async (req, res) => {
  const authz = await checkAdminAccess(req, 'agents:register', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.' });
  }
  return res.status(409).json({
    error: 'Repository control plane required for agent registration.',
    code: 'REPOSITORY_CONTROL_PLANE_REQUIRED',
    requiredFlow: 'branch -> current-main correlation -> ADR/ESS/registry validation where applicable -> PR -> Human Merge',
  });
});

/** Manual status toggles would fabricate operational state. Runtime status is derived only from
 * real orchestrator activity and cannot be changed through this HTTP surface. */
systemEventsRouter.post('/agents/toggle', async (req, res) => {
  const authz = await checkAdminAccess(req, 'agents:toggle', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.' });
  }
  return res.status(409).json({
    error: 'Agent operational state is runtime-derived and cannot be manually fabricated.',
    code: 'RUNTIME_DERIVED_STATE_REQUIRED',
  });
});

systemEventsRouter.get('/orchestrators/status', async (req, res) => {
  const authz = await checkAdminAccess(req, 'orchestrators:status', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.' });
  }

  // These records describe code-wired capabilities, not measured network health. Therefore no
  // synthetic latency or fabricated activity timestamp is returned. Agent counts are derived from
  // the same constructed-orchestrator projection used by GET /agents.
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    statusSemantics: 'structural-capability-only',
    orchestrators: [
      {
        id: 'crypto_orchestrator',
        name: 'Crypto Orchestrator',
        status: 'AVAILABLE',
        latency: null,
        agentsCount: orchestratorAgentRuntimeProjection.countForOrchestrator('crypto_orchestrator'),
        lastActive: null,
        type: 'Crypto & DeFi research/enrichment',
      },
      {
        id: 'rawmaterials_orchestrator',
        name: 'Raw Materials Orchestrator',
        status: 'AVAILABLE',
        latency: null,
        agentsCount: orchestratorAgentRuntimeProjection.countForOrchestrator('rawmaterials_orchestrator'),
        lastActive: null,
        type: 'Macroeconomic & Commodities Valuation',
      },
    ],
  });
});
