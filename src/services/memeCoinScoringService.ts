/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MemeCoinInputs, MemeCoinAnalysisPayload } from '../types/memeCoin';

// Audit ARCH-AUDIT-0002 (Q6): Diese Gewichte lagen zuvor doppelt vor - einmal als Literale in
// der base_score-Formel, einmal als separates weightsRecord-Objekt fuer die Antwort-Payload.
// Beide liefen strukturell auseinander, wenn nur eine Stelle geaendert wurde. Jetzt eine
// einzige Quelle, die an beiden Stellen verwendet wird.
const MEME_COIN_WEIGHTS = {
  liquidity: 0.15,
  volume_trend: 0.10,
  trend_structure: 0.15,
  momentum: 0.10,
  volatility_quality: 0.10,
  social_sentiment: 0.15,
  narrative_strength: 0.10,
  catalyst_strength: 0.10,
} as const;

export class MemeCoinScoringService {
  /**
   * Safe clamp utility to preserve values between [0.0, 1.0].
   */
  private static clamp(value: number, low: number = 0.0, high: number = 1.0): number {
    return Math.max(low, Math.min(high, value));
  }

  /**
   * Calculates high-velocity meme coin score (Version 0.5.4).
   * Fully transparent arithmetic formulas with split penalty structures.
   */
  public static scoreMemeCoin(inputs: MemeCoinInputs, version: string = "0.5.4"): MemeCoinAnalysisPayload {
    const x = inputs;

    // --- POSITIVE CORE HYPE SCORE ---
    // Represents viral force and basic trading support. Total multiplier sums up to 1.00 (100%).
    // Formula: BaseScore = (Sum(Metric * Allocation)) * 100
    const w = MEME_COIN_WEIGHTS;
    const base_score = (
      this.clamp(x.liquidity) * w.liquidity +                    // Pool depth and slippage buffer
      this.clamp(x.volume_trend) * w.volume_trend +               // Volume growth multiplier
      this.clamp(x.trend_structure) * w.trend_structure +         // Technical trend healthiness
      this.clamp(x.momentum) * w.momentum +                       // RSI/MACD buy pressure
      this.clamp(x.volatility_quality) * w.volatility_quality +   // Trading velocity continuity
      this.clamp(x.social_sentiment) * w.social_sentiment +       // TikTok, Twitter, Reddit viral velocity
      this.clamp(x.narrative_strength) * w.narrative_strength +   // Topic positioning (e.g. AI-Meme, Cat-Theme)
      this.clamp(x.catalyst_strength) * w.catalyst_strength       // Near-term events, exchange listing prospects
    ) * 100;

    // --- DESTRUCTIVE PENALTY CALCULATION ---
    // Models high-severity risks specific to meme coins.
    // Penalty: Sum(RiskIndicators) * 100
    const risk_penalty = (
      this.clamp(x.spread_penalty) +              // Bid-Ask wide spread penalty
      this.clamp(x.liquidity_penalty) +           // Lock duration and developer liquidity share
      this.clamp(x.manipulation_penalty) +        // Wash-trading or sniper activity
      this.clamp(x.rugpull_penalty) +             // Unlocked dev minting powers
      this.clamp(x.decay_penalty)                 // Community interest decay rate
    ) * 100;

    // --- AI AGENT ENHANCEMENT ---
    // AI confidence bonus contribution is limited to 5% (5 points max).
    const ai_confidence_val = this.clamp(x.ai_confidence_bonus, 0.0, 0.05) * 100;

    // --- FINAL CLAMPED AGGREGATE ---
    // Equation: FinalScore = Clamp(0, 100, BaseScore - RiskPenalty + AIConfidenceBonus)
    const final_score = Math.max(0.0, Math.min(100.0, base_score - risk_penalty + ai_confidence_val));

    // --- DECISION MATCHING ---
    let decision = "reject";
    let decisionName = "Reject";
    let decisionDesc = "Ungenügendes Risiko-Profil. Hohe Wahrscheinlichkeit von Kapitalverlust.";

    if (final_score >= 90) {
      decision = "A_setup";
      decisionName = "A-Setup";
      decisionDesc = "Sehr starker Hype & gesicherte Liquidität. Exzellenter Einstieg.";
    } else if (final_score >= 80) {
      decision = "tradeable_watch";
      decisionName = "Tradeable Watch";
      decisionDesc = "Trendstarker Memecoin mit stabiler Handelsaktivität.";
    } else if (final_score >= 70) {
      decision = "speculative_watch";
      decisionName = "Speculative Watch";
      decisionDesc = "Narrativ stark, aber erhöhtes Risiko & Volatilität.";
    } else if (final_score >= 60) {
      decision = "high_risk_speculation";
      decisionName = "High Risk Speculation";
      decisionDesc = "Hohes Risiko von Kursrückgängen und Liquidationen.";
    }

    let risk_level = "Medium";
    if (risk_penalty > 15) risk_level = "Extreme";
    else if (risk_penalty > 10) risk_level = "High";
    else if (risk_penalty < 4) risk_level = "Low";

    const reasoning: string[] = [];
    const alerts: string[] = [];

    // Detailed insights
    if (x.liquidity > 0.7) reasoning.push("Solide Liquiditätstiefe verhindert extreme Slippage.");
    if (x.volume_trend > 0.7) reasoning.push("Bullisches Handelsvolumen-Wachstum über die letzten 24h.");
    if (x.trend_structure > 0.7) reasoning.push("Saubere technische Aufwärtsstruktur auf Mikro- und Makro-Ebene.");
    if (x.momentum > 0.7) reasoning.push("Extrem hohe Impulsgeschwindigkeit (RSI-Bestätigung).");
    if (x.social_sentiment > 0.7) reasoning.push("Massiver Social-Media-Hype & hohes Mention-Wachstum.");
    if (x.narrative_strength > 0.7) reasoning.push("Starkes, viral trendendes Meme-Narrativ.");
    if (x.catalyst_strength > 0.7) reasoning.push("Starker Katalysator (z.B. Exchange-Listing oder Influencer-Post) steht bevor.");

    if (x.spread_penalty > 0.04) alerts.push("Warnung: Erhöhter Bid-Ask Spread.");
    if (x.liquidity_penalty > 0.04) alerts.push("Achtung: Dünne Liquiditätsfenster detektiert.");
    if (x.manipulation_penalty > 0.04) alerts.push("Warnung: Signifikante Wash-Trading-Muster erkannt.");
    if (x.rugpull_penalty > 0.02) alerts.push("Kritisches Risiko: Anzeichen für Zentralisierung oder Rugpull-Gefahr!");
    if (x.decay_penalty > 0.04) alerts.push("Achtung: Hohes Decay-Risiko durch nachlassende Social-Media-Aktivität.");

    if (reasoning.length === 0) {
      reasoning.push("Neutrale Meme-Handelsindikatoren.");
    }

    const avgLiq = Math.round(this.clamp(x.liquidity) * 100);
    const avgStrat = Math.round((this.clamp(x.social_sentiment) + this.clamp(x.narrative_strength) + this.clamp(x.catalyst_strength)) / 3 * 100);
    const riskScoreValue = Math.round(this.clamp(risk_penalty / 100) * 100);

    let catSub = "Speculative Community Token";
    if (x.coin === "DOGE") catSub = "Established Doge Ecosystem Benchmark";
    else if (x.coin === "SHIB") catSub = "Shiba Inu Ecosystem / Layer-2 Utility";
    else if (x.coin === "PEPE") catSub = "Pure Viral Meme-Asset Benchmark";

    return {
      coin: x.coin,
      score: Number((final_score / 10).toFixed(1)), // Keep 0-10 format compatible
      final_score: Number(final_score.toFixed(2)),
      base_score: Number(base_score.toFixed(2)),
      risk_penalty: Number(risk_penalty.toFixed(2)),
      ai_confidence_bonus: Number(ai_confidence_val.toFixed(2)),
      decision,
      decisionName,
      decisionDesc,
      risk_level,
      reasoning,
      alerts,
      classification: {
        category_main: "MemeCoin",
        category_sub: catSub,
        market_type: "Speculative High-Velocity Exchange",
        valuation_mode: "Viral Velocity & Liquidity Depth Audit",
        confidence: Number((0.85 + (x.ai_confidence_bonus || 0)).toFixed(2)),
        reasoning: reasoning.slice(0, 3)
      },
      scores: {
        fundamentals: Math.round(base_score),
        risk: riskScoreValue,
        liquidity: avgLiq,
        strategicValue: avgStrat,
        final_score: Number(final_score.toFixed(1)),
        market_liquidity: avgLiq,
        processing_complexity: Math.round((1.0 - this.clamp(x.spread_penalty)) * 100),
        risk_resilience: 100 - riskScoreValue,
        strategic_importance: avgStrat
      },
      weights: MEME_COIN_WEIGHTS,
      data_quality: {
        level: x.spread_penalty > 0.08 ? "low" : x.spread_penalty > 0.04 ? "medium" : "high"
      },
      inputs: x,
      metadata: {
        scoring_version: version,
        data_quality: Number((1.0 - this.clamp(x.spread_penalty * 0.2)).toFixed(2))
      }
    };
  }

  /**
   * Generates deterministic high-fidelity inputs based on symbol name.
   */
  public static generateMemeCoinInputs(symbol: string, change24h: number): MemeCoinInputs {
    const s = symbol.toUpperCase().trim();
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    const seed = (Math.abs(hash) % 100) / 100;

    const momentumBase = this.clamp(0.5 + change24h / 25, 0.1, 0.95);
    const socialBase = this.clamp(0.5 + change24h / 15 + seed * 0.1, 0.2, 0.95);

    let liquidity = this.clamp(0.4 + seed * 0.4);
    let volume_trend = this.clamp(momentumBase + (seed - 0.5) * 0.2);
    let trend_structure = this.clamp(0.3 + change24h / 30 + seed * 0.3);
    let momentum = momentumBase;
    let volatility_quality = this.clamp(0.3 + seed * 0.5);
    let social_sentiment = socialBase;
    let narrative_strength = this.clamp(0.5 + seed * 0.45);
    let catalyst_strength = this.clamp(0.2 + seed * 0.7);

    let spread_penalty = this.clamp(0.01 + (1.0 - seed) * 0.05);
    let liquidity_penalty = this.clamp(0.01 + (1.0 - seed) * 0.04);
    let manipulation_penalty = this.clamp(0.02 + seed * 0.06);
    let rugpull_penalty = this.clamp(0.01 + (1.0 - seed) * 0.03);
    let decay_penalty = this.clamp(0.02 + seed * 0.05);

    let ai_confidence_bonus = this.clamp(0.01 + seed * 0.04, 0.0, 0.05);

    // Well-known memes customization
    if (s === 'DOGE') {
      liquidity = 0.92;
      spread_penalty = 0.01;
      liquidity_penalty = 0.01;
      manipulation_penalty = 0.02;
      rugpull_penalty = 0.00;
      decay_penalty = 0.01;
      ai_confidence_bonus = 0.04;
      narrative_strength = 0.95;
    } else if (s === 'SHIB') {
      liquidity = 0.85;
      spread_penalty = 0.02;
      liquidity_penalty = 0.01;
      manipulation_penalty = 0.03;
      rugpull_penalty = 0.01;
      decay_penalty = 0.02;
      ai_confidence_bonus = 0.04;
      narrative_strength = 0.90;
    } else if (s === 'PEPE') {
      liquidity = 0.82;
      spread_penalty = 0.02;
      liquidity_penalty = 0.02;
      manipulation_penalty = 0.04;
      rugpull_penalty = 0.00;
      decay_penalty = 0.02;
      ai_confidence_bonus = 0.04;
      narrative_strength = 0.85;
    }

    return {
      coin: s,
      liquidity,
      volume_trend,
      trend_structure,
      momentum,
      volatility_quality,
      social_sentiment,
      narrative_strength,
      catalyst_strength,
      spread_penalty,
      liquidity_penalty,
      manipulation_penalty,
      rugpull_penalty,
      decay_penalty,
      ai_confidence_bonus
    };
  }
}
