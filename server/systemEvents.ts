import express from 'express';
import { getHygieneStatusData } from './documentHygiene';
import { checkAdminAccess } from '../src/platform/Security/authMiddleware';
import { SUPERVISOR_ZONE_ROLES } from '../src/platform/Security/types';
import { publishSystemAuditEvent } from '../src/platform/EventMesh/Services/SystemAuditBridge';
import {
  operationalSystemEventJournal,
  type SystemEvent,
} from './systemEvents/systemEventJournal';

export type { SystemEvent } from './systemEvents/systemEventJournal';

export const systemEventsRouter = express.Router();

/**
 * Compatibility projection used by existing in-process callers.
 * The authoritative durable read path is the authenticated async route below. No file-backed or
 * synthetic fallback exists anymore.
 */
export function getSystemEvents(): SystemEvent[] {
  return operationalSystemEventJournal.getRecent();
}

let clients: express.Response[] = [];

export function logSystemEvent(
  type: SystemEvent['type'],
  action: string,
  userEmail: string,
  details: string,
  status: SystemEvent['status'],
  ip?: string,
): void {
  const newEvent = operationalSystemEventJournal.record({
    type,
    action,
    userEmail: userEmail || 'system',
    details,
    status,
    ip,
  });

  const eventPayload = JSON.stringify(newEvent);
  clients.forEach((client) => {
    try {
      client.write(`data: ${eventPayload}\n\n`);
    } catch (err) {
      console.error('SSE failed to write to a client:', err);
    }
  });

  // ADR-0018 Event Mesh remains an additive in-process transport. It is not the durable journal
  // and it does not become an authorization or audit authority through this projection.
  try {
    publishSystemAuditEvent({
      type,
      action,
      userEmail: newEvent.userEmail,
      details,
      status,
      ip,
    });
  } catch (meshErr) {
    console.error('[EventMesh] SystemAuditEvent konnte nicht veröffentlicht werden:', meshErr);
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
    },
  });
});

systemEventsRouter.get('/system-events/stream', async (req, res) => {
  const authz = await checkAdminAccess(req, 'system-events:stream');
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators only.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  clients.push(res);
  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAliveInterval);
    }
  }, 20_000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    clients = clients.filter((client) => client !== res);
  });
});

systemEventsRouter.post('/system-events', async (req, res) => {
  const authz = await checkAdminAccess(req, 'system-events:write');
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators only.' });
  }

  const { type, action, details, status, targetEmail } = req.body;
  if (!type || !action || !details) {
    return res.status(400).json({ error: 'Type, action and details are required.' });
  }

  logSystemEvent(type, action, targetEmail || authz.actorLabel, details, status || 'SUCCESS');
  const snapshot = await operationalSystemEventJournal.list(100);
  res.json({
    success: true,
    events: snapshot.events,
    journal: {
      durability: snapshot.durability,
      authority: snapshot.authority,
      auditAuthority: snapshot.auditAuthority,
    },
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
// This is deliberately process-local telemetry. It is not an agent registry authority and it is
// never written to the Render filesystem. Canonical agent/provider/domain identities remain owned
// by their existing code/config registries and Supervisor contracts.

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'IDLE' | 'ACTIVE';
  activeTask: string;
  queriesCount: number;
  model: string;
  performance: string;
  isCustom?: boolean;
}

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'ag_allocator',
    name: 'Analysis Pipeline',
    role: 'Fundamentals / network activity telemetry',
    status: 'IDLE',
    activeTask: 'Keine aktive Aufgabe',
    queriesCount: 0,
    model: 'provider-neutral',
    performance: 'N/A',
  },
  {
    id: 'ag_risk',
    name: 'Risk Pipeline',
    role: 'Risk observation telemetry',
    status: 'IDLE',
    activeTask: 'Keine aktive Aufgabe',
    queriesCount: 0,
    model: 'provider-neutral',
    performance: 'N/A',
  },
  {
    id: 'ag_scanner',
    name: 'Research Scanner',
    role: 'Classification / research telemetry',
    status: 'IDLE',
    activeTask: 'Keine aktive Aufgabe',
    queriesCount: 0,
    model: 'provider-neutral',
    performance: 'N/A',
  },
  {
    id: 'ag_auditor',
    name: 'Compliance Observation',
    role: 'Compliance observation telemetry',
    status: 'IDLE',
    activeTask: 'Keine aktive Aufgabe',
    queriesCount: 0,
    model: 'provider-neutral',
    performance: 'N/A',
  },
];

const agentsRegistry: Agent[] = DEFAULT_AGENTS.map((agent) => ({ ...agent }));

export function getAgentsRegistry(): Agent[] {
  return agentsRegistry.map((agent) => ({ ...agent }));
}

export function updateAgentActivity(id: string, activeTask: string, isStarting: boolean): void {
  const agent = agentsRegistry.find((candidate) => candidate.id === id);
  if (!agent) return;

  if (isStarting) {
    agent.status = 'ACTIVE';
    agent.activeTask = activeTask;
    agent.queriesCount += 1;
  } else {
    agent.status = 'IDLE';
    agent.activeTask = 'Keine aktive Aufgabe';
  }
}

systemEventsRouter.get('/agents', async (req, res) => {
  const authz = await checkAdminAccess(req, 'agents:read', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.' });
  }
  res.json({
    success: true,
    agents: getAgentsRegistry(),
    registryAuthority: 'operational-projection-only',
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
 * real updateAgentActivity() calls made by active orchestrator execution. */
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
  // synthetic latency or fabricated activity timestamp is returned.
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
        agentsCount: 4,
        lastActive: null,
        type: 'Crypto & DeFi research/enrichment',
      },
      {
        id: 'rawmaterials_orchestrator',
        name: 'Raw Materials Orchestrator',
        status: 'AVAILABLE',
        latency: null,
        agentsCount: 4,
        lastActive: null,
        type: 'Macroeconomic & Commodities Valuation',
      },
    ],
  });
});
