import { describe, expect, it } from 'vitest';
import {
  EQUITY_ANTI_CORRELATION_RULES,
  EQUITY_FACTOR_FAMILIES,
  EQUITY_RESEARCH_FEATURE_BINDINGS,
  EQUITY_RESEARCH_MODEL_CONTRACT,
  createUnclassifiedEquityClassification,
} from '../../src/platform/Scoring/EquityModelContracts';

describe('Equity P1-A/P1-B model contracts', () => {
  it('defines exactly six top-level factor families without executable weights', () => {
    expect(EQUITY_FACTOR_FAMILIES).toEqual([
      'quality',
      'valuation',
      'growth',
      'momentum',
      'financialStrength',
      'capitalAllocation',
    ]);
    expect(EQUITY_RESEARCH_MODEL_CONTRACT.modelVersion).toBe('0.2.0');
    expect(EQUITY_RESEARCH_MODEL_CONTRACT.featureContractVersion).toBe('equity-multifactor-features/0.2.0');
    expect(EQUITY_RESEARCH_MODEL_CONTRACT.lifecycle).toBe('challenger');
    expect(EQUITY_RESEARCH_MODEL_CONTRACT.scoreEligible).toBe(false);
    expect(EQUITY_RESEARCH_MODEL_CONTRACT.executionEligible).toBe(false);
    expect(EQUITY_RESEARCH_MODEL_CONTRACT.executableWeights).toBe(false);
  });

  it('binds every feature to one family, phase and correlation group', () => {
    const keys = EQUITY_RESEARCH_FEATURE_BINDINGS.map(feature => feature.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(EQUITY_RESEARCH_FEATURE_BINDINGS.every(feature => Boolean(feature.family))).toBe(true);
    expect(EQUITY_RESEARCH_FEATURE_BINDINGS.every(feature => Boolean(feature.correlationGroup))).toBe(true);
    expect(EQUITY_RESEARCH_FEATURE_BINDINGS.every(feature => feature.phase === 'P1A' || feature.phase === 'P1B')).toBe(true);
    expect(EQUITY_RESEARCH_FEATURE_BINDINGS.filter(feature => feature.family === 'momentum')
      .every(feature => feature.correlationGroup === 'equity-price-path')).toBe(true);
  });

  it('keeps Growth and Capital Allocation out of P1-A and introduces them only in P1-B', () => {
    const p1a = EQUITY_RESEARCH_FEATURE_BINDINGS.filter(feature => feature.phase === 'P1A');
    const p1b = EQUITY_RESEARCH_FEATURE_BINDINGS.filter(feature => feature.phase === 'P1B');
    expect(p1a.some(feature => feature.family === 'growth')).toBe(false);
    expect(p1a.some(feature => feature.family === 'capitalAllocation')).toBe(false);
    expect(p1b.some(feature => feature.family === 'growth')).toBe(true);
    expect(p1b.some(feature => feature.family === 'capitalAllocation')).toBe(true);
    expect(EQUITY_ANTI_CORRELATION_RULES.some(rule => rule.includes('Dividend yield alone'))).toBe(true);
    expect(EQUITY_ANTI_CORRELATION_RULES.some(rule => rule.includes('SEC filing evidence supersedes'))).toBe(true);
  });

  it('uses explicit unclassified metadata rather than guessed classification', () => {
    const classification = createUnclassifiedEquityClassification();
    expect(classification.primaryProfile).toBe('unclassified');
    expect(classification.sizeBucket).toBe('unknown');
    expect(classification.classificationSource).toBe('unclassified');
  });
});
