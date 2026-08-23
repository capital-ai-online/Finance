/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AiGenerationClient } from '../services/aiSchema';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import type { Classification } from '../types/rawMaterials';
import { ClassificationAgent } from '../agents/classificationAgent';
import { FundamentalsAgent, type FundamentalsAnalysis } from '../agents/fundamentalsAgent';
import { RiskAgent, type RiskAnalysis } from '../agents/riskAgent';
import { ValuationAgent, type StrategicAnalysis } from '../agents/valuationAgent';
import type { CommodityMarketEvidence } from '../services/commodityMarketEvidence';
import type { CommodityOfficialEvidenceBundle } from '../services/commodityOfficialEvidence';
import { composeCommodityResearchFeatureSnapshot } from '../services/commodityResearchEvidenceComposer';
import {
  createUniversalAssetIdentity,
  evaluateCommodityCategoryResearchSnapshot,
  isCommodityResearchInstrumentKind,
  type CommodityCategoryResearchEvaluation,
  type CommodityResearchFeatureObservation,
  type CommodityResearchFeatureSnapshot,
  type UniversalAssetIdentity,
  type UniversalAssetSource,
} from '../platform/Scoring';
import {
  orchestratorAgentRuntimeProjection,
  type OrchestratorAgentDescriptor,
} from './agentRuntimeProjection';

export const RAW_MATERIALS_RESEARCH_ORCHESTRATOR_CONTRACT_VERSION =
  'raw-materials-research-orchestrator/1.0.0' as const;
export const RAW_MATERIALS_SOURCE_BACKED_RESEARCH_CONTRACT_VERSION =
  'raw-materials-source-backed-research/1.0.0' as const;

/**
 * Explicit authority boundary for the commodity/raw-materials orchestrator.
 *
 * This runtime may classify assets and assemble qualitative/agent research context only. It is
 * intentionally unable to produce a canonical score, select a productive scoring model or grant
 * execution eligibility. Productive commodity scoring remains exclusively behind
 * ScoringModelRegistry -> ScoringDispatcher -> registered commodity executor.
 */
export const RAW_MATERIALS_RESEARCH_AUTHORITY = Object.freeze({
  semantic: 'RESEARCH_CONTEXT_ONLY' as const,
  canonical: false as const,
  scoreEligible: false as const,
  scoringAuthority: false as const,
  executionAuthority: false as const,
  evidenceStatus: 'UNVERIFIED_AGENT_RESEARCH' as const,
});

export interface RawMaterialsResearchContext {
  contractVersion: typeof RAW_MATERIALS_RESEARCH_ORCHESTRATOR_CONTRACT_VERSION;
  rawMaterial: string;
  authority: typeof RAW_MATERIALS_RESEARCH_AUTHORITY;
  classification: Classification;
  research: {
    fundamentals: FundamentalsAnalysis;
    risk: RiskAnalysis;
    strategicValuation: StrategicAnalysis;
  };
  reasoning: string[];
}

export interface RawMaterialsSourceBackedResearchContext {
  contractVersion: typeof RAW_MATERIALS_SOURCE_BACKED_RESEARCH_CONTRACT_VERSION;
  authority: typeof RAW_MATERIALS_RESEARCH_AUTHORITY;
  asset: UniversalAssetIdentity;
  featureSnapshot: CommodityResearchFeatureSnapshot;
  challengerEvaluation: CommodityCategoryResearchEvaluation;
  canonical: false;
  scoreEligible: false;
  executionEligible: false;
}

export interface RawMaterialsSourceBackedResearchInput {
  symbol: string;
  name?: string;
  subtype?: string;
  instrumentKind?: string;
  source?: UniversalAssetSource;
  marketEvidence?: CommodityMarketEvidence | null;
  officialEvidence?: readonly CommodityOfficialEvidenceBundle[];
  additionalVerifiedObservations?: readonly CommodityResearchFeatureObservation[];
  nowMs?: number;
}

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
  private classificationAgent: ClassificationAgent;
  private fundamentalsAgent: FundamentalsAgent;
  private riskAgent: RiskAgent;
  private valuationAgent: ValuationAgent;

  // Audit ARCH-AUDIT-0002 (J3/J3-Folge, Kapitel 14.6): optionale Anthropic-/OpenAI-Clients
  // fuer den provideruebergreifenden Rueckfall - ohne konfigurierten Client (Standardwert null)
  // rueckt die Kette einfach zur naechsten Stufe durch.
  constructor(aiClient: AiGenerationClient | null, anthropicClient: Anthropic | null = null, openaiClient: OpenAI | null = null) {
    this.classificationAgent = new ClassificationAgent(aiClient, anthropicClient, openaiClient);
    this.fundamentalsAgent = new FundamentalsAgent(aiClient, anthropicClient, openaiClient);
    this.riskAgent = new RiskAgent(aiClient, anthropicClient, openaiClient);
    this.valuationAgent = new ValuationAgent(aiClient, anthropicClient, openaiClient);
    orchestratorAgentRuntimeProjection.registerMany(RAW_MATERIALS_ORCHESTRATOR_AGENT_DESCRIPTORS);
  }

  /**
   * Composes raw-material research context from specialized agents.
   *
   * Numeric values emitted by the agents are research annotations only. They are not provider
   * evidence and MUST NOT be promoted to CanonicalScoreResult, ranking eligibility, trading or
   * execution authority. Canonical commodity scoring is performed only by ScoringDispatcher.
   */
  public async analyzeMaterial(name: string): Promise<RawMaterialsResearchContext> {
    console.log(`[Raw Materials Research Orchestrator] Initializing research pipeline for: "${name}"`);

    orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.classification', `Klassifiziert Rohstoff ${name}`, true);
    orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.fundamentals', `Analysiert fundamentale Faktoren fuer ${name}`, true);
    orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.risk', `Analysiert geopolitische und makrooekonomische Risiken fuer ${name}`, true);
    orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.valuation', `Analysiert strategische Bewertung fuer ${name}`, true);

    let classification: Classification;
    let fundamentals: FundamentalsAnalysis;
    let risk: RiskAnalysis;
    let strategicValuation: StrategicAnalysis;
    try {
      [classification, fundamentals, risk, strategicValuation] = await Promise.all([
        this.classificationAgent.analyze(name),
        this.fundamentalsAgent.analyze(name),
        this.riskAgent.analyze(name),
        this.valuationAgent.analyze(name),
      ]);
    } finally {
      orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.classification', 'Keine aktive Aufgabe', false);
      orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.fundamentals', 'Keine aktive Aufgabe', false);
      orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.risk', 'Keine aktive Aufgabe', false);
      orchestratorAgentRuntimeProjection.updateActivity('rawmaterials.valuation', 'Keine aktive Aufgabe', false);
    }

    return {
      contractVersion: RAW_MATERIALS_RESEARCH_ORCHESTRATOR_CONTRACT_VERSION,
      rawMaterial: name,
      authority: RAW_MATERIALS_RESEARCH_AUTHORITY,
      classification,
      research: {
        fundamentals,
        risk,
        strategicValuation,
      },
      reasoning: [
        ...classification.reasoning,
        `[Geologie & Fundamente] ${fundamentals.explanation}`,
        `[Risiko & Kette] ${risk.explanation}`,
        `[Strategie & Relevanz] ${strategicValuation.explanation}`,
      ],
    };
  }

  /**
   * P1 source-backed composition boundary for Commodity challengers.
   *
   * Provider adapters acquire/validate evidence before calling this method. The orchestrator binds
   * that evidence to UAI, composes the domain FeatureSnapshot and evaluates deterministic research
   * readiness. It does not fetch arbitrary provider data, execute weight hypotheses, emit a
   * CanonicalScoreResult or bypass ScoringDispatcher.
   */
  public composeSourceBackedResearch(
    input: RawMaterialsSourceBackedResearchInput,
  ): RawMaterialsSourceBackedResearchContext {
    const asset = createUniversalAssetIdentity({
      symbol: input.symbol,
      name: input.name,
      assetClass: 'commodity',
      subtype: input.subtype,
      instrumentKind: input.instrumentKind,
      source: input.source ?? 'request',
    });
    if (!isCommodityResearchInstrumentKind(asset.instrumentKind)) {
      throw new Error(`COMMODITY_RESEARCH_UNSUPPORTED_INSTRUMENT_KIND:${asset.instrumentKind ?? 'missing'}`);
    }

    const featureSnapshot = composeCommodityResearchFeatureSnapshot({
      assetId: asset.assetId,
      symbol: asset.symbol,
      instrumentKind: asset.instrumentKind,
      marketEvidence: input.marketEvidence,
      officialEvidence: input.officialEvidence,
      additionalVerifiedObservations: input.additionalVerifiedObservations,
      nowMs: input.nowMs,
    });
    const challengerEvaluation = evaluateCommodityCategoryResearchSnapshot(featureSnapshot);

    return Object.freeze({
      contractVersion: RAW_MATERIALS_SOURCE_BACKED_RESEARCH_CONTRACT_VERSION,
      authority: RAW_MATERIALS_RESEARCH_AUTHORITY,
      asset,
      featureSnapshot,
      challengerEvaluation,
      canonical: false,
      scoreEligible: false,
      executionEligible: false,
    });
  }
}
