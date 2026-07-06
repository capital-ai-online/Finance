/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { StockOrchestrator } from '../orchestrator/stockOrchestrator';
import { StockScoringService } from '../services/stockScoringService';
import { validateStockInput } from '../schemas/stockValidation';
import { STOCKS_DATABASE } from '../config/stockConfig';

export function createStockRouter(aiClient: GoogleGenAI | null): express.Router {
  const router = express.Router();
  const orchestrator = new StockOrchestrator(aiClient);

  /**
   * GET /api/stocks/list
   * Returns list of supported stocks with their computed core scores.
   */
  router.get('/list', (req, res) => {
    try {
      const list = Object.values(STOCKS_DATABASE).map(item => {
        const payload = StockScoringService.scoreStock({ symbol: item.symbol, name: item.name });
        return {
          symbol: item.symbol,
          name: item.name,
          category_main: payload.classification.category_main,
          category_sub: payload.classification.category_sub,
          price: item.price,
          peRatio: item.peRatio,
          dividendYield: item.dividendYield,
          score: payload.final_score,
          compositeScore: payload.compositeScore,
          primaryPlaybook: payload.primaryRecommendation?.playbook || 'N/A'
        };
      });
      res.json(list);
    } catch (error: any) {
      console.error('[StockRouter] Error listing stocks:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /**
   * POST /api/stocks/analyze
   * Executes multi-agent quantitative and qualitative stock evaluation.
   */
  router.post('/analyze', async (req, res) => {
    try {
      const { symbol, customInput } = req.body;
      if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
        return res.status(400).json({ error: 'Stock "symbol" is required.' });
      }

      const payload = await orchestrator.analyzeStock(symbol, customInput);
      res.json(payload);
    } catch (error: any) {
      console.error('[StockRouter] Error analyzing stock:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  /**
   * POST /api/stocks/score
   * Runs fast deterministic score processing on financial metrics.
   */
  router.post('/score', (req, res) => {
    try {
      const { input } = req.body;
      const validation = validateStockInput(input);
      if (!validation.isValid) {
        return res.status(400).json({ error: 'Validation failed', details: validation.errors });
      }

      const payload = StockScoringService.scoreStock(validation.validatedData);
      res.json(payload);
    } catch (error: any) {
      console.error('[StockRouter] Error scoring stock:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  return router;
}
