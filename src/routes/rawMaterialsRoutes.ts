/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { RawMaterialsOrchestrator } from '../orchestrator/rawMaterialsOrchestrator';
import { RawMaterialsScoringService } from '../services/rawMaterialsScoring';
import { validateRawMaterialInput } from '../schemas/rawMaterialsValidation';
import { RAW_MATERIALS_DATABASE } from '../config/rawMaterialsConfig';
import { getAssetCatalogEntry } from '../lib/assetSearchCatalog';
import { getTwelveDataCommodityEvidence } from '../services/commodityMarketEvidence';
import { scoreCommodityMarketEvidence } from '../services/commodityEvidenceScoring';

export function createRawMaterialsRouter(aiClient: GoogleGenAI | null, anthropicClient: Anthropic | null = null, openaiClient: OpenAI | null = null): express.Router {
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
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /**
   * GET /api/raw-materials/verified-score/:symbol
   * Approved canonical commodity market-evidence score. No registry/bootstrap values participate.
   */
  router.get('/verified-score/:symbol', async (req, res) => {
    const symbol = String(req.params.symbol || '').toUpperCase().trim();
    const asset = getAssetCatalogEntry(symbol);
    if (!asset || asset.type !== 'commodity') {
      return res.status(404).json({ symbol, status: 'ASSET_NOT_FOUND', score: null });
    }
    try {
      const evidence = await getTwelveDataCommodityEvidence(symbol, 90);
      const result = scoreCommodityMarketEvidence(evidence);
      const canonical = result.canonical;
      return res.status(canonical.status === 'READY' ? 200 : 422).json({
        symbol,
        status: canonical.status,
        score: canonical.final_score,
        score10: canonical.score,
        scoreSemantic: result.scoreSemantic,
        contractVersion: result.contractVersion,
        contractStatus: result.contractStatus,
        providers: result.providers,
        evidenceIds: result.evidenceIds,
        factors: result.factors,
        reasoning: result.reasoning,
        integrity: canonical.integrity,
        providerSymbol: evidence.providerSymbol,
      });
    } catch (error) {
      return res.status(503).json({
        symbol,
        status: 'SOURCE_UNAVAILABLE',
        score: null,
        contractVersion: 'commodity-evidence-scoring/1.0.0',
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/raw-materials/analyze
   * Executes full multi-agent structural analysis for a specific material.
   */
  router.post('/analyze', async (req, res) => {
    try {
      const { name, customInput } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Raw material "name" is required.' });
      }

      const payload = await orchestrator.analyzeMaterial(name, customInput);
      res.json({ ...payload, scoreSemantic: 'legacy-structural-research', canonical: false, marketEvidenceVerified: false });
    } catch (error: any) {
      console.error('[RawMaterialsRouter] Error analyzing material:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
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
      res.json({ ...payload, scoreSemantic: 'legacy-structural-research', canonical: false, marketEvidenceVerified: false });
    } catch (error: any) {
      console.error('[RawMaterialsRouter] Error scoring material:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  return router;
}
