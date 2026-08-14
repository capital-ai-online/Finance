import express from 'express';
import { Type } from '../../src/services/aiSchema';
import { orchestrator } from '../../src/lib/requestOrchestrator';
import { generateStructuredWithFallback } from '../../src/services/agentModelRouting';

export interface PortfolioReviewRouteDependencies {
  ai: any | null;
  anthropic: any | null;
  openai: any | null;
}

export function createPortfolioReviewRouter(deps: PortfolioReviewRouteDependencies): express.Router {
  const router = express.Router();
  const { anthropic, openai } = deps;

  router.post('/portfolio-review', express.json(), orchestrator.handle('Portfolio Review'), async (req, res) => {
    if (!anthropic && !openai) {
      return res.status(500).json({ error: 'Kein KI-Provider konfiguriert (ANTHROPIC_API_KEY oder OPENAI_API_KEY erforderlich).' });
    }

    const { allocation, metrics1Y, metrics3Y, metrics5Y } = req.body || {};

    try {
      const result = await generateStructuredWithFallback({
        anthropic,
        openai,
        gemini: null,
        promptId: 'server-portfolio-review',
        geminiModels: [],
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

      if (!result) throw new Error('Alle konfigurierten Provider fehlgeschlagen.');
      return res.json(result.data);
    } catch {
      const alloc = Array.isArray(allocation) ? allocation : [];
      const isCryptoHeavy = alloc.some((item: any) => {
        const isCrypto = ['BTC', 'ETH', 'SOL', 'ADA'].includes(String(item?.symbol || '').toUpperCase());
        return isCrypto && Number(item?.weight || 0) > 30;
      });
      const hasGold = alloc.some((item: any) => String(item?.symbol || '').toUpperCase() === 'GLD' && Number(item?.weight || 0) > 5);
      const sharpe = metrics3Y?.sharpeRatio || metrics1Y?.sharpeRatio || 1;
      const maxDd = metrics3Y?.maxDrawdown || metrics1Y?.maxDrawdown || 15;
      const annualReturn = metrics3Y?.strategyReturn || metrics1Y?.strategyReturn || 10;

      let executiveSummary: string;
      let riskAssessment: string;
      if (sharpe >= 1.5) {
        executiveSummary = `Diese Allokation zeigt mit einer Sharpe Ratio von ${Number(sharpe).toFixed(2)} ein sehr effizientes Risiko-Rendite-Profil.`;
        riskAssessment = `Der maximale Drawdown von -${Number(maxDd).toFixed(2)}% liegt im historisch kontrollierten Bereich.`;
      } else if (sharpe >= 0.8) {
        executiveSummary = `Die Allokation weist mit einer Sharpe Ratio von ${Number(sharpe).toFixed(2)} ein solides Risiko-Rendite-Profil auf.`;
        riskAssessment = `Der maximale Drawdown von -${Number(maxDd).toFixed(2)}% zeigt eine marktübliche, aber optimierbare Risikobelastung.`;
      } else {
        executiveSummary = `Das Portfolio zeigt bei einer Sharpe Ratio von ${Number(sharpe).toFixed(2)} ein suboptimales Verhältnis von Risiko zu Rendite bei rund ${Number(annualReturn).toFixed(2)}% Rendite.`;
        riskAssessment = `Mit einem maximalen Drawdown von -${Number(maxDd).toFixed(2)}% bestehen erhöhte Klumpen- und Volatilitätsrisiken.`;
      }

      const optimizations: string[] = [];
      optimizations.push(isCryptoHeavy
        ? 'Krypto-Gewicht reduzieren, um Volatilität und Drawdown-Risiko zu begrenzen.'
        : 'Eine kleine kontrollierte BTC/ETH-Beimischung kann das Renditepotenzial diversifizieren.');
      optimizations.push(hasGold
        ? 'Gold-Anteil systematisch rebalancieren, um die Absicherungsfunktion zu erhalten.'
        : '5-10% Gold als defensive, niedrig korrelierte Komponente prüfen.');
      optimizations.push(maxDd > 20
        ? 'Defensive liquide Assets erhöhen, um den maximalen Drawdown unter 20% zu stabilisieren.'
        : 'Quartalsweises Rebalancing prüfen, um Abweichungen von der Zielallokation zu begrenzen.');

      return res.json({ executiveSummary, riskAssessment, optimizations });
    }
  });

  return router;
}
