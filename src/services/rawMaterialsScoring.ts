/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalysisPayload, CategoryMain, RawMaterialInput } from '../types/rawMaterials';
import { SCORING_VERSIONS, ACTIVE_VERSION, findRawMaterialConfig } from '../config/rawMaterialsConfig';

export const LEGACY_RAW_MATERIALS_SCORING_STATUS = 'legacy-research-only' as const;
export const LEGACY_RAW_MATERIALS_NEUTRAL_MISSING_VALUE = 50 as const;

/**
 * Historical structural/raw-material research scorer retained for dashboard/sandbox compatibility.
 *
 * IMPORTANT: this service is NOT a productive scoring authority. Canonical commodity scoring is
 * exclusively ScoringModelRegistry -> ScoringDispatcher -> commodity executor. The neutral value
 * below is deliberately confined to this legacy research service and MUST NOT enter Commodity
 * FeatureSnapshot, CanonicalScoreResult, ranking or eligibility.
 */
export class RawMaterialsScoringService {
  public static scoreMaterial(input: RawMaterialInput, requestedVersion: string = ACTIVE_VERSION): AnalysisPayload {
    const configVersion = SCORING_VERSIONS[requestedVersion] || SCORING_VERSIONS[ACTIVE_VERSION];
    const weights = configVersion.weights;
    const registered = findRawMaterialConfig(input.name);

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

    const missingFields: string[] = [];
    const getLegacyValue = (field: keyof Omit<RawMaterialInput, 'name' | 'category_main'>): number => {
      const value = merged[field];
      if (value === undefined || value === null || !Number.isFinite(value)) {
        missingFields.push(field);
        return LEGACY_RAW_MATERIALS_NEUTRAL_MISSING_VALUE;
      }
      return value;
    };

    const marketLiquidity = getLegacyValue('market_liquidity');
    const tradingVolume = getLegacyValue('trading_volume');
    const liquidityScore = Math.round((marketLiquidity + tradingVolume) / 2);

    const oreGrade = getLegacyValue('ore_grade');
    const tonnage = getLegacyValue('tonnage');
    const tonnageReserve = getLegacyValue('tonnage_reserve');
    // Canonical semantic for this historical field: 100 = easy to substitute, 0 = no practical substitute.
    const substitutability = getLegacyValue('substitution_potential');
    const substitutionDifficulty = 100 - substitutability;
    const recyclability = getLegacyValue('recyclability');
    const fundamentalScore = Math.round(
      (oreGrade + (tonnage + tonnageReserve) / 2 + substitutionDifficulty + recyclability) / 4,
    );

    const processingComplexity = getLegacyValue('processing_complexity');
    const infrastructureAvailability = getLegacyValue('infrastructure_availability');
    const extractionCosts = getLegacyValue('extraction_costs');
    const processingScore = Math.round(
      ((100 - processingComplexity) + infrastructureAvailability + (100 - extractionCosts)) / 3,
    );

    const geopoliticalRisk = getLegacyValue('geopolitical_risk');
    const supplyChainRisk = getLegacyValue('supply_chain_risk');
    const regulatoryRisk = getLegacyValue('regulatory_risk');
    const esgRisk = getLegacyValue('esg_risk');
    const producerConcentration = getLegacyValue('producer_concentration');
    const volatility = getLegacyValue('volatility');
    const riskScore = Math.round(
      (geopoliticalRisk + supplyChainRisk + regulatoryRisk + esgRisk + producerConcentration + volatility) / 6,
    );
    const riskResilienceScore = 100 - riskScore;

    const militaryImportance = getLegacyValue('military_importance');
    const industrialImportance = getLegacyValue('industrial_importance');
    const strategicValueScore = Math.round((militaryImportance + industrialImportance) / 2);

    const rawFinalScore =
      (fundamentalScore * weights.fundamentals)
      + (riskResilienceScore * weights.risk)
      + (liquidityScore * weights.liquidity)
      + (processingScore * weights.processing)
      + (strategicValueScore * weights.strategicValue);
    const finalScore = Number(Math.max(0, Math.min(100, rawFinalScore)).toFixed(1));

    const totalPossibleFields = 18;
    const missingRatio = missingFields.length / totalPossibleFields;
    const dataQualityLevel: 'low' | 'medium' | 'high' | 'unknown' = missingRatio > 0.6
      ? 'unknown'
      : missingRatio > 0.35
        ? 'low'
        : missingRatio > 0.15
          ? 'medium'
          : 'high';
    const baseConfidence = (registered as any)?.confidence || 0.90;
    const confidence = Number(Math.max(0.15, baseConfidence - missingFields.length * 0.04).toFixed(2));

    const reasoning: string[] = [];
    if (finalScore >= 80) reasoning.push('Hohe strukturelle Forschungsbewertung innerhalb des Legacy-Modells.');
    else if (finalScore >= 60) reasoning.push('Mittlere bis hohe strukturelle Forschungsbewertung innerhalb des Legacy-Modells.');
    else if (finalScore >= 40) reasoning.push('Erhöhte strukturelle Risiko- oder Versorgungsfaktoren im Legacy-Modell.');
    else reasoning.push('Niedrige strukturelle Forschungsbewertung im Legacy-Modell.');
    if (geopoliticalRisk > 70 || producerConcentration > 70) reasoning.push('Hohe geopolitische bzw. Angebotskonzentration erkannt.');
    if (substitutability < 30) reasoning.push('Geringe Substituierbarkeit erhöht die strukturelle Abhängigkeit.');
    if (recyclability > 75) reasoning.push('Hohe Recyclingfähigkeit reduziert langfristige Primärabhängigkeit.');
    if (missingFields.length > 0) reasoning.push(`Legacy-Neutralwerte wurden für ${missingFields.length} fehlende Datenpunkte verwendet; diese Werte sind nicht kanonisch.`);

    return {
      raw_material: merged.name,
      classification: {
        category_main: (merged.category_main as CategoryMain) || 'Unknown',
        category_sub: registered?.category_sub || 'Spezifischer Rohstoff / Sonderklasse',
        market_type: registered?.market_type || 'OTC oder Physischer Direktmarkt',
        valuation_mode: registered?.is_critical ? 'Kritikalität & Strategische Relevanz' : 'Standard-Marktbewertung',
        confidence,
        reasoning: reasoning.slice(0, 3),
      },
      scores: {
        fundamentals: fundamentalScore,
        risk: riskScore,
        liquidity: liquidityScore,
        strategicValue: strategicValueScore,
        final_score: finalScore,
        market_liquidity: liquidityScore,
        processing_complexity: processingScore,
        risk_resilience: riskResilienceScore,
        strategic_importance: strategicValueScore,
      },
      weights: {
        fundamentals: weights.fundamentals,
        risk: weights.risk,
        liquidity: weights.liquidity,
        processing: weights.processing,
        strategic_value: weights.strategicValue,
      },
      data_quality: {
        level: dataQualityLevel,
        missing_fields: missingFields.length > 0 ? missingFields : undefined,
      },
      reasoning: [
        ...reasoning,
        `${LEGACY_RAW_MATERIALS_SCORING_STATUS}: not eligible for CanonicalScoreResult or productive ranking.`,
      ],
      inputs: merged,
      metadata: {
        scoring_version: requestedVersion,
        data_quality: Number((1 - missingFields.length / totalPossibleFields).toFixed(2)),
      },
    };
  }
}
