/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { RawMaterialsOrchestrator } from '../orchestrator/rawMaterialsOrchestrator';
import { RawMaterialsScoringService } from '../services/rawMaterialsScoring';
import { validateRawMaterialInput } from '../schemas/rawMaterialsValidation';
import { RAW_MATERIALS_DATABASE } from '../config/rawMaterialsConfig';

export function createRawMaterialsRouter(aiClient: GoogleGenAI | null): express.Router {
  const router = express.Router();
  const orchestrator = new RawMaterialsOrchestrator(aiClient);

  /**
   * GET /api/raw-materials/list
   * Returns standard catalog of supported raw materials
   */
  router.get('/list', (req, res) => {
    try {
      const list = Object.values(RAW_MATERIALS_DATABASE).map(item => ({
        symbol: item.symbol,
        name: item.name,
        category_main: item.category_main,
        category_sub: item.category_sub,
        is_critical: item.is_critical,
        score: RawMaterialsScoringService.scoreMaterial({ name: item.name }).scores.final_score
      }));
      res.json(list);
    } catch (error: any) {
      console.error('[RawMaterialsRouter] Error listing materials:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /**
   * POST /api/raw-materials/analyze
   * Executes full multi-agent analysis for a specific material
   */
  router.post('/analyze', async (req, res) => {
    try {
      const { name, customInput } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Raw material "name" is required.' });
      }

      const payload = await orchestrator.analyzeMaterial(name, customInput);
      res.json(payload);
    } catch (error: any) {
      console.error('[RawMaterialsRouter] Error analyzing material:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  /**
   * POST /api/raw-materials/score
   * Performs quick deterministic scoring on manual inputs
   */
  router.post('/score', (req, res) => {
    try {
      const { input } = req.body;
      const validation = validateRawMaterialInput(input);
      if (!validation.isValid) {
        return res.status(400).json({ error: 'Validation failed', details: validation.errors });
      }

      const payload = RawMaterialsScoringService.scoreMaterial(validation.validatedData);
      res.json(payload);
    } catch (error: any) {
      console.error('[RawMaterialsRouter] Error scoring material:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  return router;
}
