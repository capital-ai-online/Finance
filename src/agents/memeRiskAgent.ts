/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';

export interface MemeRiskAssessment {
  spread_penalty: number;        // 0.0 to 1.0 (Higher is higher penalty/risk)
  liquidity_penalty: number;     // 0.0 to 1.0
  manipulation_penalty: number;  // 0.0 to 1.0
  rugpull_penalty: number;       // 0.0 to 1.0
  decay_penalty: number;         // 0.0 to 1.0
  explanation: string;
}

export class MemeRiskAgent {
  private ai: GoogleGenAI | null;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  public async analyze(coin: string): Promise<MemeRiskAssessment> {
    if (!this.ai) {
      return this.getFallback(coin);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analysiere die inhärenten Risiken des Memecoins: "${coin}".
Schätze folgende Faktoren: Spread-Verluste, Liquiditätsrisiko, Manipulationsverdacht (Wash Trading / Sniper), Rugpull-Gefahr (Zentralisierung) und Zinsabfall (Hype-Abflachung).
Antworte strictly mit einem strukturierten JSON.`,
        config: {
          systemInstruction: `Du bist der "Meme Risk Agent" von CAPITAL-AI.
Deine primäre Aufgabe ist es, betrügerische Kontrakte, Snipe-Adressen, gesperrte Liquiditäten und Community-Interessenszerfall zu bewerten.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spread_penalty: { type: Type.NUMBER },
              liquidity_penalty: { type: Type.NUMBER },
              manipulation_penalty: { type: Type.NUMBER },
              rugpull_penalty: { type: Type.NUMBER },
              decay_penalty: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            },
            required: ['spread_penalty', 'liquidity_penalty', 'manipulation_penalty', 'rugpull_penalty', 'decay_penalty', 'explanation']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      return {
        spread_penalty: typeof data.spread_penalty === 'number' ? data.spread_penalty : 0.03,
        liquidity_penalty: typeof data.liquidity_penalty === 'number' ? data.liquidity_penalty : 0.03,
        manipulation_penalty: typeof data.manipulation_penalty === 'number' ? data.manipulation_penalty : 0.04,
        rugpull_penalty: typeof data.rugpull_penalty === 'number' ? data.rugpull_penalty : 0.02,
        decay_penalty: typeof data.decay_penalty === 'number' ? data.decay_penalty : 0.03,
        explanation: data.explanation || 'Reguläre Memecoin-Risikoparameter ohne unmittelbare Ausfälle.'
      };
    } catch (e) {
      console.warn(`[MemeRiskAgent] Execution failed. Falling back.`, e);
      return this.getFallback(coin);
    }
  }

  private getFallback(coin: string): MemeRiskAssessment {
    const s = coin.toUpperCase().trim();
    if (s === 'PEPE' || s === 'DOGE' || s === 'SHIB') {
      return {
        spread_penalty: 0.01,
        liquidity_penalty: 0.01,
        manipulation_penalty: 0.02,
        rugpull_penalty: 0.00,
        decay_penalty: 0.01,
        explanation: 'Keine rugpull_penalty vorhanden. Sehr tiefe Pools und exzellente Smart Contract Verteilung.'
      };
    }
    return {
      spread_penalty: 0.05,
      liquidity_penalty: 0.04,
      manipulation_penalty: 0.06,
      rugpull_penalty: 0.04,
      decay_penalty: 0.05,
      explanation: 'Erhöhte Abverkaufs- und Liquiditätsengpass-Risiken vorhanden.'
    };
  }
}
