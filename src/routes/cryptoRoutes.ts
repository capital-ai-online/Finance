import express from 'express';
import { randomUUID } from 'node:crypto';
import type { AiGenerationClient } from '../services/aiSchema';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { CryptoOrchestrator } from '../orchestrator/cryptoOrchestrator';
import { ClassificationService } from '../services/classification.service';
import { calculateRankScore, isTop10Eligible } from '../services/ranking.service';
import { assetRegistry } from '../lib/assetRegistry';
import { evaluateVerifiedCryptoTechnicalScore } from '../services/verifiedCryptoTechnicalScoring';
import { computeTradeSetupLevels } from '../services/tradeSetupLevels';
import { buildScoringLineage } from '../services/scoringLineage';
import { getCryptoSpotConsensus } from '../services/cryptoSpotConsensus';
import { getLiveCryptoSnapshotConsensus } from '../services/liveCryptoSnapshotConsensus';
import { evaluateCryptoSnapshotIntegrity } from '../services/cryptoSnapshotIntegrity';
import { recordMarketIntegrityObservation } from '../platform/Supervisor/marketIntegrityRuntime';

function requestCorrelationId(req: express.Request): string {
  const incoming = req.header('x-correlation-id');
  return incoming && incoming.trim() ? incoming.trim().slice(0, 128) : randomUUID();
}

export function createCryptoRouter(
  aiClient: AiGenerationClient | null,
  anthropicClient: Anthropic | null = null,
  openaiClient: OpenAI | null = null,
): express.Router {
  const router = express.Router();
  const orchestrator = new CryptoOrchestrator(aiClient, anthropicClient, openaiClient);

  router.get('/list', async (req, res) => {
    try {
      const rootCorrelationId = requestCorrelationId(req);
      res.setHeader('x-correlation-id', rootCorrelationId);
      const cryptoAssets = assetRegistry.getAssets().filter((asset) => asset.type === 'crypto');
      const list = await Promise.all(cryptoAssets.map(async (asset) => {
        const correlationId = `${rootCorrelationId}:${asset.symbol}`;
        const classification = ClassificationService.classifyAsset(asset.symbol);
        const assessment = await evaluateVerifiedCryptoTechnicalScore(asset.symbol);
        const canonical = assessment.canonical;
        const lineage = buildScoringLineage({
          correlationId,
          assetId: asset.symbol,
          canonical,
          scoringInputs: assessment.inputs,
          fieldProvenance: assessment.fieldProvenance,
          providerState: assessment.providerState,
        });

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
            lineage,
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
          // SC-7 Phase C: explicit SC-3 opt-in path (same value as rankPayload.data_quality.level;
          // numerically identical to the previous default-fallback call).
          rank_score: calculateRankScore(rankPayload, canonical.final_score, {
            compositeLevel: canonical.integrity.dataQuality,
          }),
          eligible_for_top10: eligible,
          provenance: assessment.fieldProvenance,
          providerState: assessment.providerState,
          lineage,
          scoreBasis: assessment.fieldProvenance.length > 0 ? 'market-data' as const : 'market-history' as const,
        };
      }));

      res.json(list);
    } catch (error: any) {
      console.error('[CryptoRouter] Error listing crypto assets:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.get('/price-consensus/:symbol', async (req, res) => {
    try {
      const correlationId = requestCorrelationId(req);
      res.setHeader('x-correlation-id', correlationId);
      const symbol = String(req.params.symbol || '').toUpperCase().trim();
      if (!symbol) return res.status(400).json({ error: 'Cryptocurrency symbol is required.', correlationId });
      const consensus = await getCryptoSpotConsensus(symbol);
      recordMarketIntegrityObservation({
        symbol,
        capability: 'spot-consensus',
        state: consensus.status === 'CONSENSUS' ? 'consistent' : consensus.status === 'SOURCE_CONFLICT' ? 'conflict' : 'insufficient',
        correlationId,
        providers: consensus.providers,
        evidenceIds: consensus.evidenceIds,
        message: consensus.reason,
      });
      const httpStatus = consensus.status === 'CONSENSUS'
        ? 200
        : consensus.status === 'SOURCE_CONFLICT'
          ? 409
          : 422;
      return res.status(httpStatus).json({ symbol, correlationId, ...consensus });
    } catch (error: any) {
      console.error('[CryptoRouter] Error calculating spot-price consensus:', error);
      return res.status(503).json({
        status: 'INSUFFICIENT_SOURCES',
        canonicalValue: null,
        error: error?.message || 'Spot-price providers unavailable.',
      });
    }
  });

  router.get('/snapshot-consensus/:symbol', async (req, res) => {
    const correlationId = requestCorrelationId(req);
    res.setHeader('x-correlation-id', correlationId);
    const symbol = String(req.params.symbol || '').toUpperCase().trim();
    if (!symbol) return res.status(400).json({ correlationId, status: 'INVALID_REQUEST', error: 'Cryptocurrency symbol is required.' });

    try {
      const consensus = await getLiveCryptoSnapshotConsensus(symbol);
      recordMarketIntegrityObservation({
        symbol,
        capability: 'snapshot-consensus',
        state: consensus.status === 'CONSENSUS' ? 'consistent'
          : consensus.status === 'SOURCE_CONFLICT' ? 'conflict'
            : consensus.status === 'NON_COMPARABLE_EVIDENCE' ? 'degraded'
              : 'insufficient',
        correlationId,
        providers: consensus.providers,
        evidenceIds: consensus.evidenceIds,
        message: `Snapshot consensus status: ${consensus.status}`,
      });
      const httpStatus = consensus.status === 'SOURCE_CONFLICT' || consensus.status === 'NON_COMPARABLE_EVIDENCE'
        ? 409
        : consensus.status === 'INSUFFICIENT_SOURCES'
          ? 422
          : 200;
      return res.status(httpStatus).json({
        correlationId,
        symbol,
        ...consensus,
        scoringGateActive: false,
      });
    } catch (error: any) {
      return res.status(503).json({
        correlationId,
        symbol,
        status: 'INSUFFICIENT_SOURCES',
        scoringGateActive: false,
        canonicalValue: null,
        error: error?.message || 'Snapshot providers unavailable.',
      });
    }
  });

  router.get('/snapshot-integrity/:symbol', async (req, res) => {
    const correlationId = requestCorrelationId(req);
    res.setHeader('x-correlation-id', correlationId);
    const symbol = String(req.params.symbol || '').toUpperCase().trim();
    if (!symbol) return res.status(400).json({ correlationId, status: 'INVALID_REQUEST', reason: 'Cryptocurrency symbol is required.' });
    try {
      const integrity = await evaluateCryptoSnapshotIntegrity(symbol);
      recordMarketIntegrityObservation({
        symbol,
        capability: 'snapshot-integrity',
        state: integrity.status === 'CONSISTENT' ? 'consistent'
          : integrity.status === 'SOURCE_CONFLICT' || integrity.status === 'INVALID_SNAPSHOT' ? 'conflict'
            : 'insufficient',
        correlationId,
        providers: integrity.providers,
        evidenceIds: integrity.evidenceIds,
        message: integrity.reason,
      });
      const httpStatus = integrity.status === 'CONSISTENT'
        ? 200
        : integrity.status === 'SOURCE_CONFLICT' || integrity.status === 'INVALID_SNAPSHOT'
          ? 409
          : 422;
      return res.status(httpStatus).json({ correlationId, scoringImpact: 'OBSERVATION_ONLY', ...integrity });
    } catch (error: any) {
      return res.status(503).json({
        correlationId,
        symbol,
        status: 'INSUFFICIENT_EVIDENCE',
        scoringImpact: 'OBSERVATION_ONLY',
        reason: error?.message || 'Snapshot integrity evidence unavailable.',
      });
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
      const correlationId = requestCorrelationId(req);
      res.setHeader('x-correlation-id', correlationId);
      const payload = req.body;
      if (!payload.symbol || !payload.asset_name) {
        return res.status(400).json({ error: '"symbol" and "asset_name" are required in payload.' });
      }
      if (payload.scores) {
        return res.status(422).json({
          status: 'SOURCE_UNAVAILABLE',
          score: null,
          final_score: null,
          correlationId,
          error: 'Caller-provided financial scores are not accepted by the production scoring endpoint because provenance cannot be verified.',
        });
      }

      const symbol = String(payload.symbol).toUpperCase().trim();
      const classification = payload.classification || ClassificationService.classifyAsset(symbol);
      const assessment = await evaluateVerifiedCryptoTechnicalScore(symbol);
      const canonical = assessment.canonical;
      const lineage = buildScoringLineage({
        correlationId,
        assetId: symbol,
        canonical,
        scoringInputs: assessment.inputs,
        fieldProvenance: assessment.fieldProvenance,
        providerState: assessment.providerState,
      });

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
          lineage,
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
      const tradeSetup = assessment.priceStats ? computeTradeSetupLevels(assessment.priceStats) : null;

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
        // SC-7 Phase C: explicit SC-3 opt-in path (same value as rankPayload.data_quality.level;
        // numerically identical to the previous default-fallback call).
        rank_score: calculateRankScore(rankPayload, canonical.final_score, {
          compositeLevel: canonical.integrity.dataQuality,
        }),
        eligible_for_top10: eligible,
        priceStats: assessment.priceStats,
        tradeSetup,
        provenance: assessment.fieldProvenance,
        providerState: assessment.providerState,
        lineage,
        scoreBasis: assessment.fieldProvenance.length > 0 ? 'market-data' as const : 'market-history' as const,
      });
    } catch (error: any) {
      console.error('[CryptoRouter] Error calculating deterministic score:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  router.get('/top10', async (req, res) => {
    try {
      const rootCorrelationId = requestCorrelationId(req);
      res.setHeader('x-correlation-id', rootCorrelationId);
      const cryptoAssets = assetRegistry.getAssets().filter((asset) => asset.type === 'crypto');
      const evaluated = await Promise.all(cryptoAssets.map(async (asset) => {
        const correlationId = `${rootCorrelationId}:${asset.symbol}`;
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
        const lineage = buildScoringLineage({
          correlationId,
          assetId: asset.symbol,
          canonical,
          scoringInputs: assessment.inputs,
          fieldProvenance: assessment.fieldProvenance,
          providerState: assessment.providerState,
        });

        return {
          symbol: asset.symbol,
          name: asset.name,
          classification,
          final_score: canonical.final_score,
          // SC-7 Phase C: explicit SC-3 opt-in path (same value as rankPayload.data_quality.level;
          // numerically identical to the previous default-fallback call).
          rank_score: calculateRankScore(rankPayload, canonical.final_score, {
            compositeLevel: canonical.integrity.dataQuality,
          }),
          eligible,
          integrity: canonical.integrity,
          provenance: assessment.fieldProvenance,
          providerState: assessment.providerState,
          lineage,
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
