/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { findRawMaterialConfig } from '../config/rawMaterialsConfig';

export interface StrategicAnalysis {
  military_importance: number;
  industrial_importance: number;
  explanation: string;
}

export class ValuationAgent {
  private ai: GoogleGenAI | null;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  public async analyze(name: string): Promise<StrategicAnalysis> {
    const fallback = findRawMaterialConfig(name);

    if (!this.ai) {
      return this.getFallback(fallback);
    }

    try {
      try {
        const response = await this.ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: `Bewerte die strategische Bedeutung für: "${name}".
Schätze folgende Metriken auf einer Skala von 0 bis 100 ein (100 = extrem hoch/unverzichtbar, 0 = irrelevant):
1. military_importance (Militärische Bedeutung, Verteidigungstechnologien, Luft- und Raumfahrt)
2. industrial_importance (Industrielle Bedeutung, Halbleiter, Energiewende, Schlüsselindustrien)
Gib ein strukturiertes JSON zurück.`,
          config: {
            systemInstruction: `Du bist der "Valuation Agent" der AIF-CORE Plattform.
Deine Aufgabe ist es, die wehrtechnische und gesamtindustrielle Relevanz von Rohstoffen entlang internationaler Sicherheits- und Innovationsstrategien einzustufen.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                military_importance: { type: Type.INTEGER, description: 'Militärische Bedeutung von 0 bis 100' },
                industrial_importance: { type: Type.INTEGER, description: 'Industrielle Bedeutung von 0 bis 100' },
                explanation: { type: Type.STRING, description: 'Qualitative Zusammenfassung der strategischen Relevanz' }
              },
              required: ['military_importance', 'industrial_importance', 'explanation']
            }
          }
        });

        const data = JSON.parse(response.text || '{}');
        return {
          military_importance: typeof data.military_importance === 'number' ? Math.max(0, Math.min(100, data.military_importance)) : (fallback?.military_importance ?? 50),
          industrial_importance: typeof data.industrial_importance === 'number' ? Math.max(0, Math.min(100, data.industrial_importance)) : (fallback?.industrial_importance ?? 50),
          explanation: data.explanation || 'Strategische Relevanzprüfung abgeschlossen.'
        };
      } catch (e) {
        console.warn(`[ValuationAgent] Premium model 'gemini-3.1-pro-preview' failed or is rate-limited. Retrying with 'gemini-3.5-flash' fallback.`, e);
        const response = await this.ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `Bewerte die strategische Bedeutung für: "${name}".
Schätze folgende Metriken auf einer Skala von 0 bis 100 ein (100 = extrem hoch/unverzichtbar, 0 = irrelevant):
1. military_importance (Militärische Bedeutung, Verteidigungstechnologien, Luft- und Raumfahrt)
2. industrial_importance (Industrielle Bedeutung, Halbleiter, Energiewende, Schlüsselindustrien)
Gib ein strukturiertes JSON zurück.`,
          config: {
            systemInstruction: `Du bist der "Valuation Agent" der AIF-CORE Plattform.
Deine Aufgabe ist es, die wehrtechnische und gesamtindustrielle Relevanz von Rohstoffen entlang internationaler Sicherheits- und Innovationsstrategien einzustufen.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                military_importance: { type: Type.INTEGER, description: 'Militärische Bedeutung von 0 bis 100' },
                industrial_importance: { type: Type.INTEGER, description: 'Industrielle Bedeutung von 0 bis 100' },
                explanation: { type: Type.STRING, description: 'Qualitative Zusammenfassung der strategischen Relevanz' }
              },
              required: ['military_importance', 'industrial_importance', 'explanation']
            }
          }
        });

        const data = JSON.parse(response.text || '{}');
        return {
          military_importance: typeof data.military_importance === 'number' ? Math.max(0, Math.min(100, data.military_importance)) : (fallback?.military_importance ?? 50),
          industrial_importance: typeof data.industrial_importance === 'number' ? Math.max(0, Math.min(100, data.industrial_importance)) : (fallback?.industrial_importance ?? 50),
          explanation: data.explanation || 'Strategische Relevanzprüfung abgeschlossen.'
        };
      }
    } catch (e) {
      console.warn(`[ValuationAgent] Both Gemini models failed. Running quantitative database fallback.`, e);
      return this.getFallback(fallback);
    }
  }

  private getFallback(fallback: any): StrategicAnalysis {
    return {
      military_importance: fallback?.military_importance ?? 50,
      industrial_importance: fallback?.industrial_importance ?? 50,
      explanation: fallback 
        ? `Sicherheitsrelevanz und industrielle Anwendungsfelder bestimmt aus Stammdaten für ${fallback.name}.`
        : 'Einstufung mit konservativem Sicherheits-Szenario vorgenommen.'
    };
  }
}
