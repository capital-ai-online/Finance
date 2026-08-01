/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5): von den vormals 23 Faktoren hatten nur die
// folgenden 9 eine reale, technisch anbindbare Quelle (echte Kurshistorie/Volumen/Supply aus
// der AssetRegistry via src/services/realMarketSignals.ts). Die uebrigen 14 (Orderbuch-Tiefe,
// Spread, Slippage, On-Chain-Adressen/Wal-Aktivitaet, Social-/News-Metriken, Manipulations-/
// Rugpull-Risiko, KI-Konfidenz) haetten einen Order-Book-, On-Chain- oder Social-Media-
// Datenanbieter erfordert, der in diesem Projekt nicht angebunden ist, und wurden entfernt statt
// mit einem Zeichen-Hash weiterbetrieben zu werden. Alle Felder ausser `coin` optional: fehlt
// ein Wert (z.B. keine reale Kurshistorie fuer dieses Symbol), wird er bei der Score-Berechnung
// ausgeschlossen statt geschaetzt (dynamische Neugewichtung, siehe cryptoScoringService.ts).
export interface CryptoScoringInputs {
  coin: string;
  trend?: number;                 // 0.0 to 1.0 (Kurs vs. gleitendem Durchschnitt, echte Historie)
  momentum?: number;               // 0.0 to 1.0 (Rate-of-Change, echte Historie)
  volatility_quality?: number;     // 0.0 to 1.0 (invertierte Volatilitaet, echte Historie)
  breakout_quality?: number;       // 0.0 to 1.0 (Position im realen High/Low-Fenster)
  relative_strength?: number;      // 0.0 to 1.0 (RSI, echte Historie)
  avg_daily_volume?: number;       // 0.0 to 1.0 (Umschlagsrate aus realem Volumen/Marktkapitalisierung)
  supply_dynamics?: number;        // 0.0 to 1.0 (zirkulierendes/maximales Angebot, reale Supply-Daten)
  regime_bonus?: number;           // 0.0 to 1.0 (reale 24h-Preisaenderung)
  data_quality_risk?: number;      // 0.0 to 1.0 (nur belegt, wenn eine reale Kurshistorie vorlag)
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
  // Audit ARCH-AUDIT-0002 (S1/S2/S5): base_score/risk_penalty sind jetzt die dynamisch
  // neugewichtete Summe der real belegten Positiv- bzw. Risikofaktoren (siehe
  // cryptoScoringService.ts), nicht mehr aus einer festen 23-Faktoren-Formel.
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
  // Audit ARCH-AUDIT-0002 (S1/S2/S5): missing_fields listet Faktoren ohne reale Quelle fuer
  // dieses Symbol (dynamisch aus der Score-Berechnung), nicht mehr geschaetzt.
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
