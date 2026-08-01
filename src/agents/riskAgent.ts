/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { findRawMaterialConfig } from '../config/rawMaterialsConfig';
import { trackedGenerateContent } from '../services/aiUsageTracker';

export interface RiskAnalysis {
  geopolitical_risk: number;
  supply_chain_risk: number;
  regulatory_risk: number;
  esg_risk: number;
  producer_concentration: number;
  volatility: number;
  explanation: string;
}

export class RiskAgent {
  private ai: GoogleGenAI | null;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  public async analyze(name: string): Promise<RiskAnalysis> {
    const fallback = findRawMaterialConfig(name);

    if (!this.ai) {
      return this.getFallback(fallback);
    }

    try {
      try {
        const response = await trackedGenerateContent(this.ai, {
          model: 'gemini-3.1-pro-preview',
          contents: `Bewerte das geopolitische und Lieferkettenrisiko für: "${name}".
Schätze folgende Metriken auf einer Skala von 0 bis 100 ein (100 = extrem hohes Risiko, 0 = absolut risikofrei):
1. geopolitical_risk (Geopolitische Risiken im Herkunftsland / Bergbau)
2. supply_chain_risk (Logistik- und Transportengpässe)
3. regulatory_risk (Abhängigkeit von Zöllen, Exportstopps, Genehmigungen)
4. esg_risk (Umweltzerstörung, CO2-Bilanz, soziale Verträglichkeit, Menschenrechte)
5. producer_concentration (Hersteller-Konzentration: 100 = Monopol eines einzelnen Landes wie China bei Seltenen Erden)
6. volatility (Historische Preisschwankungen am Weltmarkt)
Gib ein strukturiertes JSON zurück.`,
          config: {
            systemInstruction: `Du bist der "Risk Agent" der CAPITAL-AI Plattform.
Deine Aufgabe ist es, Versorgungsrisiken, Länderrisiken und ESG-bezogene Schwachstellen entlang der globalen Rohstofflieferkette zu analysieren.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                geopolitical_risk: { type: Type.INTEGER, description: 'Geopolitisches Risiko von 0 bis 100' },
                supply_chain_risk: { type: Type.INTEGER, description: 'Lieferkettenrisiko von 0 bis 100' },
                regulatory_risk: { type: Type.INTEGER, description: 'Regulatorisches Risiko von 0 bis 100' },
                esg_risk: { type: Type.INTEGER, description: 'ESG/Umweltrisiko von 0 bis 100' },
                producer_concentration: { type: Type.INTEGER, description: 'Herstellerkonzentration von 0 bis 100' },
                volatility: { type: Type.INTEGER, description: 'Preisvolatilität von 0 bis 100' },
                explanation: { type: Type.STRING, description: 'Kurze qualitative Zusammenfassung der Risikotreiber' }
              },
              required: ['geopolitical_risk', 'supply_chain_risk', 'regulatory_risk', 'esg_risk', 'producer_concentration', 'volatility', 'explanation']
            }
          }
        }, { promptId: 'raw-materials-risk' });

        const data = JSON.parse(response.text || '{}');
        return {
          geopolitical_risk: typeof data.geopolitical_risk === 'number' ? Math.max(0, Math.min(100, data.geopolitical_risk)) : (fallback?.geopolitical_risk ?? 50),
          supply_chain_risk: typeof data.supply_chain_risk === 'number' ? Math.max(0, Math.min(100, data.supply_chain_risk)) : (fallback?.supply_chain_risk ?? 50),
          regulatory_risk: typeof data.regulatory_risk === 'number' ? Math.max(0, Math.min(100, data.regulatory_risk)) : (fallback?.regulatory_risk ?? 50),
          esg_risk: typeof data.esg_risk === 'number' ? Math.max(0, Math.min(100, data.esg_risk)) : (fallback?.esg_risk ?? 50),
          producer_concentration: typeof data.producer_concentration === 'number' ? Math.max(0, Math.min(100, data.producer_concentration)) : (fallback?.producer_concentration ?? 50),
          volatility: typeof data.volatility === 'number' ? Math.max(0, Math.min(100, data.volatility)) : (fallback?.volatility ?? 50),
          explanation: data.explanation || 'Risikoanalyse abgeschlossen basierend auf internationalen geopolitischen Indikatoren.'
        };
      } catch (e) {
        console.warn(`[RiskAgent] Premium model 'gemini-3.1-pro-preview' failed or is rate-limited. Retrying with 'gemini-3.5-flash' fallback.`, e);
        const response = await trackedGenerateContent(this.ai, {
          model: 'gemini-3.5-flash',
          contents: `Bewerte das geopolitische und Lieferkettenrisiko für: "${name}".
Schätze folgende Metriken auf einer Skala von 0 bis 100 ein (100 = extrem hohes Risiko, 0 = absolut risikofrei):
1. geopolitical_risk (Geopolitische Risiken im Herkunftsland / Bergbau)
2. supply_chain_risk (Logistik- und Transportengpässe)
3. regulatory_risk (Abhängigkeit von Zöllen, Exportstopps, Genehmigungen)
4. esg_risk (Umweltzerstörung, CO2-Bilanz, soziale Verträglichkeit, Menschenrechte)
5. producer_concentration (Hersteller-Konzentration: 100 = Monopol eines einzelnen Landes wie China bei Seltenen Erden)
6. volatility (Historische Preisschwankungen am Weltmarkt)
Gib ein strukturiertes JSON zurück.`,
          config: {
            systemInstruction: `Du bist der "Risk Agent" der CAPITAL-AI Plattform.
Deine Aufgabe ist es, Versorgungsrisiken, Länderrisiken und ESG-bezogene Schwachstellen entlang der globalen Rohstofflieferkette zu analysieren.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                geopolitical_risk: { type: Type.INTEGER, description: 'Geopolitisches Risiko von 0 bis 100' },
                supply_chain_risk: { type: Type.INTEGER, description: 'Lieferkettenrisiko von 0 bis 100' },
                regulatory_risk: { type: Type.INTEGER, description: 'Regulatorisches Risiko von 0 bis 100' },
                esg_risk: { type: Type.INTEGER, description: 'ESG/Umweltrisiko von 0 bis 100' },
                producer_concentration: { type: Type.INTEGER, description: 'Herstellerkonzentration von 0 bis 100' },
                volatility: { type: Type.INTEGER, description: 'Preisvolatilität von 0 bis 100' },
                explanation: { type: Type.STRING, description: 'Kurze qualitative Zusammenfassung der Risikotreiber' }
              },
              required: ['geopolitical_risk', 'supply_chain_risk', 'regulatory_risk', 'esg_risk', 'producer_concentration', 'volatility', 'explanation']
            }
          }
        }, { promptId: 'raw-materials-risk' });

        const data = JSON.parse(response.text || '{}');
        return {
          geopolitical_risk: typeof data.geopolitical_risk === 'number' ? Math.max(0, Math.min(100, data.geopolitical_risk)) : (fallback?.geopolitical_risk ?? 50),
          supply_chain_risk: typeof data.supply_chain_risk === 'number' ? Math.max(0, Math.min(100, data.supply_chain_risk)) : (fallback?.supply_chain_risk ?? 50),
          regulatory_risk: typeof data.regulatory_risk === 'number' ? Math.max(0, Math.min(100, data.regulatory_risk)) : (fallback?.regulatory_risk ?? 50),
          esg_risk: typeof data.esg_risk === 'number' ? Math.max(0, Math.min(100, data.esg_risk)) : (fallback?.esg_risk ?? 50),
          producer_concentration: typeof data.producer_concentration === 'number' ? Math.max(0, Math.min(100, data.producer_concentration)) : (fallback?.producer_concentration ?? 50),
          volatility: typeof data.volatility === 'number' ? Math.max(0, Math.min(100, data.volatility)) : (fallback?.volatility ?? 50),
          explanation: data.explanation || 'Risikoanalyse abgeschlossen basierend auf internationalen geopolitischen Indikatoren.'
        };
      }
    } catch (e) {
      console.warn(`[RiskAgent] Both Gemini models failed. Running quantitative database fallback.`, e);
      return this.getFallback(fallback);
    }
  }

  private getFallback(fallback: any): RiskAnalysis {
    return {
      geopolitical_risk: fallback?.geopolitical_risk ?? 50,
      supply_chain_risk: fallback?.supply_chain_risk ?? 50,
      regulatory_risk: fallback?.regulatory_risk ?? 50,
      esg_risk: fallback?.esg_risk ?? 50,
      producer_concentration: fallback?.producer_concentration ?? 50,
      volatility: fallback?.volatility ?? 50,
      explanation: fallback 
        ? `Sicherheits-Risikobewertung auf Basis historischer Lieferketten-Profile für ${fallback.name}.`
        : 'Risiko-Mittelwerte angewendet für unbekannten Rohstoff.'
    };
  }
}
