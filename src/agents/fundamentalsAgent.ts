/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { RawMaterialInput } from '../types/rawMaterials';
import { findRawMaterialConfig } from '../config/rawMaterialsConfig';

export interface FundamentalsAnalysis {
  ore_grade: number;
  tonnage: number;
  tonnage_reserve: number;
  substitution_potential: number;
  recyclability: number;
  explanation: string;
}

export class FundamentalsAgent {
  private ai: GoogleGenAI | null;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  public async analyze(name: string): Promise<FundamentalsAnalysis> {
    const fallback = findRawMaterialConfig(name);

    if (!this.ai) {
      return this.getFallback(fallback);
    }

    try {
      try {
        const response = await this.ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: `Analysiere die geologischen und physischen Fundamentaldaten für: "${name}".
Schätze folgende Metriken auf einer Skala von 0 bis 100 ein:
1. ore_grade (Erzgehalt: 100 = extrem hoch/rein, 0 = extrem gering/degradierend)
2. tonnage (Aktuelle Abbau-Tonnage: 100 = extrem hohes globales Volumen, 0 = Nischenvorkommen)
3. tonnage_reserve (Bekannte Reserven: 100 = enorme Reserven für Jahrhunderte, 0 = erschöpft in Kürze)
4. substitution_potential (Substituierbarkeit: 100 = extrem leicht zu ersetzen, 0 = nicht substituierbar)
5. recyclability (Recyclingfähigkeit: 100 = 100% zirkulär kreislauffähig, 0 = einmalige Verbrennung/Erhitzung)
Gib ein strukturiertes JSON zurück.`,
          config: {
            systemInstruction: `Du bist der "Fundamentals Agent" der CAPITAL-AI Plattform.
Deine Aufgabe ist es, die physische Verfügbarkeit, geologische Beschaffenheit und Kreislauffähigkeit von Rohstoffen quantitativ und qualitativ zu bewerten.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                ore_grade: { type: Type.INTEGER, description: 'Erzgehalt von 0 bis 100' },
                tonnage: { type: Type.INTEGER, description: 'Fördervolumen von 0 bis 100' },
                tonnage_reserve: { type: Type.INTEGER, description: 'Reservenreichweite von 0 bis 100' },
                substitution_potential: { type: Type.INTEGER, description: 'Substituierbarkeit von 0 bis 100' },
                recyclability: { type: Type.INTEGER, description: 'Recyclingfähigkeit von 0 bis 100' },
                explanation: { type: Type.STRING, description: 'Kurze qualitative Begründung der geologischen Fundamentaldaten' }
              },
              required: ['ore_grade', 'tonnage', 'tonnage_reserve', 'substitution_potential', 'recyclability', 'explanation']
            }
          }
        });

        const data = JSON.parse(response.text || '{}');
        return {
          ore_grade: typeof data.ore_grade === 'number' ? Math.max(0, Math.min(100, data.ore_grade)) : (fallback?.ore_grade ?? 50),
          tonnage: typeof data.tonnage === 'number' ? Math.max(0, Math.min(100, data.tonnage)) : (fallback?.tonnage ?? 50),
          tonnage_reserve: typeof data.tonnage_reserve === 'number' ? Math.max(0, Math.min(100, data.tonnage_reserve)) : (fallback?.tonnage_reserve ?? 50),
          substitution_potential: typeof data.substitution_potential === 'number' ? Math.max(0, Math.min(100, data.substitution_potential)) : (fallback?.substitution_potential ?? 50),
          recyclability: typeof data.recyclability === 'number' ? Math.max(0, Math.min(100, data.recyclability)) : (fallback?.recyclability ?? 50),
          explanation: data.explanation || 'Analyse durchgeführt basierend auf globalen geologischen Profilen.'
        };
      } catch (e) {
        console.warn(`[FundamentalsAgent] Premium model 'gemini-3.1-pro-preview' failed or is rate-limited. Retrying with 'gemini-3.5-flash' fallback.`, e);
        const response = await this.ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: `Analysiere die geologischen und physischen Fundamentaldaten für: "${name}".
Schätze folgende Metriken auf einer Skala von 0 bis 100 ein:
1. ore_grade (Erzgehalt: 100 = extrem hoch/rein, 0 = extrem gering/degradierend)
2. tonnage (Aktuelle Abbau-Tonnage: 100 = extrem hohes globales Volumen, 0 = Nischenvorkommen)
3. tonnage_reserve (Bekannte Reserven: 100 = enorme Reserven für Jahrhunderte, 0 = erschöpft in Kürze)
4. substitution_potential (Substituierbarkeit: 100 = extrem leicht zu ersetzen, 0 = nicht substituierbar)
5. recyclability (Recyclingfähigkeit: 100 = 100% zirkulär kreislauffähig, 0 = einmalige Verbrennung/Erhitzung)
Gib ein strukturiertes JSON zurück.`,
          config: {
            systemInstruction: `Du bist der "Fundamentals Agent" der CAPITAL-AI Plattform.
Deine Aufgabe ist es, die physische Verfügbarkeit, geologische Beschaffenheit und Kreislauffähigkeit von Rohstoffen quantitativ und qualitativ zu bewerten.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                ore_grade: { type: Type.INTEGER, description: 'Erzgehalt von 0 bis 100' },
                tonnage: { type: Type.INTEGER, description: 'Fördervolumen von 0 bis 100' },
                tonnage_reserve: { type: Type.INTEGER, description: 'Reservenreichweite von 0 bis 100' },
                substitution_potential: { type: Type.INTEGER, description: 'Substituierbarkeit von 0 bis 100' },
                recyclability: { type: Type.INTEGER, description: 'Recyclingfähigkeit von 0 bis 100' },
                explanation: { type: Type.STRING, description: 'Kurze qualitative Begründung der geologischen Fundamentaldaten' }
              },
              required: ['ore_grade', 'tonnage', 'tonnage_reserve', 'substitution_potential', 'recyclability', 'explanation']
            }
          }
        });

        const data = JSON.parse(response.text || '{}');
        return {
          ore_grade: typeof data.ore_grade === 'number' ? Math.max(0, Math.min(100, data.ore_grade)) : (fallback?.ore_grade ?? 50),
          tonnage: typeof data.tonnage === 'number' ? Math.max(0, Math.min(100, data.tonnage)) : (fallback?.tonnage ?? 50),
          tonnage_reserve: typeof data.tonnage_reserve === 'number' ? Math.max(0, Math.min(100, data.tonnage_reserve)) : (fallback?.tonnage_reserve ?? 50),
          substitution_potential: typeof data.substitution_potential === 'number' ? Math.max(0, Math.min(100, data.substitution_potential)) : (fallback?.substitution_potential ?? 50),
          recyclability: typeof data.recyclability === 'number' ? Math.max(0, Math.min(100, data.recyclability)) : (fallback?.recyclability ?? 50),
          explanation: data.explanation || 'Analyse durchgeführt basierend auf globalen geologischen Profilen.'
        };
      }
    } catch (e) {
      console.warn(`[FundamentalsAgent] Both Gemini models failed. Running quantitative database fallback.`, e);
      return this.getFallback(fallback);
    }
  }

  private getFallback(fallback: any): FundamentalsAnalysis {
    return {
      ore_grade: fallback?.ore_grade ?? 50,
      tonnage: fallback?.tonnage ?? 50,
      tonnage_reserve: fallback?.tonnage_reserve ?? 50,
      substitution_potential: fallback?.substitution_potential ?? 50,
      recyclability: fallback?.recyclability ?? 50,
      explanation: fallback 
        ? `Qualitative Bestimmung der geologischen Parameter aus den Stammdaten für ${fallback.name}.`
        : 'Sicherheits-Standardbewertung geladen aufgrund eingeschränkter Datenlage.'
    };
  }
}
