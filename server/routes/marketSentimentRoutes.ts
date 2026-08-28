import express from 'express';
import { Type } from '../../src/services/aiSchema';
import { orchestrator } from '../../src/lib/requestOrchestrator';
import { generateStructuredWithFallback } from '../../src/services/agentModelRouting';
import { resolveVerifiedIdentity } from '../../src/platform/Security/authMiddleware';

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

  // SECURITY (2026-08-25, Router-Anbindung): dieser Router war bis dahin nirgends
  // eingebunden (siehe docs/security/FULL_ARCHITECTURE_SECURITY_REVIEW_2026-08-25.md,
  // "Nebenbefund"). Die einzigen Aufrufer (MarketSentiment.tsx, SentimentDashboard.tsx) rendern
  // ausschließlich innerhalb des bereits Login-pflichtigen Dashboards (SessionComposition
  // unterstützt keine anonymen Sessions) - konsistent mit der /api/chat-Absicherung wird daher
  // auch hier eine verifizierte Identität verlangt, statt einen zweiten, unauthentifizierten
  // KI-Kosten-Endpunkt gleicher Bauart entstehen zu lassen.
  router.get('/market-sentiment', orchestrator.handle('Market Sentiment'), async (req, res) => {
    const identity = await resolveVerifiedIdentity(req);
    if (!identity) {
      return res.status(401).json({ error: 'Anmeldung erforderlich.' });
    }
    // Der frühere Gemini/Google-Search-Pfad wurde entfernt. Das ist aktuell ein bekannter
    // Capability-Zustand und kein transienter Serverausfall. Deshalb wird die Anfrage technisch
    // erfolgreich mit einem expliziten DATA_UNAVAILABLE-Vertrag beantwortet, statt permanent 503
    // zu erzeugen. Es wird weiterhin bewusst KEIN synthetischer Sentiment-Score zurückgegeben.
    res.setHeader('Cache-Control', 'private, max-age=60');
    return res.status(200).json({
      status: 'DATA_UNAVAILABLE',
      available: false,
      code: 'VERIFIED_NEWS_EVIDENCE_UNAVAILABLE',
      error: 'Verifizierte News-Evidence für das Markt-Sentiment ist derzeit nicht verfügbar.',
      reason: 'Der frühere Gemini-Grounding-Provider wurde entfernt; ein verifizierter Ersatz ist noch nicht angebunden.',
    });
  });

  router.post('/market-sentiment/simulate-shock', express.json(), orchestrator.handle('Market Sentiment Simulator'), async (req, res) => {
    const identity = await resolveVerifiedIdentity(req);
    if (!identity) {
      return res.status(401).json({ error: 'Anmeldung erforderlich, um die Schock-Simulation zu nutzen.' });
    }
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
        promptId: 'server-market-sentiment-shock',
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
