// ARCH-AUDIT-0002 (J2, Kapitel 4.12/14.6): Admin-Endpunkt fuer die Agenten-Regressionsmessung
// (server/agentEvaluation.ts). POST /run kostet echte Gemini-API-Aufrufe (acht Agenten) - daher
// ausschliesslich admin-getriggert, niemals automatisch geplant. GET /latest liest nur die
// bereits persistierten Ergebnisse (kostenlos, kein KI-Aufruf).

import express from 'express';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { runAgentEvaluation, persistAgentEvaluationRun, getAgentEvaluationHistory } from './agentEvaluation';
import { checkAdminAccess } from '../src/platform/Security/authMiddleware';
import { SUPERVISOR_ZONE_ROLES } from '../src/platform/Security/types';

export function createAgentEvaluationRouter(ai: any, anthropic: Anthropic | null = null, openai: OpenAI | null = null) {
  const router = express.Router();

  router.post('/run', async (req, res) => {
    const authz = await checkAdminAccess(req, 'agent-evaluation:run', SUPERVISOR_ZONE_ROLES);
    if (!authz.authorized) {
      return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.', reason: authz.reason });
    }
    try {
      const results = await runAgentEvaluation(ai, anthropic, openai);
      const { runId, persisted } = await persistAgentEvaluationRun(results);
      res.json({ runId, persisted, results });
    } catch (err: any) {
      res.status(500).json({ error: 'Agent evaluation run failed', message: err?.message || String(err) });
    }
  });

  router.get('/latest', async (req, res) => {
    const authz = await checkAdminAccess(req, 'agent-evaluation:read', SUPERVISOR_ZONE_ROLES);
    if (!authz.authorized) {
      return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.', reason: authz.reason });
    }
    const history = await getAgentEvaluationHistory();
    res.json(history);
  });

  return router;
}
