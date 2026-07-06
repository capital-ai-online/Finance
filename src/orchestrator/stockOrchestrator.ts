/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { StockAnalysisPayload, StockInput } from '../types/stock';
import { StockClassificationAgent } from '../agents/stockClassificationAgent';
import { StockFundamentalsAgent } from '../agents/stockFundamentalsAgent';
import { StockValuationAgent } from '../agents/stockValuationAgent';
import { StockRiskAgent } from '../agents/stockRiskAgent';
import { StockScoringService } from '../services/stockScoringService';
import { findStockConfig } from '../config/stockConfig';

export class StockOrchestrator {
  private ai: GoogleGenAI | null;
  private classificationAgent: StockClassificationAgent;
  private fundamentalsAgent: StockFundamentalsAgent;
  private valuationAgent: StockValuationAgent;
  private riskAgent: StockRiskAgent;

  constructor(aiClient: GoogleGenAI | null) {
    this.ai = aiClient;
    this.classificationAgent = new StockClassificationAgent(aiClient);
    this.fundamentalsAgent = new StockFundamentalsAgent(aiClient);
    this.valuationAgent = new StockValuationAgent(aiClient);
    this.riskAgent = new StockRiskAgent(aiClient);
  }

  /**
   * Orchestrates the complete stock analysis workflow:
   * 1. Run the specialized agents in parallel
   * 2. Blend inputs with the database static configurations
   * 3. Apply the mathematical central scoring rules (Value, Growth, Momentum, Quality, DCF, Playbooks)
   * 4. Synthesize unified German market and financial insights
   */
  public async analyzeStock(symbol: string, customInput?: Partial<StockInput>): Promise<StockAnalysisPayload> {
    const uppercaseSymbol = symbol.toUpperCase().trim();
    console.log(`[StockOrchestrator] Running multi-agent evaluation pipeline for stock: "${uppercaseSymbol}"`);

    const dbConfig = findStockConfig(uppercaseSymbol);
    const stockName = customInput?.name || dbConfig?.name || uppercaseSymbol;

    // 1. Run all 4 agents in parallel
    const [classification, fundamentals, valuation, risk] = await Promise.all([
      this.classificationAgent.analyze(uppercaseSymbol, stockName),
      this.fundamentalsAgent.analyze(uppercaseSymbol, stockName),
      this.valuationAgent.analyze(uppercaseSymbol, stockName),
      this.riskAgent.analyze(uppercaseSymbol, stockName)
    ]);

    // 2. Assemble complete unified inputs
    const unifiedInput: StockInput = {
      symbol: uppercaseSymbol,
      name: stockName,
      price: customInput?.price ?? dbConfig?.price ?? 100,
      
      // Valuation ratios
      peRatio: customInput?.peRatio ?? valuation.peRatio,
      pbRatio: customInput?.pbRatio ?? valuation.pbRatio,
      evToEbitda: customInput?.evToEbitda ?? valuation.evToEbitda,
      fcfYield: customInput?.fcfYield ?? valuation.fcfYield,
      dividendYield: customInput?.dividendYield ?? valuation.dividendYield,
      
      // Quality & balance sheet
      debtToEquity: customInput?.debtToEquity ?? risk.debtToEquity,
      currentRatio: customInput?.currentRatio ?? risk.currentRatio,
      roe: customInput?.roe ?? dbConfig?.roe ?? 15.0,
      roic: customInput?.roic ?? dbConfig?.roic ?? 12.0,
      operatingMargin: customInput?.operatingMargin ?? dbConfig?.operatingMargin ?? 15.0,
      
      // Growth drivers
      revenueGrowth3Y: customInput?.revenueGrowth3Y ?? fundamentals.revenueGrowth3Y,
      epsGrowth3Y: customInput?.epsGrowth3Y ?? fundamentals.epsGrowth3Y,
      fcfGrowth3Y: customInput?.fcfGrowth3Y ?? fundamentals.fcfGrowth3Y,
      reinvestmentRate: customInput?.reinvestmentRate ?? fundamentals.reinvestmentRate,
      
      // Risk & Momentum
      beta: customInput?.beta ?? risk.beta,
      volatility30D: customInput?.volatility30D ?? risk.volatility30D,
      momentum3M: customInput?.momentum3M ?? dbConfig?.momentum3M ?? 5.0,
      momentum6M: customInput?.momentum6M ?? dbConfig?.momentum6M ?? 10.0,
      momentum12M: customInput?.momentum12M ?? dbConfig?.momentum12M ?? 15.0,
      rsi14: customInput?.rsi14 ?? dbConfig?.rsi14 ?? 55,
      trendStrength: customInput?.trendStrength ?? dbConfig?.trendStrength ?? 60,
      
      // Sentiment
      sentimentScore: customInput?.sentimentScore ?? dbConfig?.sentimentScore ?? 6.0,
      analystRating: customInput?.analystRating ?? dbConfig?.analystRating ?? 7.0,
      
      // DCF metrics
      fcf: customInput?.fcf ?? dbConfig?.fcf,
      discountRate: customInput?.discountRate ?? dbConfig?.discountRate,
      terminalGrowth: customInput?.terminalGrowth ?? dbConfig?.terminalGrowth,
      sharesOutstanding: customInput?.sharesOutstanding ?? dbConfig?.sharesOutstanding
    };

    // 3. Score the stock using the mathematical central scoring engine
    const scoredResult = StockScoringService.scoreStock(unifiedInput);

    // 4. Overwrite classifications and append qualitative intelligence
    const mergedReasoning = [
      ...scoredResult.reasoning,
      `[Wachstumstrend] ${fundamentals.explanation}`,
      `[Bewertungskontext] ${valuation.explanation}`,
      `[Risikoparameter] ${risk.explanation}`
    ];

    const blendedConfidence = Number(((scoredResult.classification.confidence + classification.confidence) / 2).toFixed(2));

    return {
      ...scoredResult,
      classification: {
        category_main: classification.category_main,
        category_sub: classification.category_sub,
        valuation_mode: classification.valuation_mode,
        confidence: blendedConfidence,
        reasoning: classification.reasoning
      },
      reasoning: mergedReasoning
    };
  }
}
