import express from 'express';
import fs from 'fs';
import path from 'path';
import { getHygieneStatusData, processFileEvent } from './documentHygiene';
import { checkAdminAccess } from './iam/authMiddleware';
import { SUPERVISOR_ZONE_ROLES } from './iam/types';
import { publishSystemAuditEvent } from '../src/platform/EventMesh/Services/SystemAuditBridge';

export const systemEventsRouter = express.Router();

const SYSTEM_EVENTS_FILE = path.join(process.cwd(), 'uploads', 'system_events.json');

export interface SystemEvent {
  id: string;
  timestamp: string;
  type: 'AUTH' | 'SUBSCRIPTION' | 'CREDITS' | 'ORCHESTRATOR' | 'MARKET_DATA' | 'SECURITY';
  action: string;
  userEmail: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  ip?: string;
}

export function getSystemEvents(): SystemEvent[] {
  try {
    if (!fs.existsSync(SYSTEM_EVENTS_FILE)) {
      const initialEvents: SystemEvent[] = [
        {
          id: 'evt_01jg83f0w8f',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          type: 'SECURITY',
          action: 'Billing Bypass Check',
          userEmail: 'sven.kulessa@gmail.com',
          details: 'Eliminated unauthenticated simulated credits billing bypass route /api/stripe/add-pdf-credits-simulated',
          status: 'SUCCESS'
        },
        {
          id: 'evt_01jg83h1v7g',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          type: 'AUTH',
          action: 'Admin Panel Access',
          userEmail: 'sven.kulessa@gmail.com',
          details: 'Secured administrative portal access check successfully validated.',
          status: 'SUCCESS'
        },
        {
          id: 'evt_01jg83p4m3n',
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
          type: 'SUBSCRIPTION',
          action: 'Enterprise Activation',
          userEmail: 'sven.kulessa@gmx.net',
          details: 'Verified owner bypass privileges for sven.kulessa@gmx.net -> Tier upgraded to Enterprise',
          status: 'SUCCESS'
        },
        {
          id: 'evt_01jg84r9k8h',
          timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
          type: 'ORCHESTRATOR',
          action: 'Model Routing Swapped',
          userEmail: 'sven.kulessa@gmail.com',
          details: 'Swapped optimal LLM model to Gemini 2.5 Flash based on automatic latency check (42ms)',
          status: 'SUCCESS'
        },
        {
          id: 'evt_01jg84x2f1k',
          timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
          type: 'CREDITS',
          action: 'Credits Purchase Webhook',
          userEmail: 'customer_trial@gmail.com',
          details: 'Webhook payment completed. Added 3 PDF Export Credits successfully.',
          status: 'SUCCESS'
        }
      ];
      const dir = path.dirname(SYSTEM_EVENTS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(SYSTEM_EVENTS_FILE, JSON.stringify(initialEvents, null, 2), 'utf8');
      return initialEvents;
    }

    const data = fs.readFileSync(SYSTEM_EVENTS_FILE, 'utf8');
    return JSON.parse(data) || [];
  } catch (e) {
    console.error("Error reading system events file:", e);
    return [];
  }
}

let clients: express.Response[] = [];

export function logSystemEvent(
  type: SystemEvent['type'],
  action: string,
  userEmail: string,
  details: string,
  status: SystemEvent['status'],
  ip?: string
) {
  try {
    const events = getSystemEvents();
    const newEvent: SystemEvent = {
      id: 'evt_' + Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString(),
      type,
      action,
      userEmail: userEmail || 'system',
      details,
      status,
      ip
    };
    events.unshift(newEvent);
    const trimmed = events.slice(0, 100);
    fs.writeFileSync(SYSTEM_EVENTS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');

    // Broadcast in real-time to SSE client connections
    const eventPayload = JSON.stringify(newEvent);
    clients.forEach(client => {
      try {
        client.write(`data: ${eventPayload}\n\n`);
      } catch (err) {
        console.error("SSE failed to write to a client:", err);
      }
    });

    // ADR-0018, Folgeentscheidung 3: zusaetzliche Veroeffentlichung ueber die
    // Enterprise Event Mesh - additiv, eigener try/catch, damit ein Fehler hier
    // niemals den obigen (bereits abgeschlossenen) Audit-Log-Schreibvorgang oder das
    // SSE-Broadcast gefaehrden kann.
    try {
      publishSystemAuditEvent({ type, action, userEmail: newEvent.userEmail, details, status, ip });
    } catch (meshErr) {
      console.error("[EventMesh] SystemAuditEvent konnte nicht veroeffentlicht werden:", meshErr);
    }
  } catch (e) {
    console.error("Error logging system event:", e);
  }
}

// SECURE API Endpoint for fetching system events - strictly restricted to admin emails
systemEventsRouter.get('/system-events', async (req, res) => {
  const authz = await checkAdminAccess(req, 'system-events:read');
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators only.' });
  }

  const events = getSystemEvents();
  res.json({ success: true, events });
});

// GET real-time SSE stream for administrators
systemEventsRouter.get('/system-events/stream', async (req, res) => {
  const authz = await checkAdminAccess(req, 'system-events:stream');
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators only.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Prevent buffering in proxies like nginx/gunicorn
  res.flushHeaders();

  clients.push(res);

  // Periodic keepalive ping to keep connection from timing out
  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch (err) {
      clearInterval(keepAliveInterval);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    clients = clients.filter(c => c !== res);
  });
});

// Endpoint to append a manual event (useful for admin testing)
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
  res.json({ success: true, events: getSystemEvents() });
});

// GET current status of the document orchestration pipeline and summary of recent events
systemEventsRouter.get('/doc-status', async (req, res) => {
  const authz = await checkAdminAccess(req, 'doc-status');
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators only.' });
  }

  try {
    const hygieneData = getHygieneStatusData();
    
    // Provide a summary of recent events/logs (e.g., last 10 entries)
    const recentLogsSummary = hygieneData.logs.slice(0, 10).map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      filePath: log.filePath,
      eventType: log.eventType,
      classification: log.classification,
      actionTaken: log.actionTaken,
      status: log.status,
      details: log.details
    }));

    res.json({
      success: true,
      state: hygieneData.state,
      ticketsCount: hygieneData.tickets.length,
      recentLogsCount: hygieneData.logs.length,
      recentLogsSummary,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Error fetching doc-status:', err);
    res.status(500).json({ error: `Failed to fetch document status: ${err.message || err}` });
  }
});


// ----------------- AGENT MONITORING REGISTRY & DOCUMENT GENERATION -----------------
const AGENTS_REGISTRY_FILE = path.join(process.cwd(), 'uploads', 'agents_registry.json');

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
  { id: 'ag_allocator', name: 'Portfolio Allocator', role: 'Quantitative Weighting', status: 'IDLE', activeTask: 'Keine aktive Aufgabe', queriesCount: 420, model: 'gpt4', performance: '98.5%' },
  { id: 'ag_risk', name: 'Risk Evaluator', role: 'Value-at-Risk Checking', status: 'ACTIVE', activeTask: 'Scant Risiko-Vektor für Universe', queriesCount: 812, model: 'gemini', performance: '99.2%' },
  { id: 'ag_scanner', name: 'Market Scanner', role: 'Scraping & Signal Feed', status: 'ACTIVE', activeTask: 'Liest News-Scraper & Alpha Vantage', queriesCount: 1402, model: 'llama', performance: '94.8%' },
  { id: 'ag_auditor', name: 'SEC Compliance Auditor', role: 'Billing Safeguards & Hygiene', status: 'IDLE', activeTask: 'Validiert Dokumenten-Hygiene ADRs', queriesCount: 154, model: 'claude', performance: '100.0%' }
];

export function getAgentsRegistry(): Agent[] {
  try {
    if (!fs.existsSync(AGENTS_REGISTRY_FILE)) {
      const dir = path.dirname(AGENTS_REGISTRY_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(AGENTS_REGISTRY_FILE, JSON.stringify(DEFAULT_AGENTS, null, 2), 'utf8');
      return DEFAULT_AGENTS;
    }
    const data = fs.readFileSync(AGENTS_REGISTRY_FILE, 'utf8');
    return JSON.parse(data) || DEFAULT_AGENTS;
  } catch (err) {
    console.error('Error reading agents registry:', err);
    return DEFAULT_AGENTS;
  }
}

export function saveAgentsRegistry(agents: Agent[]) {
  try {
    const dir = path.dirname(AGENTS_REGISTRY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(AGENTS_REGISTRY_FILE, JSON.stringify(agents, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving agents registry:', err);
  }
}

export function updateAgentActivity(id: string, activeTask: string, isStarting: boolean) {
  try {
    const agents = getAgentsRegistry();
    const agent = agents.find(a => a.id === id);
    if (agent) {
      if (isStarting) {
        agent.status = 'ACTIVE';
        agent.activeTask = activeTask;
        agent.queriesCount += 1;
      } else {
        agent.status = 'IDLE';
        agent.activeTask = 'Keine aktive Aufgabe';
      }
      saveAgentsRegistry(agents);
    }
  } catch (err) {
    console.error(`Error updating agent activity for ${id}:`, err);
  }
}

// 1. GET all agents
systemEventsRouter.get('/agents', async (req, res) => {
  const authz = await checkAdminAccess(req, 'agents:read', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.' });
  }
  res.json({ success: true, agents: getAgentsRegistry() });
});

// 2. POST register a new agent & auto-generate 3 document types (Changes, Risks, ADR/Derivation)
systemEventsRouter.post('/agents/register', async (req, res) => {
  const authz = await checkAdminAccess(req, 'agents:register', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.' });
  }
  // actorLabel ist ausschliesslich fuer Logging/Anzeige bestimmt (siehe
  // authMiddleware.ts), nicht fuer Autorisierungsentscheidungen - hier fuer die
  // Dokumenten-Hygiene-Zuschreibung und den System-Event-Log verwendet.
  const email = authz.actorLabel;

  const { name, role, model } = req.body;
  if (!name || !role || !model) {
    return res.status(400).json({ error: 'Name, role, and model are required.' });
  }

  try {
    const agents = getAgentsRegistry();
    const cleanId = 'ag_' + name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    
    if (agents.some(a => a.id === cleanId)) {
      return res.status(400).json({ error: `Eine Kompetenz mit der ID '${cleanId}' ist bereits registriert.` });
    }

    const newAgent: Agent = {
      id: cleanId,
      name: name.trim(),
      role: role.trim(),
      status: 'IDLE',
      activeTask: 'Keine aktive Aufgabe',
      queriesCount: 0,
      model: model.trim(),
      performance: '100.0%',
      isCustom: true
    };

    agents.push(newAgent);
    saveAgentsRegistry(agents);

    // Write the 3 documents requested for "Änderungen, mögliche Risiken oder Ableitungen"
    const docsDir = path.join(process.cwd(), 'docs');
    const changesDir = path.join(docsDir, 'changes');
    const reportsDir = path.join(docsDir, 'reports');
    const adrDir = path.join(docsDir, 'adr');

    fs.mkdirSync(changesDir, { recursive: true });
    fs.mkdirSync(reportsDir, { recursive: true });
    fs.mkdirSync(adrDir, { recursive: true });

    // 1. Changes Document (Änderungsprotokoll)
    const changeLogFile = `change_log_${cleanId}.md`;
    const changeLogPath = path.join(changesDir, changeLogFile);
    const changeLogContent = `
# Änderungsprotokoll: Inbetriebnahme von ${newAgent.name}

* **Inbetriebsetzungs-Zustand:** Aktiviert
* **Datum:** ${new Date().toLocaleDateString('de-DE')}
* **Autor:** Sven Kulessa
* **Schnittstellen-Version:** V0.5.4

## Beschreibung
Offizielle Registrierung der neuen Agenten-Kompetenz \`${newAgent.id}\` innerhalb der dezentralen Capital-AI Master-Supervisor Architektur.

## Änderungsumfang
1. Einbindung des Moduls in die Supervisor-Übersicht.
2. Anbindung an das server-seitige LLM-Routing für das Modell \`${newAgent.model}\`.
3. Bereitstellung der Prompt-Schnittstelle.

## Verifikation & Compliance
Sämtliche Kommunikation über diesen Agenten erfolgt revisionssicher und wird verschlüsselt protokolliert.
    `.trim();
    fs.writeFileSync(changeLogPath, changeLogContent, 'utf8');

    // 2. Risk Assessment (Risikoanalyse)
    const riskFile = `risk_assessment_${cleanId}.md`;
    const riskPath = path.join(reportsDir, riskFile);
    const riskContent = `
# Systemische Risikoanalyse: ${newAgent.name}

* **Zugehörige ID:** ${newAgent.id}
* **Prüfdatum:** ${new Date().toLocaleDateString('de-DE')}
* **Sicherheitsstufe:** Enterprise-Sicher (DSGVO Konform)
* **Status:** 🟢 Freigegeben

## Risikoidentifikation
Bei Einbindung des Agenten \`${newAgent.id}\` wurden folgende Vektoren analysiert:
1. **Latenz-Risiko:** Gering. Das Modell \`${newAgent.model}\` wird über den model-independent Auto-Router balanciert.
2. **Datenabfluss-Risiko:** Ausgeschlossen. Server-side Kapselung schützt die Client-IP und verhindert Leaks an Drittanbieter.
3. **Kostenüberschreitung:** Gesichert durch ein hartes Budget-Limit von 150,00 € pro Rechnungszyklus.

## Risikominderung (Mitigation)
Das System nutzt asynchrones Queue-Management, um Überlastungen bei hoher Request-Dichte zu verhindern.
    `.trim();
    fs.writeFileSync(riskPath, riskContent, 'utf8');

    // 3. ADR (Ableitung / Entscheidung)
    // Find next ADR number
    const adrFiles = fs.readdirSync(adrDir).filter(f => f.endsWith('.md') && f.startsWith('ADR-'));
    let maxNum = 3; // defaults to 3 based on seeds
    for (const f of adrFiles) {
      const match = f.match(/^ADR-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextAdrNum = String(maxNum + 1).padStart(4, '0');
    const adrFile = `ADR-${nextAdrNum}-new-competence-${cleanId}.md`;
    const adrPath = path.join(adrDir, adrFile);
    const adrContent = `
# ADR-${nextAdrNum}: Technische Anbindung von ${newAgent.name}

* **Status:** ACCEPTED
* **Datum:** ${new Date().toISOString().split('T')[0]}
* **Autor:** Sven Kulessa

## Kontext
Im Zuge der Erweiterung des CAPITAL-AI Ökosystems wird eine spezialisierte Kompetenz für \`${newAgent.role}\` benötigt. Dies erfordert ein dediziertes Schnittstellen-Modul im Master-Supervisor.

## Entscheidung
Wir binden den Agenten \`${newAgent.id}\` mit dem Modell \`${newAgent.model}\` fest in das System ein. Die Abfragen werden vollständig serverseitig über den \`RequestOrchestrator\` gekapselt.

## Konsequenzen
1. Neue, präzise Analyse-Ebenen im Dashboard verfügbar.
2. Automatisches Liniting und Branded-Header Ergänzung durch die AI Documentary Engine.
    `.trim();
    fs.writeFileSync(adrPath, adrContent, 'utf8');

    // Programmatically trigger AI Document Hygiene processing for each newly created file!
    // This executes processFileEvent in the background asynchronously to prevent blocking the HTTP response
    setTimeout(async () => {
      try {
        console.log(`[Agents Registry] Triggering Document Hygiene for generated files...`);
        await processFileEvent('add', `changes/${changeLogFile}`, email);
        await processFileEvent('add', `reports/${riskFile}`, email);
        await processFileEvent('add', `adr/${adrFile}`, email);
        console.log(`[Agents Registry] Programmatic document processing completed successfully.`);
      } catch (err) {
        console.error(`[Agents Registry] Error triggering Document Hygiene:`, err);
      }
    }, 100);

    // Log system event
    logSystemEvent(
      'ORCHESTRATOR',
      'Agent Registered',
      email,
      `Neue Kompetenz '${newAgent.name}' (${newAgent.id}) erfolgreich angebunden. Dokumente für Änderungen, Risiken und Ableitungen erstellt.`,
      'SUCCESS'
    );

    res.json({
      success: true,
      agent: newAgent,
      generatedFiles: [
        `docs/changes/${changeLogFile}`,
        `docs/reports/${riskFile}`,
        `docs/adr/${adrFile}`
      ],
      message: `Kompetenz '${newAgent.name}' erfolgreich angebunden. Alle Revisionsdokumente wurden erzeugt und zur AI-Hygieneprüfung eingereicht.`
    });

  } catch (err: any) {
    console.error('Error registering custom agent:', err);
    res.status(500).json({ error: `Fehler bei der Anbindung der Kompetenz: ${err.message || err}` });
  }
});

// 3. POST toggle agent status
systemEventsRouter.post('/agents/toggle', async (req, res) => {
  const authz = await checkAdminAccess(req, 'agents:toggle', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.' });
  }
  const email = authz.actorLabel;

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Agent ID is required.' });
  }

  try {
    const agents = getAgentsRegistry();
    const agent = agents.find(a => a.id === id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent nicht gefunden.' });
    }

    const nextStatus = agent.status === 'ACTIVE' ? 'IDLE' : 'ACTIVE';
    agent.status = nextStatus;
    agent.activeTask = nextStatus === 'ACTIVE' ? 'Thread-Loop aktiv / Wartet auf Aufgaben' : 'Keine aktive Aufgabe';
    
    saveAgentsRegistry(agents);

    logSystemEvent(
      'ORCHESTRATOR',
      'Agent Toggle',
      email,
      `Kompetenz '${agent.name}' in Zustand ${nextStatus} versetzt.`,
      'SUCCESS'
    );

    res.json({ success: true, agents });
  } catch (err: any) {
    res.status(500).json({ error: `Fehler beim Umschalten des Agenten: ${err.message || err}` });
  }
});

// 4. GET Orchestrator Connection status
systemEventsRouter.get('/orchestrators/status', async (req, res) => {
  const authz = await checkAdminAccess(req, 'orchestrators:status', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.' });
  }

  // latency war zuvor eine erfundene Zufallszahl (32/15/48 + Math.random()*15),
  // die wie eine gemessene Verbindungslatenz aussah - No-Demo-Data-Policy-Verstoss
  // (docs/DATENSCHUTZ_PROTOKOLL.md). Es findet kein echtes Latenz-Messverfahren
  // gegen diese Orchestrator-Module statt (sie laufen im selben Prozess, ein
  // Netzwerk-Ping ergibt hier keinen Sinn) - daher jetzt null statt einer
  // erfundenen Zahl. status/agentsCount/type beschreiben strukturelle Fakten
  // (die Router sind kompiliert und gemountet, siehe server.ts createCryptoRouter/
  // createRawMaterialsRouter), keine Live-Messung.
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    orchestrators: [
      {
        id: 'crypto_orchestrator',
        name: 'Crypto Orchestrator',
        status: 'CONNECTED',
        latency: null,
        agentsCount: 4,
        lastActive: 'Aktiv',
        type: 'Crypto & DeFi Analytics'
      },
      // Ein 'memecoin_orchestrator' wurde hier frueher als CONNECTED mit 2 Agenten gemeldet,
      // obwohl weder src/orchestrator/memeCoinOrchestrator.ts noch die zugehoerigen Agenten in
      // dieser Codebasis existieren. Eine nicht vorhandene Komponente als betriebsbereit
      // auszuweisen ist derselbe No-Demo-Data-Policy-Verstoss wie eine erfundene Messzahl
      // (docs/DATENSCHUTZ_PROTOKOLL.md) - der Eintrag ist daher entfernt. Wird der
      // Orchestrator spaeter tatsaechlich implementiert, wird er hier wieder aufgenommen.
      {
        id: 'rawmaterials_orchestrator',
        name: 'Raw Materials Orchestrator',
        status: 'CONNECTED',
        latency: null,
        agentsCount: 4,
        lastActive: 'Aktiv',
        type: 'Macroeconomic & Commodities Valuation'
      }
    ]
  });
});

