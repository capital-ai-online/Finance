/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { PortfolioScoringService, PortfolioScoringInput, PortfolioScoreResult } from '../services/portfolioScoringService';

export interface PortfolioReviewPayload {
  executiveSummary: string;
  riskAssessment: string;
  optimizations: string[];
  quantitativeAnalysis: PortfolioScoreResult;
}

export class PortfolioOrchestrator {
  private ai: GoogleGenAI | null;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
  }

  /**
   * Orchestrates portfolio analysis:
   * 1. Evaluates allocation with PortfolioScoringService
   * 2. Prompts Gemini 2.5 Flash / Omni models to build qualitative commentary in German
   * 3. Synthesizes a unified structured result
   */
  public async reviewPortfolio(input: PortfolioScoringInput): Promise<PortfolioReviewPayload> {
    console.log('[PortfolioOrchestrator] Running portfolio evaluation pipeline...');

    // 1. Run deterministic quantitative analysis
    const quantitative = PortfolioScoringService.scorePortfolio(input);

    // 2. Generate qualitative insights using LLM if available
    let executiveSummary = 'Die Allokation zeigt ein solides Fundament. Eine genaue qualitative Tiefenanalyse wird vorgenommen.';
    let riskAssessment = 'Diversifiziertes Profil über die gewählten Anlageklassen. Ein ausgewogenes Verhältnis von Volatilität und Rendite.';
    let optimizations = quantitative.optimizationSuggestions;

    if (this.ai) {
      try {
        const prompt = `Du bist ein hochprofessioneller Quant-Portfolio-Analyst und Risk-Officer bei CAPITAL-AI.
        Analysiere die folgende Portfolio-Allokation und deren historische Backtest-Ergebnisse:
        
        Allokation:
        ${JSON.stringify(input.allocation, null, 2)}
        
        Performance-Metriken:
        - 1-Jahr-Zeitraum: Rendite: ${input.metrics1Y?.strategyReturn?.toFixed(2)}%, Max Drawdown: -${input.metrics1Y?.maxDrawdown?.toFixed(2)}%, Sharpe Ratio: ${input.metrics1Y?.sharpeRatio?.toFixed(2)}
        - 3-Jahre-Zeitraum: Rendite: ${input.metrics3Y?.strategyReturn?.toFixed(2)}%, Max Drawdown: -${input.metrics3Y?.maxDrawdown?.toFixed(2)}%, Sharpe Ratio: ${input.metrics3Y?.sharpeRatio?.toFixed(2)}
        - 5-Jahre-Zeitraum: Rendite: ${input.metrics5Y?.strategyReturn?.toFixed(2)}%, Max Drawdown: -${input.metrics5Y?.maxDrawdown?.toFixed(2)}%, Sharpe Ratio: ${input.metrics5Y?.sharpeRatio?.toFixed(2)}
        
        Deterministische Analyseergebnisse:
        - Gesamtscore: ${quantitative.overallScore}/100
        - Diversifikationsscore: ${quantitative.diversificationScore}/100
        - Risikoniveau: ${quantitative.riskLevel} (${quantitative.riskDescription})
        
        Generiere ein professionelles, fundiertes Review (in deutscher Sprache) mit folgenden Punkten im JSON-Format:
        {
          "executiveSummary": "<Ein prägnanter Absatz (2-3 Sätze), der das Risiko-Rendite-Profil dieser Allokation zusammenfasst.>",
          "riskAssessment": "<Spezifische Risikobetrachtung der Kombination aus den gewählten Assets, z.B. Diversifikation, Korrelationen, Volatilität.>",
          "optimizations": [
            "<Ein konkreter Verbesserungsvorschlag (z.B. Erhöhung von Gold zur Reduktion von Drawdowns oder Reduktion von Krypto bei hoher Volatilität).>",
            "<Ein weiterer konstruktiver Optimierungsschlag.>"
          ]
        }
        
        Antworte AUSSCHLIESSLICH mit diesem JSON-Objekt. Verwende kein Markdown-Code-Highlighting wie \`\`\`json.`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const text = response.text || '';
        const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
        if (parsed.executiveSummary) executiveSummary = parsed.executiveSummary;
        if (parsed.riskAssessment) riskAssessment = parsed.riskAssessment;
        if (parsed.optimizations && Array.isArray(parsed.optimizations)) {
          optimizations = [...parsed.optimizations, ...quantitative.optimizationSuggestions.slice(1)];
        }
      } catch (err) {
        console.warn('[PortfolioOrchestrator] LLM invocation failed, using qualitative templates:', err);
      }
    }

    return {
      executiveSummary,
      riskAssessment,
      optimizations: Array.from(new Set(optimizations)),
      quantitativeAnalysis: quantitative
    };
  }
}
