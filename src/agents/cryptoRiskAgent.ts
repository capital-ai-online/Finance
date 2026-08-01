/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { trackedGenerateContent } from '../services/aiUsageTracker';

export interface CryptoRiskAssessment {
  manipulation_index: number;       // 0.0 to 1.0 (Higher is higher risk)
  exchange_concentration_index: number; // 0.0 to 1.0
  regulatory_risk_index: number;    // 0.0 to 1.0
  explanation: string;
}

export class CryptoRiskAgent {
  private ai: GoogleGenAI | null;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  public async analyze(coin: string): Promise<CryptoRiskAssessment> {
    if (!this.ai) {
      return this.getFallback(coin);
    }

    try {
      const response = await trackedGenerateContent(this.ai, {
        model: 'gemini-2.5-flash',
        contents: `Analysiere die Risikoprofile für: "${coin}".
Bestimme das geschätzte Manipulationsrisiko (Wash Trading), die Handelsplatzkonzentration und regulatorische Risiken.
Antworte strictly mit einem strukturierten JSON.`,
        config: {
          systemInstruction: `Du bist der "Crypto Risk Agent" von CAPITAL-AI.
Deine Mission ist es, verdeckte Risiken, Zentralisierung und Marktmanipulationsmuster in Krypto-Märkten zu identifizieren.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              manipulation_index: { type: Type.NUMBER },
              exchange_concentration_index: { type: Type.NUMBER },
              regulatory_risk_index: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            },
            required: ['manipulation_index', 'exchange_concentration_index', 'regulatory_risk_index', 'explanation']
          }
        }
      }, { promptId: 'crypto-risk' });

      const data = JSON.parse(response.text || '{}');
      return {
        manipulation_index: typeof data.manipulation_index === 'number' ? data.manipulation_index : 0.20,
        exchange_concentration_index: typeof data.exchange_concentration_index === 'number' ? data.exchange_concentration_index : 0.25,
        regulatory_risk_index: typeof data.regulatory_risk_index === 'number' ? data.regulatory_risk_index : 0.30,
        explanation: data.explanation || 'Keine erhöhten Risikosignaturen im Netzwerk detektiert.'
      };
    } catch (e) {
      console.warn(`[CryptoRiskAgent] Failed to execute risk analysis. Falling back.`, e);
      return this.getFallback(coin);
    }
  }

  private getFallback(coin: string): CryptoRiskAssessment {
    const s = coin.toUpperCase().trim();
    if (s === 'BTC') {
      return {
        manipulation_index: 0.03,
        exchange_concentration_index: 0.08,
        regulatory_risk_index: 0.10,
        explanation: 'Bitcoin hat das niedrigste Risikoprofil; als Ware (Commodity) eingestuft und global diversifiziert handelsfähig.'
      };
    }
    return {
      manipulation_index: 0.15,
      exchange_concentration_index: 0.20,
      regulatory_risk_index: 0.35,
      explanation: 'Moderate Zentralisierung und übliches Altcoin-Regulierungsrisiko vorhanden.'
    };
  }
}
