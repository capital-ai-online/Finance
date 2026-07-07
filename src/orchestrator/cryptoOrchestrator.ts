/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { CryptoAnalysisPayload, CryptoScoringInputs } from '../types/crypto';
import { CryptoClassificationAgent } from '../agents/cryptoClassificationAgent';
import { CryptoOnChainAgent } from '../agents/cryptoOnChainAgent';
import { CryptoSentimentAgent } from '../agents/cryptoSentimentAgent';
import { CryptoRiskAgent } from '../agents/cryptoRiskAgent';
import { CryptoScoringService } from '../services/cryptoScoringService';

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
   * Coordinates the multi-agent pipeline for standard/enterprise cryptocurrencies.
   */
  public async analyzeCrypto(coin: string, customInput?: Partial<CryptoScoringInputs>): Promise<CryptoAnalysisPayload> {
    console.log(`[Crypto Orchestrator] Initializing multi-agent pipeline for asset: "${coin}"`);

    // 1. Run Classification, On-Chain metrics, Sentiment, and Risk Agents in parallel
    const [classification, onchain, sentiment, risk] = await Promise.all([
      this.classificationAgent.analyze(coin),
      this.onChainAgent.analyze(coin),
      this.sentimentAgent.analyze(coin),
      this.riskAgent.analyze(coin)
    ]);

    // 2. Generate standard initial seed inputs based on the coin and a flat performance fallback
    const seedInputs = CryptoScoringService.generateCryptoInputs(coin, 1.5);

    // 3. Assemble unified complete scoring inputs, blending AI agent qualitative inputs with seed/custom inputs
    const unifiedInput: CryptoScoringInputs = {
      coin,
      trend: customInput?.trend ?? seedInputs.trend,
      momentum: customInput?.momentum ?? seedInputs.momentum,
      volatility_quality: customInput?.volatility_quality ?? seedInputs.volatility_quality,
      breakout_quality: customInput?.breakout_quality ?? seedInputs.breakout_quality,
      relative_strength: customInput?.relative_strength ?? seedInputs.relative_strength,
      
      avg_daily_volume: customInput?.avg_daily_volume ?? seedInputs.avg_daily_volume,
      spread: customInput?.spread ?? seedInputs.spread,
      orderbook_depth: customInput?.orderbook_depth ?? seedInputs.orderbook_depth,
      slippage_estimate: customInput?.slippage_estimate ?? seedInputs.slippage_estimate,
      
      // Infuse On-Chain agent insights
      active_addresses: customInput?.active_addresses ?? onchain.active_addresses_growth,
      exchange_flows: customInput?.exchange_flows ?? seedInputs.exchange_flows,
      whale_activity: customInput?.whale_activity ?? onchain.whale_accumulation,
      supply_dynamics: customInput?.supply_dynamics ?? seedInputs.supply_dynamics,
      
      // Infuse Sentiment agent insights
      social_velocity: customInput?.social_velocity ?? sentiment.social_velocity,
      narrative_strength: customInput?.narrative_strength ?? sentiment.narrative_strength,
      news_momentum: customInput?.news_momentum ?? sentiment.news_momentum,
      community_engagement: customInput?.community_engagement ?? seedInputs.community_engagement,
      
      // Infuse Risk agent insights
      manipulation_risk: customInput?.manipulation_risk ?? risk.manipulation_index,
      exchange_concentration: customInput?.exchange_concentration ?? risk.exchange_concentration_index,
      rugpull_risk: customInput?.rugpull_risk ?? seedInputs.rugpull_risk,
      data_quality_risk: customInput?.data_quality_risk ?? seedInputs.data_quality_risk,
      
      ai_confidence: customInput?.ai_confidence ?? classification.confidence,
      regime_bonus: customInput?.regime_bonus ?? seedInputs.regime_bonus
    };

    // 4. Run the high-fidelity scoring calculations (Version 0.5.4)
    const result = CryptoScoringService.scoreCrypto(unifiedInput);

    // 5. Build rich aggregated reasoning by incorporating individual agent explanations
    const mergedReasoning = [
      ...result.reasoning,
      `[Klassifikation] Typus: ${classification.category} (${classification.sub_tier}), Narrativ-Zugehörigkeit: ${classification.narrative_alignment}.`,
      `[Netzwerk-Aktivität] ${onchain.explanation}`,
      `[Sentiment-Zirkulation] ${sentiment.explanation}`,
      `[Systemisches Risiko] ${risk.explanation}`
    ];

    return {
      ...result,
      reasoning: mergedReasoning
    };
  }
}
