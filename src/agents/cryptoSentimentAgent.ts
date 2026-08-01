/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { trackedGenerateContent } from '../services/aiUsageTracker';

export interface CryptoSentimentMetrics {
  social_velocity: number;      // 0.0 to 1.0
  narrative_strength: number;   // 0.0 to 1.0
  news_momentum: number;        // 0.0 to 1.0
  explanation: string;
}

export class CryptoSentimentAgent {
  private ai: GoogleGenAI | null;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  public async analyze(coin: string): Promise<CryptoSentimentMetrics> {
    if (!this.ai) {
      return this.getFallback(coin);
    }

    try {
      const response = await trackedGenerateContent(this.ai, {
        model: 'gemini-2.5-flash',
        contents: `Analysiere die Marktstimmung und virale Dynamik für: "${coin}".
Schätze die Social-Media-Geschwindigkeit, die fundamentale Narrativstärke und das Momentum aktueller Nachrichtenmeldungen ein.
Antworte strictly mit einem strukturierten JSON.`,
        config: {
          systemInstruction: `Du bist der "Crypto Sentiment Agent" der CAPITAL-AI Analyseplattform.
Deine Mission ist es, globale Foren, Nachrichtenströme und soziale Medien quantitativ auszuwerten.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              social_velocity: { type: Type.NUMBER },
              narrative_strength: { type: Type.NUMBER },
              news_momentum: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            },
            required: ['social_velocity', 'narrative_strength', 'news_momentum', 'explanation']
          }
        }
      }, { promptId: 'crypto-sentiment' });

      const data = JSON.parse(response.text || '{}');
      return {
        social_velocity: typeof data.social_velocity === 'number' ? data.social_velocity : 0.60,
        narrative_strength: typeof data.narrative_strength === 'number' ? data.narrative_strength : 0.55,
        news_momentum: typeof data.news_momentum === 'number' ? data.news_momentum : 0.50,
        explanation: data.explanation || 'Solides, stabiles Markt- und Newsinhalt-Volumen.'
      };
    } catch (e) {
      console.warn(`[CryptoSentimentAgent] Failed to analyze sentiment. Falling back.`, e);
      return this.getFallback(coin);
    }
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
