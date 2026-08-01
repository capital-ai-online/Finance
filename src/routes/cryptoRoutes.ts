import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { CryptoOrchestrator } from '../orchestrator/cryptoOrchestrator';
import { ClassificationService } from '../services/classification.service';
import { generateCryptoScores, calculateBaseScore, calculateDefiScore } from '../services/scoring.service';
import { calculateRankScore, isTop10Eligible } from '../services/ranking.service';
import { assetRegistry } from '../lib/assetRegistry';

export function createCryptoRouter(aiClient: GoogleGenAI | null): express.Router {
  const router = express.Router();
  const orchestrator = new CryptoOrchestrator(aiClient);

  /**
   * GET /api/crypto/list
   * Returns supported cryptocurrencies with dynamic evaluation using the new scoring system
   */
  router.get('/list', async (req, res) => {
    try {
      const cryptoAssets = assetRegistry.getAssets().filter(a => a.type === 'crypto');
      const list = await Promise.all(cryptoAssets.map(async asset => {
        const classification = ClassificationService.classifyAsset(asset.symbol);
        const scores = await generateCryptoScores(asset.symbol, asset.change24h);

        const payload = {
          asset_name: asset.name,
          symbol: asset.symbol,
          classification,
          scores
        };

        const finalScores = classification.category_main === 'DeFi'
          ? calculateDefiScore(payload)
          : calculateBaseScore(payload);

        const rankScore = calculateRankScore(payload, finalScores.final_score ?? 0);

        return {
          symbol: asset.symbol,
          name: asset.name,
          category_main: classification.category_main,
          category_sub: classification.category_sub,
          tier: classification.tier,
          final_score: Number((finalScores.final_score ?? 0).toFixed(1)),
          rank_score: Number(rankScore.toFixed(1)),
          eligible_for_top10: isTop10Eligible({
            ...payload,
            scores: finalScores,
            data_quality: { level: 'high' }
          }),
          // Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5): scores stammt aus
          // generateCryptoScores() - seit S1/S2/S5 reale Marktdaten (AssetRegistry/CMC/
          // CoinGecko), aber ohne die vollstaendige Multi-Agenten-Analyse von
          // /api/crypto/analyze.
          scoreBasis: 'market-data' as const
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
   * Runs the full multi-agent CryptoOrchestrator analysis
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
   * Deterministic scoring on custom input parameters
   */
  router.post('/score', async (req, res) => {
    try {
      const payload = req.body;
      if (!payload.symbol || !payload.asset_name) {
        return res.status(400).json({ error: '"symbol" and "asset_name" are required in payload.' });
      }

      const classification = payload.classification || ClassificationService.classifyAsset(payload.symbol);
      // Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5): ohne vom Aufrufer gelieferte scores
      // wird auf generateCryptoScores() zurueckgefallen - seit S1/S2/S5 reale Marktdaten
      // (AssetRegistry/CMC/CoinGecko) statt eines Zeichen-Hash-Generators.
      const scoresProvidedByCaller = !!payload.scores;
      const inputScores = payload.scores || await generateCryptoScores(payload.symbol, 0);
      const unifiedPayload = {
        ...payload,
        classification,
        scores: inputScores,
        data_quality: payload.data_quality || { level: 'high' }
      };

      const finalScores = classification.category_main === 'DeFi' 
        ? calculateDefiScore(unifiedPayload) 
        : calculateBaseScore(unifiedPayload);

      res.json({
        asset_name: unifiedPayload.asset_name,
        symbol: unifiedPayload.symbol,
        model: classification.category_main === 'DeFi' ? 'defi' : 'base',
        classification,
        scores: finalScores,
        rank_score: calculateRankScore(unifiedPayload, finalScores.final_score ?? 0),
        eligible_for_top10: isTop10Eligible({
          ...unifiedPayload,
          scores: finalScores
        }),
        scoreBasis: scoresProvidedByCaller ? 'user-adjusted' as const : 'market-data' as const
      });
    } catch (error: any) {
      console.error('[CryptoRouter] Error calculating deterministic score:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  /**
   * GET /api/crypto/top10
   * Filter and sort standard and DeFi assets for the central Top 10 rankings
   */
  router.get('/top10', async (req, res) => {
    try {
      const cryptoAssets = assetRegistry.getAssets().filter(a => a.type === 'crypto');
      const evaluated = await Promise.all(cryptoAssets.map(async asset => {
        const classification = ClassificationService.classifyAsset(asset.symbol);
        const scores = await generateCryptoScores(asset.symbol, asset.change24h);

        const payload = {
          asset_name: asset.name,
          symbol: asset.symbol,
          classification,
          scores,
          data_quality: { level: 'high' as const }
        };

        const finalScores = classification.category_main === 'DeFi'
          ? calculateDefiScore(payload)
          : calculateBaseScore(payload);

        const rankScore = calculateRankScore(payload, finalScores.final_score ?? 0);
        const eligible = isTop10Eligible({
          ...payload,
          scores: finalScores
        });

        return {
          symbol: asset.symbol,
          name: asset.name,
          classification,
          final_score: finalScores.final_score ?? 0,
          rank_score: rankScore,
          eligible,
          // Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5): scores stammt aus
          // generateCryptoScores() - seit S1/S2/S5 reale Marktdaten statt eines
          // Zeichen-Hash-Generators.
          scoreBasis: 'market-data' as const
        };
      }));

      const top10 = evaluated
        .filter(item => item.eligible)
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
