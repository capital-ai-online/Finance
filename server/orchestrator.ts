import express from 'express';
import path from 'path';
import fs from 'fs';
import { orchestrator } from '../src/lib/requestOrchestrator';
import { checkAdminAccess } from '../src/platform/Security/authMiddleware';
import { SUPERVISOR_ZONE_ROLES } from '../src/platform/Security/types';
import { isGeminiConfigured } from './ai';
import { getCleanEnv } from './env';

export const orchestratorRouter = express.Router();

async function requireOrchestratorAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authz = await checkAdminAccess(req, 'orchestrator-config', SUPERVISOR_ZONE_ROLES);
  if (!authz.authorized) {
    return res.status(authz.reason === 'rate-limited' ? 429 : 401).json({ error: 'Ungültiger Zugriff. Zugriff verweigert.' });
  }
  next();
}

orchestratorRouter.get('/stats', (_req, res) => {
  res.json(orchestrator.getStats());
});

orchestratorRouter.get('/ping-models', (_req, res) => {
  const models = [
    { id: 'claude', name: 'Claude 3.5 Sonnet', task: 'Code & Review', cost: '3.00', configured: false },
    { id: 'gpt4', name: 'GPT-4o', task: 'Reasoning & Legacy', cost: '2.50', configured: false },
    { id: 'gemini', name: 'Gemini 2.5 Flash', task: 'Speed & Vision', cost: '0.075', configured: isGeminiConfigured() },
    { id: 'grok', name: 'Grok 2', task: 'Real-time Research', cost: '2.00', configured: false },
    { id: 'llama', name: 'Llama 3.3 (Local)', task: 'GDPR / Compliant', cost: '0.00', configured: !!getCleanEnv('LLAMA_LOCAL_ENDPOINT') },
  ].map((model) => ({
    ...model,
    status: model.configured ? 'Configured' : 'Not Integrated',
    latency: null as number | null,
  }));

  const configuredModels = models.filter((model) => model.configured);
  res.json({
    timestamp: Date.now(),
    simulated: false,
    note: 'Zeigt den tatsächlichen Integrations-/Konfigurationsstatus je Modell, keine erfundene Latenz.',
    models,
    optimalModelId: configuredModels[0]?.id ?? null,
  });
});

orchestratorRouter.post('/config', requireOrchestratorAdmin, (req, res) => {
  const { concurrencyLimit, maxQueueSize, maxRequestsPerWindow } = req.body;
  orchestrator.updateConfig({
    concurrencyLimit: typeof concurrencyLimit === 'number' ? concurrencyLimit : undefined,
    maxQueueSize: typeof maxQueueSize === 'number' ? maxQueueSize : undefined,
    maxRequestsPerWindow: typeof maxRequestsPerWindow === 'number' ? maxRequestsPerWindow : undefined,
  });
  res.json({ success: true, stats: orchestrator.getStats() });
});

orchestratorRouter.post('/reset', requireOrchestratorAdmin, (_req, res) => {
  orchestrator.resetStats();
  res.json({ success: true, stats: orchestrator.getStats() });
});

orchestratorRouter.get('/audit-files', requireOrchestratorAdmin, (_req, res) => {
  const reportsDir = path.join(process.cwd(), 'docs', 'reports');
  try {
    if (!fs.existsSync(reportsDir)) return res.json({ files: [] });
    const files = fs.readdirSync(reportsDir)
      .filter((file) => file.endsWith('.json') || file.endsWith('.md'))
      .map((file) => {
        const filePath = path.join(reportsDir, file);
        const stat = fs.statSync(filePath);
        return {
          name: file,
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          path: `reports/${file}`,
        };
      })
      .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
    return res.json({ files });
  } catch (error) {
    return res.status(500).json({
      error: `Fehler beim Auflisten der Audit-Dateien: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

/**
 * ARCH-AUDIT-0004 / AUD4-F-001 (P0)
 *
 * Legacy compatibility tombstone. The previous route persisted client-supplied/defaulted
 * "audit" scores into docs/reports and made simulated records indistinguishable from real
 * evidence. Enterprise audit evidence must originate from an instrumented control/runtime
 * event and must never be manufactured by a UI or default value.
 */
orchestratorRouter.post('/create-simulated-audit', requireOrchestratorAdmin, (_req, res) => {
  return res.status(410).json({
    status: 'SIMULATED_AUDIT_DISABLED',
    persisted: false,
    reason: 'Persistent simulated audit records are prohibited. Use evidence-backed runtime/compliance audit paths.',
    auditReference: 'ARCH-AUDIT-0004/AUD4-F-001',
  });
});
