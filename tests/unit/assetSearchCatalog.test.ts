import { describe, expect, it } from 'vitest';
import {
  getAssetCatalogEntry,
  getAssetCatalogIntegrity,
  getAssetClassCounts,
  getAssetSearchCatalog,
} from '../../src/lib/assetSearchCatalog';

const TYPES = ['crypto', 'stock', 'forex', 'commodity', 'index', 'bond'] as const;

describe('asset search catalog expansion and integrity', () => {
  it('adds exactly 100 new unique assets to every supported asset class', () => {
    const integrity = getAssetCatalogIntegrity();

    expect(integrity.status).toBe('READY');
    for (const type of TYPES) {
      expect(integrity.expansionTarget[type]).toBe(100);
      expect(integrity.expansionAdded[type]).toBe(100);
      expect(integrity.shortfalls[type]).toBeUndefined();
    }
  });

  it('keeps the merged catalog globally unique and structurally valid', () => {
    const catalog = getAssetSearchCatalog();
    const integrity = getAssetCatalogIntegrity();
    const symbols = catalog.map(asset => asset.symbol);

    expect(new Set(symbols).size).toBe(symbols.length);
    expect(integrity.duplicateSymbols).toEqual([]);
    expect(integrity.invalidSymbols).toEqual([]);
    expect(integrity.invalidNames).toEqual([]);
    expect(integrity.missingSources).toEqual([]);
    expect(integrity.unsupportedTypes).toEqual([]);
    expect(integrity.scoreImpactEnabled).toBe(false);
  });

  it('reports the real merged asset count for every class', () => {
    const catalog = getAssetSearchCatalog();
    const counts = getAssetClassCounts();

    for (const type of TYPES) {
      expect(counts[type]).toBe(catalog.filter(asset => asset.type === type).length);
      expect(counts[type]).toBeGreaterThanOrEqual(100);
    }
    expect(Object.values(counts).reduce((sum, count) => sum + count, 0)).toBe(catalog.length);
  });

  it('does not count compatibility aliases as newly added crypto or stock assets', () => {
    const expansion = getAssetSearchCatalog().filter(asset => asset.origin === 'catalog-expansion');

    expect(expansion.filter(asset => asset.type === 'crypto').every(asset => !asset.symbol.includes('_'))).toBe(true);
    expect(expansion.filter(asset => asset.type === 'stock').every(asset => !/\d$/.test(asset.symbol))).toBe(true);
  });

  it('keeps catalog presence separate from market-data and scoring evidence', () => {
    const expansion = getAssetSearchCatalog().filter(asset => asset.origin === 'catalog-expansion');
    const forbiddenMarketFields = [
      'price', 'change24h', 'expectedReturn', 'volatility', 'drift', 'marketCap', 'volume24h', 'score',
    ];

    expect(expansion.length).toBe(600);
    for (const asset of expansion) {
      for (const field of forbiddenMarketFields) {
        expect(field in asset).toBe(false);
      }
    }
  });

  it('binds commodity and sovereign benchmark assets to explicit evidence contracts without turning catalog metadata into evidence', () => {
    expect(getAssetCatalogEntry('CMD_GOLD_COMEX')).toMatchObject({
      screeningContract: 'catalog-only',
      evidenceScoringContract: 'commodity-evidence-scoring/1.0.0',
    });
    expect(getAssetCatalogEntry('GB_US_2Y')).toMatchObject({
      screeningContract: 'catalog-only',
      evidenceScoringContract: 'sovereign-benchmark-yield-scoring/1.0.0',
      providerMappingContract: 'sovereign-bond-provider-mapping/1.0.0',
    });
    expect(getAssetCatalogEntry('AAA-CORP')?.evidenceScoringContract).toBeUndefined();
  });

  it('binds every index to the versioned provider mapping and resolves aliases', () => {
    expect(getAssetCatalogEntry('NDX')?.providerMappingContract).toBe('index-provider-mapping/1.0.0');
    expect(getAssetCatalogEntry('^NDX')?.symbol).toBe('NDX');
  });

  it('allows new crypto, stock and forex catalog entries to enter provenance-backed runtime paths', () => {
    expect(getAssetCatalogEntry('TON')?.screeningContract).toBe('crypto-provenance');
    expect(getAssetCatalogEntry('ABT')?.screeningContract).toBe('traditional-provenance');
    expect(getAssetCatalogEntry('USDNOK')?.screeningContract).toBe('traditional-provenance');
  });
});
