import express from 'express';
import { GoogleGenAI } from '@google/genai';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { CryptoOrchestrator } from '../orchestrator/cryptoOrchestrator';
import { ClassificationService } from '../services/classification.service';
import { generateCryptoScores, calculateBaseScore, calculateDefiScore } from '../services/scoring.service';
import { calculateRankScore, isTop10Eligible } from '../services/ranking.service';
import { assetRegistry } from '../lib/assetRegistry';
import { baseWeights, defiWeights } from '../config/weights';
import { buildReadyScore, buildUnavailableScore, evaluateDataQualityGate } from '../services/scoringIntegrity';

async function buildCryptoGate(symbol: string, scores: Record<string, number | undefined>, model: 'base' | 'defi') {
  const history = await assetRegistry.getHistory(symbol, 30);
  const lastPoint = history.source === 'live' && history.points.length > 0
    ? history.points[history.points.length - 1]
    : undefined;

  const evidence = history.source === 'live' && lastPoint
    ? [{
        id: `coingecko-history:${symbol}:${lastPoint.date}`,
        source: 'CoinGecko',
        observedAt: new Date(`${lastPoint.date}T00:00:00.000Z`).toISOString(),
        retrievedAt: new Date().toISOString(),
        kind: 'market-history' as const,
      }]
    : [];

  return evaluateDataQualityGate({
    assetId: symbol,
    providers: history.source === 'live' ? ['CoinGecko'] : [],
    featureNames: Object.keys(model === 'defi' ? defiWeights : baseWeights),
    values: scores,
    evidence,
    observedAt: evidence[0]?.observedAt,
    retrievedAt: evidence[0]?.retrievedAt ?? new Date().toISOString(),
    minimumCoverage: 0.4,
    minimumHistoryPoints: 20,
    historyPoints: history.source === 'live' ? history.points.length : 0,
    // Daily historical observations: tolerate weekends/provider lag but reject old snapshots.
    maxAgeMs: 4 * 24 * 60 * 60 * 1000,
    scoringVersion: 'crypto-base-defi/0.6.0+p0',
  });
}

export function createCryptoRouter(aiClient: GoogleGenAI | null, anthropicClient: Anthropic | null = null, openaiClient: OpenAI | null = null): express.Router {
  const router = express.Router();
  const orchestrator = new CryptoOrchestrator(aiClient, anthropicClient, openaiClient);

  /**
   * GET /api/crypto/list
   * P0: Assets remain visible even when a score is unavailable, but unavailable data is
   * represented explicitly and never converted to zero or a plausible fallback score.
   */
  router.get('/list', async (_req, res) => {
    try {
      const cryptoAssets = assetRegistry.getAssets().filter(a => a.type === 'crypto');
      const list = await Promise.all(cryptoAssets.map(async asset => {
        const classification = ClassificationService.classifyAsset(asset.symbol);
        const model: 'base' | 'defi' = classification.category_main === 'DeFi' ? 'defi' : 'base';
        const scores = await generateCryptoScores(asset.symbol, asset.change24h);
        const gate = await buildCryptoGate(asset.symbol, scores as Record<string, number | undefined>, model);

        if (!gate.ready) {
          const unavailable = buildUnavailableScore(gate);
          return {
            symbol: asset.symbol,
            name: asset.name,
            category_main: classification.category_main,
            category_sub: classification.category_sub,
            tier: classification.tier,
            final_score: null,
            rank_score: null,
            eligible_for_top10: false,
            scoreBasis: 'unavailable' as const,
            ...unavailable,
          };
        }

        const payload = { asset_name: asset.name, symbol: asset.symbol, classification, scores };
        const finalScores = model === 'defi' ? calculateDefiScore(payload) : calculateBaseScore(payload);
        const canonical = buildReadyScore(finalScores.final_score ?? Number.NaN, gate);
        const rankScore = canonical.status === 'READY' ? calculateRankScore(payload, canonical.final_score) : null;

        return {
          symbol: asset.symbol,
          name: asset.name,
          category_main: classification.category_main,
          category_sub: classification.category_sub,
          tier: classification.tier,
          final_score: canonical.final_score,
          rank_score: rankScore,
          eligible_for_top10: canonical.status === 'READY' && isTop10Eligible({
            ...payload,
            scores: finalScores,
            data_quality: { level: gate.integrity.dataQuality }
          }),
          scoreBasis: 'market-data' as const,
          ...canonical,
        };
      }));

      res.json(list);
    } catch (error: any) {
      console.error('[CryptoRouter] Error listing crypto assets:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /**
   * POST /api/crypto/analyze
   * Runs the full multi-agent CryptoOrchestrator analysis. The orchestrator has its own
   * quantitative/AI contracts; P0 deterministic score endpoints below must not accept
   * caller-fabricated score fields.
   */
  router.post('/analyze', async (req, res) => {
    try {
      const { symbol, customInput } = req.body;
      const targetSymbol = symbol || req.body.coin;
      if (!targetSymbol || typeof targetSymbol !== 'string' || targetSymbol.trim() === '') {
        return res.status(400).json({ error: 'Cryptocurrency "symbol" is required.' });
      }

      const payload = await orchestrator.analyzeCrypto(targetSymbol.toUpperCase().trim(), customInput);
      res.json(payload);
    } catch (error: any) {
      console.error('[CryptoRouter] Error analyzing crypto asset:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  /**
   * POST /api/crypto/score
   * P0: Public deterministic financial scoring is source-driven only. Arbitrary caller scores
   * are rejected because they cannot satisfy evidence/provenance requirements.
   */
  router.post('/score', async (req, res) => {
    try {
      const payload = req.body;
      if (!payload.symbol || !payload.asset_name) {
        return res.status(400).json({ error: '"symbol" and "asset_name" are required in payload.' });
      }
      if (payload.scores) {
        return res.status(422).json({
          status: 'SOURCE_UNAVAILABLE',
          score: null,
          final_score: null,
          error: 'Caller-provided financial scores are not accepted by the production scoring endpoint because provenance cannot be verified.'
        });
      }

      const classification = payload.classification || ClassificationService.classifyAsset(payload.symbol);
      const model: 'base' | 'defi' = classification.category_main === 'DeFi' ? 'defi' : 'base';
      const inputScores = await generateCryptoScores(payload.symbol, 0);
      const gate = await buildCryptoGate(payload.symbol, inputScores as Record<string, number | undefined>, model);

      if (!gate.ready) {
        return res.status(422).json({
          asset_name: payload.asset_name,
          symbol: payload.symbol,
          model,
          classification,
          ...buildUnavailableScore(gate),
          rank_score: null,
          eligible_for_top10: false,
          scoreBasis: 'unavailable' as const,
        });
      }

      const unifiedPayload = {
        ...payload,
        classification,
        scores: inputScores,
        data_quality: { level: gate.integrity.dataQuality }
      };
      const finalScores = model === 'defi' ? calculateDefiScore(unifiedPayload) : calculateBaseScore(unifiedPayload);
      const canonical = buildReadyScore(finalScores.final_score ?? Number.NaN, gate);
      if (canonical.status !== 'READY') {
        return res.status(422).json({
          asset_name: payload.asset_name,
          symbol: payload.symbol,
          model,
          classification,
          ...canonical,
          rank_score: null,
          eligible_for_top10: false,
          scoreBasis: 'unavailable' as const,
        });
      }

      res.json({
        asset_name: unifiedPayload.asset_name,
        symbol: unifiedPayload.symbol,
        model,
        classification,
        scores: finalScores,
        ...canonical,
        rank_score: calculateRankScore(unifiedPayload, canonical.final_score),
        eligible_for_top10: isTop10Eligible({ ...unifiedPayload, scores: finalScores }),
        scoreBasis: 'market-data' as const
      });
    } catch (error: any) {
      console.error('[CryptoRouter] Error calculating deterministic score:', error);
      const code = error?.code === 'SCORE_NOT_COMPUTABLE' ? 422 : 500;
      res.status(code).json({
        status: error?.code === 'SCORE_NOT_COMPUTABLE' ? 'SCORE_NOT_COMPUTABLE' : undefined,
        score: error?.code === 'SCORE_NOT_COMPUTABLE' ? null : undefined,
        final_score: error?.code === 'SCORE_NOT_COMPUTABLE' ? null : undefined,
        error: error.message || 'Internal Server Error'
      });
    }
  });

  /**
   * GET /api/crypto/top10
   * Only READY scores may enter ranking. Unavailable assets are omitted instead of receiving
   * a zero score that could be misinterpreted as a genuine negative assessment.
   */
  router.get('/top10', async (_req, res) => {
    try {
      const cryptoAssets = assetRegistry.getAssets().filter(a => a.type === 'crypto');
      const evaluated = await Promise.all(cryptoAssets.map(async asset => {
        const classification = ClassificationService.classifyAsset(asset.symbol);
        const model: 'base' | 'defi' = classification.category_main === 'DeFi' ? 'defi' : 'base';
        const scores = await generateCryptoScores(asset.symbol, asset.change24h);
        const gate = await buildCryptoGate(asset.symbol, scores as Record<string, number | undefined>, model);
        if (!gate.ready) return null;

        const payload = {
          asset_name: asset.name,
          symbol: asset.symbol,
          classification,
          scores,
          data_quality: { level: gate.integrity.dataQuality }
        };
        const finalScores = model === 'defi' ? calculateDefiScore(payload) : calculateBaseScore(payload);
        const canonical = buildReadyScore(finalScores.final_score ?? Number.NaN, gate);
        if (canonical.status !== 'READY') return null;

        const rankScore = calculateRankScore(payload, canonical.final_score);
        const eligible = isTop10Eligible({ ...payload, scores: finalScores });
        return {
          symbol: asset.symbol,
          name: asset.name,
          classification,
          final_score: canonical.final_score,
          rank_score: rankScore,
          eligible,
          integrity: canonical.integrity,
          scoreBasis: 'market-data' as const
        };
      }));

      const top10 = evaluated
        .filter((item): item is NonNullable<typeof item> => item !== null && item.eligible)
        .sort((a, b) => b.rank_score - a.rank_score)
        .slice(0, 10);

      res.json(top10);
    } catch (error: any) {
      console.error('[CryptoRouter] Error calculating top 10 rankings:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
}
