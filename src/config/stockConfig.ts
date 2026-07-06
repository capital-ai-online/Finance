/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StockInput, StockCategoryMain } from '../types/stock';

export interface StockScoringVersion {
  version: string;
  releasedAt: string;
  description: string;
  weights: {
    value: number;
    growth: number;
    momentum: number;
    quality: number;
    risk: number; // Penalty weight
    dcf: number;
    screeningFit: number;
  };
}

export const STOCK_SCORING_VERSIONS: Record<string, StockScoringVersion> = {
  'v0.5.5': {
    version: '0.5.5',
    releasedAt: '2026-07-06',
    description: 'CAPITAL-AI Stock Scoring & Analytics Engine v0.5.5 (Beta-Phase)',
    weights: {
      value: 0.20,        // 20%
      growth: 0.20,       // 20%
      momentum: 0.15,     // 15%
      quality: 0.25,      // 25%
      dcf: 0.10,          // 10%
      screeningFit: 0.10, // 10%
      risk: 0.15          // Subtracts up to 15 points
    }
  }
};

export const ACTIVE_STOCK_VERSION = 'v0.5.5';

export interface DBStockItem extends StockInput {
  symbol: string;
  name: string;
  category_main: StockCategoryMain;
  category_sub: string;
  valuation_mode: string;
}

export const STOCKS_DATABASE: Record<string, DBStockItem> = {
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    category_main: 'Technology',
    category_sub: 'Consumer Hardware & Cloud Ecosystems',
    valuation_mode: 'Cashflow Compounder & Ecosystem Multiple',
    price: 189.30,
    peRatio: 28.5,
    pbRatio: 42.1,
    evToEbitda: 21.4,
    fcfYield: 4.1,
    dividendYield: 0.51,
    debtToEquity: 1.45,
    currentRatio: 1.2,
    roe: 154.2,
    roic: 58.6,
    operatingMargin: 30.2,
    revenueGrowth3Y: 8.5,
    epsGrowth3Y: 11.2,
    fcfGrowth3Y: 9.8,
    reinvestmentRate: 42.0,
    beta: 1.15,
    volatility30D: 18.0,
    momentum3M: 8.5,
    momentum6M: 12.0,
    momentum12M: 20.4,
    rsi14: 56.4,
    trendStrength: 78.0,
    sentimentScore: 7.8,
    analystRating: 8.2,
    fcf: 99580000000,
    discountRate: 8.5,
    terminalGrowth: 2.5,
    sharesOutstanding: 15450000000
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    category_main: 'Technology',
    category_sub: 'Enterprise Software & Cloud AI Infrastructure',
    valuation_mode: 'High-Margin Recurring Revenue & Compounder',
    price: 415.60,
    peRatio: 35.2,
    pbRatio: 12.4,
    evToEbitda: 25.6,
    fcfYield: 3.4,
    dividendYield: 0.72,
    debtToEquity: 0.28,
    currentRatio: 1.4,
    roe: 38.5,
    roic: 31.2,
    operatingMargin: 44.6,
    revenueGrowth3Y: 12.4,
    epsGrowth3Y: 15.6,
    fcfGrowth3Y: 14.2,
    reinvestmentRate: 58.0,
    beta: 1.05,
    volatility30D: 15.2,
    momentum3M: 11.2,
    momentum6M: 18.5,
    momentum12M: 28.2,
    rsi14: 61.2,
    trendStrength: 85.0,
    sentimentScore: 8.4,
    analystRating: 9.1,
    fcf: 67440000000,
    discountRate: 8.0,
    terminalGrowth: 3.0,
    sharesOutstanding: 7430000000
  },
  GOOGL: {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    category_main: 'Technology',
    category_sub: 'Digital Advertising & AI Services',
    valuation_mode: 'Cashflow Compounder with Deep Option Value',
    price: 172.50,
    peRatio: 25.4,
    pbRatio: 7.2,
    evToEbitda: 16.8,
    fcfYield: 4.8,
    dividendYield: 0.46,
    debtToEquity: 0.06,
    currentRatio: 2.1,
    roe: 27.4,
    roic: 24.5,
    operatingMargin: 29.4,
    revenueGrowth3Y: 11.5,
    epsGrowth3Y: 14.8,
    fcfGrowth3Y: 12.0,
    reinvestmentRate: 50.0,
    beta: 1.10,
    volatility30D: 20.4,
    momentum3M: 14.2,
    momentum6M: 22.5,
    momentum12M: 35.6,
    rsi14: 59.5,
    trendStrength: 82.0,
    sentimentScore: 8.1,
    analystRating: 8.8,
    fcf: 69120000000,
    discountRate: 8.8,
    terminalGrowth: 2.5,
    sharesOutstanding: 12400000000
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    category_main: 'Technology',
    category_sub: 'E-Commerce Logistics & Cloud AI Scaling',
    valuation_mode: 'Operating Cashflow Yield & Infrastructure Multiples',
    price: 185.20,
    peRatio: 40.1,
    pbRatio: 8.8,
    evToEbitda: 14.5,
    fcfYield: 3.2,
    dividendYield: 0.0,
    debtToEquity: 0.42,
    currentRatio: 1.05,
    roe: 20.5,
    roic: 14.8,
    operatingMargin: 9.2,
    revenueGrowth3Y: 14.6,
    epsGrowth3Y: 35.4,
    fcfGrowth3Y: 42.0,
    reinvestmentRate: 85.0,
    beta: 1.20,
    volatility30D: 22.1,
    momentum3M: 6.2,
    momentum6M: 10.4,
    momentum12M: 18.2,
    rsi14: 52.1,
    trendStrength: 68.0,
    sentimentScore: 7.2,
    analystRating: 8.4,
    fcf: 36800000000,
    discountRate: 9.2,
    terminalGrowth: 3.0,
    sharesOutstanding: 10400000000
  },
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    category_main: 'Technology',
    category_sub: 'High-Performance AI Silicon & Core Accelerators',
    valuation_mode: 'Hyper-Growth Hardware Scaler Multiple',
    price: 127.40,
    peRatio: 68.4,
    pbRatio: 38.6,
    evToEbitda: 48.2,
    fcfYield: 1.8,
    dividendYield: 0.03,
    debtToEquity: 0.15,
    currentRatio: 3.4,
    roe: 115.4,
    roic: 92.5,
    operatingMargin: 54.2,
    revenueGrowth3Y: 112.5,
    epsGrowth3Y: 185.2,
    fcfGrowth3Y: 210.0,
    reinvestmentRate: 92.0,
    beta: 1.85,
    volatility30D: 45.4,
    momentum3M: 35.6,
    momentum6M: 78.4,
    momentum12M: 195.2,
    rsi14: 68.2,
    trendStrength: 96.0,
    sentimentScore: 9.4,
    analystRating: 9.6,
    fcf: 27500000000,
    discountRate: 11.5,
    terminalGrowth: 3.5,
    sharesOutstanding: 24500000000
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Consumer',
    category_main: 'Consumer',
    category_sub: 'Autonomous Vehicles & Distributed Energy',
    valuation_mode: 'Volatile Premium Multiple & Tech-Disruptor Scaler',
    price: 178.40,
    peRatio: 48.2,
    pbRatio: 9.5,
    evToEbitda: 28.4,
    fcfYield: 2.1,
    dividendYield: 0.0,
    debtToEquity: 0.05,
    currentRatio: 1.8,
    roe: 18.4,
    roic: 12.6,
    operatingMargin: 11.4,
    revenueGrowth3Y: 18.5,
    epsGrowth3Y: 22.0,
    fcfGrowth3Y: 16.5,
    reinvestmentRate: 75.0,
    beta: 1.62,
    volatility30D: 38.6,
    momentum3M: -12.4,
    momentum6M: -6.5,
    momentum12M: 14.2,
    rsi14: 42.6,
    trendStrength: 45.0,
    sentimentScore: 6.8,
    analystRating: 6.5,
    fcf: 4350000000,
    discountRate: 10.5,
    terminalGrowth: 3.0,
    sharesOutstanding: 3180000000
  },
  META: {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    category_main: 'Technology',
    category_sub: 'Social Media Advertising & Metaverse Research',
    valuation_mode: 'High Margin Ad-Revenue Multiple & AI Leveraged Cashflow',
    price: 504.20,
    peRatio: 28.1,
    pbRatio: 8.4,
    evToEbitda: 18.5,
    fcfYield: 4.2,
    dividendYield: 0.40,
    debtToEquity: 0.07,
    currentRatio: 2.3,
    roe: 28.6,
    roic: 22.4,
    operatingMargin: 38.2,
    revenueGrowth3Y: 15.4,
    epsGrowth3Y: 18.2,
    fcfGrowth3Y: 24.5,
    reinvestmentRate: 60.0,
    beta: 1.25,
    volatility30D: 28.4,
    momentum3M: 18.2,
    momentum6M: 32.4,
    momentum12M: 68.5,
    rsi14: 63.4,
    trendStrength: 88.0,
    sentimentScore: 8.2,
    analystRating: 8.9,
    fcf: 43010000000,
    discountRate: 9.0,
    terminalGrowth: 2.5,
    sharesOutstanding: 2540000000
  },
  NKE: {
    symbol: 'NKE',
    name: 'Nike Inc.',
    category_main: 'Consumer',
    category_sub: 'Global Consumer Retail & Athletic Apparel',
    valuation_mode: 'Brand-Premium Retail Compounder',
    price: 94.20,
    peRatio: 24.1,
    pbRatio: 10.2,
    evToEbitda: 17.1,
    fcfYield: 3.8,
    dividendYield: 1.56,
    debtToEquity: 0.65,
    currentRatio: 1.9,
    roe: 35.2,
    roic: 22.1,
    operatingMargin: 12.4,
    revenueGrowth3Y: 4.8,
    epsGrowth3Y: 6.2,
    fcfGrowth3Y: 5.5,
    reinvestmentRate: 35.0,
    beta: 1.05,
    volatility30D: 18.5,
    momentum3M: -4.2,
    momentum6M: -8.5,
    momentum12M: -3.4,
    rsi14: 45.2,
    trendStrength: 52.0,
    sentimentScore: 6.4,
    analystRating: 7.0,
    fcf: 5400000000,
    discountRate: 8.2,
    terminalGrowth: 2.0,
    sharesOutstanding: 1510000000
  },
  JPM: {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    category_main: 'Financial',
    category_sub: 'Systemic Diversified Investment & Retail Banking',
    valuation_mode: 'Return on Equity & Book Value Multiple',
    price: 198.50,
    peRatio: 12.1,
    pbRatio: 1.65,
    evToEbitda: 9.8,
    fcfYield: 8.5,
    dividendYield: 2.42,
    debtToEquity: 1.15,
    currentRatio: 1.1,
    roe: 16.2,
    roic: 11.5,
    operatingMargin: 35.4,
    revenueGrowth3Y: 8.2,
    epsGrowth3Y: 10.5,
    fcfGrowth3Y: 9.2,
    reinvestmentRate: 30.0,
    beta: 1.12,
    volatility30D: 14.8,
    momentum3M: 12.4,
    momentum6M: 19.8,
    momentum12M: 32.5,
    rsi14: 64.2,
    trendStrength: 86.0,
    sentimentScore: 8.0,
    analystRating: 8.5,
    fcf: 38400000000,
    discountRate: 9.5,
    terminalGrowth: 1.5,
    sharesOutstanding: 2870000000
  },
  JNJ: {
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    category_main: 'Healthcare',
    category_sub: 'Pharmaceutical & Consumer Healthcare Brand',
    valuation_mode: 'Defensive Value & High Balance Sheet Quality',
    price: 148.60,
    peRatio: 15.6,
    pbRatio: 4.8,
    evToEbitda: 11.2,
    fcfYield: 5.6,
    dividendYield: 3.20,
    debtToEquity: 0.45,
    currentRatio: 1.5,
    roe: 22.4,
    roic: 16.8,
    operatingMargin: 25.1,
    revenueGrowth3Y: 3.5,
    epsGrowth3Y: 5.1,
    fcfGrowth3Y: 4.8,
    reinvestmentRate: 40.0,
    beta: 0.55,
    volatility30D: 10.5,
    momentum3M: 1.5,
    momentum6M: 3.2,
    momentum12M: -1.8,
    rsi14: 48.6,
    trendStrength: 50.0,
    sentimentScore: 7.0,
    analystRating: 7.5,
    fcf: 16200000000,
    discountRate: 7.2,
    terminalGrowth: 1.8,
    sharesOutstanding: 2410000000
  }
};

export function findStockConfig(query: string): DBStockItem | null {
  const normalized = query.toUpperCase().trim();
  if (STOCKS_DATABASE[normalized]) {
    return STOCKS_DATABASE[normalized];
  }

  // Fallback substring search
  for (const [sym, item] of Object.entries(STOCKS_DATABASE)) {
    if (
      item.name.toLowerCase().includes(normalized.toLowerCase()) ||
      sym.includes(normalized) ||
      normalized.includes(sym)
    ) {
      return item;
    }
  }
  return null;
}
