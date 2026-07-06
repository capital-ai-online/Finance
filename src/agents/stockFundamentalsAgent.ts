/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { findStockConfig } from '../config/stockConfig';

export interface StockFundamentalsAnalysis {
  revenueGrowth3Y: number;
  epsGrowth3Y: number;
  fcfGrowth3Y: number;
  reinvestmentRate: number;
  explanation: string;
}

export class StockFundamentalsAgent {
  private ai: GoogleGenAI | null;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  public async analyze(symbol: string, name: string): Promise<StockFundamentalsAnalysis> {
    const fallback = findStockConfig(symbol);

    if (!this.ai) {
      return this.getFallback(fallback);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Analysiere die operativen Fundamentaldaten und das Wachstum für: Ticker "${symbol}", Name "${name}".
Schätze folgende Metriken auf einer Skala von 0 bis 100 ein bzw. gib Prozentwerte an:
1. revenueGrowth3Y (3-jähriges Umsatzwachstum CAGR in %)
2. epsGrowth3Y (3-jähriges EPS-Wachstum in %)
3. fcfGrowth3Y (3-jähriges FCF-Wachstum in %)
4. reinvestmentRate (Reinvestitionsquote in % vom operativen Cashflow)
Gib ein strukturiertes JSON zurück.`,
        config: {
          systemInstruction: `Du bist der "Stock Fundamentals Agent" der CAPITAL-AI Plattform.
Deine Aufgabe ist es, die finanzielle Expansionskraft, Rentabilitäts-Dynamik und Reinvestitionsfähigkeit von Aktiengesellschaften quantitativ und qualitativ zu bewerten.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              revenueGrowth3Y: { type: Type.NUMBER, description: '3-jähriges Umsatzwachstum CAGR in % (z.B. 12.5)' },
              epsGrowth3Y: { type: Type.NUMBER, description: '3-jähriges EPS-Wachstum in % (z.B. 15.0)' },
              fcfGrowth3Y: { type: Type.NUMBER, description: '3-jähriges FCF-Wachstum in % (z.B. 14.2)' },
              reinvestmentRate: { type: Type.NUMBER, description: 'Reinvestitionsquote in % (z.B. 45.0)' },
              explanation: { type: Type.STRING, description: 'Kurze qualitative Begründung der operativen Dynamik und Reinvestitionen' }
            },
            required: ['revenueGrowth3Y', 'epsGrowth3Y', 'fcfGrowth3Y', 'reinvestmentRate', 'explanation']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      return {
        revenueGrowth3Y: typeof data.revenueGrowth3Y === 'number' ? data.revenueGrowth3Y : (fallback?.revenueGrowth3Y ?? 8.0),
        epsGrowth3Y: typeof data.epsGrowth3Y === 'number' ? data.epsGrowth3Y : (fallback?.epsGrowth3Y ?? 10.0),
        fcfGrowth3Y: typeof data.fcfGrowth3Y === 'number' ? data.fcfGrowth3Y : (fallback?.fcfGrowth3Y ?? 9.0),
        reinvestmentRate: typeof data.reinvestmentRate === 'number' ? Math.max(0, Math.min(100, data.reinvestmentRate)) : (fallback?.reinvestmentRate ?? 40.0),
        explanation: data.explanation || 'Analyse der operativen Triebkräfte basierend auf globalen Marktprofilen.'
      };
    } catch (e) {
      console.warn(`[StockFundamentalsAgent] Gemini failed. Running database fallback.`, e);
      return this.getFallback(fallback);
    }
  }

  private getFallback(fallback: any): StockFundamentalsAnalysis {
    return {
      revenueGrowth3Y: fallback?.revenueGrowth3Y ?? 8.0,
      epsGrowth3Y: fallback?.epsGrowth3Y ?? 10.0,
      fcfGrowth3Y: fallback?.fcfGrowth3Y ?? 9.0,
      reinvestmentRate: fallback?.reinvestmentRate ?? 40.0,
      explanation: fallback 
        ? `Qualitative Bestimmung der Wachstumstreiber und der Reinvestition für ${fallback.name} aus den verifizierten CAPITAL-AI Stammdaten.`
        : 'Sicherheits-Standardbewertung geladen aufgrund eingeschränkter Datenlage.'
    };
  }
}
