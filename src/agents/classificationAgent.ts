/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type, type AiGenerationClient } from '../services/aiSchema';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { Classification, CategoryMain } from '../types/rawMaterials';
import { findRawMaterialConfig } from '../config/rawMaterialsConfig';
import { generateStructuredWithFallback } from '../services/agentModelRouting';

export class ClassificationAgent {
  private ai: AiGenerationClient | null;
  private anthropic: Anthropic | null;
  private openai: OpenAI | null;

  constructor(aiClient: AiGenerationClient | null, anthropicClient: Anthropic | null = null, openaiClient: OpenAI | null = null) {
    this.ai = aiClient;
    this.anthropic = anthropicClient;
    this.openai = openaiClient;
  }

  /**
   * Run the Classification Agent on the raw material name
   */
  public async analyze(name: string): Promise<Classification> {
    const fallback = findRawMaterialConfig(name);

    const result = await generateStructuredWithFallback({
      gemini: this.ai,
      anthropic: this.anthropic,
      openai: this.openai,
      promptId: 'raw-materials-classification',
      geminiModels: ['gemini-3.1-pro-preview', 'gemini-3.5-flash'],
      contents: `Klassifiziere den folgenden Rohstoff: "${name}".
Bestimme die Hauptklasse (Metal, Energy, Agriculture, Industrial, Recycling, oder Unknown), eine präzise Subklasse (z.B. Batteriemetalle, Edelmetalle, Nuklearbrennstoffe), den Markttyp (z.B. LME, OTC, Physisch) und den Bewertungsmodus (z.B. Standard, Strategische Relevanz).
Gib ein strukturiertes JSON zurück.`,
      systemInstruction: `Du bist der "Classification Agent" der CAPITAL-AI Rohstoff-Bewertungsplattform.
Deine Aufgabe ist es, Rohstoffe präzise zu kategorisieren.
Du musst dich strikt an die folgenden Hauptkategorien halten:
"Metal" (Metalle / kritische Metalle), "Energy" (Energierohstoffe), "Agriculture" (Agrarrohstoffe), "Industrial" (Industrieminerale), "Recycling" (Recycling- & Sekundärrohstoffe) oder "Unknown".
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
      schema: {
        type: Type.OBJECT,
        properties: {
          category_main: {
            type: Type.STRING,
            description: 'Metal, Energy, Agriculture, Industrial, Recycling, Unknown',
          },
          category_sub: { type: Type.STRING, description: 'Spezifische Unterklasse auf Deutsch' },
          market_type: { type: Type.STRING, description: 'Markttyp, z.B. Börsennotiert (LME), OTC-Handel' },
          valuation_mode: { type: Type.STRING, description: 'Bewertungsmodus, z.B. Kritikalität & ökonomischer Wert' },
          confidence: { type: Type.NUMBER, description: 'Konfidenzlevel zwischen 0.0 und 1.0' },
          reasoning: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 prägnante Stichpunkte zur Begründung'
          }
        },
        required: ['category_main', 'category_sub', 'market_type', 'valuation_mode', 'confidence', 'reasoning']
      },
    });

    if (!result) {
      return this.getFallback(name, fallback);
    }

    const data = result.data;
    const category_main = this.normalizeCategory(data.category_main);

    return {
      category_main,
      category_sub: data.category_sub || fallback?.category_sub || 'Spezifischer Rohstoff / Sonderklasse',
      market_type: data.market_type || fallback?.market_type || 'OTC oder Physischer Direktmarkt',
      valuation_mode: data.valuation_mode || (fallback?.is_critical ? 'Kritikalität & Strategische Relevanz' : 'Standard-Marktbewertung'),
      confidence: typeof data.confidence === 'number' ? Math.max(0.1, Math.min(1.0, data.confidence)) : 0.85,
      reasoning: Array.isArray(data.reasoning) ? data.reasoning.slice(0, 3) : ['Klassifiziert durch CAPITAL-AI Klassifikator.']
    };
  }

  private normalizeCategory(cat: string): CategoryMain {
    const mapping: Record<string, CategoryMain> = {
      'metal': 'Metal',
      'energy': 'Energy',
      'agriculture': 'Agriculture',
      'industrial': 'Industrial',
      'recycling': 'Recycling',
      'unknown': 'Unknown'
    };
    const key = String(cat || '').toLowerCase().trim();
    return mapping[key] || 'Unknown';
  }

  private getFallback(name: string, fallback: any): Classification {
    return {
      category_main: (fallback?.category_main as CategoryMain) || 'Unknown',
      category_sub: fallback?.category_sub || 'Spezifischer Rohstoff / Sonderklasse',
      market_type: fallback?.market_type || 'OTC oder Physischer Direktmarkt',
      valuation_mode: fallback?.is_critical ? 'Kritikalität & Strategische Relevanz' : 'Standard-Marktbewertung',
      confidence: fallback ? 0.95 : 0.50,
      reasoning: [
        fallback ? `Referenzierte Daten aus dem verifizierten CAPITAL-AI Stammdatensatz.` : `Temporäre Klassifizierung aufgrund fehlender Datenpunkte.`,
        fallback?.is_critical ? 'Identifiziert als kritischer Rohstoff.' : 'Standard-Risikoklasse angewendet.',
        'Robuster deterministischer Fallback aktiv.'
      ]
    };
  }
}
