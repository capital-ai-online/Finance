/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type, type AiGenerationClient } from '../services/aiSchema';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { findRawMaterialConfig } from '../config/rawMaterialsConfig';
import { generateStructuredWithFallback } from '../services/agentModelRouting';

export interface StrategicAnalysis {
  military_importance: number;
  industrial_importance: number;
  explanation: string;
}

export class ValuationAgent {
  private ai: AiGenerationClient | null;
  private anthropic: Anthropic | null;
  private openai: OpenAI | null;

  constructor(aiClient: AiGenerationClient | null, anthropicClient: Anthropic | null = null, openaiClient: OpenAI | null = null) {
    this.ai = aiClient;
    this.anthropic = anthropicClient;
    this.openai = openaiClient;
  }

  public async analyze(name: string): Promise<StrategicAnalysis> {
    const fallback = findRawMaterialConfig(name);

    const result = await generateStructuredWithFallback({
      anthropic: this.anthropic,
      openai: this.openai,
      promptId: 'raw-materials-valuation',
      contents: `Bewerte die strategische Bedeutung für: "${name}".
Schätze folgende Metriken auf einer Skala von 0 bis 100 ein (100 = extrem hoch/unverzichtbar, 0 = irrelevant):
1. military_importance (Militärische Bedeutung, Verteidigungstechnologien, Luft- und Raumfahrt)
2. industrial_importance (Industrielle Bedeutung, Halbleiter, Energiewende, Schlüsselindustrien)
Gib ein strukturiertes JSON zurück.`,
      systemInstruction: `Du bist der "Valuation Agent" der CAPITAL-AI Plattform.
Deine Aufgabe ist es, die wehrtechnische und gesamtindustrielle Relevanz von Rohstoffen entlang internationaler Sicherheits- und Innovationsstrategien einzustufen.
Gib ausschließlich ein valides JSON-Objekt zurück, das dem verlangten Schema entspricht.`,
      schema: {
        type: Type.OBJECT,
        properties: {
          military_importance: { type: Type.INTEGER, description: 'Militärische Bedeutung von 0 bis 100' },
          industrial_importance: { type: Type.INTEGER, description: 'Industrielle Bedeutung von 0 bis 100' },
          explanation: { type: Type.STRING, description: 'Qualitative Zusammenfassung der strategischen Relevanz' }
        },
        required: ['military_importance', 'industrial_importance', 'explanation']
      },
    });

    if (!result) {
      return this.getFallback(fallback);
    }

    const data = result.data;
    return {
      military_importance: typeof data.military_importance === 'number' ? Math.max(0, Math.min(100, data.military_importance)) : (fallback?.military_importance ?? 50),
      industrial_importance: typeof data.industrial_importance === 'number' ? Math.max(0, Math.min(100, data.industrial_importance)) : (fallback?.industrial_importance ?? 50),
      explanation: data.explanation || 'Strategische Relevanzprüfung abgeschlossen.'
    };
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
