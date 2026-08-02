import { describe, expect, it } from 'vitest';
import {
  resetSovereignBondProviderCatalogCache,
  resolveSovereignBondProviderMapping,
} from '../../src/services/sovereignBondProviderMapping';

describe('sovereign bond provider mapping', () => {
  it('uses approved exact static GBOND mappings', async () => {
    await expect(resolveSovereignBondProviderMapping('GB_DE_10Y', { apiKey: 'unused' })).resolves.toMatchObject({
      provider: 'EODHD', providerSymbol: 'DE10Y.GBOND', mappingMode: 'approved-static',
    });
    await expect(resolveSovereignBondProviderMapping('US10Y', { apiKey: 'unused' })).resolves.toMatchObject({
      providerSymbol: 'US10Y.GBOND', mappingMode: 'approved-static',
    });
  });

  it('does not unlock corporate or non-benchmark bond catalog assets', async () => {
    await expect(resolveSovereignBondProviderMapping('AAA-CORP', { apiKey: 'unused' })).resolves.toBeNull();
  });

  it('allows a non-static tenor only when the provider GBOND catalog confirms the exact symbol', async () => {
    resetSovereignBondProviderCatalogCache();
    const fetchImpl = (async () => new Response(JSON.stringify([
      { Code: 'PT5Y', Name: 'Portugal 5 Years Government Bond' },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;

    const mapping = await resolveSovereignBondProviderMapping('GB_PT_5Y', { fetchImpl, apiKey: 'test-key' });
    expect(mapping).toMatchObject({
      providerSymbol: 'PT5Y.GBOND', mappingMode: 'provider-catalog-verified',
    });
  });

  it('fails closed when the exact provider symbol is absent', async () => {
    resetSovereignBondProviderCatalogCache();
    const fetchImpl = (async () => new Response(JSON.stringify([
      { Code: 'PT10Y', Name: 'Portugal 10 Years Government Bond' },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;

    await expect(resolveSovereignBondProviderMapping('GB_PT_5Y', { fetchImpl, apiKey: 'test-key' })).resolves.toBeNull();
  });
});
