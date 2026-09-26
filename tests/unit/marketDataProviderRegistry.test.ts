import { describe, expect, it } from 'vitest';
import {
  LEGACY_PROVIDER_COMPATIBILITY_BINDINGS,
  getProviderMatrixEntry,
} from '../../src/platform/MarketData/ProviderMatrix';
import { getMarketDataProviderRegistry } from '../../src/services/marketDataProviderRegistry';

describe('marketDataProviderRegistry compatibility projection', () => {
  it('materializes every legacy provider identity from existing ProviderMatrix entries', () => {
    const registry = getMarketDataProviderRegistry();

    expect(registry).toHaveLength(LEGACY_PROVIDER_COMPATIBILITY_BINDINGS.length);
    expect(new Set(registry.map(entry => entry.id)).size).toBe(registry.length);

    for (const binding of LEGACY_PROVIDER_COMPATIBILITY_BINDINGS) {
      expect(binding.matrixEntryIds.length, binding.legacyId).toBeGreaterThan(0);
      for (const matrixId of binding.matrixEntryIds) {
        expect(getProviderMatrixEntry(matrixId), `${binding.legacyId} -> ${matrixId}`).toBeDefined();
      }
      expect(registry.find(entry => entry.id === binding.legacyId), binding.legacyId).toBeDefined();
    }
  });

  it('keeps Stooq non-productive until canonical gateway migration', () => {
    const stooq = getMarketDataProviderRegistry().find(entry => entry.id === 'Stooq');
    expect(stooq).toMatchObject({
      enabled: false,
      activation: 'reference-only',
    });
  });

  it('derives the canonical Alpha Vantage credential identity and stock-fundamental capability', () => {
    const alphaVantage = getMarketDataProviderRegistry().find(entry => entry.id === 'AlphaVantage');
    expect(alphaVantage).toMatchObject({
      enabled: true,
      activation: 'active',
      environmentVariable: 'ALPHA_VANTAGE_API_KEY',
      requiresApiKey: true,
    });
    expect(alphaVantage?.capabilities).toEqual(expect.arrayContaining(['fundamentals', 'history', 'quotes']));
    expect(alphaVantage?.environmentVariable).not.toBe('ALPHA_VANTAGE_KEY');
  });

  it('preserves compatibility routing priorities for active history providers', () => {
    const registry = getMarketDataProviderRegistry();
    const priorities = Object.fromEntries(
      registry
        .filter(entry => ['CoinGecko', 'Binance', 'Kraken', 'CoinAPI', 'TwelveData', 'EODHD'].includes(entry.id))
        .map(entry => [entry.id, entry.basePriority]),
    );

    expect(priorities).toEqual({
      CoinGecko: 1,
      Binance: 2,
      Kraken: 3,
      CoinAPI: 2,
      TwelveData: 3,
      EODHD: 4,
    });
  });

  it('projects FMP, FRED and ECB capabilities from the canonical matrix', () => {
    const registry = getMarketDataProviderRegistry();
    const fmp = registry.find(entry => entry.id === 'FMP');
    const fred = registry.find(entry => entry.id === 'FRED');
    const ecb = registry.find(entry => entry.id === 'ECB');

    expect(fmp?.assetClasses).toEqual(expect.arrayContaining(['stock', 'index']));
    expect(fmp?.capabilities).toEqual(expect.arrayContaining(['snapshot', 'quotes', 'history', 'fundamentals']));

    expect(fred).toMatchObject({
      enabled: true,
      activation: 'active',
      environmentVariable: 'FRED_API_KEY',
    });
    expect(fred?.capabilities).toContain('macro-series');

    expect(ecb).toMatchObject({
      enabled: true,
      activation: 'reference-only',
    });
    expect(ecb?.capabilities).toContain('macro-series');
  });
});
