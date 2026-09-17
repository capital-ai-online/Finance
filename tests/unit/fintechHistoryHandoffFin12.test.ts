import { describe, expect, it } from 'vitest';
import { createUniversalAssetIdentity } from '../../src/platform/Scoring/UniversalAssetAdapter';
import {
  MARKET_DATA_HISTORY_CONTRACT_VERSION,
  type CanonicalMarketDataHistory,
} from '../../src/platform/MarketData/contracts';
import { buildValidatedHistoryInput } from '../../src/platform/MarketData/ValidatedDataInput';
import { projectValidatedHistoryInputForFintech } from '../../src/platform/MarketData/FintechHistoryHandoff';

function history(
  symbol: string,
  assetClass: CanonicalMarketDataHistory['assetClass'],
  points: CanonicalMarketDataHistory['points'],
  overrides: Partial<CanonicalMarketDataHistory> = {},
): CanonicalMarketDataHistory {
  return {
    contractVersion: MARKET_DATA_HISTORY_CONTRACT_VERSION,
    provider: 'canonical-history-provider',
    providerFeed: 'daily-history',
    symbol,
    assetClass,
    currency: 'USD',
    receivedAt: '2026-09-17T00:00:00.000Z',
    qualityState: 'HISTORICAL',
    correlationId: `corr-fin12-history-${symbol.toLowerCase()}`,
    points,
    evidenceId: `evd:history:${symbol}:daily`,
    ...overrides,
  };
}

describe('DATA FIN-12 canonical history handoff', () => {
  it('projects validated crypto history without creating a second history authority', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'BTC', assetClass: 'crypto' });
    const validated = buildValidatedHistoryInput(asset, history('BTC', 'crypto', [
      { timestamp: '2026-09-16T12:00:00.000Z', close: 115_000 },
      { timestamp: '2026-09-17T00:00:00.000Z', close: 116_500 },
    ]));

    expect(validated.status).toBe('PASS');
    const projection = projectValidatedHistoryInputForFintech(validated);
    expect(projection.computability).toBe('COMPUTABLE');
    expect(projection.valueSemantics).toBe('POSITIVE_PRICE');
    expect(projection.points.map(point => point.value)).toEqual([115_000, 116_500]);
  });

  it('projects validated traditional history through the same canonical contract', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' });
    const validated = buildValidatedHistoryInput(asset, history('AAPL', 'stock', [
      { timestamp: '2026-09-16T12:00:00.000Z', close: 245.25 },
      { timestamp: '2026-09-17T00:00:00.000Z', close: 247.1 },
    ], {
      provider: 'traditional-history-provider',
      providerFeed: 'stock-history',
      evidenceId: 'evd:traditional:AAPL:stock-history',
    }));

    expect(validated.status).toBe('PASS');
    const projection = projectValidatedHistoryInputForFintech(validated);
    expect(projection.computability).toBe('COMPUTABLE');
    expect(projection.assetId).toBe(asset.assetId);
    expect(projection.providerFeed).toBe('stock-history');
  });

  it('retains finite negative sovereign yields only under explicit SIGNED_VALUE semantics', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'DE10Y', assetClass: 'bond' });
    const validated = buildValidatedHistoryInput(asset, history('DE10Y', 'bond', [
      { timestamp: '2026-09-16T12:00:00.000Z', close: -0.25 },
      { timestamp: '2026-09-17T00:00:00.000Z', close: -0.1 },
    ], {
      provider: 'test-sovereign-yield',
      providerFeed: 'daily-yield',
      currency: 'PCT',
      evidenceId: 'evd:test-sovereign-yield:DE10Y:daily-yield',
    }), {
      valueSemantics: 'SIGNED_VALUE',
    });

    expect(validated.status).toBe('PASS');
    const projection = projectValidatedHistoryInputForFintech(validated);
    expect(projection.computability).toBe('COMPUTABLE');
    expect(projection.valueSemantics).toBe('SIGNED_VALUE');
    expect(projection.points.map(point => point.value)).toEqual([-0.25, -0.1]);
  });

  it('turns stale history into NOT_COMPUTABLE and exports no history values', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'BTC', assetClass: 'crypto' });
    const validated = buildValidatedHistoryInput(asset, history('BTC', 'crypto', [
      { timestamp: '2026-09-15T00:00:00.000Z', close: 112_000 },
    ]));

    expect(validated.status).toBe('STALE');
    const projection = projectValidatedHistoryInputForFintech(validated);
    expect(projection.computability).toBe('NOT_COMPUTABLE');
    expect(projection.points).toEqual([]);
    expect(projection.blockingReasons).toContain('source-status:STALE');
  });

  it('turns missing provenance into NOT_COMPUTABLE and exports no history values', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' });
    const validated = buildValidatedHistoryInput(asset, history('AAPL', 'stock', [
      { timestamp: '2026-09-17T00:00:00.000Z', close: 247.1 },
    ], {
      evidenceId: null,
    }));

    expect(validated.status).toBe('FAIL');
    expect(validated.provenanceComplete).toBe(false);
    const projection = projectValidatedHistoryInputForFintech(validated);
    expect(projection.computability).toBe('NOT_COMPUTABLE');
    expect(projection.points).toEqual([]);
    expect(projection.blockingReasons).toContain('provenance-incomplete');
  });
});
