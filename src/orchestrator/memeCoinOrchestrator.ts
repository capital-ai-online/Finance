/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { MemeCoinAnalysisPayload, MemeCoinInputs } from '../types/memeCoin';
import { MemeSentimentAgent } from '../agents/memeSentimentAgent';
import { MemeRiskAgent } from '../agents/memeRiskAgent';
import { MemeCoinScoringService } from '../services/memeCoinScoringService';

export class MemeCoinOrchestrator {
  private ai: GoogleGenAI | null;
  private sentimentAgent: MemeSentimentAgent;
  private riskAgent: MemeRiskAgent;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
    this.sentimentAgent = new MemeSentimentAgent(aiClient);
    this.riskAgent = new MemeRiskAgent(aiClient);
  }

  /**
   * Coordinates the multi-agent pipeline for high-speed speculative memecoin evaluation.
   */
  public async analyzeMemeCoin(coin: string, customInput?: Partial<MemeCoinInputs>): Promise<MemeCoinAnalysisPayload> {
    console.log(`[Meme-coin Master] Initializing multi-agent pipeline for meme: "${coin}"`);

    // 1. Run Sentiment and Risk Agents in parallel
    const [sentiment, risk] = await Promise.all([
      this.sentimentAgent.analyze(coin),
      this.riskAgent.analyze(coin)
    ]);

    // 2. Generate initial seed inputs
    const seedInputs = MemeCoinScoringService.generateMemeCoinInputs(coin, 5.5);

    // 3. Blend inputs together
    const unifiedInput: MemeCoinInputs = {
      coin,
      liquidity: customInput?.liquidity ?? seedInputs.liquidity,
      volume_trend: customInput?.volume_trend ?? seedInputs.volume_trend,
      trend_structure: customInput?.trend_structure ?? seedInputs.trend_structure,
      momentum: customInput?.momentum ?? seedInputs.momentum,
      volatility_quality: customInput?.volatility_quality ?? seedInputs.volatility_quality,
      
      // Sentiment agent values
      social_sentiment: customInput?.social_sentiment ?? sentiment.social_hype,
      narrative_strength: customInput?.narrative_strength ?? sentiment.narrative_strength,
      catalyst_strength: customInput?.catalyst_strength ?? sentiment.catalyst_strength,
      
      // Risk agent values
      spread_penalty: customInput?.spread_penalty ?? risk.spread_penalty,
      liquidity_penalty: customInput?.liquidity_penalty ?? risk.liquidity_penalty,
      manipulation_penalty: customInput?.manipulation_penalty ?? risk.manipulation_penalty,
      rugpull_penalty: customInput?.rugpull_penalty ?? risk.rugpull_penalty,
      decay_penalty: customInput?.decay_penalty ?? risk.decay_penalty,
      
      ai_confidence_bonus: customInput?.ai_confidence_bonus ?? seedInputs.ai_confidence_bonus
    };

    // 4. Calculate deterministic final scores
    const result = MemeCoinScoringService.scoreMemeCoin(unifiedInput);

    // 5. Build rich aggregated reasoning
    const mergedReasoning = [
      ...result.reasoning,
      `[Meme-Hype] ${sentiment.explanation}`,
      `[Sicherheitsaudit] ${risk.explanation}`
    ];

    return {
      ...result,
      reasoning: mergedReasoning
    };
  }
}
