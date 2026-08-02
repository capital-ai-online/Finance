import express from 'express';
import { GoogleGenAI } from '@google/genai';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { CryptoOrchestrator } from '../orchestrator/cryptoOrchestrator';
import { ClassificationService } from '../services/classification.service';
import { calculateRankScore, isTop10Eligible } from '../services/ranking.service';
import { assetRegistry } from '../lib/assetRegistry';
import { evaluateVerifiedCryptoTechnicalScore } from '../services/verifiedCryptoTechnicalScoring';

export function createCryptoRouter(
  aiClient: GoogleGenAI | null,
  anthropicClient: Anthropic | null = null,
  openaiClient: OpenAI | null = null,
): express.Router {
  const router = express.Router();
  const orchestrator = new CryptoOrchestrator(aiClient, anthropicClient, openaiClient);

  router.get('/list', async (_req, res) => {
    try {
      const cryptoAssets = assetRegistry.getAssets().filter((asset) => asset.type === 'crypto');
      const list = await Promise.all(cryptoAssets.map(async (asset) => {
        const classification = ClassificationService.classifyAsset(asset.symbol);
        const assessment = await evaluateVerifiedCryptoTechnicalScore(asset.symbol);
        const canonical = assessment.canonical;

        if (canonical.status !== 'READY' || !assessment.analysis) {
          return {
            symbol: asset.symbol,
            name: asset.name,
            category_main: classification.category_main,
            category_sub: classification.category_sub,
            tier: classification.tier,
            classification,
            ...canonical,
            rank_score: null,
            eligible_for_top10: false,
            provenance: assessment.fieldProvenance,
            providerState: assessment.providerState,
            scoreBasis: 'unavailable' as const,
          };
        }

        const rankPayload = {
          asset_name: asset.name,
          symbol: asset.symbol,
          classification,
          scores: assessment.analysis.scores,
          data_quality: { level: canonical.integrity.dataQuality },
        } as any;
        const eligible = assessment.rankingEvidenceReady && isTop10Eligible(rankPayload);

        return {
          symbol: asset.symbol,
          name: asset.name,
          category_main: classification.category_main,
          category_sub: classification.category_sub,
          tier: classification.tier,
          classification,
          ...canonical,
          decision: assessment.analysis.decision,
          decisionName: assessment.analysis.decisionName,
          decisionDesc: assessment.analysis.decisionDesc,
          risk_level: assessment.analysis.risk_level,
          reasoning: assessment.analysis.reasoning,
          rank_score: calculateRankScore(rankPayload, canonical.final_score),
          eligible_for_top10: eligible,
          provenance: assessment.fieldProvenance,
          providerState: assessment.providerState,
          scoreBasis: assessment.fieldProvenance.length > 0 ? 'market-data' as const : 'market-history' as const,
        };
      }));

      res.json(list);
    } catch (error: any) {
      console.error('[CryptoRouter] Error listing crypto assets:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

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
          error: 'Caller-provided financial scores are not accepted by the production scoring endpoint because provenance cannot be verified.',
        });
      }

      const symbol = String(payload.symbol).toUpperCase().trim();
      const classification = payload.classification || ClassificationService.classifyAsset(symbol);
      const assessment = await evaluateVerifiedCryptoTechnicalScore(symbol);
      const canonical = assessment.canonical;

      if (canonical.status !== 'READY' || !assessment.analysis) {
        return res.status(422).json({
          asset_name: payload.asset_name,
          symbol,
          model: 'technical-provenance',
          classification,
          ...canonical,
          rank_score: null,
          eligible_for_top10: false,
          provenance: assessment.fieldProvenance,
          providerState: assessment.providerState,
          scoreBasis: 'unavailable' as const,
        });
      }

      const rankPayload = {
        asset_name: payload.asset_name,
        symbol,
        classification,
        scores: assessment.analysis.scores,
        data_quality: { level: canonical.integrity.dataQuality },
      } as any;
      const eligible = assessment.rankingEvidenceReady && isTop10Eligible(rankPayload);

      res.json({
        asset_name: payload.asset_name,
        symbol,
        model: 'technical-provenance',
        classification,
        ...canonical,
        inputs: assessment.inputs,
        scores: assessment.analysis.scores,
        decision: assessment.analysis.decision,
        decisionName: assessment.analysis.decisionName,
        decisionDesc: assessment.analysis.decisionDesc,
        risk_level: assessment.analysis.risk_level,
        reasoning: assessment.analysis.reasoning,
        alerts: assessment.analysis.alerts,
        rank_score: calculateRankScore(rankPayload, canonical.final_score),
        eligible_for_top10: eligible,
        provenance: assessment.fieldProvenance,
        providerState: assessment.providerState,
        scoreBasis: assessment.fieldProvenance.length > 0 ? 'market-data' as const : 'market-history' as const,
      });
    } catch (error: any) {
      console.error('[CryptoRouter] Error calculating deterministic score:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  /**
   * Top-10 admission is now enabled only when the score is READY and the snapshot carries
   * provenance for market-cap, volume and supply. Assets without that lineage remain excluded.
   */
  router.get('/top10', async (_req, res) => {
    try {
      const cryptoAssets = assetRegistry.getAssets().filter((asset) => asset.type === 'crypto');
      const evaluated = await Promise.all(cryptoAssets.map(async (asset) => {
        const classification = ClassificationService.classifyAsset(asset.symbol);
        const assessment = await evaluateVerifiedCryptoTechnicalScore(asset.symbol);
        const canonical = assessment.canonical;
        if (canonical.status !== 'READY' || !assessment.analysis) return null;

        const rankPayload = {
          asset_name: asset.name,
          symbol: asset.symbol,
          classification,
          scores: assessment.analysis.scores,
          data_quality: { level: canonical.integrity.dataQuality },
        } as any;
        const eligible = assessment.rankingEvidenceReady && isTop10Eligible(rankPayload);

        return {
          symbol: asset.symbol,
          name: asset.name,
          classification,
          final_score: canonical.final_score,
          rank_score: calculateRankScore(rankPayload, canonical.final_score),
          eligible,
          integrity: canonical.integrity,
          provenance: assessment.fieldProvenance,
          providerState: assessment.providerState,
          scoreBasis: assessment.fieldProvenance.length > 0 ? 'market-data' as const : 'market-history' as const,
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
