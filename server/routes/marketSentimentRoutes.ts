import express from 'express';
import { Type } from '@google/genai';
import { orchestrator } from '../../src/lib/requestOrchestrator';
import { generateStructuredWithFallback } from '../../src/services/agentModelRouting';

export interface MarketSentimentRouteDependencies {
  ai: any | null;
  anthropic: any | null;
  openai: any | null;
  assetRegistry: { getAsset(symbol: string): any };
  fallbackAssets: any[];
}

export function createMarketSentimentRouter(deps: MarketSentimentRouteDependencies): express.Router {
  const router = express.Router();
  const { anthropic, openai } = deps;

  // Der frühere Gemini/Google-Search-Pfad wurde entfernt. Ohne verifizierten News-
  // Evidence-Provider wird bewusst kein synthetischer Sentiment-Score erzeugt.
  router.get('/market-sentiment', orchestrator.handle('Market Sentiment'), (_req, res) => {
    return res.status(503).json({
      status: 'DATA_UNAVAILABLE',
      error: 'VERIFIED_NEWS_EVIDENCE_UNAVAILABLE',
      reason: 'Der frühere Gemini-Grounding-Provider wurde entfernt; ein verifizierter Ersatz ist noch nicht angebunden.',
    });
  });

  router.post('/market-sentiment/simulate-shock', express.json(), orchestrator.handle('Market Sentiment Simulator'), async (req, res) => {
    if (!anthropic && !openai) {
      return res.status(503).json({ error: 'Kein KI-Provider konfiguriert (ANTHROPIC_API_KEY oder OPENAI_API_KEY erforderlich).' });
    }

    const symbol = String(req.body?.symbol || 'BTC').toUpperCase();
    const assetClass = String(req.body?.assetClass || 'Crypto');
    const shockScenario = String(req.body?.shockScenario || 'Fed-Zinsanhebung');

    try {
      const result = await generateStructuredWithFallback({
        anthropic,
        openai,
        gemini: null,
        promptId: 'server-market-sentiment-shock',
        geminiModels: [],
        systemInstruction: 'Du bist ein hochprofessioneller Quant-Analyst. Kennzeichne die Ausgabe als theoretische Simulation und gib ausschließlich valides JSON zurück.',
        contents: `Analysiere als ausdrücklich theoretische Simulation den möglichen Einfluss des Ereignisses "${shockScenario}" auf ${symbol} (${assetClass}). Nutze keine erfundenen aktuellen Marktdaten.`,
        schema: {
          type: Type.OBJECT,
          properties: {
            originalScore: { type: Type.NUMBER },
            newScore: { type: Type.NUMBER },
            impactLabel: { type: Type.STRING },
            transmissionMechanism: { type: Type.STRING },
            predictedDrivers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { text: { type: Type.STRING }, impact: { type: Type.STRING } },
                required: ['text', 'impact'],
              },
            },
            riskLevel: { type: Type.STRING },
          },
          required: ['originalScore', 'newScore', 'impactLabel', 'transmissionMechanism', 'predictedDrivers', 'riskLevel'],
        },
        requestId: req.requestId,
      });

      if (!result) throw new Error('Alle konfigurierten Provider fehlgeschlagen.');
      return res.json({ ...result.data, simulation: true, provider: result.provider });
    } catch {
      return res.status(503).json({
        status: 'DATA_UNAVAILABLE',
        error: 'SIMULATION_PROVIDER_UNAVAILABLE',
        reason: 'Es werden keine festen oder synthetischen Ersatzscores erzeugt.',
      });
    }
  });

  return router;
}
