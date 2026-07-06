/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StockCategoryMain =
  | 'Large Cap'
  | 'Mid Cap'
  | 'Small Cap'
  | 'Growth'
  | 'Value'
  | 'Dividend'
  | 'Quality'
  | 'Momentum'
  | 'Cyclical'
  | 'Defensive'
  | 'Financial'
  | 'Technology'
  | 'Healthcare'
  | 'Industrial'
  | 'Consumer'
  | 'Energy'
  | 'Materials'
  | 'Utilities'
  | 'Real Estate'
  | 'ETF / Fund'
  | 'Unknown';

export type PlaybookType =
  | 'Long-Term Investing'
  | 'Swing Trading'
  | 'Momentum Rotation'
  | 'Deep Value'
  | 'DCF Quality Compounders';

export interface StockClassification {
  category_main: StockCategoryMain;
  category_sub: string;
  valuation_mode: string;
  confidence: number;
  reasoning: string[];
}

export interface DCFScenarioResult {
  scenario: 'Conservative' | 'Neutral' | 'Optimistic';
  intrinsicValue: number;
  upsideDownside: number; // Percentage
  growthRate: number;
  discountRate: number;
}

export interface DCFValuationPayload {
  intrinsicValue: number; // Neutral scenario intrinsic value
  fairValueGap: number; // Percentage distance between current price and intrinsic value
  scenarios: DCFScenarioResult[];
}

export interface StockFactorScores {
  value: number; // P/E, P/B, EV/EBITDA, FCF Yield
  growth: number; // Revenue, EPS, FCF growth, reinvestment rate
  momentum: number; // 3M, 6M, 12M performance, RSI, Trend
  quality: number; // ROE, ROIC, operating margin, debt levels
  risk: number; // Beta, volatility, sector exposure, debt-to-equity
  profitability: number; // Margins, cash conversion, return metrics
  balanceSheet: number; // Debt, current ratio, stability
  catalysts: number; // Sentiment, analyst ratings, growth catalysts
  sentiment: number; // News and social sentiment
  valuation: number; // Relative multiple score
  dcf: number; // DCF gap based score
  screeningFit: number; // How well the stock fits suited playbooks
}

export interface PlaybookRecommendation {
  playbook: PlaybookType;
  fitScore: number; // 0 - 100
  priority: number; // Ranking priority (1 is highest)
  isMatching: boolean;
  rulesMet: string[];
}

export interface StockAnalysisPayload {
  symbol: string;
  name: string;
  classification: StockClassification;
  factorScores: StockFactorScores;
  compositeScore: number; // Primary decision score combining factors, DCF, and Screening-Fit
  final_score: number; // Base score scaled 0-100
  dcfValuation: DCFValuationPayload | null;
  playbookRecommendations: PlaybookRecommendation[];
  primaryRecommendation: PlaybookRecommendation | null;
  confidence: number; // 0 - 100
  dataQuality: {
    level: 'low' | 'medium' | 'high' | 'unknown';
    score: number; // 0 - 100
    missingFields: string[];
  };
  reasoning: string[];
  inputs: StockInput;
  metadata: {
    scoring_version: string;
    timestamp: string;
  };
}

export interface StockInput {
  symbol: string;
  name?: string;
  price?: number;
  
  // Value indicators
  peRatio?: number;
  pbRatio?: number;
  evToEbitda?: number;
  fcfYield?: number;
  dividendYield?: number;
  
  // Balance sheet & quality
  debtToEquity?: number;
  currentRatio?: number;
  roe?: number;
  roic?: number;
  operatingMargin?: number;
  
  // Growth indicators
  revenueGrowth3Y?: number;
  epsGrowth3Y?: number;
  fcfGrowth3Y?: number;
  reinvestmentRate?: number;
  
  // Risk & technicals
  beta?: number;
  volatility30D?: number;
  momentum3M?: number;
  momentum6M?: number;
  momentum12M?: number;
  rsi14?: number;
  trendStrength?: number;
  
  // Qualitative indicators
  sentimentScore?: number; // 0 - 10
  analystRating?: number;  // 0 - 10
  
  // DCF Specifics
  fcf?: number; // Free Cash Flow in absolute currency
  discountRate?: number; // WACC in %
  terminalGrowth?: number; // terminal growth rate in %
  sharesOutstanding?: number;
}
