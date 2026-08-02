import { describe, expect, it } from 'vitest';
import { INDEX_FMP_TICKERS } from '../../server/fmpIndices';
import { getAssetSearchCatalog } from '../../src/lib/assetSearchCatalog';
import {
  getAllIndexProviderMappings,
  getIndexProviderMapping,
  validateTwelveDataIndexIdentity,
} from '../../src/services/indexProviderMapping';

describe('index provider mapping', () => {
  it('covers every catalog index with at least one versioned provider candidate', () => {
    const indexCount = getAssetSearchCatalog().filter(asset => asset.type === 'index').length;
    const mappings = getAllIndexProviderMappings();
    expect(mappings).toHaveLength(indexCount);
    expect(mappings.every(mapping => mapping.version === 'index-provider-mapping/1.0.0')).toBe(true);
    expect(mappings.every(mapping => mapping.candidates.length >= 1)).toBe(true);
  });

  it('preserves every legacy FMP mapping as priority one', () => {
    for (const [symbol, providerSymbol] of Object.entries(INDEX_FMP_TICKERS)) {
      const mapping = getIndexProviderMapping(symbol);
      const fmp = mapping?.candidates.find(candidate => candidate.provider === 'FMP');
      expect(fmp).toMatchObject({ providerSymbol, priority: 1, mappingMode: 'approved-static' });
    }
  });

  it('adds runtime-verified TwelveData mappings for expanded indices', () => {
    expect(getIndexProviderMapping('NDX')?.candidates.find(candidate => candidate.provider === 'TwelveData')).toMatchObject({
      providerSymbol: 'NDX', mappingMode: 'runtime-verified', priority: 1,
    });
    expect(getIndexProviderMapping('EGX30')?.candidates.find(candidate => candidate.provider === 'TwelveData')?.providerSymbol).toBe('CASE30');
  });

  it('rejects provider identity mismatches and non-index metadata', () => {
    const mapping = getIndexProviderMapping('NDX');
    expect(mapping).toBeDefined();
    expect(validateTwelveDataIndexIdentity(mapping!, { symbol: 'NDX', type: 'Index' })).toBe(true);
    expect(validateTwelveDataIndexIdentity(mapping!, { symbol: 'SPX', type: 'Index' })).toBe(false);
    expect(validateTwelveDataIndexIdentity(mapping!, { symbol: 'NDX', type: 'Common Stock' })).toBe(false);
  });
});
