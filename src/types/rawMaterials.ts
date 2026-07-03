/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategoryMain = "Metal" | "Energy" | "Agriculture" | "Industrial" | "Recycling" | "Unknown";

export interface Classification {
  category_main: CategoryMain;
  category_sub: string;
  market_type: string;
  valuation_mode: string;
  confidence: number;
  reasoning: string[];
}

export interface ScoreSet {
  fundamentals: number;
  risk: number;
  liquidity: number;
  strategicValue: number;
  final_score: number;
  // UI and metric binding alias fields
  market_liquidity: number;
  processing_complexity: number;
  risk_resilience: number;
  strategic_importance: number;
}

export interface AnalysisPayload {
  raw_material: string;
  classification: Classification;
  scores: ScoreSet;
  weights: Record<string, number>;
  data_quality: {
    level: "low" | "medium" | "high" | "unknown";
    missing_fields?: string[];
  };
  reasoning: string[];
  inputs: RawMaterialInput;
  metadata: {
    scoring_version: string;
    data_quality: number;
  };
}

export interface RawMaterialInput {
  name: string;
  category_main?: CategoryMain;
  // Markt & Liquidität
  market_liquidity?: number;
  volatility?: number;
  trading_volume?: number;
  // Fundamentaldaten
  ore_grade?: number; // Gehalt
  tonnage?: number;   // Volumen
  tonnage_reserve?: number;
  substitution_potential?: number;
  recyclability?: number;
  // Förderbarkeit / Prozessierbarkeit
  processing_complexity?: number;
  infrastructure_availability?: number;
  extraction_costs?: number;
  // Risiko / Resilienz
  geopolitical_risk?: number;
  supply_chain_risk?: number;
  regulatory_risk?: number;
  esg_risk?: number;
  producer_concentration?: number;
  // Strategische Bedeutung
  military_importance?: number;
  industrial_importance?: number;
}
