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
import {
  computeCompositeDataQuality,
  computeUnifiedConfidence,
  COMPOSITE_DATA_QUALITY_VERSION,
} from '../platform/MarketData/CompositeDataQuality';
import { generateCryptoScores, calculateBaseScore, calculateDefiScore, calculateValueCorridor } from '../services/scoring.service';
import { calculateRankScore, isTop10Eligible } from '../services/ranking.service';
import { CryptoCategory, CryptoSubCategory, CryptoTier, CryptoClassification, CryptoScores, CryptoAnalysisPayload } from '../types/crypto.types';
import { updateAgentActivity } from '../../server/systemEvents';

export class CryptoOrchestrator {
  private ai: AiGenerationClient | null;
  private classificationAgent: CryptoClassificationAgent;
  private onChainAgent: CryptoOnChainAgent;
  private sentimentAgent: CryptoSentimentAgent;
  private riskAgent: CryptoRiskAgent;

  // Audit ARCH-AUDIT-0002 (J3/J3-Folge, Kapitel 14.6): optionale Anthropic-/OpenAI-Clients
  // fuer den providerübergreifenden Rückfall - ohne konfigurierten Client (Standardwert null)
  // ruckt die Kette einfach zur naechsten Stufe durch.
  constructor(aiClient: AiGenerationClient | null, anthropicClient: Anthropic | null = null, openaiClient: OpenAI | null = null) {
    this.ai = aiClient;
    this.classificationAgent = new CryptoClassificationAgent(aiClient, anthropicClient, openaiClient);
    this.onChainAgent = new CryptoOnChainAgent(aiClient, anthropicClient, openaiClient);
    this.sentimentAgent = new CryptoSentimentAgent(aiClient, anthropicClient, openaiClient);
    this.riskAgent = new CryptoRiskAgent(aiClient, anthropicClient, openaiClient);
  }

  /**
   * Coordinates the multi-agent pipeline for standard/enterprise cryptocurrencies,
   * blending AI inputs with the new, official deterministic Standard & DeFi scoring models.
   *
   * SC-1 (SC-MD-SPT-0001): classification exits only via classificationAdapter
   * (adaptAgent → ensureCanonical deterministic → mergeDeterministicAndAgent).
   * No free-text category values remain on the ranking payload path.
   */
  public async analyzeCrypto(coin: string, customInput?: Partial<CryptoScores>): Promise<CryptoAnalysisPayload> {
    const symbol = coin.toUpperCase().trim();
    console.log(`[Crypto Orchestrator] Initializing high-fidelity multi-agent pipeline for: "${symbol}"`);

    // Live update agent statuses on Master Supervisor
    updateAgentActivity('ag_scanner', `Klassifiziert ${symbol} und sammelt Marktstimmung`, true);
    updateAgentActivity('ag_allocator', `Analysiert On-Chain Metriken für ${symbol}`, true);
    updateAgentActivity('ag_risk', `Berechnet Risiko-Koeffizienten für ${symbol}`, true);

    let agentClassificationRaw, onchain, sentiment, risk;
    try {
      // 1. Run Classification, On-Chain metrics, Sentiment, and Risk Agents in parallel
      [agentClassificationRaw, onchain, sentiment, risk] = await Promise.all([
        this.classificationAgent.analyze(symbol),
        this.onChainAgent.analyze(symbol),
        this.sentimentAgent.analyze(symbol),
        this.riskAgent.analyze(symbol)
      ]);
    } finally {
      // Reset statuses to idle after completing tasks
      updateAgentActivity('ag_scanner', `Keine aktive Aufgabe`, false);
      updateAgentActivity('ag_allocator', `Keine aktive Aufgabe`, false);
      updateAgentActivity('ag_risk', `Keine aktive Aufgabe`, false);
    }

    // 2. Fetch registry asset name or use default fallback
    const asset = assetRegistry.getAsset(symbol);
    const assetName = asset ? asset.name : symbol;

    // 3. SC-1 single classification exit: deterministic + adapted agent → merge
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

    // 4. Resolve real-data-backed seed scores
    const seedScores = await generateCryptoScores(symbol, asset ? asset.change24h : 0.0);

    // 5. Construct composite scoring inputs, blending AI agent qualitative observations with
    // real-data-backed market scores (seedScores) and custom overrides. Felder ohne reale
    // Quelle fuer dieses Asset bleiben undefined (kein Fallback auf einen Schaetzwert) -
    // renormalizeAndScore() in scoring.service.ts schliesst sie dynamisch aus der
    // Gewichtung aus.
    const scores: CryptoScores = {
      marketCap: customInput?.marketCap ?? seedScores.marketCap,
      liquidity: customInput?.liquidity ?? seedScores.liquidity,
      tokenomics: customInput?.tokenomics ?? seedScores.tokenomics,
      supplyTransparency: customInput?.supplyTransparency ?? seedScores.supplyTransparency,
      volatility: customInput?.volatility ?? seedScores.volatility,

      // Inject On-Chain / Risk agent insights
      networkActivity: customInput?.networkActivity ?? Math.round(onchain.active_addresses_growth * 100),
      security: customInput?.security ?? Math.round((1.0 - risk.manipulation_index) * 100),

      // Inject Sentiment agent insights
      utility: customInput?.utility ?? Math.round(sentiment.narrative_strength * 100),
      adoption: customInput?.adoption ?? Math.round(sentiment.social_velocity * 100),
      risk: customInput?.risk ?? Math.round(risk.manipulation_index * 100),
      sentiment: customInput?.sentiment ?? Math.round(sentiment.news_momentum * 100),
    };

    // Audit ARCH-AUDIT-0002 (AUD2-F-001, S1/S2/S5, Kapitel 6): von den 11 Score-
    // Eingangsgroessen stammen 6 aus echten LLM-Agenten-Analysen (onChainAgent,
    // sentimentAgent, riskAgent) und 5 aus realen Marktdaten (seedScores =
    // generateCryptoScores(), AssetRegistry/CoinGecko) - sofern nicht per customInput
    // ueberschrieben. Die vormals 12 Zeichen-Hash-Felder ohne belastbare Quelle wurden
    // entfernt (siehe CryptoScores in types/crypto.types.ts).
    const AGENT_DERIVED_FIELDS = ['networkActivity', 'security', 'utility', 'adoption', 'risk', 'sentiment'] as const;
    const REAL_MARKET_FIELDS = ['marketCap', 'liquidity', 'tokenomics', 'supplyTransparency', 'volatility'] as const;
    const scoreFieldBasis: Record<string, 'agent-derived' | 'real' | 'user-adjusted'> = {};
    for (const field of AGENT_DERIVED_FIELDS) {
      scoreFieldBasis[field] = (customInput && field in customInput) ? 'user-adjusted' : 'agent-derived';
    }
    for (const field of REAL_MARKET_FIELDS) {
      scoreFieldBasis[field] = (customInput && field in customInput) ? 'user-adjusted' : 'real';
    }

    // SC-3 foundation observation only (rankingImpactEnabled remains false)
    const presentScoreFields = Object.keys(scores).filter(
      (k) => scores[k as keyof CryptoScores] !== undefined && scores[k as keyof CryptoScores] !== null,
    );
    const composite = computeCompositeDataQuality({
      sourceCoverage: presentScoreFields.length / 11,
      supplyTransparency:
        typeof scores.supplyTransparency === 'number'
          ? scores.supplyTransparency / 100
          : null,
      providerCount: asset ? 1 : 0,
      outlierDetected: risk.manipulation_index > 0.6,
    });
    const unifiedConfidence = computeUnifiedConfidence({
      baseConfidence: classification.confidence,
      composite,
      providerCount: asset ? 1 : 0,
    });

    const payload: CryptoAnalysisPayload = {
      asset_name: assetName,
      symbol,
      classification,
      scores,
      data_quality: {
        level: composite.level === 'unknown'
          ? (risk.manipulation_index > 0.4 ? 'medium' : 'high')
          : composite.level,
        missing_fields: composite.missingFactors,
      },
    };

    // 6. Compute scores using the high-fidelity scoring engines
    const finalScores = categoryMain === 'DeFi'
      ? calculateDefiScore(payload)
      : calculateBaseScore(payload);

    // 7. Calculate value corridor and rank metrics
    const valueCorridor = calculateValueCorridor(finalScores.final_score ?? 0, asset ? asset.price : undefined);
    const rankScore = calculateRankScore(payload, finalScores.final_score ?? 0);
    const eligibleForTop10 = isTop10Eligible({
      ...payload,
      scores: finalScores
    });

    // 8. Build consolidated reasoning trail
    const mergedReasoning = [
      `[Klassifikation/${CLASSIFICATION_ADAPTER_VERSION}] Hauptkategorie: ${categoryMain}, Unterklasse: ${categorySub}, Tier: ${tier}, conf=${classification.confidence}.`,
      `[Netzwerk-Aktivität] ${onchain.explanation}`,
      `[Markt-Sentiment] ${sentiment.explanation}`,
      `[Systemisches Risiko] ${risk.explanation}`,
      `[Valuation Autopilot] Modell: ${categoryMain === 'DeFi' ? 'DeFi-Cashflow-Modell' : 'Krypto-Basis-Modell'}, Final Score: ${(finalScores.final_score ?? 0).toFixed(1)}/100`,
      `[Top 10 Status] Eignung: ${eligibleForTop10 ? "Zugelassen (Rank Score: " + rankScore.toFixed(1) + ")" : "Nicht zugelassen (unzureichende Liquidität oder Datenqualität)"}`,
      `[SC-3/${COMPOSITE_DATA_QUALITY_VERSION}] composite=${composite.score ?? 'n/a'} level=${composite.level}; unifiedConf=${unifiedConfidence.confidence} (scoreImpactEnabled=false)`,
    ];

    return {
      asset_name: assetName,
      symbol,
      classification,
      scores: finalScores,
      data_quality: {
        level: classification.confidence >= 0.8 && composite.level === 'high'
          ? 'high'
          : composite.level === 'low'
            ? 'low'
            : 'medium',
        missing_fields: composite.missingFactors,
      },
      reasoning: mergedReasoning,
      scoreFieldBasis
    };
  }
}
export default CryptoOrchestrator;
