/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5): von den vormals 14 Faktoren haben nur die
// folgenden 4 eine reale, technisch anbindbare Quelle (echte Kurshistorie/Volumen aus der
// AssetRegistry via src/services/realMarketSignals.ts - bei den meisten Meme-Coins ausser
// DOGE/SHIB liegt mangels CoinGecko-ID keine reale Historie vor, dann bleiben trend_structure/
// momentum/volatility_quality undefined statt geschaetzt). Die uebrigen 10 (Social-Media-
// Hype, Narrativ, Katalysator, Spread/Liquiditaets-/Manipulations-/Rugpull-/Decay-Penalty,
// KI-Konfidenz) haetten einen Social-Media-, Order-Book- oder On-Chain-Datenanbieter erfordert,
// der in diesem Projekt nicht angebunden ist, und wurden entfernt statt mit einem Zeichen-Hash
// weiterbetrieben zu werden.
export interface MemeCoinInputs {
  coin: string;
  liquidity?: number;            // 0.0 to 1.0 (Umschlagsrate aus realem Volumen/Marktkapitalisierung)
  trend_structure?: number;      // 0.0 to 1.0 (Kurs vs. gleitendem Durchschnitt, echte Historie)
  momentum?: number;             // 0.0 to 1.0 (Rate-of-Change, echte Historie)
  volatility_quality?: number;   // 0.0 to 1.0 (invertierte Volatilitaet, echte Historie)
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
  decision: string;
  decisionName: string;
  decisionDesc: string;
  // Audit ARCH-AUDIT-0002 (S1/S2/S5): fuer Meme-Coins gibt es keinen real anbindbaren
  // Manipulations-/Rugpull-/Liquiditaets-Risikofaktor mehr - "Unbekannt" statt eines
  // erfundenen "Low"/"Medium", wenn kein Risikofaktor real belegt ist.
  risk_level: string;
  reasoning: string[];
  alerts: string[];
  classification: MemeCoinClassification;
  scores: {
    fundamentals: number;
    liquidity: number;
    technicalStrength: number;
    final_score: number;
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
