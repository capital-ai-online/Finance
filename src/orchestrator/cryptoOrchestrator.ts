/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { CryptoClassificationAgent } from '../agents/cryptoClassificationAgent';
import { CryptoOnChainAgent } from '../agents/cryptoOnChainAgent';
import { CryptoSentimentAgent } from '../agents/cryptoSentimentAgent';
import { CryptoRiskAgent } from '../agents/cryptoRiskAgent';
import { assetRegistry } from '../lib/assetRegistry';
import { ClassificationService } from '../services/classification.service';
import { generateCryptoScores, calculateBaseScore, calculateDefiScore, calculateValueCorridor } from '../services/scoring.service';
import { calculateRankScore, isTop10Eligible } from '../services/ranking.service';
import { CryptoCategory, CryptoSubCategory, CryptoTier, CryptoClassification, CryptoScores, CryptoAnalysisPayload } from '../types/crypto.types';
import { updateAgentActivity } from '../../server/systemEvents';

export class CryptoOrchestrator {
  private ai: GoogleGenAI | null;
  private classificationAgent: CryptoClassificationAgent;
  private onChainAgent: CryptoOnChainAgent;
  private sentimentAgent: CryptoSentimentAgent;
  private riskAgent: CryptoRiskAgent;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
    this.classificationAgent = new CryptoClassificationAgent(aiClient);
    this.onChainAgent = new CryptoOnChainAgent(aiClient);
    this.sentimentAgent = new CryptoSentimentAgent(aiClient);
    this.riskAgent = new CryptoRiskAgent(aiClient);
  }

  /**
   * Coordinates the multi-agent pipeline for standard/enterprise cryptocurrencies,
   * blending AI inputs with the new, official deterministic Standard & DeFi scoring models.
   */
  public async analyzeCrypto(coin: string, customInput?: Partial<CryptoScores>): Promise<CryptoAnalysisPayload> {
    const symbol = coin.toUpperCase().trim();
    console.log(`[Crypto Orchestrator] Initializing high-fidelity multi-agent pipeline for: "${symbol}"`);

    // Live update agent statuses on Master Supervisor
    updateAgentActivity('ag_scanner', `Klassifiziert ${symbol} und sammelt Marktstimmung`, true);
    updateAgentActivity('ag_allocator', `Analysiert On-Chain Metriken für ${symbol}`, true);
    updateAgentActivity('ag_risk', `Berechnet Risiko-Koeffizienten für ${symbol}`, true);

    let agentClassification, onchain, sentiment, risk;
    try {
      // 1. Run Classification, On-Chain metrics, Sentiment, and Risk Agents in parallel
      [agentClassification, onchain, sentiment, risk] = await Promise.all([
        this.classificationAgent.analyze(symbol),
        this.onChainAgent.analyze(symbol),
        this.sentimentAgent.analyze(symbol),
        this.riskAgent.analyze(symbol)
      ]);
    } finally {
      // Reset statuses to idle after completing tasks
      updateAgentActivity('ag_scanner', `Keine aktive Aufgabe`, false);
      updateAgentActivity('ag_allocator', `Keine aktive Aufgabe`, false);
      updateAgentActivity('ag_risk', `Keine aktive Aufgabe`, false);
    }

    // 2. Fetch registry asset name or use default fallback
    const asset = assetRegistry.getAsset(symbol);
    const assetName = asset ? asset.name : symbol;

    // 3. Resolve deterministic classification and seed scores
    const baseClassification = ClassificationService.classifyAsset(symbol);
    const seedScores = generateCryptoScores(symbol, asset ? asset.change24h : 0.0);

    // 4. Determine main category mapping
    let categoryMain: CryptoCategory = baseClassification.category_main;
    if (agentClassification.category?.toLowerCase().includes('defi')) {
      categoryMain = 'DeFi';
    } else if (agentClassification.category?.toLowerCase() === 'l1' || agentClassification.category?.toLowerCase() === 'layer1') {
      categoryMain = 'Layer 1';
    } else if (agentClassification.category?.toLowerCase() === 'l2' || agentClassification.category?.toLowerCase() === 'layer2') {
      categoryMain = 'Layer 2';
    } else if (agentClassification.category?.toLowerCase().includes('meme')) {
      categoryMain = 'Meme';
    } else if (agentClassification.category?.toLowerCase().includes('oracle')) {
      categoryMain = 'Oracle';
    }

    const categorySub: CryptoSubCategory = baseClassification.category_sub;
    const tier: CryptoTier = baseClassification.tier;

    const classification: CryptoClassification = {
      category_main: categoryMain,
      category_sub: categorySub,
      asset_type: baseClassification.asset_type,
      tier,
      confidence: Number(((baseClassification.confidence + agentClassification.confidence) / 2).toFixed(2)),
      reasoning: [
        ...baseClassification.reasoning,
        ...agentClassification.reasoning
      ]
    };

    // 5. Construct composite scoring inputs, blending AI agent qualitative observations with seed and custom overrides
    const scores: CryptoScores = {
      marketCap: customInput?.marketCap ?? seedScores.marketCap,
      liquidity: customInput?.liquidity ?? seedScores.liquidity,
      volumeQuality: customInput?.volumeQuality ?? seedScores.volumeQuality,
      tokenomics: customInput?.tokenomics ?? seedScores.tokenomics,
      supplyTransparency: customInput?.supplyTransparency ?? seedScores.supplyTransparency,
      
      // Inject On-Chain agent insights
      networkActivity: customInput?.networkActivity ?? Math.round(onchain.active_addresses_growth * 100),
      security: customInput?.security ?? Math.round((1.0 - risk.manipulation_index) * 100),
      developerActivity: customInput?.developerActivity ?? seedScores.developerActivity,
      
      // Inject Sentiment and utility metrics
      utility: customInput?.utility ?? Math.round(sentiment.narrative_strength * 100),
      feeGeneration: customInput?.feeGeneration ?? seedScores.feeGeneration,
      revenue: customInput?.revenue ?? seedScores.revenue,
      governanceStrength: customInput?.governanceStrength ?? seedScores.governanceStrength,
      
      // Inject Sentiment agent insights
      adoption: customInput?.adoption ?? Math.round(sentiment.social_velocity * 100),
      risk: customInput?.risk ?? Math.round(risk.manipulation_index * 100),
      volatility: customInput?.volatility ?? seedScores.volatility,
      sentiment: customInput?.sentiment ?? Math.round(sentiment.news_momentum * 100),
      compliance: customInput?.compliance ?? seedScores.compliance,
      tvlQuality: customInput?.tvlQuality ?? seedScores.tvlQuality
    };

    const payload: CryptoAnalysisPayload = {
      asset_name: assetName,
      symbol,
      classification,
      scores,
      data_quality: {
        level: risk.manipulation_index > 0.4 ? 'medium' : 'high',
        missing_fields: []
      }
    };

    // 6. Compute scores using the high-fidelity scoring engines
    const finalScores = categoryMain === 'DeFi' 
      ? calculateDefiScore(payload) 
      : calculateBaseScore(payload);

    // 7. Calculate value corridor and rank metrics
    const valueCorridor = calculateValueCorridor(finalScores.final_score ?? 0, asset ? asset.price : undefined);
    const rankScore = calculateRankScore(payload, finalScores.final_score ?? 0);
    const eligibleForTop10 = isTop10Eligible({
      ...payload,
      scores: finalScores
    });

    // 8. Build consolidated reasoning trail
    const mergedReasoning = [
      `[Klassifikation] Hauptkategorie: ${categoryMain}, Unterklasse: ${categorySub}, Tier: ${tier}.`,
      `[Netzwerk-Aktivität] ${onchain.explanation}`,
      `[Markt-Sentiment] ${sentiment.explanation}`,
      `[Systemisches Risiko] ${risk.explanation}`,
      `[Valuation Autopilot] Modell: ${categoryMain === 'DeFi' ? 'DeFi-Cashflow-Modell' : 'Krypto-Basis-Modell'}, Final Score: ${(finalScores.final_score ?? 0).toFixed(1)}/100`,
      `[Top 10 Status] Eignung: ${eligibleForTop10 ? "Zugelassen (Rank Score: " + rankScore.toFixed(1) + ")" : "Nicht zugelassen (unzureichende Liquidität oder Datenqualität)"}`
    ];

    return {
      asset_name: assetName,
      symbol,
      classification,
      scores: finalScores,
      data_quality: {
        level: classification.confidence >= 0.8 ? 'high' : 'medium',
        missing_fields: []
      },
      reasoning: mergedReasoning
    };
  }
}
export default CryptoOrchestrator;
