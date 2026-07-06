/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CryptoScoringInputs, CryptoAnalysisPayload } from '../types/crypto';

// Weight config according to corporate standards (Version 0.5.5)
export const CRYPTO_SCORING_WEIGHTS = {
  trend: 14,
  momentum: 12,
  volatility_quality: 10,
  breakout_quality: 8,
  relative_strength: 8,
  avg_daily_volume: 10,
  spread: 8,
  orderbook_depth: 8,
  slippage_estimate: 6,
  active_addresses: 5,
  exchange_flows: 5,
  whale_activity: 5,
  supply_dynamics: 4,
  social_velocity: 6,
  narrative_strength: 5,
  news_momentum: 5,
  community_engagement: 4,
  manipulation_risk: 5,
  exchange_concentration: 4,
  rugpull_risk: 3,
  data_quality_risk: 2,
  ai_confidence: 2,
  regime_bonus: 6
};

export const CRYPTO_DECISION_THRESHOLDS = [
  { low: 90, high: 100, label: "A_setup", name: "A-Setup", desc: "Höchste Priorität. Enges Monitoring. Trade-Kandidat." },
  { low: 80, high: 89.99, label: "tradeable_watch", name: "Tradeable Watch", desc: "Qualitativ stark. Nur bei sauberem Timing handeln." },
  { low: 70, high: 79.99, label: "speculative_watch", name: "Speculative Watch", desc: "Gute Story, aber Risiko erhöht." },
  { low: 60, high: 69.99, label: "observe", name: "Observe", desc: "Nur mit Bestätigung oder Cluster-Setup." },
  { low: 0, high: 59.99, label: "reject", name: "Reject", desc: "Kein Trade. Ungenügende Qualität/Risiko-Profil." }
];

export class CryptoScoringService {
  /**
   * Safe clamp utility to ensure indicator values remain strictly inside bounds [0.0, 1.0].
   */
  private static clamp(value: number, low: number = 0.0, high: number = 1.0): number {
    return Math.max(low, Math.min(high, value));
  }

  /**
   * Helper to normalize raw parameters [0, 1] relative to their assigned weight.
   */
  private static normalizeToScore(value: number, weight: number): number {
    return this.clamp(value) * weight;
  }

  /**
   * Main mathematical execution of the CAPITAL-AI Crypto Scoring Model (Version 0.5.5).
   * Fully provable, with separated positive potential and negative risk factors.
   */
  public static scoreCrypto(inputs: CryptoScoringInputs, version: string = "0.5.5"): CryptoAnalysisPayload {
    const x = inputs;
    const w = CRYPTO_SCORING_WEIGHTS;

    // --- POSITIVE SCORING CONTRIBUTION ---
    // Aggregates technical indicators, liquidity indicators, network/on-chain density,
    // and sentiment momentum indicators. Total maximum weight of positive components is 111.
    const base_pos = 
      this.normalizeToScore(x.trend, w.trend) +                             // Tech: Trend strength
      this.normalizeToScore(x.momentum, w.momentum) +                       // Tech: Momentum velocity
      this.normalizeToScore(x.volatility_quality, w.volatility_quality) +   // Tech: Volatility quality
      this.normalizeToScore(x.breakout_quality, w.breakout_quality) +       // Tech: Breakout confirmation
      this.normalizeToScore(x.relative_strength, w.relative_strength) +     // Tech: RSI relative strength
      this.normalizeToScore(x.avg_daily_volume, w.avg_daily_volume) +       // Liq: Average volume
      this.normalizeToScore(x.orderbook_depth, w.orderbook_depth) +         // Liq: Depth thickness
      this.normalizeToScore(x.active_addresses, w.active_addresses) +       // On-Chain: Active addresses growth
      this.normalizeToScore(x.exchange_flows, w.exchange_flows) +           // On-Chain: Outflows/deposits
      this.normalizeToScore(x.whale_activity, w.whale_activity) +           // On-Chain: Large transactions trace
      this.normalizeToScore(x.supply_dynamics, w.supply_dynamics) +         // Tokenomics: Circulating supply factor
      this.normalizeToScore(x.social_velocity, w.social_velocity) +         // Sentiment: Mention growth
      this.normalizeToScore(x.narrative_strength, w.narrative_strength) +   // Sentiment: Theme alignment
      this.normalizeToScore(x.news_momentum, w.news_momentum) +             // Sentiment: Positive press flow
      this.normalizeToScore(x.community_engagement, w.community_engagement) + // Sentiment: Community chat density
      this.normalizeToScore(x.ai_confidence, w.ai_confidence);              // AI: Agent certainty factor

    // --- NEGATIVE SCORING PENALIZATION ---
    // Aggregates liquidity risk (spread, slippage) and security/structural risks (manipulation,
    // centralization, contract rugpull risk, oracle latency). Total maximum weight of negative components is 28.
    const base_neg = 
      this.normalizeToScore(x.spread, w.spread) +                           // Risk: Wide spreads
      this.normalizeToScore(x.slippage_estimate, w.slippage_estimate) +     // Risk: Order execution cost
      this.normalizeToScore(x.manipulation_risk, w.manipulation_risk) +     // Risk: Wash-trading suspicion
      this.normalizeToScore(x.exchange_concentration, w.exchange_concentration) + // Risk: Custody centralization
      this.normalizeToScore(x.rugpull_risk, w.rugpull_risk) +               // Risk: Contract security
      this.normalizeToScore(x.data_quality_risk, w.data_quality_risk);      // Risk: Pricing feed stability

    // --- NORMALIZATION AND BENCHMARK SCALES ---
    // 1. Positive scale: Map 111 theoretical maximum positive points to 80 final base score points.
    // Equation: BaseScore = (Sum(PositiveWeights) / 111) * 80
    const base_score = Number(((base_pos / 111) * 80).toFixed(2));
    
    // 2. Risk penalty scale: Map 28 theoretical maximum risk points to 15 final risk penalty points.
    // Equation: PenaltyScore = (Sum(NegativeWeights) / 28) * 15
    const risk_penalty = Number(((base_neg / 28) * 15).toFixed(2));
    
    // 3. Regime bonus: Macro market alignment contributes up to 20 additional points.
    // Equation: RegimeBonus = Clamp(regime_bonus) * 20
    const regime_bonus_val = Number((this.clamp(x.regime_bonus) * 20).toFixed(2));
    
    // 4. Final Score calculation: Combined score clamped safely inside standard range [0.0, 100.0]
    // Equation: FinalScore = Clamp(0, 100, BaseScore - PenaltyScore + RegimeBonus)
    const final_score = Math.max(0.0, Math.min(100.0, base_score - risk_penalty + regime_bonus_val));

    // --- DECISION LOGIC & METADATA BINDING ---
    let decision = "reject";
    let decisionName = "Reject";
    let decisionDesc = "Kein Trade. Ungenügende Qualität/Risiko-Profil.";
    for (const t of CRYPTO_DECISION_THRESHOLDS) {
      if (final_score >= t.low && final_score <= t.high) {
        decision = t.label;
        decisionName = t.name;
        decisionDesc = t.desc;
        break;
      }
    }

    // Risk tier assignment based on the resolved risk penalty
    let risk_level = "Medium";
    if (risk_penalty > 9) risk_level = "Extreme";
    else if (risk_penalty > 5) risk_level = "High";
    else if (risk_penalty < 2) risk_level = "Low";

    const reasoning: string[] = [];
    const alerts: string[] = [];

    // Construct detailed explanations dynamically based on input thresholds
    if (x.trend > 0.7) reasoning.push("Starker technischer Aufwärtstrend vorhanden.");
    if (x.momentum > 0.7) reasoning.push("Hohes bullisches Momentum wird durch Marktvolumen bestätigt.");
    if (x.relative_strength > 0.7) reasoning.push("Überragende relative Stärke gegenüber dem breiten Markt.");
    if (x.avg_daily_volume > 0.7) reasoning.push("Hervorragende tägliche Liquidität unterstützt größere Positionen.");
    if (x.orderbook_depth > 0.7) reasoning.push("Geringe Marktauswirkung durch tiefe Orderbuch-Liquidität.");
    if (x.active_addresses > 0.7) reasoning.push("Sehr hohe On-Chain-Netzwerkaktivität deutet auf organische Nutzung hin.");
    if (x.whale_activity > 0.7) reasoning.push("Smart-Money-Akkumulation durch Wal-Aktivitäten bestätigt.");
    if (x.social_velocity > 0.7) reasoning.push("Starke Dynamik in den sozialen Netzwerken verzeichnet.");
    if (x.narrative_strength > 0.7) reasoning.push("Führende Rolle in einem stark trendenden Markt-Narrativ.");
    
    if (x.spread > 0.4) alerts.push("Warnung: Erhöhter Bid-Ask Spread kann Ausführungskosten treiben.");
    if (x.slippage_estimate > 0.4) alerts.push("Achtung: Erhöhte Slippage bei Marktorders zu erwarten.");
    if (x.manipulation_risk > 0.4) alerts.push("Risiko: Erhöhtes Manipulations- oder Wash-Trading-Risiko.");
    if (x.exchange_concentration > 0.4) alerts.push("Sicherheitsrisiko: Hohe Konzentration auf wenigen Krypto-Börsen.");
    if (x.rugpull_risk > 0.2) alerts.push("Kritisches Risiko: Signifikantes Rugpull- oder Smart-Contract-Risiko!");

    if (reasoning.length === 0) {
      reasoning.push("Neutrale Markt- und On-Chain-Entwicklung.");
    }

    const avgLiq = Math.round((this.clamp(x.avg_daily_volume) + this.clamp(x.orderbook_depth)) / 2 * 100);
    const avgStrat = Math.round((this.clamp(x.social_velocity) + this.clamp(x.narrative_strength) + this.clamp(x.news_momentum)) / 3 * 100);
    const riskScoreValue = Math.round((risk_penalty / 15) * 100);

    let catSub = "Alternative Cryptographic Protocol";
    if (x.coin === "BTC") catSub = "Decentralized Store of Value / Ledger Base";
    else if (x.coin === "ETH") catSub = "Smart Contract Platform / Layer-1";
    else if (x.coin === "SOL") catSub = "High-Throughput Smart Contract Network";

    return {
      coin: x.coin,
      score: Number((final_score / 10).toFixed(1)), // 0-10 compatible score
      final_score: Number(final_score.toFixed(2)),
      base_score: Number(base_score.toFixed(2)),
      risk_penalty: Number(risk_penalty.toFixed(2)),
      regime_bonus: Number(regime_bonus_val.toFixed(2)),
      ai_confidence_bonus: Number((this.clamp(x.ai_confidence) * w.ai_confidence * 10).toFixed(2)),
      decision,
      decisionName,
      decisionDesc,
      risk_level,
      reasoning,
      alerts,
      classification: {
        category_main: "Crypto",
        category_sub: catSub,
        market_type: "Spot & Futures Asset Exchange",
        valuation_mode: "Multi-Dimensional On-Chain & Sentiment Metrics",
        confidence: Number(this.clamp(x.ai_confidence).toFixed(2)),
        reasoning: reasoning.slice(0, 3)
      },
      scores: {
        fundamentals: Math.round(base_score),
        risk: riskScoreValue,
        liquidity: avgLiq,
        strategicValue: avgStrat,
        final_score: Number(final_score.toFixed(1)),
        market_liquidity: avgLiq,
        processing_complexity: Math.round((1.0 - this.clamp(x.data_quality_risk)) * 100),
        risk_resilience: 100 - riskScoreValue,
        strategic_importance: avgStrat
      },
      weights: w,
      data_quality: {
        level: x.data_quality_risk > 0.15 ? "low" : x.data_quality_risk > 0.05 ? "medium" : "high"
      },
      inputs: x,
      metadata: {
        scoring_version: version,
        data_quality: Number((1.0 - this.clamp(x.data_quality_risk)).toFixed(2))
      }
    };
  }

  /**
   * Programmatically generate realistic inputs based on coin symbol and 24h performance.
   */
  public static generateCryptoInputs(symbol: string, change24h: number): CryptoScoringInputs {
    const s = symbol.toUpperCase().trim();
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    const seed = (Math.abs(hash) % 100) / 100;

    const momentumBase = this.clamp(0.5 + change24h / 15, 0.1, 0.95);
    const trendBase = this.clamp(0.5 + change24h / 25 + seed * 0.1, 0.15, 0.95);

    let trend = trendBase;
    let momentum = momentumBase;
    let volatility_quality = this.clamp(0.5 + (seed - 0.5) * 0.4);
    let breakout_quality = this.clamp(change24h > 4 ? 0.8 : 0.4 + seed * 0.3);
    let relative_strength = this.clamp(trendBase + (seed - 0.5) * 0.2);
    let avg_daily_volume = 0.5;
    let spread = 0.05;
    let orderbook_depth = 0.6;
    let slippage_estimate = 0.04;
    let active_addresses = this.clamp(0.5 + (seed - 0.3) * 0.4);
    let exchange_flows = this.clamp(0.5 + (0.5 - seed) * 0.3);
    let whale_activity = this.clamp(0.4 + seed * 0.4);
    let supply_dynamics = this.clamp(0.6 + (seed - 0.5) * 0.2);
    let social_velocity = this.clamp(momentumBase + (seed - 0.5) * 0.3);
    let narrative_strength = this.clamp(0.4 + seed * 0.5);
    let news_momentum = this.clamp(0.5 + change24h / 30);
    let community_engagement = this.clamp(0.5 + seed * 0.4);
    let manipulation_risk = this.clamp(0.1 + (1.0 - seed) * 0.2);
    let exchange_concentration = this.clamp(0.15 + seed * 0.2);
    let rugpull_risk = 0.02;
    let data_quality_risk = 0.01;
    let ai_confidence = this.clamp(0.6 + seed * 0.3);
    let regime_bonus = this.clamp(change24h > 1.5 ? 0.4 + seed * 0.3 : 0.2);

    // Asset-specific calibration for bluechips
    if (s === 'BTC') {
      avg_daily_volume = 0.98;
      spread = 0.01;
      orderbook_depth = 0.95;
      slippage_estimate = 0.01;
      active_addresses = 0.92;
      whale_activity = 0.85;
      manipulation_risk = 0.03;
      exchange_concentration = 0.08;
      rugpull_risk = 0.01;
      data_quality_risk = 0.01;
      narrative_strength = 0.95;
      community_engagement = 0.98;
    } else if (s === 'ETH') {
      avg_daily_volume = 0.88;
      spread = 0.02;
      orderbook_depth = 0.89;
      slippage_estimate = 0.02;
      active_addresses = 0.85;
      whale_activity = 0.78;
      manipulation_risk = 0.05;
      exchange_concentration = 0.12;
      rugpull_risk = 0.02;
      data_quality_risk = 0.01;
      narrative_strength = 0.90;
      community_engagement = 0.92;
    } else if (s === 'SOL') {
      avg_daily_volume = 0.82;
      spread = 0.04;
      orderbook_depth = 0.78;
      slippage_estimate = 0.05;
      active_addresses = 0.88;
      whale_activity = 0.72;
      manipulation_risk = 0.12;
      exchange_concentration = 0.22;
      rugpull_risk = 0.03;
      data_quality_risk = 0.02;
      narrative_strength = 0.92;
      community_engagement = 0.89;
    }

    return {
      coin: s,
      trend,
      momentum,
      volatility_quality,
      breakout_quality,
      relative_strength,
      avg_daily_volume,
      spread,
      orderbook_depth,
      slippage_estimate,
      active_addresses,
      exchange_flows,
      whale_activity,
      supply_dynamics,
      social_velocity,
      narrative_strength,
      news_momentum,
      community_engagement,
      manipulation_risk,
      exchange_concentration,
      rugpull_risk,
      data_quality_risk,
      ai_confidence,
      regime_bonus
    };
  }
}
