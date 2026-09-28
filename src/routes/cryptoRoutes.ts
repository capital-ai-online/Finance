import express from 'express';
import { randomUUID } from 'node:crypto';
import type { AiGenerationClient } from '../services/aiSchema';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { CryptoOrchestrator } from '../orchestrator/cryptoOrchestrator';
import { ClassificationService } from '../services/classification.service';
import { calculateRankScore, isTop10Eligible } from '../services/ranking.service';
import { assetRegistry } from '../lib/assetRegistry';
import { computeTradeSetupLevels } from '../services/tradeSetupLevels';
import { buildScoringLineage } from '../services/scoringLineage';
import { getCryptoSpotConsensus } from '../services/cryptoSpotConsensus';
import { getLiveCryptoSnapshotConsensus } from '../services/liveCryptoSnapshotConsensus';
import { evaluateCryptoSnapshotIntegrity } from '../services/cryptoSnapshotIntegrity';
import { recordMarketIntegrityObservation } from '../platform/Supervisor/marketIntegrityRuntime';
import {
  buildBackendRankingProjection,
  type BackendRankingProjectionInput,
} from '../platform/Ranking';
import {
  dispatchCanonicalScore,
  type ScoringModelDescriptor,
} from '../platform/Scoring';

const CRYPTO_SCORE_BATCH_LIMIT = 24;

function requestCorrelationId(req: express.Request): string {
  const incoming = req.header('x-correlation-id');
  return incoming && incoming.trim() ? incoming.trim().slice(0, 128) : randomUUID();
}

function modelRegistryView(model: ScoringModelDescriptor) {
  return {
    registryVersion: model.registryVersion,
    modelId: model.modelId,
    version: model.version,
    alias: model.alias,
    lifecycle: model.lifecycle,
    executorKey: model.executorKey,
    featureContractVersion: model.featureContractVersion,
    resultContractVersion: model.resultContractVersion,
    evidencePolicy: model.evidencePolicy,
  };
}

interface CryptoScoreEvaluation {
  httpStatus: number;
  response: Record<string, unknown>;
  rankingInput: BackendRankingProjectionInput | null;
}

function rankingTier(value: unknown): 1 | 2 | 3 | null {
  return value === 1 || value === 2 || value === 3 ? value : null;
}

async function evaluateCryptoScorePayload(
  payload: any,
  correlationId: string,
  source: 'request' | 'registry' = 'request',
  subtype?: string,
): Promise<CryptoScoreEvaluation> {
  if (!payload?.symbol || !payload?.asset_name) {
    return {
      httpStatus: 400,
      response: { correlationId, error: '"symbol" and "asset_name" are required in payload.' },
      rankingInput: null,
    };
  }
  if (payload.scores) {
    return {
      httpStatus: 422,
      response: {
        status: 'SOURCE_UNAVAILABLE',
        score: null,
        final_score: null,
        correlationId,
        error: 'Caller-provided financial scores are not accepted by the production scoring endpoint because provenance cannot be verified.',
      },
      rankingInput: null,
    };
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'classification')) {
    return {
      httpStatus: 422,
      response: {
        status: 'CALLER_CLASSIFICATION_NOT_ALLOWED',
        score: null,
        final_score: null,
        correlationId,
        error: 'Caller-provided classification has no productive score, ranking, tier, confidence or eligibility authority.',
      },
      rankingInput: null,
    };
  }

  const symbol = String(payload.symbol).toUpperCase().trim();
  const assetName = String(payload.asset_name);
  const classification = ClassificationService.classifyAsset(symbol);
  const dispatch = await dispatchCanonicalScore({
    symbol,
    name: assetName,
    assetClass: 'crypto',
    subtype,
    source,
  });

  if (dispatch.status !== 'DISPATCHED') {
    const response = {
      asset_name: assetName,
      symbol,
      assetId: dispatch.asset.assetId,
      model: null,
      modelRegistry: dispatch.model ? modelRegistryView(dispatch.model) : null,
      classification,
      ...dispatch.canonical,
      correlationId,
      reason: dispatch.reason,
      rank_score: null,
      eligible_for_top10: false,
      scoreBasis: 'unavailable' as const,
    };
    return {
      httpStatus: 422,
      response,
      rankingInput: {
        symbol,
        name: assetName,
        assetClass: 'crypto',
        subtype,
        source,
        canonical: dispatch.canonical,
        category: classification.category_main,
        tier: rankingTier(classification.tier),
        governance: {
          eligible: false,
          eligibilityStatus: dispatch.reason,
        },
      },
    };
  }

  const registeredModel = dispatch.model;
  const modelRegistry = modelRegistryView(registeredModel);
  const assessment = dispatch.assessment;
  const canonical = dispatch.canonical;
  const lineage = buildScoringLineage({
    correlationId,
    assetId: dispatch.asset.assetId,
    model: registeredModel,
    canonical,
    scoringInputs: assessment.inputs,
    fieldProvenance: assessment.fieldProvenance,
    providerState: assessment.providerState,
  });
  const rankingInput: BackendRankingProjectionInput = {
    symbol,
    name: assetName,
    assetClass: 'crypto',
    subtype,
    source,
    canonical,
    category: classification.category_main,
    tier: rankingTier(classification.tier),
    governance: {
      eligible: assessment.rankingEvidenceReady,
      eligibilityStatus: assessment.rankingEvidenceReady
        ? 'RANKING_EVIDENCE_READY'
        : 'RANKING_EVIDENCE_UNAVAILABLE',
    },
  };

  if (canonical.status !== 'READY' || !assessment.analysis) {
    return {
      httpStatus: 422,
      response: {
        asset_name: assetName,
        symbol,
        assetId: dispatch.asset.assetId,
        model: 'technical-provenance',
        modelRegistry,
        classification,
        ...canonical,
        correlationId,
        rank_score: null,
        eligible_for_top10: false,
        provenance: assessment.fieldProvenance,
        providerState: assessment.providerState,
        lineage,
        scoreBasis: 'unavailable' as const,
      },
      rankingInput,
    };
  }

  const rankPayload = {
    asset_name: assetName,
    symbol,
    classification,
    scores: assessment.analysis.scores,
    data_quality: { level: canonical.integrity.dataQuality },
  } as any;
  const eligible = assessment.rankingEvidenceReady && isTop10Eligible(rankPayload);
  const tradeSetup = assessment.priceStats ? computeTradeSetupLevels(assessment.priceStats) : null;

  return {
    httpStatus: 200,
    response: {
      asset_name: assetName,
      symbol,
      assetId: dispatch.asset.assetId,
      model: 'technical-provenance',
      modelRegistry,
      classification,
      ...canonical,
      correlationId,
      inputs: assessment.inputs,
      scores: assessment.analysis.scores,
      decision: assessment.analysis.decision,
      decisionName: assessment.analysis.decisionName,
      decisionDesc: assessment.analysis.decisionDesc,
      risk_level: assessment.analysis.risk_level,
      reasoning: assessment.analysis.reasoning,
      alerts: assessment.analysis.alerts,
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
    },
    rankingInput,
  };
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
        const dispatch = await dispatchCanonicalScore({
          symbol: asset.symbol,
          name: asset.name,
          assetClass: 'crypto',
          subtype: asset.subtype,
          source: 'registry',
        });

        if (dispatch.status !== 'DISPATCHED') {
          return {
            symbol: asset.symbol,
            name: asset.name,
            assetId: dispatch.asset.assetId,
            modelRegistry: dispatch.model ? modelRegistryView(dispatch.model) : null,
            category_main: classification.category_main,
            category_sub: classification.category_sub,
            tier: classification.tier,
            classification,
            ...dispatch.canonical,
            reason: dispatch.reason,
            rank_score: null,
            eligible_for_top10: false,
            provenance: [],
            providerState: {},
            lineage: null,
            scoreBasis: 'unavailable' as const,
          };
        }

        const registeredModel = dispatch.model;
        const modelRegistry = modelRegistryView(registeredModel);
        const assessment = dispatch.assessment;
        const canonical = dispatch.canonical;
        const lineage = buildScoringLineage({
          correlationId,
          assetId: dispatch.asset.assetId,
          model: registeredModel,
          canonical,
          scoringInputs: assessment.inputs,
          fieldProvenance: assessment.fieldProvenance,
          providerState: assessment.providerState,
        });

        if (canonical.status !== 'READY' || !assessment.analysis) {
          return {
            symbol: asset.symbol,
            name: asset.name,
            assetId: dispatch.asset.assetId,
            modelRegistry,
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
          assetId: dispatch.asset.assetId,
          modelRegistry,
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
      const consensus = await getCryptoSpotConsensus(symbol, { correlationId });
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
      return res.status(httpStatus).json({ symbol, ...consensus });
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
        ...consensus,
        correlationId,
        symbol,
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
      if (customInput && typeof customInput === 'object' && Object.keys(customInput).length > 0) {
        return res.status(422).json({
          status: 'RESEARCH_ONLY',
          scoreEligible: false,
          error: 'Caller-provided scoring overrides are not accepted by the research/enrichment endpoint.',
        });
      }
      const payload = await orchestrator.analyzeCrypto(targetSymbol.toUpperCase().trim());
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

      if (Array.isArray(payload?.assets)) {
        if (payload.assets.length === 0 || payload.assets.length > CRYPTO_SCORE_BATCH_LIMIT) {
          return res.status(400).json({
            correlationId,
            status: 'INVALID_REQUEST',
            reason: `assets must contain between 1 and ${CRYPTO_SCORE_BATCH_LIMIT} candidates.`,
            results: [],
          });
        }

        const evaluations = await Promise.all(
          payload.assets.map((asset: unknown, index: number) =>
            evaluateCryptoScorePayload(asset, `${correlationId}:${index + 1}`),
          ),
        );
        const backendRanking = buildBackendRankingProjection(
          evaluations
            .map(evaluation => evaluation.rankingInput)
            .filter((item): item is BackendRankingProjectionInput => item !== null),
        );

        return res.json({
          correlationId,
          status: 'BATCH_COMPLETE',
          requested: evaluations.length,
          ready: evaluations.filter(evaluation => evaluation.httpStatus === 200).length,
          backendRanking,
          results: evaluations.map(evaluation => evaluation.response),
        });
      }

      const evaluation = await evaluateCryptoScorePayload(payload, correlationId);
      return res.status(evaluation.httpStatus).json(evaluation.response);
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
      const evaluations = await Promise.all(
        cryptoAssets.map(asset =>
          evaluateCryptoScorePayload(
            { symbol: asset.symbol, asset_name: asset.name },
            `${rootCorrelationId}:${asset.symbol}`,
            'registry',
            asset.subtype,
          ),
        ),
      );
      const top10Eligible = evaluations.filter(evaluation =>
        evaluation.rankingInput !== null && evaluation.response.eligible_for_top10 === true,
      );
      const backendRanking = buildBackendRankingProjection(
        top10Eligible.map(evaluation => ({
          ...(evaluation.rankingInput as BackendRankingProjectionInput),
          governance: {
            ...(evaluation.rankingInput as BackendRankingProjectionInput).governance,
            eligible: true,
            eligibilityStatus: 'TOP10_ELIGIBLE',
          },
        })),
      );

      if (backendRanking.result.cohorts.length > 1) {
        return res.status(409).json({
          correlationId: rootCorrelationId,
          status: 'RANKING_COHORT_AMBIGUOUS',
          reason: 'Top-10 cannot merge incomparable ranking cohorts.',
          backendRanking,
          results: [],
        });
      }

      const responseByAssetId = new Map(
        top10Eligible.map(evaluation => [String(evaluation.response.assetId), evaluation.response]),
      );
      const ordered = backendRanking.result.cohorts[0]?.entries ?? [];
      const top10 = ordered
        .slice(0, 10)
        .map(entry => responseByAssetId.get(entry.assetId))
        .filter((item): item is Record<string, unknown> => item !== undefined);

      res.json(top10);
    } catch (error: any) {
      console.error('[CryptoRouter] Error calculating top 10 rankings:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return router;
}
