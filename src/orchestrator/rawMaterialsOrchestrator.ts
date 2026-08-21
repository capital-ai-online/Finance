/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AiGenerationClient } from '../services/aiSchema';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { AnalysisPayload, RawMaterialInput } from '../types/rawMaterials';
import { ClassificationAgent } from '../agents/classificationAgent';
import { FundamentalsAgent } from '../agents/fundamentalsAgent';
import { RiskAgent } from '../agents/riskAgent';
import { ValuationAgent } from '../agents/valuationAgent';
import { RawMaterialsScoringService } from '../services/rawMaterialsScoring';
import { findRawMaterialConfig } from '../config/rawMaterialsConfig';
import {
  orchestratorAgentRuntimeProjection,
  type OrchestratorAgentDescriptor,
} from './agentRuntimeProjection';

export const RAW_MATERIALS_ORCHESTRATOR_AGENT_DESCRIPTORS: readonly OrchestratorAgentDescriptor[] = [
  {
    id: 'rawmaterials.classification',
    name: 'Raw Materials Classification Agent',
    role: 'Raw-material classification research',
    orchestratorId: 'rawmaterials_orchestrator',
    model: 'provider-neutral',
  },
  {
    id: 'rawmaterials.fundamentals',
    name: 'Raw Materials Fundamentals Agent',
    role: 'Geology/fundamentals research',
    orchestratorId: 'rawmaterials_orchestrator',
    model: 'provider-neutral',
  },
  {
    id: 'rawmaterials.risk',
    name: 'Raw Materials Risk Agent',
    role: 'Geopolitical and macro risk research',
    orchestratorId: 'rawmaterials_orchestrator',
    model: 'provider-neutral',
  },
  {
    id: 'rawmaterials.valuation',
    name: 'Raw Materials Valuation Agent',
    role: 'Strategic valuation research',
    orchestratorId: 'rawmaterials_orchestrator',
    model: 'provider-neutral',
  },
];

export class RawMaterialsOrchestrator {
  private ai: AiGenerationClient | null;
  private classificationAgent: ClassificationAgent;
  private fundamentalsAgent: FundamentalsAgent;
  private riskAgent: RiskAgent;
  private valuationAgent: ValuationAgent;

  // Audit ARCH-AUDIT-0002 (J3/J3-Folge, Kapitel 14.6): optionale Anthropic-/OpenAI-Clients
  // fuer den providerübergreifenden Rückfall - ohne konfigurierten Client (Standardwert null)
  // ruckt die Kette einfach zur naechsten Stufe durch.
  constructor(aiClient: AiGenerationClient | null, anthropicClient: Anthropic | null = null, openaiClient: OpenAI | null = null) {
    this.ai = aiClient;
    this.classificationAgent = new ClassificationAgent(aiClient, anthropicClient, openaiClient);
    this.fundamentalsAgent = new FundamentalsAgent(aiClient, anthropicClient, openaiClient);
    this.riskAgent = new RiskAgent(aiClient, anthropicClient, openaiClient);
    this.valuationAgent = new ValuationAgent(aiClient, anthropicClient, openaiClient);
    orchestratorAgentRuntimeProjection.registerMany(RAW_MATERIALS_ORCHESTRATOR_AGENT_DESCRIPTORS);
  }

  /**
   * Orchestrates the entire multi-agent raw material assessment pipeline.
   * Leverages parallel agents processing, combined with deterministic scoring logic.
   */
  public async analyzeMaterial(name: string, customInput?: Partial<RawMaterialInput>): Promise<AnalysisPayload> {
    console.log(`[Master Orchestrator] Initializing multi-agent pipeline for raw material: "${name}"`);

    orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.classification', `Klassifiziert Rohstoff ${name}`, true);
    orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.fundamentals', `Analysiert fundamentale Faktoren für ${name}`, true);
    orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.risk', `Analysiert geopolitische und makroökonomische Risiken für ${name}`, true);
    orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.valuation', `Analysiert strategische Bewertung für ${name}`, true);

    let classification, fundamentals, risk, valuation;
    try {
      // 1. Run Classification, Fundamentals, Risk, and Valuation Agents in parallel
      [classification, fundamentals, risk, valuation] = await Promise.all([
        this.classificationAgent.analyze(name),
        this.fundamentalsAgent.analyze(name),
        this.riskAgent.analyze(name),
        this.valuationAgent.analyze(name)
      ]);
    } finally {
      orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.classification', 'Keine aktive Aufgabe', false);
      orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.fundamentals', 'Keine aktive Aufgabe', false);
      orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.risk', 'Keine aktive Aufgabe', false);
      orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.valuation', 'Keine aktive Aufgabe', false);
    }

    // 2. Resolve database defaults for fields that are not covered by the agents
    const config = findRawMaterialConfig(name);

    // 3. Assemble complete raw input set
    const unifiedInput: RawMaterialInput = {
      name,
      category_main: customInput?.category_main || classification.category_main,
      
      // Market / Liquidity
      market_liquidity: customInput?.market_liquidity ?? config?.market_liquidity ?? 50,
      volatility: customInput?.volatility ?? risk.volatility,
      trading_volume: customInput?.trading_volume ?? config?.trading_volume ?? 50,
      
      // Fundamentals
      ore_grade: customInput?.ore_grade ?? fundamentals.ore_grade,
      tonnage: customInput?.tonnage ?? fundamentals.tonnage,
      tonnage_reserve: customInput?.tonnage_reserve ?? fundamentals.tonnage_reserve,
      substitution_potential: customInput?.substitution_potential ?? fundamentals.substitution_potential,
      recyclability: customInput?.recyclability ?? fundamentals.recyclability,
      
      // Processing
      processing_complexity: customInput?.processing_complexity ?? config?.processing_complexity ?? 50,
      infrastructure_availability: customInput?.infrastructure_availability ?? config?.infrastructure_availability ?? 50,
      extraction_costs: customInput?.extraction_costs ?? config?.extraction_costs ?? 50,
      
      // Risk / Resilience
      geopolitical_risk: customInput?.geopolitical_risk ?? risk.geopolitical_risk,
      supply_chain_risk: customInput?.supply_chain_risk ?? risk.supply_chain_risk,
      regulatory_risk: customInput?.regulatory_risk ?? risk.regulatory_risk,
      esg_risk: customInput?.esg_risk ?? risk.esg_risk,
      producer_concentration: customInput?.producer_concentration ?? risk.producer_concentration,
      
      // Strategic Value
      military_importance: customInput?.military_importance ?? valuation.military_importance,
      industrial_importance: customInput?.industrial_importance ?? valuation.industrial_importance
    };

    // 4. Calculate final versioned mathematical scores (Single Source of Truth)
    const result = RawMaterialsScoringService.scoreMaterial(unifiedInput);

    // 5. Append agent qualitative insights to the output reasoning array
    const mergedReasoning = [
      ...result.reasoning,
      `[Geologie & Fundamente] ${fundamentals.explanation}`,
      `[Risiko & Kette] ${risk.explanation}`,
      `[Strategie & Relevanz] ${valuation.explanation}`
    ];

    return {
      ...result,
      classification: {
        ...result.classification,
        category_main: classification.category_main,
        category_sub: classification.category_sub,
        market_type: classification.market_type,
        valuation_mode: classification.valuation_mode,
        // blend confidence based on classification agent confidence
        confidence: Number(((result.classification.confidence + classification.confidence) / 2).toFixed(2))
      },
      reasoning: mergedReasoning
    };
  }
}
