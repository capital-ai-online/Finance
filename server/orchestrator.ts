import express from 'express';
import path from 'path';
import fs from 'fs';
import { orchestrator } from '../src/lib/requestOrchestrator';
import { checkAdminAccess } from './iam/authMiddleware';
import { SUPERVISOR_ZONE_ROLES } from './iam/types';
import { isGeminiConfigured } from './ai';
import { getCleanEnv } from './env';

export const orchestratorRouter = express.Router();

// ADR-0003.5: Der frühere Token-Vergleich hatte einen hartcodierten Fallback-Wert
// ('aif-admin-2026'), der greift, sobald ORCHESTRATOR_ADMIN_TOKEN in der Umgebung fehlt -
// ein bekannter, im Quellcode sichtbarer Master-Schlüssel für jede Fehlkonfiguration.
// Zusätzlich war der Vergleich (!==) nicht timing-sicher. Ersetzt durch dieselbe
// JWT-basierte checkAdminAccess()-Prüfung wie alle anderen Admin-Endpunkte
// (einheitlicher Authentifizierungsmechanismus, siehe ADR-0003.5).
async function requireOrchestratorAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authz = await checkAdminAccess(req, 'orchestrator-config', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(authz.reason === 'rate-limited' ? 429 : 401).json({ error: 'Ungültiger Zugriff. Zugriff verweigert.' });
  }
  next();
}

// 1. Stats API for Request Orchestrator
orchestratorRouter.get('/stats', (req, res) => {
  res.json(orchestrator.getStats());
});

// 2. Model configuration status API.
//
// Fruehere Fassung ("Model Auto-Routing Latency Check") gab fuer alle fuenf
// gelisteten Modelle - unabhaengig davon, ob ueberhaupt eine Integration existiert -
// eine erfundene Zufallslatenz und pauschal status: 'Active' zurueck. Tatsaechlich
// integriert ist in diesem Repository ausschliesslich Google Gemini (@google/genai);
// Claude, GPT-4o, Grok und ein lokales Llama sind nicht angebunden. Das war ein
// No-Demo-Data-Policy-Verstoss (docs/DATENSCHUTZ_PROTOKOLL.md): eine als
// "Live-Latenzpruefung" bezeichnete Admin-Ansicht zeigte vollstaendig simulierte
// Werte ohne jede Kennzeichnung.
//
// Diese Fassung misst keine erfundenen Latenzen mehr, sondern meldet ausschliesslich
// den tatsaechlichen Konfigurationsstatus je Modell - ehrlich, aber ohne den Umfang
// auf eine echte Multi-Provider-Latenzmessung auszuweiten (eigene, hier nicht
// angeforderte Integrationsentscheidung fuer jeden zusaetzlichen Provider).
orchestratorRouter.get('/ping-models', (req, res) => {
  const models = [
    { id: 'claude', name: 'Claude 3.5 Sonnet', task: 'Code & Review', cost: '3.00', configured: false },
    { id: 'gpt4', name: 'GPT-4o', task: 'Reasoning & Legacy', cost: '2.50', configured: false },
    { id: 'gemini', name: 'Gemini 2.5 Flash', task: 'Speed & Vision', cost: '0.075', configured: isGeminiConfigured() },
    { id: 'grok', name: 'Grok 2', task: 'Real-time Research', cost: '2.00', configured: false },
    { id: 'llama', name: 'Llama 3.3 (Local)', task: 'GDPR / Compliant', cost: '0.00', configured: !!getCleanEnv('LLAMA_LOCAL_ENDPOINT') },
    // latency: null statt einer erfundenen Zahl - keine Latenz wird tatsaechlich
    // gemessen. Feld bleibt aus Frontend-Kompatibilitaet erhalten (OrchestratorPanel.tsx,
    // SupervisorDashboard.tsx), muss dort aber "-" statt einer Zahl anzeigen.
  ].map((m) => ({ ...m, status: m.configured ? 'Configured' : 'Not Integrated', latency: null as number | null }));

  const configuredModels = models.filter((m) => m.configured);

  res.json({
    timestamp: Date.now(),
    simulated: false,
    note: 'Zeigt den tatsaechlichen Integrations-/Konfigurationsstatus je Modell, keine gemessene Latenz.',
    models,
    optimalModelId: configuredModels[0]?.id ?? null,
  });
});

// 3. Dynamic configuration update API (Protected)
orchestratorRouter.post('/config', requireOrchestratorAdmin, (req, res) => {
  const { concurrencyLimit, maxQueueSize, maxRequestsPerWindow } = req.body;
  orchestrator.updateConfig({
    concurrencyLimit: typeof concurrencyLimit === 'number' ? concurrencyLimit : undefined,
    maxQueueSize: typeof maxQueueSize === 'number' ? maxQueueSize : undefined,
    maxRequestsPerWindow: typeof maxRequestsPerWindow === 'number' ? maxRequestsPerWindow : undefined
  });
  res.json({ success: true, stats: orchestrator.getStats() });
});

// 4. Dynamic stats reset API (Protected)
orchestratorRouter.post('/reset', requireOrchestratorAdmin, (req, res) => {
  orchestrator.resetStats();
  res.json({ success: true, stats: orchestrator.getStats() });
});

// 5. Endpoint to list all audit trail files from /docs/reports
// ADR-0003.5: war zuvor unauthentifiziert erreichbar (Informationspreisgabe über
// Compliance-Berichte). Jetzt wie alle Admin-Zonen per checkAdminAccess geschützt.
orchestratorRouter.get('/audit-files', requireOrchestratorAdmin, (req, res) => {
  const reportsDir = path.join(process.cwd(), 'docs', 'reports');
  try {
    if (!fs.existsSync(reportsDir)) {
      return res.json({ files: [] });
    }
    const files = fs.readdirSync(reportsDir)
      .filter(file => file.endsWith('.json') || file.endsWith('.md'))
      .map(file => {
        const filePath = path.join(reportsDir, file);
        const stat = fs.statSync(filePath);
        return {
          name: file,
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          path: `reports/${file}`
        };
      })
      .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
    res.json({ files });
  } catch (err: any) {
    res.status(500).json({ error: `Fehler beim Auflisten der Audit-Dateien: ${err.message}` });
  }
});

// 6. Endpoint to generate simulated/automated audit logs and save them as actual JSON files in /docs/reports
// ADR-0003.5: war zuvor unauthentifiziert - jeder konnte beliebige, als "COMPLIANT"
// deklarierte Audit-Datensätze für beliebige Symbole erzeugen (siehe Compliance-Review:
// "Static seed data ≠ audit logs" - hier ging es über reine Seed-Daten hinaus zu einem
// aktiv ausnutzbaren Schreibzugriff). Jetzt Admin/Supervisor-only.
orchestratorRouter.post('/create-simulated-audit', requireOrchestratorAdmin, (req, res) => {
  const { symbol, market, timeframe, price, volume, dataQualityScore, finalScore, issues, status } = req.body;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required.' });
  }

  const timestampStr = new Date().toISOString();
  const fileTimestamp = Math.floor(Date.now() / 1000);
  const fileName = `audit_trail_${symbol.toUpperCase()}_${fileTimestamp}.json`;
  const reportsDir = path.join(process.cwd(), 'docs', 'reports');

  const auditPayload = {
    auditId: `AIF-CR-${symbol.toUpperCase()}-${fileTimestamp}`,
    symbol: symbol.toUpperCase(),
    market: market || 'crypto',
    timeframe: timeframe || '1std',
    timestamp: timestampStr,
    status: status || 'COMPLIANT',
    validation: {
      status: (dataQualityScore || 98) >= 90 ? 'pass' : 'review',
      data_quality_score: dataQualityScore || 98,
      issues: issues || []
    },
    score: {
      final_score: finalScore || 85,
      breakdown: {
        trend: 0.15,
        momentum: 0.15,
        volume: 0.10,
        liquidity: 0.15,
        volatility: 0.10,
        structure: 0.10,
        regime: 0.15,
        risk: 0.10
      },
      quality_multipliers: {
        backtest_validity: 1.0,
        slippage_estimation: 1.0,
        spread_density: 1.0,
        cross_exchange_correlation: 1.0
      }
    }
  };

  try {
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const fullPath = path.join(reportsDir, fileName);
    fs.writeFileSync(fullPath, JSON.stringify(auditPayload, null, 2), 'utf-8');
    res.json({ success: true, fileName, auditId: auditPayload.auditId });
  } catch (err: any) {
    res.status(500).json({ error: `Fehler beim Speichern der Audit-Datei: ${err.message}` });
  }
});
