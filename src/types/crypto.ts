/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// R-001 / ADR-0032: scorefaehige Crypto-Faktoren muessen aus verifizierter Provider-Evidence
// oder aus einer explizit als `live` akzeptierten Kurshistorie stammen. Legacy-AssetRegistry-
// Bootstrapwerte sind Catalog-/Compatibility-Daten und duerfen nicht automatisch zu Evidence
// werden. Alle Felder ausser `coin` sind optional; fehlt belastbare Evidence, wird der Faktor
// ausgeschlossen statt geschaetzt oder durch Bootstrapwerte ersetzt.
export interface CryptoScoringInputs {
  coin: string;
  trend?: number;                 // 0.0 to 1.0 (Kurs vs. gleitendem Durchschnitt, verifizierte Historie)
  momentum?: number;              // 0.0 to 1.0 (Rate-of-Change, verifizierte Historie)
  volatility_quality?: number;    // 0.0 to 1.0 (invertierte Volatilitaet, verifizierte Historie)
  breakout_quality?: number;      // 0.0 to 1.0 (Position im realen High/Low-Fenster)
  relative_strength?: number;     // 0.0 to 1.0 (RSI, verifizierte Historie)
  avg_daily_volume?: number;      // 0.0 to 1.0; nur aus verifizierter Market-Cap/Volume-Evidence
  supply_dynamics?: number;       // 0.0 to 1.0; nur aus verifizierter Supply-Evidence
  regime_bonus?: number;          // 0.0 to 1.0; nur aus verifizierter Preisveraenderungs-Evidence
  data_quality_risk?: number;     // 0.0 to 1.0; derzeit nur bei akzeptierter realer Kurshistorie
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
  score: number;
  final_score: number;
  base_score: number;
  risk_penalty: number;
  regime_bonus: number;
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
    technicalStrength: number;
    final_score: number;
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
