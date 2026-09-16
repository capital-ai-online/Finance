import { describe, expect, it } from 'vitest';
import { createUniversalAssetIdentity } from '../../src/platform/Scoring/UniversalAssetAdapter';
import {
  MARKET_DATA_CONTRACT_VERSION,
  MARKET_DATA_HISTORY_CONTRACT_VERSION,
  type CanonicalMarketDataHistory,
  type CanonicalMarketDataSnapshot,
} from '../../src/platform/MarketData/contracts';
import {
  buildValidatedDataInputFromFundamentals,
  buildValidatedDataInputFromSnapshot,
  buildValidatedHistoryInput,
  type FundamentalsObservationCandidate,
  type ValidatedDataInput,
} from '../../src/platform/MarketData/ValidatedDataInput';
import {
  projectValidatedDataInputForFintech,
  projectValidatedHistoryInputForFintech,
} from '../../src/platform/MarketData/FintechDataHandoff';

const EVALUATED_AT = '2026-09-16T12:00:00.000Z';
const cryptoAsset = createUniversalAssetIdentity({ symbol: 'BTC', assetClass: 'crypto' });

function cryptoSnapshot(overrides: Partial<CanonicalMarketDataSnapshot> = {}): CanonicalMarketDataSnapshot {
  return {
    contractVersion: MARKET_DATA_CONTRACT_VERSION,
    provider: 'CoinGecko',
    providerFeed: 'coins/market_data',
    symbol: 'BTC',
    assetClass: 'crypto',
    currency: 'USD',
    sourceTimestamp: '2026-09-16T11:59:30.000Z',
    ingestedAt: '2026-09-16T11:59:31.000Z',
    receivedAt: '2026-09-16T11:59:31.000Z',
    freshnessMs: 30_000,
    qualityState: 'LIVE',
    isRealtime: true,
    isDelayed: false,
    correlationId: 'corr-crypto-fin12',
    price: 61_000,
    evidenceId: 'quote:coingecko:bitcoin:USD:2026-09-16T11:59:30.000Z',
    marketCapUsd: 1_210_000_000_000,
    volume24hUsd: 31_000_000_000,
    circulatingSupply: 19_900_000,
    maxSupply: 21_000_000,
    totalSupply: 19_900_000,
    ...overrides,
  };
}

function fundamental(
  field: FundamentalsObservationCandidate['field'],
  value: number,
  overrides: Partial<FundamentalsObservationCandidate> = {},
): FundamentalsObservationCandidate {
  return {
    field,
    value,
    currency: null,
    providerId: 'AlphaVantage',
    providerFeed: 'OVERVIEW',
    evidenceRef: `financial:alphavantage:STOCK:AAPL:${field}`,
    observedAt: '2026-06-30T00:00:00.000Z',
    retrievedAt: '2026-09-16T11:55:00.000Z',
    ...overrides,
  };
}

describe('FIN-12 DATA validated feature return', () => {
  it('exports canonical crypto market and supply observations from one validated snapshot', () => {
    const input = buildValidatedDataInputFromSnapshot(
      cryptoAsset,
      cryptoSnapshot(),
      { evaluatedAt: EVALUATED_AT },
    );
    const projection = projectValidatedDataInputForFintech(input);

    expect(input.aggregateStatus).toBe('PASS');
    expect(projection.admissibleForNumericFeatures).toBe(true);
    expect(projection.numericObservations.map(item => item.field)).toEqual([
      'price',
      'marketCapUsd',
      'volume24hUsd',
      'circulatingSupply',
      'maxSupply',
      'totalSupply',
    ]);
    expect(projection.numericObservations.every(item => item.evidenceRef === cryptoSnapshot().evidenceId)).toBe(true);
  });

  it('keeps absent optional maxSupply explicit without synthesizing zero or blocking other fields', () => {
    const input = buildValidatedDataInputFromSnapshot(
      cryptoAsset,
      cryptoSnapshot({ maxSupply: null }),
      { evaluatedAt: EVALUATED_AT },
    );
    const maxSupply = input.observations.find(item => item.field === 'maxSupply');
    const projection = projectValidatedDataInputForFintech(input);

    expect(maxSupply).toMatchObject({ value: null, status: 'MISSING', required: false });
    expect(projection.admissibleForNumericFeatures).toBe(true);
    expect(projection.numericObservations.some(item => item.field === 'maxSupply')).toBe(false);
    expect(projection.numericObservations.some(item => item.value === 0)).toBe(false);
  });

  it('keeps stale canonical snapshots fail-closed for every numeric export', () => {
    const input = buildValidatedDataInputFromSnapshot(
      cryptoAsset,
      cryptoSnapshot({
        sourceTimestamp: '2026-09-16T10:00:00.000Z',
        ingestedAt: '2026-09-16T10:00:01.000Z',
        receivedAt: '2026-09-16T10:00:01.000Z',
      }),
      { evaluatedAt: EVALUATED_AT },
    );
    const projection = projectValidatedDataInputForFintech(input);

    expect(input.aggregateStatus).toBe('STALE');
    expect(projection.admissibleForNumericFeatures).toBe(false);
    expect(projection.numericObservations).toEqual([]);
  });

  it('rejects duplicate field identities at the DATA -> FINTECH boundary', () => {
    const pass = buildValidatedDataInputFromSnapshot(cryptoAsset, cryptoSnapshot(), { evaluatedAt: EVALUATED_AT });
    const duplicate: ValidatedDataInput = {
      ...pass,
      observations: [...pass.observations, pass.observations[1]!],
    };
    const projection = projectValidatedDataInputForFintech(duplicate);

    expect(projection.admissibleForNumericFeatures).toBe(false);
    expect(projection.blockingReasons).toContain('duplicate-observation-field:marketCapUsd');
  });

  it('admits the three productive traditional fundamentals only with complete field provenance', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' });
    const input = buildValidatedDataInputFromFundamentals(asset, 'corr-fundamentals', [
      fundamental('peRatio', 25.2),
      fundamental('dividendYieldPct', 1.2),
      fundamental('profitMarginPct', 24.8),
    ], { evaluatedAt: EVALUATED_AT });
    const projection = projectValidatedDataInputForFintech(input);

    expect(input.aggregateStatus).toBe('PASS');
    expect(projection.admissibleForNumericFeatures).toBe(true);
    expect(projection.numericObservations.map(item => item.field)).toEqual([
      'peRatio',
      'dividendYieldPct',
      'profitMarginPct',
    ]);
  });

  it('does not turn a retrieval timestamp into missing FMP source provenance', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' });
    const input = buildValidatedDataInputFromFundamentals(asset, 'corr-fmp-no-observed', [
      fundamental('peRatio', 25.2, { providerId: 'FMP', providerFeed: 'ratios-ttm', observedAt: null }),
      fundamental('dividendYieldPct', 1.2, { providerId: 'FMP', providerFeed: 'ratios-ttm', observedAt: null }),
      fundamental('profitMarginPct', 24.8, { providerId: 'FMP', providerFeed: 'ratios-ttm', observedAt: null }),
    ], { evaluatedAt: EVALUATED_AT });

    expect(input.aggregateStatus).toBe('FAIL');
    expect(projectValidatedDataInputForFintech(input).numericObservations).toEqual([]);
  });

  it('keeps differing provider values conflicting instead of averaging them', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' });
    const input = buildValidatedDataInputFromFundamentals(asset, 'corr-conflict', [
      fundamental('peRatio', 25.2),
      fundamental('peRatio', 27.1, {
        providerId: 'FMP',
        providerFeed: 'ratios-ttm',
        evidenceRef: 'financial:fmp:STOCK:AAPL:peRatio',
      }),
      fundamental('dividendYieldPct', 1.2),
      fundamental('profitMarginPct', 24.8),
    ], { evaluatedAt: EVALUATED_AT });

    expect(input.observations.find(item => item.field === 'peRatio')?.status).toBe('UNKNOWN');
    expect(input.aggregateStatus).toBe('UNKNOWN');
    expect(projectValidatedDataInputForFintech(input).numericObservations).toEqual([]);
  });

  it('preserves SIGNED_VALUE history semantics through the DATA -> FINTECH handoff', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'DE10Y', assetClass: 'bond' });
    const history: CanonicalMarketDataHistory = {
      contractVersion: MARKET_DATA_HISTORY_CONTRACT_VERSION,
      provider: 'test-sovereign',
      providerFeed: 'yield-history',
      symbol: 'DE10Y',
      assetClass: 'bond',
      currency: null,
      receivedAt: '2026-09-16T12:00:00.000Z',
      qualityState: 'HISTORICAL',
      correlationId: 'corr-signed-history',
      points: [{ timestamp: '2026-09-16T11:00:00.000Z', close: -0.15 }],
      evidenceId: 'evidence:sovereign:de10y',
    };
    const validated = buildValidatedHistoryInput(asset, history, { valueSemantics: 'SIGNED_VALUE' });
    const projection = projectValidatedHistoryInputForFintech(validated);

    expect(validated.status).toBe('PASS');
    expect(projection.admissibleForFeatures).toBe(true);
    expect(projection.valueSemantics).toBe('SIGNED_VALUE');
    expect(projection.points[0]?.close).toBe(-0.15);
  });
});
