/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { findStockConfig } from '../config/stockConfig';

export interface StockRiskAnalysis {
  beta: number;
  volatility30D: number;
  debtToEquity: number;
  currentRatio: number;
  explanation: string;
}

export class StockRiskAgent {
  private ai: GoogleGenAI | null;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  public async analyze(symbol: string, name: string): Promise<StockRiskAnalysis> {
    const fallback = findStockConfig(symbol);

    if (!this.ai) {
      return this.getFallback(fallback);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Bewerte die Risikometriken für: Ticker "${symbol}", Name "${name}".
Schätze folgende Kenngrößen ein oder liefere Annahmen:
1. beta (Markt-Beta-Faktor)
2. volatility30D (30-Tage-Volatilität in %)
3. debtToEquity (Verschuldungsgrad - Fremdkapital zu Eigenkapital)
4. currentRatio (Liquiditätskennzahl)
Gib ein strukturiertes JSON zurück.`,
        config: {
          systemInstruction: `Du bist der "Stock Risk Agent" der CAPITAL-AI Plattform.
Deine Aufgabe ist es, Volatilitäten, Verschuldungsrisiken und Liquiditätsengpässe von börsennotierten Unternehmen zu identifizieren und qualitativ zu kommentieren.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              beta: { type: Type.NUMBER, description: 'Beta-Faktor' },
              volatility30D: { type: Type.NUMBER, description: '30-Tage-Volatilität in %' },
              debtToEquity: { type: Type.NUMBER, description: 'Debt-to-Equity-Ratio' },
              currentRatio: { type: Type.NUMBER, description: 'Current Ratio (Liquiditätsgrad)' },
              explanation: { type: Type.STRING, description: 'Risiko-Audit des Unternehmens' }
            },
            required: ['beta', 'volatility30D', 'debtToEquity', 'currentRatio', 'explanation']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      return {
        beta: typeof data.beta === 'number' ? data.beta : (fallback?.beta ?? 1.1),
        volatility30D: typeof data.volatility30D === 'number' ? data.volatility30D : (fallback?.volatility30D ?? 22.0),
        debtToEquity: typeof data.debtToEquity === 'number' ? data.debtToEquity : (fallback?.debtToEquity ?? 0.8),
        currentRatio: typeof data.currentRatio === 'number' ? data.currentRatio : (fallback?.currentRatio ?? 1.3),
        explanation: data.explanation || 'Risikoprofil und Verschuldung basierend auf dem globalen Sektor-Zustand.'
      };
    } catch (e) {
      console.warn(`[StockRiskAgent] Gemini failed. Running database fallback.`, e);
      return this.getFallback(fallback);
    }
  }

  private getFallback(fallback: any): StockRiskAnalysis {
    return {
      beta: fallback?.beta ?? 1.1,
      volatility30D: fallback?.volatility30D ?? 22.0,
      debtToEquity: fallback?.debtToEquity ?? 0.8,
      currentRatio: fallback?.currentRatio ?? 1.3,
      explanation: fallback 
        ? `Sicherer Stammdaten-Risk-Fallback für ${fallback.name} geladen.`
        : 'Sicherheits-Standard-Risikobewertung angewendet.'
    };
  }
}
