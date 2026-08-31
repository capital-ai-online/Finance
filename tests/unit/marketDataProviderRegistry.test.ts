import { describe, expect, it } from 'vitest';
import { getMarketDataProviderRegistry } from '../../src/services/marketDataProviderRegistry';

describe('marketDataProviderRegistry DATA safety contract', () => {
  it('keeps Stooq non-productive until canonical gateway migration', () => {
    const stooq = getMarketDataProviderRegistry().find(entry => entry.id === 'Stooq');
    expect(stooq).toMatchObject({
      enabled: false,
      activation: 'reference-only',
    });
  });

  it('declares only the canonical Alpha Vantage credential identity', () => {
    const alphaVantage = getMarketDataProviderRegistry().find(entry => entry.id === 'AlphaVantage');
    expect(alphaVantage).toMatchObject({
      enabled: true,
      activation: 'active',
      environmentVariable: 'ALPHA_VANTAGE_API_KEY',
    });
    expect(alphaVantage?.environmentVariable).not.toBe('ALPHA_VANTAGE_KEY');
  });
});
