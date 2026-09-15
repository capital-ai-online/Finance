import express from 'express';
import { Type } from '../../src/services/aiSchema';
import { orchestrator } from '../../src/lib/requestOrchestrator';
import { generateStructuredWithFallback } from '../../src/services/agentModelRouting';
import {
  evaluatePaidAnalysisAccess,
  paidAnalysisDecisionBody,
} from '../middleware/paidAnalysisEntitlement';

export interface PortfolioReviewRouteDependencies {
  ai: any | null;
  anthropic: any | null;
  openai: any | null;
}

export function createPortfolioReviewRouter(deps: PortfolioReviewRouteDependencies): express.Router {
  const router = express.Router();
  const { anthropic, openai } = deps;

  router.post('/portfolio-review', express.json(), orchestrator.handle('Portfolio Review'), async (req, res) => {
    // FIN-SEC-03: `/api/portfolio-review` is the productive financial-domain executor bound to
    // `full_ai_analysis`. A configured real model executor is required before quota is consumed;
    // the entitlement decision itself is then resolved from verified identity + server tier/quota.
    if (!anthropic && !openai) {
      return res.status(503).json({
        error: 'FULL_AI_ANALYSIS_UNAVAILABLE',
        reason: 'Kein produktiver KI-Provider für full_ai_analysis konfiguriert.',
      });
    }

    const access = await evaluatePaidAnalysisAccess(req, 'full_ai_analysis');
    if (!access.allowed) {
      return res.status(access.status).json(paidAnalysisDecisionBody(access));
    }

    const { allocation, metrics1Y, metrics3Y, metrics5Y } = req.body || {};

    try {
      const result = await generateStructuredWithFallback({
        anthropic,
        openai,
        promptId: 'server-portfolio-review',
        systemInstruction: 'Du bist ein hochprofessioneller Quant-Portfolio-Analyst und Risk-Officer bei CAPITAL-AI. Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.',
        contents: `Analysiere die folgende Portfolio-Allokation und deren historische Backtest-Ergebnisse (1, 3 und 5 Jahre):\n\nAllokation:\n${JSON.stringify(allocation, null, 2)}\n\nPerformance-Metriken:\n- 1 Jahr: Rendite ${metrics1Y?.strategyReturn?.toFixed?.(2)}%, Max Drawdown -${metrics1Y?.maxDrawdown?.toFixed?.(2)}%, Sharpe ${metrics1Y?.sharpeRatio?.toFixed?.(2)}\n- 3 Jahre: Rendite ${metrics3Y?.strategyReturn?.toFixed?.(2)}%, Max Drawdown -${metrics3Y?.maxDrawdown?.toFixed?.(2)}%, Sharpe ${metrics3Y?.sharpeRatio?.toFixed?.(2)}\n- 5 Jahre: Rendite ${metrics5Y?.strategyReturn?.toFixed?.(2)}%, Max Drawdown -${metrics5Y?.maxDrawdown?.toFixed?.(2)}%, Sharpe ${metrics5Y?.sharpeRatio?.toFixed?.(2)}\n\nLiefere executiveSummary, riskAssessment und konkrete optimizations.`,
        schema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            riskAssessment: { type: Type.STRING },
            optimizations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['executiveSummary', 'riskAssessment', 'optimizations'],
        },
        requestId: req.requestId,
      });

      if (!result) {
        return res.status(503).json({
          error: 'FULL_AI_ANALYSIS_UNAVAILABLE',
          reason: 'Alle produktiven KI-Provider für full_ai_analysis sind fehlgeschlagen.',
        });
      }

      return res.json(result.data);
    } catch (error: any) {
      console.error('[Portfolio Review] Productive full_ai_analysis executor failed:', error?.message || error);
      return res.status(503).json({
        error: 'FULL_AI_ANALYSIS_UNAVAILABLE',
        reason: 'Der produktive full_ai_analysis Executor ist derzeit nicht verfügbar.',
      });
    }
  });

  return router;
}
