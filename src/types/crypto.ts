/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CryptoScoringInputs {
  coin: string;
  trend: number;                 // 0.0 to 1.0 (Technical Indicator)
  momentum: number;              // 0.0 to 1.0 (Momentum Indicator)
  volatility_quality: number;    // 0.0 to 1.0 (Volatility stability check)
  breakout_quality: number;      // 0.0 to 1.0 (Breakout strength indicator)
  relative_strength: number;     // 0.0 to 1.0 (RSI relative strength)
  avg_daily_volume: number;      // 0.0 to 1.0 (Liquidity indicator)
  spread: number;                // 0.0 to 1.0 (Bid-Ask penalty)
  orderbook_depth: number;       // 0.0 to 1.0 (Orderbook thickness)
  slippage_estimate: number;     // 0.0 to 1.0 (Execution penalty)
  active_addresses: number;      // 0.0 to 1.0 (On-chain network density)
  exchange_flows: number;        // 0.0 to 1.0 (Exchange inflow/outflow)
  whale_activity: number;        // 0.0 to 1.0 (Smart money indicator)
  supply_dynamics: number;       // 0.0 to 1.0 (Tokenomics, inflation check)
  social_velocity: number;       // 0.0 to 1.0 (Social media mentions velocity)
  narrative_strength: number;    // 0.0 to 1.0 (Viral trend alignment)
  news_momentum: number;         // 0.0 to 1.0 (Sentiment momentum)
  community_engagement: number;  // 0.0 to 1.0 (Followers growth & chat density)
  manipulation_risk: number;     // 0.0 to 1.0 (Wash trading penalty)
  exchange_concentration: number;// 0.0 to 1.0 (Exchange centralisation risk)
  rugpull_risk: number;          // 0.0 to 1.0 (Smart contract risk penalty)
  data_quality_risk: number;     // 0.0 to 1.0 (Oracle latency risk)
  ai_confidence: number;         // 0.0 to 1.0 (AI agent confidence rating)
  regime_bonus: number;          // 0.0 to 1.0 (Broad market alignment bonus)
}

export interface CryptoScoreSet {
  trend: number;
  momentum: number;
  liquidity: number;
  on_chain: number;
  sentiment: number;
  risk_penalty: number;
  regime_bonus: number;
  final_score: number;
}

export interface CryptoClassification {
  category_main: "Crypto" | "Unknown";
  category_sub: string;
  market_type: string;
  valuation_mode: string;
  confidence: number;
  reasoning: string[];
}

export interface CryptoAnalysisPayload {
  coin: string;
  score: number; // 0-10 format
  final_score: number; // 0-100 format
  base_score: number;
  risk_penalty: number;
  regime_bonus: number;
  ai_confidence_bonus: number;
  decision: string;
  decisionName: string;
  decisionDesc: string;
  risk_level: string;
  reasoning: string[];
  alerts: string[];
  classification: CryptoClassification;
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
  inputs: CryptoScoringInputs;
  metadata: {
    scoring_version: string;
    data_quality: number;
  };
}
