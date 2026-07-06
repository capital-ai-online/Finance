/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { findStockConfig } from '../config/stockConfig';

export interface StockValuationAnalysis {
  peRatio: number;
  pbRatio: number;
  evToEbitda: number;
  fcfYield: number;
  dividendYield: number;
  explanation: string;
}

export class StockValuationAgent {
  private ai: GoogleGenAI | null;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  public async analyze(symbol: string, name: string): Promise<StockValuationAnalysis> {
    const fallback = findStockConfig(symbol);

    if (!this.ai) {
      return this.getFallback(fallback);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Analysiere die aktuelle Bewertung und Multiples für: Ticker "${symbol}", Name "${name}".
Schätze folgende Kenngrößen ein oder liefere Annahmen:
1. peRatio (KGV - Kurs-Gewinn-Verhältnis)
2. pbRatio (KBV - Kurs-Buchwert-Verhältnis)
3. evToEbitda (Enterprise Value zu EBITDA)
4. fcfYield (Free-Cash-Flow-Rendite in %)
5. dividendYield (Dividendenrendite in %)
Gib ein strukturiertes JSON zurück.`,
        config: {
          systemInstruction: `Du bist der "Stock Valuation Agent" der CAPITAL-AI Plattform.
Deine Aufgabe ist es, relative Multiples und Cashflow-Renditen auf Angemessenheit zu prüfen und im Branchenkontext qualitativ einzuordnen.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              peRatio: { type: Type.NUMBER, description: 'Kurs-Gewinn-Verhältnis' },
              pbRatio: { type: Type.NUMBER, description: 'Kurs-Buchwert-Verhältnis' },
              evToEbitda: { type: Type.NUMBER, description: 'Enterprise Value zu EBITDA' },
              fcfYield: { type: Type.NUMBER, description: 'Free Cash Flow Yield in %' },
              dividendYield: { type: Type.NUMBER, description: 'Dividendenrendite in %' },
              explanation: { type: Type.STRING, description: 'Analysten-Einschätzung zur Angemessenheit der Bewertung' }
            },
            required: ['peRatio', 'pbRatio', 'evToEbitda', 'fcfYield', 'dividendYield', 'explanation']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      return {
        peRatio: typeof data.peRatio === 'number' ? data.peRatio : (fallback?.peRatio ?? 22.0),
        pbRatio: typeof data.pbRatio === 'number' ? data.pbRatio : (fallback?.pbRatio ?? 3.5),
        evToEbitda: typeof data.evToEbitda === 'number' ? data.evToEbitda : (fallback?.evToEbitda ?? 14.0),
        fcfYield: typeof data.fcfYield === 'number' ? data.fcfYield : (fallback?.fcfYield ?? 4.5),
        dividendYield: typeof data.dividendYield === 'number' ? data.dividendYield : (fallback?.dividendYield ?? 1.8),
        explanation: data.explanation || 'Relatives Bewertungsprofil im Branchenvergleich.'
      };
    } catch (e) {
      console.warn(`[StockValuationAgent] Gemini failed. Running database fallback.`, e);
      return this.getFallback(fallback);
    }
  }

  private getFallback(fallback: any): StockValuationAnalysis {
    return {
      peRatio: fallback?.peRatio ?? 22.0,
      pbRatio: fallback?.pbRatio ?? 3.5,
      evToEbitda: fallback?.evToEbitda ?? 14.0,
      fcfYield: fallback?.fcfYield ?? 4.5,
      dividendYield: fallback?.dividendYield ?? 1.8,
      explanation: fallback 
        ? `Sicherer Stammdaten-Fallback für die Bewertung von ${fallback.name} geladen.`
        : 'Allgemeine Standard-Aktienmultiples verwendet.'
    };
  }
}
