/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalysisPayload, CategoryMain, RawMaterialInput, ScoreSet } from '../types/rawMaterials';
import { SCORING_VERSIONS, ACTIVE_VERSION, findRawMaterialConfig } from '../config/rawMaterialsConfig';

/**
 * Main Raw Materials Scoring Engine.
 * Serves as the Single Source of Truth for commodities risk & structural evaluations.
 */
export class RawMaterialsScoringService {
  /**
   * Calculates the raw material score payload based on active version.
   * Logs events and handles missing data gracefully.
   */
  public static scoreMaterial(input: RawMaterialInput, requestedVersion: string = ACTIVE_VERSION): AnalysisPayload {
    const configVersion = SCORING_VERSIONS[requestedVersion] || SCORING_VERSIONS[ACTIVE_VERSION];
    const weights = configVersion.weights;

    // Resolve base configurations if the material exists in the static registry
    const registered = findRawMaterialConfig(input.name);
    
    // Merge inputs: user provided input takes precedence over registered database
    const merged: RawMaterialInput = {
      name: input.name,
      category_main: input.category_main || registered?.category_main || 'Unknown',
      market_liquidity: input.market_liquidity ?? registered?.market_liquidity,
      volatility: input.volatility ?? registered?.volatility,
      trading_volume: input.trading_volume ?? registered?.trading_volume,
      ore_grade: input.ore_grade ?? registered?.ore_grade,
      tonnage: input.tonnage ?? registered?.tonnage,
      tonnage_reserve: input.tonnage_reserve ?? registered?.tonnage_reserve,
      substitution_potential: input.substitution_potential ?? registered?.substitution_potential,
      recyclability: input.recyclability ?? registered?.recyclability,
      processing_complexity: input.processing_complexity ?? registered?.processing_complexity,
      infrastructure_availability: input.infrastructure_availability ?? registered?.infrastructure_availability,
      extraction_costs: input.extraction_costs ?? registered?.extraction_costs,
      geopolitical_risk: input.geopolitical_risk ?? registered?.geopolitical_risk,
      supply_chain_risk: input.supply_chain_risk ?? registered?.supply_chain_risk,
      regulatory_risk: input.regulatory_risk ?? registered?.regulatory_risk,
      esg_risk: input.esg_risk ?? registered?.esg_risk,
      producer_concentration: input.producer_concentration ?? registered?.producer_concentration,
      military_importance: input.military_importance ?? registered?.military_importance,
      industrial_importance: input.industrial_importance ?? registered?.industrial_importance,
    };

    const missing_fields: string[] = [];

    // Helper to extract a score or track missing fields
    const getVal = (field: keyof Omit<RawMaterialInput, 'name' | 'category_main'>, fallback: number = 50): number => {
      const val = merged[field];
      if (val === undefined || val === null) {
        missing_fields.push(field);
        return fallback;
      }
      return val;
    };

    // 1. Markt und Liquidität
    const market_liquidity = getVal('market_liquidity', 50);
    const trading_volume = getVal('trading_volume', 50);
    const liquidityScore = Math.round((market_liquidity + trading_volume) / 2);

    // 2. Fundamentaldaten
    const ore_grade = getVal('ore_grade', 50);
    const tonnage = getVal('tonnage', 50);
    const tonnage_reserve = getVal('tonnage_reserve', 50);
    const substitution_potential = getVal('substitution_potential', 50); // 100 means extreme strategic dependency / hard to substitute
    const recyclability = getVal('recyclability', 50);
    
    // Fundamental average: higher gehalt, reserve, recyclability, and harder to substitute is better
    const fundamentalScore = Math.round(
      (ore_grade + (tonnage + tonnage_reserve) / 2 + substitution_potential + recyclability) / 4
    );

    // 3. Förderbarkeit und Prozessierbarkeit
    const processing_complexity = getVal('processing_complexity', 50); // 100 is extremely complex (bad)
    const infrastructure_availability = getVal('infrastructure_availability', 50); // 100 is excellent (good)
    const extraction_costs = getVal('extraction_costs', 50); // 100 is extremely expensive (bad)
    
    const processingScore = Math.round(
      ((100 - processing_complexity) + infrastructure_availability + (100 - extraction_costs)) / 3
    );

    // 4. Risiko und Resilienz
    const geopolitical_risk = getVal('geopolitical_risk', 50);
    const supply_chain_risk = getVal('supply_chain_risk', 50);
    const regulatory_risk = getVal('regulatory_risk', 50);
    const esg_risk = getVal('esg_risk', 50);
    const producer_concentration = getVal('producer_concentration', 50);
    const volatility = getVal('volatility', 50);

    const riskScore = Math.round(
      (geopolitical_risk + supply_chain_risk + regulatory_risk + esg_risk + producer_concentration + volatility) / 6
    );

    // 5. Strategische Bedeutung
    const military_importance = getVal('military_importance', 50);
    const industrial_importance = getVal('industrial_importance', 50);
    const strategicValueScore = Math.round((military_importance + industrial_importance) / 2);

    // Calculate dynamic weights
    const fWeight = weights.fundamentals;
    const rWeight = weights.risk;
    const lWeight = weights.liquidity;
    const pWeight = weights.processing;
    const sWeight = weights.strategicValue;

    // Final Score formula
    const rawFinalScore = 
      (fundamentalScore * fWeight) +
      ((100 - riskScore) * rWeight) + // Low risk is positive, so we invert
      (liquidityScore * lWeight) +
      (processingScore * pWeight) +
      (strategicValueScore * sWeight);

    const final_score = Number(Math.max(0, Math.min(100, rawFinalScore)).toFixed(1));

    // Determine data quality level
    let dataQualityLevel: 'low' | 'medium' | 'high' | 'unknown' = 'high';
    const totalPossibleFields = 18;
    const missingCount = missing_fields.length;
    const missingRatio = missingCount / totalPossibleFields;

    if (missingRatio > 0.6) {
      dataQualityLevel = 'unknown';
    } else if (missingRatio > 0.35) {
      dataQualityLevel = 'low';
    } else if (missingRatio > 0.15) {
      dataQualityLevel = 'medium';
    }

    // Determine confidence: base is registered confidence or 0.90, penalized by missing fields
    const baseConfidence = (registered as any)?.confidence || 0.90;
    const penalty = missingCount * 0.04;
    const confidence = Number(Math.max(0.15, baseConfidence - penalty).toFixed(2));

    // Compile reasoning items dynamically
    const reasoning: string[] = [];
    if (final_score >= 80) {
      reasoning.push(`Überragende strategische und fundamentale Stärke mit exzellenter Resilienz.`);
    } else if (final_score >= 60) {
      reasoning.push(`Solides Risikoprofil mit ausgeglichener Marktbewegung.`);
    } else if (final_score >= 40) {
      reasoning.push(`Erhöhte Risikofaktoren oder Versorgungsengpässe dämpfen die Gesamtbewertung.`);
    } else {
      reasoning.push(`Kritisches Risikoprofil. Starke Abhängigkeiten oder mangelnde Marktliquidität vorhanden.`);
    }

    if (geopolitical_risk > 70 || producer_concentration > 70) {
      reasoning.push(`Warnung: Extreme Marktkonzentration oder geopolitisches Risiko gefährdet Versorgung.`);
    }
    if (substitution_potential > 70) {
      reasoning.push(`Kritisch: Extrem schwer zu substituieren in industriellen Prozessen.`);
    }
    if (recyclability > 75) {
      reasoning.push(`Nachhaltig: Sehr hohe Recyclingfähigkeit mindert langfristige Primärabhängigkeit.`);
    }
    if (missingCount > 0) {
      reasoning.push(`Datenqualität eingeschränkt durch ${missingCount} fehlende(n) Datenpunkt(e).`);
    }

    // Build the structural payload matching user requirements exactly
    const payload: AnalysisPayload = {
      raw_material: merged.name,
      classification: {
        category_main: (merged.category_main as CategoryMain) || 'Unknown',
        category_sub: registered?.category_sub || 'Spezifischer Rohstoff / Sonderklasse',
        market_type: registered?.market_type || 'OTC oder Physischer Direktmarkt',
        valuation_mode: registered?.is_critical ? 'Kritikalität & Strategische Relevanz' : 'Standard-Marktbewertung',
        confidence,
        reasoning: reasoning.slice(0, 3)
      },
      scores: {
        fundamentals: fundamentalScore,
        risk: riskScore,
        liquidity: liquidityScore,
        strategicValue: strategicValueScore,
        final_score: final_score,
        market_liquidity: liquidityScore,
        processing_complexity: processingScore,
        risk_resilience: riskScore,
        strategic_importance: strategicValueScore
      },
      weights: {
        fundamentals: fWeight,
        risk: rWeight,
        liquidity: lWeight,
        processing: pWeight,
        strategic_value: sWeight // support both camelCase and snake_case for maximum resilience
      },
      data_quality: {
        level: dataQualityLevel,
        missing_fields: missing_fields.length > 0 ? missing_fields : undefined
      },
      reasoning: reasoning,
      inputs: merged,
      metadata: {
        scoring_version: requestedVersion,
        data_quality: Number((1 - missingCount / totalPossibleFields).toFixed(2))
      }
    };

    // Logging simulation in accordance with AIF-CORE directives
    console.log(`[AIF-CORE Scoring Engine] Evaluated ${merged.name} (Score: ${final_score}, Level: ${dataQualityLevel}, Version: ${requestedVersion})`);

    return payload;
  }
}
