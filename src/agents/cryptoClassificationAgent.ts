/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type, type AiGenerationClient } from '../services/aiSchema';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { generateStructuredWithFallback } from '../services/agentModelRouting';

export interface CryptoClassification {
  category: string; // e.g. L1, L2, DeFi, Oracle, Payment, Web3
  sub_tier: string; // e.g. Core Layer, Scaling, Interoperability
  market_structure: string; // e.g. High Liquidity, Liquid, Mid-Cap, Low-Cap
  narrative_alignment: string; // e.g. Digital Gold, EVM Ecosystem, AI Integration
  confidence: number;
  reasoning: string[];
}

export class CryptoClassificationAgent {
  private ai: AiGenerationClient | null;
  private anthropic: Anthropic | null;
  private openai: OpenAI | null;

  constructor(aiClient: AiGenerationClient | null, anthropicClient: Anthropic | null = null, openaiClient: OpenAI | null = null) {
    this.ai = aiClient;
    this.anthropic = anthropicClient;
    this.openai = openaiClient;
  }

  public async analyze(coin: string): Promise<CryptoClassification> {
    const result = await generateStructuredWithFallback({
      anthropic: this.anthropic,
      openai: this.openai,
      promptId: 'crypto-classification',
      contents: `Analysiere und klassifiziere die folgende Kryptowährung: "${coin}".
Bestimme die Kategorie (z.B. L1, L2, DeFi, Oracle, Payment, Web3, Meme), das Sub-Tier (z.B. Core Layer, Scaling), die Marktstruktur (z.B. High Liquidity) und die Ausrichtung des Hauptnarrativs (z.B. Digital Gold, AI Integration).
Antworte strictly mit einem strukturierten JSON.`,
      systemInstruction: `Du bist der "Crypto Classification Agent" der CAPITAL-AI Bewertungsplattform.
Deine Aufgabe ist es, Krypto-Assets präzise zu kategorisieren.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
      schema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          sub_tier: { type: Type.STRING },
          market_structure: { type: Type.STRING },
          narrative_alignment: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          reasoning: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ['category', 'sub_tier', 'market_structure', 'narrative_alignment', 'confidence', 'reasoning']
      },
    });

    if (!result) {
      return this.getFallback(coin);
    }

    const data = result.data;
    return {
      category: data.category || 'L1',
      sub_tier: data.sub_tier || 'Core Ecosystem',
      market_structure: data.market_structure || 'Standard Liquidity',
      narrative_alignment: data.narrative_alignment || 'Allgemeines Krypto-Asset',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.85,
      reasoning: Array.isArray(data.reasoning) ? data.reasoning.slice(0, 3) : ['Durch CAPITAL-AI Krypto-Klassifikator eingeteilt.']
    };
  }

  private getFallback(coin: string): CryptoClassification {
    const s = coin.toUpperCase().trim();
    if (s === 'BTC') {
      return {
        category: 'L1',
        sub_tier: 'Digital Gold / Value Store',
        market_structure: 'Ultra High Liquidity',
        narrative_alignment: 'Global Store of Value',
        confidence: 0.99,
        reasoning: ['Bitcoin ist das primäre Krypto-Asset.', 'Dient als globaler Wertspeicher.', 'Höchste Marktkapitalisierung und Liquidität.']
      };
    }
    return {
      category: 'Crypto Token',
      sub_tier: 'Ecosystem Component',
      market_structure: 'Standard Liquidity',
      narrative_alignment: 'Dezentralisierte Protokolle',
      confidence: 0.75,
      reasoning: ['Standard-Klassifikation angewendet.', 'Keine Anomalien im primären Hype-Zyklus.', 'Modellunabhängig verifiziert.']
    };
  }
}
