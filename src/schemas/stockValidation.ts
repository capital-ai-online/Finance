/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StockInput } from '../types/stock';

export interface ValidationResult<T> {
  isValid: boolean;
  validatedData: T;
  errors: string[];
}

export function validateStockInput(input: any): ValidationResult<StockInput> {
  const errors: string[] = [];
  
  if (!input || typeof input !== 'object') {
    return {
      isValid: false,
      validatedData: {} as StockInput,
      errors: ['Input must be a non-null object']
    };
  }

  const symbol = typeof input.symbol === 'string' ? input.symbol.toUpperCase().trim() : '';
  const name = typeof input.name === 'string' ? input.name.trim() : '';

  if (!symbol) {
    errors.push('Missing or invalid stock "symbol" field.');
  }

  const num = (val: any): number | undefined => {
    if (val === undefined || val === null || val === '') return undefined;
    const parsed = Number(val);
    return isNaN(parsed) ? undefined : parsed;
  };

  const validatedData: StockInput = {
    symbol,
    name: name || symbol,
    price: num(input.price),
    
    peRatio: num(input.peRatio),
    pbRatio: num(input.pbRatio),
    evToEbitda: num(input.evToEbitda),
    fcfYield: num(input.fcfYield),
    dividendYield: num(input.dividendYield),
    
    debtToEquity: num(input.debtToEquity),
    currentRatio: num(input.currentRatio),
    roe: num(input.roe),
    roic: num(input.roic),
    operatingMargin: num(input.operatingMargin),
    
    revenueGrowth3Y: num(input.revenueGrowth3Y),
    epsGrowth3Y: num(input.epsGrowth3Y),
    fcfGrowth3Y: num(input.fcfGrowth3Y),
    reinvestmentRate: num(input.reinvestmentRate),
    
    beta: num(input.beta),
    volatility30D: num(input.volatility30D),
    momentum3M: num(input.momentum3M),
    momentum6M: num(input.momentum6M),
    momentum12M: num(input.momentum12M),
    rsi14: num(input.rsi14),
    trendStrength: num(input.trendStrength),
    
    sentimentScore: num(input.sentimentScore),
    analystRating: num(input.analystRating),
    
    fcf: num(input.fcf),
    discountRate: num(input.discountRate),
    terminalGrowth: num(input.terminalGrowth),
    sharesOutstanding: num(input.sharesOutstanding)
  };

  return {
    isValid: errors.length === 0,
    validatedData,
    errors
  };
}
