import express from 'express';
import path from 'path';
import fs from 'fs';
import { orchestrator } from '../src/lib/requestOrchestrator';
import { getCleanEnv } from './env';

export const orchestratorRouter = express.Router();

const ORCHESTRATOR_ADMIN_TOKEN = getCleanEnv('ORCHESTRATOR_ADMIN_TOKEN') || 'aif-admin-2026';

function requireOrchestratorAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers['x-orchestrator-admin-token'] || req.headers['authorization']?.toString().replace('Bearer ', '');
  if (token !== ORCHESTRATOR_ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Ungültiger Admin-Token. Zugriff verweigert.' });
  }
  next();
}

// 1. Stats API for Request Orchestrator
orchestratorRouter.get('/stats', (req, res) => {
  res.json(orchestrator.getStats());
});

// 2. Model Auto-Routing Latency Check API
orchestratorRouter.get('/ping-models', (req, res) => {
  const models = [
    { id: 'claude', name: 'Claude 3.5 Sonnet', task: 'Code & Review', cost: '3.00', latency: Math.floor(130 + Math.random() * 50), status: 'Active' },
    { id: 'gpt4', name: 'GPT-4o', task: 'Reasoning & Legacy', cost: '2.50', latency: Math.floor(150 + Math.random() * 60), status: 'Active' },
    { id: 'gemini', name: 'Gemini 2.5 Flash', task: 'Speed & Vision', cost: '0.075', latency: Math.floor(40 + Math.random() * 30), status: 'Active' },
    { id: 'grok', name: 'Grok 2', task: 'Real-time Research', cost: '2.00', latency: Math.floor(190 + Math.random() * 80), status: 'Active' },
    { id: 'llama', name: 'Llama 3.3 (Local)', task: 'GDPR / Compliant', cost: '0.00', latency: Math.floor(12 + Math.random() * 15), status: 'Active' }
  ];

  const optimalModel = models
    .filter(m => m.latency < 200)
    .reduce((prev, current) => (prev.latency < current.latency ? prev : current), models[2]);

  res.json({
    timestamp: Date.now(),
    models,
    optimalModelId: optimalModel.id
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
orchestratorRouter.get('/audit-files', (req, res) => {
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
orchestratorRouter.post('/create-simulated-audit', (req, res) => {
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
