/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MemeCoinInputs {
  coin: string;
  liquidity: number;            // 0.0 to 1.0 (Liquidity pool thickness)
  volume_trend: number;         // 0.0 to 1.0 (Trading volume momentum)
  trend_structure: number;      // 0.0 to 1.0 (Price action structure)
  momentum: number;             // 0.0 to 1.0 (FOMO velocity)
  volatility_quality: number;   // 0.0 to 1.0 (Vol stability check)
  social_sentiment: number;     // 0.0 to 1.0 (Social media hype level)
  narrative_strength: number;    // 0.0 to 1.0 (Viral potential index)
  catalyst_strength: number;     // 0.0 to 1.0 (Upcoming listings or main influencer posts)
  spread_penalty: number;        // 0.0 to 1.0 (Exchange spread risk)
  liquidity_penalty: number;     // 0.0 to 1.0 (Pool unlock or thin orderbook risk)
  manipulation_penalty: number;  // 0.0 to 1.0 (Snipers and wash trading index)
  rugpull_penalty: number;       // 0.0 to 1.0 (Dev token concentration, lock status)
  decay_penalty: number;         // 0.0 to 1.0 (Interest decay factor over time)
  ai_confidence_bonus: number;   // 0.0 to 0.05 (AI confidence contribution)
}

export interface MemeCoinClassification {
  category_main: "MemeCoin" | "Unknown";
  category_sub: string;
  market_type: string;
  valuation_mode: string;
  confidence: number;
  reasoning: string[];
}

export interface MemeCoinAnalysisPayload {
  coin: string;
  score: number; // 0-10 format
  final_score: number; // 0-100 format
  base_score: number;
  risk_penalty: number;
  ai_confidence_bonus: number;
  decision: string;
  decisionName: string;
  decisionDesc: string;
  risk_level: string;
  reasoning: string[];
  alerts: string[];
  classification: MemeCoinClassification;
  scores: {
    fundamentals: number;
    risk: number;
    liquidity: number;
    strategicValue: number;
    final_score: number;
    market_liquidity: number;
    processing_complexity: number;
    risk_resilience: number;
    strategic_importance: number;
  };
  weights: Record<string, number>;
  data_quality: {
    level: "low" | "medium" | "high" | "unknown";
    missing_fields?: string[];
  };
  inputs: MemeCoinInputs;
  metadata: {
    scoring_version: string;
    data_quality: number;
  };
}
