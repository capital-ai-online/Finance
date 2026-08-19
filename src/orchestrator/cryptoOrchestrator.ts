/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AiGenerationClient } from '../services/aiSchema';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { CryptoClassificationAgent } from '../agents/cryptoClassificationAgent';
import { CryptoOnChainAgent } from '../agents/cryptoOnChainAgent';
import { CryptoSentimentAgent } from '../agents/cryptoSentimentAgent';
import { CryptoRiskAgent } from '../agents/cryptoRiskAgent';
import { assetRegistry } from '../lib/assetRegistry';
import { ClassificationService } from '../services/classification.service';
import {
  adaptAgentClassification,
  ensureCanonicalClassification,
  mergeDeterministicAndAgentClassification,
  CLASSIFICATION_ADAPTER_VERSION,
} from '../services/classificationAdapter';
import type { CryptoCategory, CryptoSubCategory, CryptoTier, CryptoAnalysisPayload } from '../types/crypto.types';
import { updateAgentActivity } from '../../server/systemEvents';

export class CryptoOrchestrator {
  private ai: AiGenerationClient | null;
  private classificationAgent: CryptoClassificationAgent;
  private onChainAgent: CryptoOnChainAgent;
  private sentimentAgent: CryptoSentimentAgent;
  private riskAgent: CryptoRiskAgent;

  constructor(aiClient: AiGenerationClient | null, anthropicClient: Anthropic | null = null, openaiClient: OpenAI | null = null) {
    this.ai = aiClient;
    this.classificationAgent = new CryptoClassificationAgent(aiClient, anthropicClient, openaiClient);
    this.onChainAgent = new CryptoOnChainAgent(aiClient, anthropicClient, openaiClient);
    this.sentimentAgent = new CryptoSentimentAgent(aiClient, anthropicClient, openaiClient);
    this.riskAgent = new CryptoRiskAgent(aiClient, anthropicClient, openaiClient);
  }

  /**
   * SC-2 Phase C research/enrichment boundary.
   *
   * This multi-agent path intentionally produces no canonical score, rank score, eligibility
   * decision or scoring feature override. Productive financial scoring is owned exclusively by
   * ScoringDispatcher. Agent outputs remain non-score-eligible observations that may inform the
   * UI/research trail but cannot enter CanonicalScoreResult without a separately approved evidence
   * promotion contract.
   */
  public async analyzeCrypto(coin: string): Promise<CryptoAnalysisPayload> {
    const symbol = coin.toUpperCase().trim();
    console.log(`[Crypto Orchestrator] Initializing research/enrichment pipeline for: "${symbol}"`);

    updateAgentActivity('ag_scanner', `Klassifiziert ${symbol} und sammelt Marktstimmung`, true);
    updateAgentActivity('ag_allocator', `Analysiert On-Chain Metriken für ${symbol}`, true);
    updateAgentActivity('ag_risk', `Analysiert Risikoindikatoren für ${symbol}`, true);

    let agentClassificationRaw, onchain, sentiment, risk;
    try {
      [agentClassificationRaw, onchain, sentiment, risk] = await Promise.all([
        this.classificationAgent.analyze(symbol),
        this.onChainAgent.analyze(symbol),
        this.sentimentAgent.analyze(symbol),
        this.riskAgent.analyze(symbol),
      ]);
    } finally {
      updateAgentActivity('ag_scanner', 'Keine aktive Aufgabe', false);
      updateAgentActivity('ag_allocator', 'Keine aktive Aufgabe', false);
      updateAgentActivity('ag_risk', 'Keine aktive Aufgabe', false);
    }

    const asset = assetRegistry.getAsset(symbol);
    const assetName = asset ? asset.name : symbol;

    const deterministic = ensureCanonicalClassification(
      ClassificationService.classifyAsset(symbol),
    );
    const agentCanonical = adaptAgentClassification(agentClassificationRaw);
    const classification = mergeDeterministicAndAgentClassification(
      deterministic,
      agentCanonical,
    );
    const categoryMain: CryptoCategory = classification.category_main;
    const categorySub: CryptoSubCategory = classification.category_sub;
    const tier: CryptoTier = classification.tier;

    const researchSignals = {
      activeAddressesGrowth: onchain.active_addresses_growth,
      manipulationIndex: risk.manipulation_index,
      narrativeStrength: sentiment.narrative_strength,
      socialVelocity: sentiment.social_velocity,
      newsMomentum: sentiment.news_momentum,
    };

    const reasoning = [
      `[Klassifikation/${CLASSIFICATION_ADAPTER_VERSION}] Hauptkategorie: ${categoryMain}, Unterklasse: ${categorySub}, Tier: ${tier}, conf=${classification.confidence}.`,
      `[Netzwerk-Aktivität] ${onchain.explanation}`,
      `[Markt-Sentiment] ${sentiment.explanation}`,
      `[Systemisches Risiko] ${risk.explanation}`,
      '[SC-2 Phase C] Research/Enrichment only: Agenten-Ausgaben sind scoreEligible=false; CanonicalScoreResult, Ranking und Eligibility werden ausschließlich durch ScoringDispatcher erzeugt.',
    ];

    return {
      asset_name: assetName,
      symbol,
      classification,
      mode: 'research-enrichment',
      scoreEligible: false,
      researchSignals,
      researchFieldBasis: {
        activeAddressesGrowth: 'agent-derived',
        manipulationIndex: 'agent-derived',
        narrativeStrength: 'agent-derived',
        socialVelocity: 'agent-derived',
        newsMomentum: 'agent-derived',
      },
      data_quality: {
        level: 'unknown',
        missing_fields: [],
      },
      reasoning,
    };
  }
}

export default CryptoOrchestrator;
