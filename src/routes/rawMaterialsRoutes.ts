/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import type { AiGenerationClient } from '../services/aiSchema';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { RawMaterialsOrchestrator, type RawMaterialsResearchContext } from '../orchestrator/rawMaterialsOrchestrator';
import { RawMaterialsScoringService } from '../services/rawMaterialsScoring';
import { validateRawMaterialInput } from '../schemas/rawMaterialsValidation';
import { RAW_MATERIALS_DATABASE, findRawMaterialConfig } from '../config/rawMaterialsConfig';
import type { AnalysisPayload, RawMaterialInput } from '../types/rawMaterials';
import { getAssetCatalogEntry } from '../lib/assetSearchCatalog';
import { getTwelveDataCommodityEvidence } from '../services/commodityMarketEvidence';
import { observeVerifiedCommodityScoreShadow } from '../services/commodityShadowRuntimeBridge';
import { dispatchCanonicalScore, type ScoringModelDescriptor } from '../platform/Scoring';

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

/**
 * TEMPORARY LEGACY UI COMPATIBILITY ONLY.
 *
 * The research orchestrator no longer owns or computes a score. This adapter preserves the
 * historical /analyze response shape for RawMaterialsDashboard until that legacy surface is
 * migrated. Its output stays explicitly non-canonical and score-ineligible and MUST NOT feed the
 * registry, ranking, eligibility or execution chain.
 */
function buildLegacyResearchCompatibilityPayload(
  research: RawMaterialsResearchContext,
  customInput?: Partial<RawMaterialInput>,
): AnalysisPayload {
  const config = findRawMaterialConfig(research.rawMaterial);
  const { fundamentals, risk, strategicValuation } = research.research;

  const unifiedInput: RawMaterialInput = {
    name: research.rawMaterial,
    category_main: customInput?.category_main || research.classification.category_main,

    market_liquidity: customInput?.market_liquidity ?? config?.market_liquidity,
    volatility: customInput?.volatility ?? risk.volatility,
    trading_volume: customInput?.trading_volume ?? config?.trading_volume,

    ore_grade: customInput?.ore_grade ?? fundamentals.ore_grade,
    tonnage: customInput?.tonnage ?? fundamentals.tonnage,
    tonnage_reserve: customInput?.tonnage_reserve ?? fundamentals.tonnage_reserve,
    substitution_potential: customInput?.substitution_potential ?? fundamentals.substitution_potential,
    recyclability: customInput?.recyclability ?? fundamentals.recyclability,

    processing_complexity: customInput?.processing_complexity ?? config?.processing_complexity,
    infrastructure_availability: customInput?.infrastructure_availability ?? config?.infrastructure_availability,
    extraction_costs: customInput?.extraction_costs ?? config?.extraction_costs,

    geopolitical_risk: customInput?.geopolitical_risk ?? risk.geopolitical_risk,
    supply_chain_risk: customInput?.supply_chain_risk ?? risk.supply_chain_risk,
    regulatory_risk: customInput?.regulatory_risk ?? risk.regulatory_risk,
    esg_risk: customInput?.esg_risk ?? risk.esg_risk,
    producer_concentration: customInput?.producer_concentration ?? risk.producer_concentration,

    military_importance: customInput?.military_importance ?? strategicValuation.military_importance,
    industrial_importance: customInput?.industrial_importance ?? strategicValuation.industrial_importance,
  };

  const result = RawMaterialsScoringService.scoreMaterial(unifiedInput);
  return {
    ...result,
    classification: {
      ...result.classification,
      category_main: research.classification.category_main,
      category_sub: research.classification.category_sub,
      market_type: research.classification.market_type,
      valuation_mode: research.classification.valuation_mode,
      confidence: Number(((result.classification.confidence + research.classification.confidence) / 2).toFixed(2)),
    },
    reasoning: [
      ...result.reasoning,
      ...research.reasoning,
      'Legacy compatibility score only; canonical commodity scoring is available exclusively through ScoringDispatcher.',
    ],
  };
}

export function createRawMaterialsRouter(aiClient: AiGenerationClient | null, anthropicClient: Anthropic | null = null, openaiClient: OpenAI | null = null): express.Router {
  const router = express.Router();
  const orchestrator = new RawMaterialsOrchestrator(aiClient, anthropicClient, openaiClient);

  /**
   * GET /api/raw-materials/list
   * Returns the legacy structural-material catalog. Its structural score is explicitly non-canonical:
   * canonical market scoring is exposed only by /verified-score/:symbol.
   */
  router.get('/list', (_req, res) => {
    try {
      const list = Object.values(RAW_MATERIALS_DATABASE).map(item => ({
        symbol: item.symbol,
        name: item.name,
        category_main: item.category_main,
        category_sub: item.category_sub,
        is_critical: item.is_critical,
        score: RawMaterialsScoringService.scoreMaterial({ name: item.name }).scores.final_score,
        scoreSemantic: 'legacy-structural-research',
        canonical: false,
        marketEvidenceVerified: false,
      }));
      res.json(list);
    } catch (error: any) {
      console.error('[RawMaterialsRouter] Error listing materials:', error);
      res.status(500).json({ error: 'Internal Server Error', code: 'RAW_MATERIAL_LIST_FAILED' });
    }
  });

  /**
   * GET /api/raw-materials/verified-score/:symbol
   * Approved canonical commodity market-evidence score. Evidence acquisition is domain-specific;
   * model resolution and execution authority are owned exclusively by ScoringDispatcher.
   *
   * P3-A mirrors the exact already-acquired evidence into a read-only challenger observation after
   * dispatcher evaluation. This adds no provider call and cannot alter the canonical response.
   */
  router.get('/verified-score/:symbol', async (req, res) => {
    const symbol = String(req.params.symbol || '').toUpperCase().trim();
    const asset = getAssetCatalogEntry(symbol);
    if (!asset || asset.type !== 'commodity') {
      return res.status(404).json({ symbol, status: 'ASSET_NOT_FOUND', score: null });
    }
    try {
      const evidence = await getTwelveDataCommodityEvidence(symbol, 90);
      const dispatch = await dispatchCanonicalScore({
        symbol,
        name: asset.name,
        assetClass: 'commodity',
        subtype: asset.subtype,
        source: 'catalog',
        execution: { kind: 'commodity-evidence', evidence },
      });

      const shadow = observeVerifiedCommodityScoreShadow({
        orchestrator,
        asset: {
          symbol,
          name: asset.name,
          subtype: asset.subtype,
          instrumentKind: asset.instrumentKind,
        },
        evidence,
        dispatch,
        environment: process.env.NODE_ENV,
      });
      if (shadow.status === 'BLOCKED') {
        console.warn('[RawMaterialsRouter] P3-A shadow runtime blocked', {
          symbol,
          code: shadow.code,
        });
      }

      if (dispatch.status !== 'DISPATCHED') {
        return res.status(422).json({
          ...dispatch.canonical,
          symbol,
          assetId: dispatch.asset.assetId,
          modelRegistry: dispatch.model ? modelRegistryView(dispatch.model) : null,
          reason: dispatch.reason,
        });
      }

      const result = dispatch.assessment;
      const canonical = dispatch.canonical;
      return res.status(canonical.status === 'READY' ? 200 : 422).json({
        ...canonical,
        symbol,
        assetId: dispatch.asset.assetId,
        modelRegistry: modelRegistryView(dispatch.model),
        score10: canonical.score,
        scoreSemantic: result.scoreSemantic,
        contractVersion: result.contractVersion,
        contractStatus: result.contractStatus,
        providers: result.providers,
        evidenceIds: result.evidenceIds,
        factors: result.factors,
        reasoning: result.reasoning,
        providerSymbol: evidence.providerSymbol,
      });
    } catch (error) {
      console.error('[RawMaterialsRouter] Error retrieving verified commodity score:', error);
      return res.status(503).json({
        symbol,
        status: 'SOURCE_UNAVAILABLE',
        code: 'COMMODITY_EVIDENCE_UNAVAILABLE',
        score: null,
        final_score: null,
        reason: 'Commodity evidence is temporarily unavailable.',
      });
    }
  });

  /**
   * POST /api/raw-materials/analyze
   * Executes the multi-agent research pipeline. The orchestrator itself is research-only and does
   * not compute a score. A temporary compatibility adapter keeps the existing dashboard payload
   * shape isolated at this legacy route until the dashboard consumes research context directly.
   */
  router.post('/analyze', async (req, res) => {
    try {
      const { name, customInput } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Raw material "name" is required.' });
      }

      const research = await orchestrator.analyzeMaterial(name);
      const payload = buildLegacyResearchCompatibilityPayload(research, customInput);
      res.json({
        ...payload,
        researchContext: research,
        orchestratorAuthority: research.authority,
        scoreSemantic: 'legacy-structural-research',
        canonical: false,
        scoreEligible: false,
        marketEvidenceVerified: false,
        legacyCompatibility: true,
      });
    } catch (error: any) {
      console.error('[RawMaterialsRouter] Error analyzing material:', error);
      res.status(500).json({ error: 'Internal Server Error', code: 'RAW_MATERIAL_ANALYSIS_FAILED' });
    }
  });

  /**
   * POST /api/raw-materials/score
   * Manual sandbox/structural scoring. It is intentionally not the canonical market evidence score.
   */
  router.post('/score', (req, res) => {
    try {
      const { input } = req.body;
      const validation = validateRawMaterialInput(input);
      if (!validation.isValid) {
        return res.status(400).json({ error: 'Validation failed', details: validation.errors });
      }

      const payload = RawMaterialsScoringService.scoreMaterial(validation.validatedData);
      res.json({ ...payload, scoreSemantic: 'legacy-structural-research', canonical: false, scoreEligible: false, marketEvidenceVerified: false });
    } catch (error: any) {
      console.error('[RawMaterialsRouter] Error scoring material:', error);
      res.status(500).json({ error: 'Internal Server Error', code: 'RAW_MATERIAL_SCORING_FAILED' });
    }
  });

  return router;
}