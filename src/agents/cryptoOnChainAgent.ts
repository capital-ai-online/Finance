/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type, type AiGenerationClient } from '../services/aiSchema';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { generateStructuredWithFallback } from '../services/agentModelRouting';

export interface CryptoOnChainMetrics {
  active_addresses_growth: number; // 0.0 to 1.0
  transaction_velocity: number;    // 0.0 to 1.0
  whale_accumulation: number;      // 0.0 to 1.0
  explanation: string;
}

export class CryptoOnChainAgent {
  private ai: AiGenerationClient | null;
  private anthropic: Anthropic | null;
  private openai: OpenAI | null;

  constructor(aiClient: AiGenerationClient | null, anthropicClient: Anthropic | null = null, openaiClient: OpenAI | null = null) {
    this.ai = aiClient;
    this.anthropic = anthropicClient;
    this.openai = openaiClient;
  }

  public async analyze(coin: string): Promise<CryptoOnChainMetrics> {
    const result = await generateStructuredWithFallback({
      gemini: this.ai,
      anthropic: this.anthropic,
      openai: this.openai,
      promptId: 'crypto-onchain',
      geminiModels: ['gemini-2.5-flash'],
      contents: `Analysiere die hypothetischen On-Chain-Metriken für die Kryptowährung: "${coin}".
Schätze das Wachstum aktiver Adressen, die Transaktionsgeschwindigkeit und die Akkumulation von Walen (Smart Money).
Antworte strictly mit einem strukturierten JSON.`,
      systemInstruction: `Du bist der "Crypto On-Chain Agent" von CAPITAL-AI.
Deine Aufgabe ist es, die Gesundheit von Blockchain-Netzwerken und Token-Umläufen zu bewerten.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
      schema: {
        type: Type.OBJECT,
        properties: {
          active_addresses_growth: { type: Type.NUMBER },
          transaction_velocity: { type: Type.NUMBER },
          whale_accumulation: { type: Type.NUMBER },
          explanation: { type: Type.STRING }
        },
        required: ['active_addresses_growth', 'transaction_velocity', 'whale_accumulation', 'explanation']
      },
    });

    if (!result) {
      return this.getFallback(coin);
    }

    const data = result.data;
    return {
      active_addresses_growth: typeof data.active_addresses_growth === 'number' ? data.active_addresses_growth : 0.65,
      transaction_velocity: typeof data.transaction_velocity === 'number' ? data.transaction_velocity : 0.60,
      whale_accumulation: typeof data.whale_accumulation === 'number' ? data.whale_accumulation : 0.55,
      explanation: data.explanation || 'On-chain Kennzahlen im gesunden Standardbereich.'
    };
  }

  private getFallback(coin: string): CryptoOnChainMetrics {
    const s = coin.toUpperCase().trim();
    if (s === 'BTC') {
      return {
        active_addresses_growth: 0.88,
        transaction_velocity: 0.72,
        whale_accumulation: 0.82,
        explanation: 'Bitcoin weist robuste Akkumulation durch institutionelle Verwahrer und Spot-ETFs auf.'
      };
    }
    return {
      active_addresses_growth: 0.60,
      transaction_velocity: 0.55,
      whale_accumulation: 0.50,
      explanation: 'Normale On-chain Aktivität ohne signifikante Wallet-Zunahmen.'
    };
  }
}
