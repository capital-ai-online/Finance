import express from 'express';
import { Type } from '@google/genai';
import { orchestrator } from '../../src/lib/requestOrchestrator';
import { trackedGenerateContent } from '../../src/services/aiUsageTracker';
import { generateStructuredWithFallback } from '../../src/services/agentModelRouting';

export interface MarketSentimentRouteDependencies {
  ai: any | null;
  anthropic: any | null;
  openai: any | null;
  assetRegistry: {
    getAsset(symbol: string): any;
  };
  fallbackAssets: any[];
}

export function createMarketSentimentRouter(deps: MarketSentimentRouteDependencies): express.Router {
  const router = express.Router();
  const { ai, anthropic, openai, assetRegistry, fallbackAssets } = deps;

  // Google Search Grounding is intentionally Gemini-specific. Do not route this
  // endpoint through the generic provider fallback chain.
  router.get('/market-sentiment', orchestrator.handle('Market Sentiment'), async (req, res) => {
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API-Schlüssel fehlt oder ist ungültig' });
    }

    const symbol = String(req.query.symbol || 'BTC').toUpperCase();
    const assetClass = String(req.query.assetClass || 'Crypto');

    try {
      const prompt = `Analysiere das aktuelle Markt-Sentiment und die neuesten Nachrichten für das Asset "${symbol}" (Kategorie: ${assetClass}).
Verwende die Google-Suche für die neuesten Nachrichten, Berichte und Marktentwicklungen der letzten 24-48 Stunden.
Antworte ausschließlich als valides JSON mit score (0-100), label, summary, drivers[] und sources[].`;

      const response = await trackedGenerateContent(ai, {
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
        },
      }, { promptId: 'server-market-sentiment', requestId: req.requestId });

      const text = response.text || '';
      let parsedData: any;
      try {
        parsedData = JSON.parse(text);
      } catch {
        parsedData = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
      }

      if (parsedData?.sources && Array.isArray(parsedData.sources)) {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks?.length) {
          parsedData.sources = parsedData.sources.map((source: any, index: number) => {
            const web = chunks[index]?.web;
            if (!web) return source;
            return {
              ...source,
              url: source.url || web.uri || '',
              title: source.title || web.title || '',
            };
          });
        }
      }

      return res.json(parsedData);
    } catch {
      // Preserve the existing quantitative fallback contract when grounded AI fails.
      const asset = assetRegistry.getAsset(symbol) || fallbackAssets.find((candidate) => candidate.symbol === symbol);
      let score = 50;
      if (asset) {
        const changeFactor = (asset.change24h || 0) * 2;
        score = Math.min(100, Math.max(0, Math.round((asset.score || 7) * 10 + changeFactor)));
      }

      const label = score >= 80 ? 'Extrem Bullisch'
        : score >= 60 ? 'Bullisch'
          : score >= 40 ? 'Neutral'
            : score >= 20 ? 'Bearisch'
              : 'Extrem Bearisch';

      const change24h = asset?.change24h || 0;
      const drivers = asset ? [
        {
          text: `24h-Preisentwicklung von ${change24h}%`,
          impact: change24h >= 1 ? 'Bullisch' : change24h <= -1 ? 'Bearisch' : 'Neutral',
        },
        {
          text: `Eingestuftes Risiko-Level: ${asset.risk || 'Unbekannt'}`,
          impact: asset.risk === 'Low' ? 'Bullisch' : asset.risk === 'High' ? 'Bearisch' : 'Neutral',
        },
      ] : [{ text: 'Konsolidierung im neutralen Bereich', impact: 'Neutral' }];

      return res.json({
        score,
        label,
        summary: `Quantitatives Fallback-Sentiment für ${asset?.name || symbol}: ${label} bei Score ${score}/100.`,
        drivers,
        sources: [],
      });
    }
  });

  // Pure reasoning task: preserve Anthropic -> OpenAI -> Gemini fallback ownership.
  router.post('/market-sentiment/simulate-shock', express.json(), orchestrator.handle('Market Sentiment Simulator'), async (req, res) => {
    if (!anthropic && !openai && !ai) {
      return res.status(500).json({ error: 'Kein KI-Provider konfiguriert (ANTHROPIC_API_KEY, OPENAI_API_KEY oder GEMINI_API_KEY erforderlich).' });
    }

    const symbol = String(req.body?.symbol || 'BTC').toUpperCase();
    const assetClass = String(req.body?.assetClass || 'Crypto');
    const shockScenario = String(req.body?.shockScenario || 'Fed-Zinsanhebung');

    try {
      const result = await generateStructuredWithFallback({
        anthropic,
        openai,
        gemini: ai,
        promptId: 'server-market-sentiment-shock',
        geminiModels: ['gemini-3.5-flash'],
        systemInstruction: 'Du bist ein hochprofessioneller Quant-Analyst. Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.',
        contents: `Analysiere den theoretischen Einfluss des Ereignisses "${shockScenario}" auf ${symbol} (${assetClass}).`,
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
      return res.json(result.data);
    } catch {
      const positive = /senkt|cut|beat|positive/i.test(shockScenario);
      return res.json({
        originalScore: 55,
        newScore: positive ? 75 : 40,
        impactLabel: positive ? 'Positiv' : 'Negativ',
        transmissionMechanism: `Die Simulation prognostiziert, dass "${shockScenario}" Liquiditätsströme und Risikoprämien für ${symbol} im ${assetClass}-Sektor verändert.`,
        predictedDrivers: [
          { text: `Unmittelbare Markt-Reaktion auf "${shockScenario}"`, impact: positive ? 'Bullisch' : 'Bearisch' },
          { text: 'Umschichtung von Portfolio-Liquidität', impact: 'Neutral' },
        ],
        riskLevel: positive ? 'Niedrig' : 'Hoch',
      });
    }
  });

  return router;
}
