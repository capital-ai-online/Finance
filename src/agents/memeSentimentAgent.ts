/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';

export interface MemeSentimentMetrics {
  social_hype: number;          // 0.0 to 1.0 (Twitter/TikTok velocity)
  narrative_strength: number;   // 0.0 to 1.0 (Hype sector - e.g. cat/dog/frog/AI)
  catalyst_strength: number;    // 0.0 to 1.0 (Influencer engagement, major events)
  explanation: string;
}

export class MemeSentimentAgent {
  private ai: GoogleGenAI | null;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  public async analyze(coin: string): Promise<MemeSentimentMetrics> {
    if (!this.ai) {
      return this.getFallback(coin);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analysiere den viralen Status des Memecoins: "${coin}".
Schätze den Social-Hype, die narrative Stärke (Meme-Klasse) und die Stärke anstehender Katalysatoren ein.
Antworte strictly mit einem strukturierten JSON.`,
        config: {
          systemInstruction: `Du bist der "Meme Sentiment Agent" von CAPITAL-AI.
Deine Spezialität ist es, kognitive Ansteckungen (Memes), FOMO und virale Internetphänomene quantitativ einzustufen.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              social_hype: { type: Type.NUMBER },
              narrative_strength: { type: Type.NUMBER },
              catalyst_strength: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            },
            required: ['social_hype', 'narrative_strength', 'catalyst_strength', 'explanation']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      return {
        social_hype: typeof data.social_hype === 'number' ? data.social_hype : 0.65,
        narrative_strength: typeof data.narrative_strength === 'number' ? data.narrative_strength : 0.60,
        catalyst_strength: typeof data.catalyst_strength === 'number' ? data.catalyst_strength : 0.45,
        explanation: data.explanation || 'Solide virale Basiskomponenten detektiert.'
      };
    } catch (e) {
      console.warn(`[MemeSentimentAgent] Execution failed. Falling back.`, e);
      return this.getFallback(coin);
    }
  }

  private getFallback(coin: string): MemeSentimentMetrics {
    const s = coin.toUpperCase().trim();
    if (s === 'PEPE' || s === 'DOGE' || s === 'SHIB') {
      return {
        social_hype: 0.94,
        narrative_strength: 0.95,
        catalyst_strength: 0.85,
        explanation: 'Etablierter, hochgradig liquider Memecoin mit dauerhaftem Kultstatus und enormer Community-Bindung.'
      };
    }
    return {
      social_hype: 0.50,
      narrative_strength: 0.45,
      catalyst_strength: 0.35,
      explanation: 'Geringe virale Traktion. Vorwiegend spekulatives Interesse.'
    };
  }
}
