import { describe, expect, it, vi } from 'vitest';
import { buildEquityResearchFoundation } from '../../server/equityResearchRuntime';

const observedAt = '2026-08-27T00:00:00.000Z';
const retrievedAt = '2026-08-28T08:00:00.000Z';

describe('Equity P1-A research runtime', () => {
  it('reuses existing providers and emits a non-authorizing research snapshot', async () => {
    const ensure = vi.fn().mockResolvedValue(undefined);
    const getFundamentals = vi.fn().mockReturnValue({
      peRatio: 20,
      profitMarginPct: 25,
      fetchedAt: Date.parse(retrievedAt),
      provenance: [
        { field: 'peRatio', provider: 'AlphaVantage', sourcePath: 'alpha://overview/AAPL', retrievedAt, observedAt, value: 20 },
        { field: 'profitMarginPct', provider: 'AlphaVantage', sourcePath: 'alpha://overview/AAPL', retrievedAt, observedAt, value: 25 },
      ],
    });
    const generate = vi.fn().mockResolvedValue({
      symbol: 'AAPL',
      assetType: 'stock',
      trend: 0.8,
      provenance: [{
        field: 'trend',
        provider: 'Stooq',
        sourcePath: 'stooq://AAPL',
        retrievedAt,
        observedAt,
        value: 0.8,
        unit: 'normalized-0-1',
        derivedFrom: ['close-history'],
      }],
    });

    const result = await buildEquityResearchFoundation({
      symbol: ' aapl ',
      evaluatedAt: '2026-08-28T12:00:00.000Z',
    }, {
      ensureFundamentalsFresh: ensure,
      getCachedFundamentals: getFundamentals,
      generateTraditionalAssetInputs: generate,
    });

    expect(ensure).toHaveBeenCalledWith('AAPL');
    expect(generate).toHaveBeenCalledWith('AAPL', 'stock', expect.objectContaining({ peRatio: 20 }));
    expect(result.symbol).toBe('AAPL');
    expect(result.publicRouteExposed).toBe(false);
    expect(result.canonical).toBe(false);
    expect(result.scoreEligible).toBe(false);
    expect(result.executionEligible).toBe(false);
    expect(result.snapshot.researchCompositeScore).toBeNull();
    expect(result.snapshot.classification.primaryProfile).toBe('unclassified');
  });

  it('does not invent fundamentals when the provider cache is empty', async () => {
    const result = await buildEquityResearchFoundation({ symbol: 'MSFT', evaluatedAt: '2026-08-28T12:00:00.000Z' }, {
      ensureFundamentalsFresh: vi.fn().mockResolvedValue(undefined),
      getCachedFundamentals: vi.fn().mockReturnValue(undefined),
      generateTraditionalAssetInputs: vi.fn().mockResolvedValue({ symbol: 'MSFT', assetType: 'stock', provenance: [] }),
    });

    expect(result.snapshot.validFeatures).toHaveLength(0);
    expect(result.snapshot.missingFeatures.length).toBeGreaterThan(0);
    expect(result.snapshot.researchCompositeScore).toBeNull();
  });
});
