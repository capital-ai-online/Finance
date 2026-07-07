/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CategoryMain, RawMaterialInput } from '../types/rawMaterials';

export interface ScoringVersion {
  version: string;
  releasedAt: string;
  description: string;
  weights: {
    fundamentals: number;
    risk: number;
    liquidity: number;
    processing: number;
    strategicValue: number;
  };
}

export const SCORING_VERSIONS: Record<string, ScoringVersion> = {
  'v0.6.0-Beta': {
    version: '0.6.0-Beta',
    releasedAt: '2026-07-06',
    description: 'CAPITAL-AI Unified Commodities Scoring Engine v0.6.0-Beta',
    weights: {
      fundamentals: 0.35,  // 35%
      risk: 0.20,          // 20% (inverted)
      liquidity: 0.15,     // 15%
      processing: 0.20,    // 20%
      strategicValue: 0.10 // 10%
    }
  }
};

export const ACTIVE_VERSION = 'v0.6.0-Beta';

/**
 * Standard database for commodities (Single Source of Truth)
 * Maps raw material names/symbols to detailed attributes
 */
export const RAW_MATERIALS_DATABASE: Record<string, RawMaterialInput & { symbol: string; category_sub: string; market_type: string; is_critical: boolean }> = {
  'lithium': {
    symbol: 'LITHIUM',
    name: 'Lithium',
    category_main: 'Metal',
    category_sub: 'Batteriemetalle / Technologie-Metalle',
    market_type: 'Industrieller Rohstoff',
    is_critical: true,
    market_liquidity: 73,
    volatility: 68,
    trading_volume: 65,
    ore_grade: 82,
    tonnage: 78,
    tonnage_reserve: 85,
    substitution_potential: 35, // 35 means hard to substitute (high value for fundamentals)
    recyclability: 45,          // currently medium recyclability
    processing_complexity: 75,  // complex processing
    infrastructure_availability: 55,
    extraction_costs: 60,
    geopolitical_risk: 72,      // high concentration in South America / China processing
    supply_chain_risk: 78,
    regulatory_risk: 58,
    esg_risk: 70,               // water consumption in Salars is high
    producer_concentration: 82, // highly concentrated
    military_importance: 50,
    industrial_importance: 95   // essential for EV transition
  },
  'copper': {
    symbol: 'COPPER',
    name: 'Kupfer (Copper)',
    category_main: 'Metal',
    category_sub: 'Industriemetalle',
    market_type: 'Börsennotiert (LME)',
    is_critical: true,
    market_liquidity: 92,
    volatility: 35,
    trading_volume: 90,
    ore_grade: 60,              // declining ore grades worldwide
    tonnage: 85,
    tonnage_reserve: 78,
    substitution_potential: 48, // hard to substitute in high-end electrical applications
    recyclability: 88,          // highly recyclable
    processing_complexity: 40,  // standard processing
    infrastructure_availability: 85,
    extraction_costs: 50,
    geopolitical_risk: 45,
    supply_chain_risk: 50,
    regulatory_risk: 40,
    esg_risk: 48,
    producer_concentration: 55, // moderate concentration (Chile/Peru)
    military_importance: 60,
    industrial_importance: 98   // grid expansion & electrification
  },
  'uranium': {
    symbol: 'URANIUM',
    name: 'Uran (Uranium)',
    category_main: 'Energy',
    category_sub: 'Kernbrennstoffe / Nuklear',
    market_type: 'Spezialmarkt / OTC',
    is_critical: true,
    market_liquidity: 48,
    volatility: 75,
    trading_volume: 45,
    ore_grade: 88,
    tonnage: 65,
    tonnage_reserve: 70,
    substitution_potential: 15, // extremely hard to substitute in nuclear power
    recyclability: 30,          // recycling is possible but highly regulated/complex
    processing_complexity: 92,  // extreme regulatory & processing complexity
    infrastructure_availability: 60,
    extraction_costs: 68,
    geopolitical_risk: 85,      // Kazakhstan, Russia, Niger
    supply_chain_risk: 88,
    regulatory_risk: 95,        // highest regulation
    esg_risk: 80,               // environmental remediation of tailing sites
    producer_concentration: 88, // high concentration
    military_importance: 95,    // strategic & defense
    industrial_importance: 90
  },
  'gold': {
    symbol: 'GLD',
    name: 'Gold',
    category_main: 'Metal',
    category_sub: 'Edelmetalle',
    market_type: 'Globaler Leitmarkt (Spot)',
    is_critical: false,
    market_liquidity: 98,
    volatility: 18,
    trading_volume: 96,
    ore_grade: 50,
    tonnage: 60,
    tonnage_reserve: 55,
    substitution_potential: 30, // central bank reserve & jewelry (emotional/strategic)
    recyclability: 95,          // near 100% recyclable
    processing_complexity: 35,
    infrastructure_availability: 95,
    extraction_costs: 55,
    geopolitical_risk: 25,      // diversified mining
    supply_chain_risk: 20,
    regulatory_risk: 30,
    esg_risk: 65,               // artisanal gold mining issues, high water/energy
    producer_concentration: 32,
    military_importance: 30,
    industrial_importance: 45
  },
  'crudeoil': {
    symbol: 'USO',
    name: 'Rohöl (Crude Oil)',
    category_main: 'Energy',
    category_sub: 'Fossile Energieträger',
    market_type: 'Globaler Terminmarkt (WTI/Brent)',
    is_critical: false,
    market_liquidity: 99,
    volatility: 42,
    trading_volume: 98,
    ore_grade: 80,
    tonnage: 92,
    tonnage_reserve: 80,
    substitution_potential: 65, // renewable alternatives are rising, but petrochemicals remain
    recyclability: 10,          // consumed on use, low recycling
    processing_complexity: 30,  // refined globally
    infrastructure_availability: 95,
    extraction_costs: 35,
    geopolitical_risk: 78,      // OPEC cartel, Middle East risks
    supply_chain_risk: 70,
    regulatory_risk: 75,        // climate policies, carbon taxes
    esg_risk: 85,               // high carbon emission
    producer_concentration: 75,
    military_importance: 88,
    industrial_importance: 85
  },
  'silicon': {
    symbol: 'SILICON',
    name: 'Silizium (Silicon Metal)',
    category_main: 'Industrial',
    category_sub: 'Halbleiter- & Industrieminerale',
    market_type: 'Industrieller Rohstoff',
    is_critical: true,
    market_liquidity: 60,
    volatility: 45,
    trading_volume: 58,
    ore_grade: 90,              // quartz is abundant, but high purity silicon is limited
    tonnage: 88,
    tonnage_reserve: 92,
    substitution_potential: 20, // no substitute in modern semiconductor wafers
    recyclability: 40,
    processing_complexity: 82,  // extreme energy required for high-purity polysilicon
    infrastructure_availability: 70,
    extraction_costs: 65,
    geopolitical_risk: 68,      // China dominance in processing
    supply_chain_risk: 72,
    regulatory_risk: 50,
    esg_risk: 72,               // coal-powered reduction furnaces
    producer_concentration: 80,
    military_importance: 85,
    industrial_importance: 98   // solar panels & chips
  },
  'cobalt': {
    symbol: 'COBALT',
    name: 'Kobalt (Cobalt)',
    category_main: 'Metal',
    category_sub: 'Batteriemetalle',
    market_type: 'Spezialmarkt / LME',
    is_critical: true,
    market_liquidity: 55,
    volatility: 62,
    trading_volume: 50,
    ore_grade: 48,
    tonnage: 55,
    tonnage_reserve: 60,
    substitution_potential: 55, // LFP batteries can substitute cobalt, but reduces energy density
    recyclability: 70,
    processing_complexity: 65,
    infrastructure_availability: 42,
    extraction_costs: 58,
    geopolitical_risk: 92,      // >70% mined in DRC, refined in China
    supply_chain_risk: 95,
    regulatory_risk: 65,
    esg_risk: 92,               // human rights / child labor in artisanal mining
    producer_concentration: 94, // extreme concentration
    military_importance: 80,    // superalloys for jet engines
    industrial_importance: 85
  },
  'recycling_steel': {
    symbol: 'STEEL',
    name: 'Recycling-Stahl (Scrap Steel)',
    category_main: 'Recycling',
    category_sub: 'Sekundärrohstoffe / Kreislaufwirtschaft',
    market_type: 'Physischer Recyclingmarkt',
    is_critical: false,
    market_liquidity: 80,
    volatility: 28,
    trading_volume: 82,
    ore_grade: 95,              // pure metallic content
    tonnage: 85,
    tonnage_reserve: 90,
    substitution_potential: 70, // steel is highly versatile
    recyclability: 100,         // infinitely recyclable
    processing_complexity: 25,  // electric arc furnace is very efficient
    infrastructure_availability: 90,
    extraction_costs: 30,
    geopolitical_risk: 20,      // localized supply
    supply_chain_risk: 30,
    regulatory_risk: 25,
    esg_risk: 20,               // very low CO2 compared to primary blast furnace
    producer_concentration: 15, // highly diversified
    military_importance: 50,
    industrial_importance: 90
  },
  'wheat': {
    symbol: 'WHEAT',
    name: 'Weizen (Wheat)',
    category_main: 'Agriculture',
    category_sub: 'Agrarrohstoffe / Grundnahrungsmittel',
    market_type: 'Börsennotiert (CBOT)',
    is_critical: false,
    market_liquidity: 88,
    volatility: 38,
    trading_volume: 85,
    ore_grade: 75,              // quality/protein content
    tonnage: 95,                // seasonal global volume
    tonnage_reserve: 60,        // stockpiles represent global consumption buffer
    substitution_potential: 60, // can substitute with other grains like corn/rice
    recyclability: 5,           // consumed, not recyclable
    processing_complexity: 15,  // milling
    infrastructure_availability: 80,
    extraction_costs: 20,
    geopolitical_risk: 58,      // Black Sea corridor risks, export bans
    supply_chain_risk: 60,
    regulatory_risk: 35,
    esg_risk: 50,               // climate change impact, fertilizer reliance
    producer_concentration: 45,
    military_importance: 40,    // food security is national security
    industrial_importance: 35
  }
};

/**
 * Normalizes user input into one of the supported raw material IDs or returns null
 */
export function findRawMaterialConfig(query: string | undefined | null) {
  if (!query || typeof query !== 'string') {
    return null;
  }
  const normalized = query.toLowerCase().trim();
  if (RAW_MATERIALS_DATABASE[normalized]) {
    return RAW_MATERIALS_DATABASE[normalized];
  }

  // Fallback: search by name or symbol substring
  for (const [key, item] of Object.entries(RAW_MATERIALS_DATABASE)) {
    if (
      (item.name && item.name.toLowerCase().includes(normalized)) || 
      (item.symbol && item.symbol.toLowerCase().includes(normalized)) ||
      normalized.includes(key)
    ) {
      return item;
    }
  }
  return null;
}
