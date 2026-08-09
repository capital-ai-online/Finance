// ESS-0017 Phase 1 / ADR-0046: Read-only Erklaerbarkeits-Endpunkt fuer Screening/Scoring. Nutzt
// den privilegierten Server-Client ausschliesslich lesend ueber ScoreExplainabilityAgent
// (score_snapshots ist per RLS service-role-only, ADR-0043) - kein Schreibpfad, kein anonymer
// Zugriff. Admin/Supervisor-only, gleiches Muster wie server/agentEvaluationRouter.ts.

import express from 'express';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { ScoreExplainabilityAgent } from '../src/agents/scoreExplainabilityAgent';
import { checkAdminAccess } from '../src/platform/Security/authMiddleware';
import { SUPERVISOR_ZONE_ROLES } from '../src/platform/Security/types';
import { logSystemEvent } from './systemEvents';

export function createScoreExplainabilityRouter(ai: any, anthropic: Anthropic | null = null, openai: OpenAI | null = null) {
  const router = express.Router();
  const agent = new ScoreExplainabilityAgent(ai, anthropic, openai);

  router.get('/:symbol', async (req, res) => {
    const authz = await checkAdminAccess(req, 'scoring:explain', SUPERVISOR_ZONE_ROLES);
    if (!authz.authorized) {
      return res.status(403).json({ error: 'Access Denied: Restricted to administrators/supervisors only.', reason: authz.reason });
    }

    const symbol = String(req.params.symbol || '').trim();
    const fromDate = typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined;
    const toDate = typeof req.query.toDate === 'string' ? req.query.toDate : undefined;

    try {
      const result = await agent.explain({ symbol, fromDate, toDate });
      logSystemEvent(
        'ORCHESTRATOR',
        'Score Explainability Read',
        authz.actorLabel || 'unknown',
        `symbol=${result.symbol} range=${fromDate ?? '-'}..${toDate ?? '-'} rowCount=${result.evidence.evaluation.resultCount} quality=${result.evidence.evaluation.quality}`,
        'SUCCESS'
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: 'Score explainability request failed', message: err?.message || String(err) });
    }
  });

  return router;
}
