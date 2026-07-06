/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { StockClassification, StockCategoryMain } from '../types/stock';
import { findStockConfig } from '../config/stockConfig';

export class StockClassificationAgent {
  private ai: GoogleGenAI | null;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  /**
   * Run the Classification Agent on the Stock Name / Symbol
   */
  public async analyze(symbol: string, name: string): Promise<StockClassification> {
    const fallback = findStockConfig(symbol);
    
    if (!this.ai) {
      return this.getFallback(symbol, name, fallback);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Klassifiziere die folgende Aktie: Ticker "${symbol}", Name "${name}".
Bestimme die Hauptklasse (Large Cap, Mid Cap, Small Cap, Growth, Value, Dividend, Quality, Momentum, Cyclical, Defensive, Financial, Technology, Healthcare, Industrial, Consumer, Energy, Materials, Utilities, Real Estate, ETF / Fund, Unknown), eine präzise Subklasse (z.B. Enterprise Software, Batterietechnologie), den Bewertungsmodus (z.B. DCF-Compounder, Substanzwertverfahren).
Gib ein strukturiertes JSON zurück.`,
        config: {
          systemInstruction: `Du bist der "Stock Classification Agent" der CAPITAL-AI Plattform.
Deine Aufgabe ist es, Aktien präzise in ihre Hauptkategorien und Subkategorien einzuteilen.
Halte dich strikt an die vorgegebenen Hauptklassen:
"Large Cap", "Mid Cap", "Small Cap", "Growth", "Value", "Dividend", "Quality", "Momentum", "Cyclical", "Defensive", "Financial", "Technology", "Healthcare", "Industrial", "Consumer", "Energy", "Materials", "Utilities", "Real Estate", "ETF / Fund", "Unknown".
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category_main: {
                type: Type.STRING,
                description: 'Hauptklasse der Aktie (z.B. Technology, Growth, Dividend, Financial)',
              },
              category_sub: { type: Type.STRING, description: 'Spezifische Unterklasse auf Deutsch (z.B. Cloud-AI Infrastruktur)' },
              valuation_mode: { type: Type.STRING, description: 'Bewertungsmodus, z.B. DCF-Compounder & relatives Multiple' },
              confidence: { type: Type.NUMBER, description: 'Konfidenzlevel zwischen 0.0 und 1.0' },
              reasoning: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 prägnante Stichpunkte zur Begründung'
              }
            },
            required: ['category_main', 'category_sub', 'valuation_mode', 'confidence', 'reasoning']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      const category_main = this.normalizeCategory(data.category_main);

      return {
        category_main,
        category_sub: data.category_sub || fallback?.category_sub || 'Standard Bluechip Equity Class',
        valuation_mode: data.valuation_mode || fallback?.valuation_mode || 'Relatives Multiple & Cashflow Check',
        confidence: typeof data.confidence === 'number' ? Math.max(0.1, Math.min(1.0, data.confidence)) : 0.85,
        reasoning: Array.isArray(data.reasoning) ? data.reasoning.slice(0, 3) : ['Klassifiziert durch CAPITAL-AI Stock-Klassifikator.']
      };
    } catch (e) {
      console.warn(`[StockClassificationAgent] Gemini failed. Running fallbacks.`, e);
      return this.getFallback(symbol, name, fallback);
    }
  }

  private normalizeCategory(cat: string): StockCategoryMain {
    const valid: StockCategoryMain[] = [
      'Large Cap', 'Mid Cap', 'Small Cap', 'Growth', 'Value', 'Dividend', 'Quality', 'Momentum',
      'Cyclical', 'Defensive', 'Financial', 'Technology', 'Healthcare', 'Industrial', 'Consumer',
      'Energy', 'Materials', 'Utilities', 'Real Estate', 'ETF / Fund', 'Unknown'
    ];
    const key = String(cat || '').toLowerCase().trim();
    const found = valid.find(v => v.toLowerCase() === key);
    return found || 'Unknown';
  }

  private getFallback(symbol: string, name: string, fallback: any): StockClassification {
    return {
      category_main: fallback?.category_main || 'Unknown',
      category_sub: fallback?.category_sub || 'Standard Bluechip Equity Class',
      valuation_mode: fallback?.valuation_mode || 'Relatives Multiple & Cashflow Check',
      confidence: fallback ? 0.95 : 0.50,
      reasoning: [
        fallback ? `Referenzierte Daten aus dem verifizierten CAPITAL-AI Aktien-Stammdatensatz.` : `Temporäre Klassifizierung aufgrund fehlender Datenpunkte.`,
        'Robuster deterministischer Fallback aktiv.'
      ]
    };
  }
}
