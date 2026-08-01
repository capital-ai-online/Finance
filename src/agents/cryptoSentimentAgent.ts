/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import type Anthropic from '@anthropic-ai/sdk';
import { generateStructuredWithFallback } from '../services/agentModelRouting';

export interface CryptoSentimentMetrics {
  social_velocity: number;      // 0.0 to 1.0
  narrative_strength: number;   // 0.0 to 1.0
  news_momentum: number;        // 0.0 to 1.0
  explanation: string;
}

export class CryptoSentimentAgent {
  private ai: GoogleGenAI | null;
  private anthropic: Anthropic | null;

  constructor(aiClient: GoogleGenAI | null, anthropicClient: Anthropic | null = null) {
    this.ai = aiClient;
    this.anthropic = anthropicClient;
  }

  public async analyze(coin: string): Promise<CryptoSentimentMetrics> {
    const result = await generateStructuredWithFallback({
      gemini: this.ai,
      anthropic: this.anthropic,
      promptId: 'crypto-sentiment',
      geminiModels: ['gemini-2.5-flash'],
      contents: `Analysiere die Marktstimmung und virale Dynamik für: "${coin}".
Schätze die Social-Media-Geschwindigkeit, die fundamentale Narrativstärke und das Momentum aktueller Nachrichtenmeldungen ein.
Antworte strictly mit einem strukturierten JSON.`,
      systemInstruction: `Du bist der "Crypto Sentiment Agent" der CAPITAL-AI Analyseplattform.
Deine Mission ist es, globale Foren, Nachrichtenströme und soziale Medien quantitativ auszuwerten.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
      schema: {
        type: Type.OBJECT,
        properties: {
          social_velocity: { type: Type.NUMBER },
          narrative_strength: { type: Type.NUMBER },
          news_momentum: { type: Type.NUMBER },
          explanation: { type: Type.STRING }
        },
        required: ['social_velocity', 'narrative_strength', 'news_momentum', 'explanation']
      },
    });

    if (!result) {
      return this.getFallback(coin);
    }

    const data = result.data;
    return {
      social_velocity: typeof data.social_velocity === 'number' ? data.social_velocity : 0.60,
      narrative_strength: typeof data.narrative_strength === 'number' ? data.narrative_strength : 0.55,
      news_momentum: typeof data.news_momentum === 'number' ? data.news_momentum : 0.50,
      explanation: data.explanation || 'Solides, stabiles Markt- und Newsinhalt-Volumen.'
    };
  }

  private getFallback(coin: string): CryptoSentimentMetrics {
    const s = coin.toUpperCase().trim();
    if (s === 'BTC') {
      return {
        social_velocity: 0.95,
        narrative_strength: 0.98,
        news_momentum: 0.85,
        explanation: 'Bitcoin profitiert von einem dominanten, langlebigen Narrativ als makroökonomischer Hedge.'
      };
    }
    return {
      social_velocity: 0.55,
      narrative_strength: 0.50,
      news_momentum: 0.50,
      explanation: 'Moderate Erwähnungen ohne akuten viralen Ausbruch.'
    };
  }
}
