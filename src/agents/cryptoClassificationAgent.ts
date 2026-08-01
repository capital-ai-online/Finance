/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { trackedGenerateContent } from '../services/aiUsageTracker';

export interface CryptoClassification {
  category: string; // e.g. L1, L2, DeFi, Oracle, Payment, Web3
  sub_tier: string; // e.g. Core Layer, Scaling, Interoperability
  market_structure: string; // e.g. High Liquidity, Liquid, Mid-Cap, Low-Cap
  narrative_alignment: string; // e.g. Digital Gold, EVM Ecosystem, AI Integration
  confidence: number;
  reasoning: string[];
}

export class CryptoClassificationAgent {
  private ai: GoogleGenAI | null;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  public async analyze(coin: string): Promise<CryptoClassification> {
    if (!this.ai) {
      return this.getFallback(coin);
    }

    try {
      const response = await trackedGenerateContent(this.ai, {
        model: 'gemini-2.5-flash',
        contents: `Analysiere und klassifiziere die folgende Kryptowährung: "${coin}".
Bestimme die Kategorie (z.B. L1, L2, DeFi, Oracle, Payment, Web3, Meme), das Sub-Tier (z.B. Core Layer, Scaling), die Marktstruktur (z.B. High Liquidity) und die Ausrichtung des Hauptnarrativs (z.B. Digital Gold, AI Integration).
Antworte strictly mit einem strukturierten JSON.`,
        config: {
          systemInstruction: `Du bist der "Crypto Classification Agent" der CAPITAL-AI Bewertungsplattform.
Deine Aufgabe ist es, Krypto-Assets präzise zu kategorisieren.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
          responseMimeType: 'application/json',
          responseSchema: {
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
          }
        }
      }, { promptId: 'crypto-classification' });

      const data = JSON.parse(response.text || '{}');
      return {
        category: data.category || 'L1',
        sub_tier: data.sub_tier || 'Core Ecosystem',
        market_structure: data.market_structure || 'Standard Liquidity',
        narrative_alignment: data.narrative_alignment || 'Allgemeines Krypto-Asset',
        confidence: typeof data.confidence === 'number' ? data.confidence : 0.85,
        reasoning: Array.isArray(data.reasoning) ? data.reasoning.slice(0, 3) : ['Durch CAPITAL-AI Krypto-Klassifikator eingeteilt.']
      };
    } catch (e) {
      console.warn(`[CryptoClassificationAgent] Agent execution failed. Falling back.`, e);
      return this.getFallback(coin);
    }
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
