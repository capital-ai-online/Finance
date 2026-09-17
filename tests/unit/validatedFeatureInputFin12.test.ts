import { describe, expect, it } from 'vitest';
import { createUniversalAssetIdentity } from '../../src/platform/Scoring/UniversalAssetAdapter';
import {
  MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
  type MarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/evidenceQualityContracts';
import {
  buildValidatedFeatureDataInput,
  type ValidatedFeatureFieldInput,
} from '../../src/platform/MarketData/ValidatedFeatureInput';
import { projectValidatedFeatureDataForFintech } from '../../src/platform/MarketData/FintechFeatureHandoff';

const EVALUATED_AT = '2026-09-17T00:00:30.000Z';

function evidence(
  assetId: string,
  field: string,
  overrides: Partial<MarketEvidenceQualityRecord> = {},
): MarketEvidenceQualityRecord {
  return {
    contractVersion: MARKET_EVIDENCE_DQ_CONTRACT_VERSION,
    assetId,
    providerId: 'CoinGecko',
    capability: 'market-fields',
    field,
    observedAt: '2026-09-17T00:00:00.000Z',
    retrievedAt: '2026-09-17T00:00:01.000Z',
    freshness: {
      ageMs: 30_000,
      maxAgeMs: 90_000,
      evaluatedAt: EVALUATED_AT,
    },
    qualityStatus: 'VERIFIED',
    evidenceRef: `evd:provider:${assetId}:${field}`,
    ...overrides,
  };
}

function feature(
  assetId: string,
  field: string,
  value: number | null,
  overrides: Partial<ValidatedFeatureFieldInput> = {},
): ValidatedFeatureFieldInput {
  return {
    field,
    value,
    providerFeed: 'canonical-feature-feed',
    evidence: evidence(assetId, field),
    ...overrides,
  };
}

describe('FINTECH FIN-12 validated-data field-level owner return', () => {
  it('admits crypto market-cap, volume and supply only with field-level evidence', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'BTC', assetClass: 'crypto' });
    const validated = buildValidatedFeatureDataInput(asset, [
      feature(asset.assetId, 'marketCapUsd', 1_200_000_000_000, { currency: 'USD' }),
      feature(asset.assetId, 'volume24hUsd', 45_000_000_000, { currency: 'USD' }),
      feature(asset.assetId, 'circulatingSupply', 19_900_000),
    ], {
      correlationId: 'corr-fin12-crypto-fields',
      evaluatedAt: EVALUATED_AT,
      requiredFields: ['marketCapUsd', 'volume24hUsd', 'circulatingSupply'],
    });

    expect(validated.aggregateStatus).toBe('PASS');
    expect(validated.provenanceComplete).toBe(true);
    expect(validated.missingRequiredFields).toEqual([]);

    const handoff = projectValidatedFeatureDataForFintech(validated);
    expect(handoff.computability).toBe('COMPUTABLE');
    expect(handoff.numericObservations.map(item => item.field)).toEqual([
      'marketCapUsd',
      'volume24hUsd',
      'circulatingSupply',
    ]);
    expect(handoff.numericObservations.every(item => Boolean(item.evidenceRef))).toBe(true);
  });

  it('turns a missing required crypto field into NOT_COMPUTABLE with zero numeric export', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'BTC', assetClass: 'crypto' });
    const validated = buildValidatedFeatureDataInput(asset, [
      feature(asset.assetId, 'marketCapUsd', 1_200_000_000_000),
      feature(asset.assetId, 'circulatingSupply', 19_900_000),
    ], {
      correlationId: 'corr-fin12-crypto-missing',
      evaluatedAt: EVALUATED_AT,
      requiredFields: ['marketCapUsd', 'volume24hUsd', 'circulatingSupply'],
    });

    expect(validated.aggregateStatus).toBe('MISSING');
    expect(validated.missingRequiredFields).toEqual(['volume24hUsd']);

    const handoff = projectValidatedFeatureDataForFintech(validated);
    expect(handoff.computability).toBe('NOT_COMPUTABLE');
    expect(handoff.numericObservations).toEqual([]);
  });

  it('turns stale and conflicting feature evidence into NOT_COMPUTABLE', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'BTC', assetClass: 'crypto' });
    const stale = buildValidatedFeatureDataInput(asset, [
      feature(asset.assetId, 'marketCapUsd', 1_200_000_000_000, {
        evidence: evidence(asset.assetId, 'marketCapUsd', {
          qualityStatus: 'STALE',
          freshness: {
            ageMs: 120_000,
            maxAgeMs: 90_000,
            evaluatedAt: EVALUATED_AT,
          },
        }),
      }),
    ], {
      correlationId: 'corr-fin12-stale',
      evaluatedAt: EVALUATED_AT,
      requiredFields: ['marketCapUsd'],
    });
    const conflicting = buildValidatedFeatureDataInput(asset, [
      feature(asset.assetId, 'marketCapUsd', 1_200_000_000_000, {
        evidence: evidence(asset.assetId, 'marketCapUsd', {
          qualityStatus: 'CONFLICTING',
        }),
      }),
    ], {
      correlationId: 'corr-fin12-conflict',
      evaluatedAt: EVALUATED_AT,
      requiredFields: ['marketCapUsd'],
    });

    expect(stale.aggregateStatus).toBe('STALE');
    expect(projectValidatedFeatureDataForFintech(stale).computability).toBe('NOT_COMPUTABLE');
    expect(projectValidatedFeatureDataForFintech(stale).numericObservations).toEqual([]);
    expect(conflicting.aggregateStatus).toBe('UNKNOWN');
    expect(projectValidatedFeatureDataForFintech(conflicting).computability).toBe('NOT_COMPUTABLE');
    expect(projectValidatedFeatureDataForFintech(conflicting).numericObservations).toEqual([]);
  });

  it('validates traditional fundamentals per field with provider provenance and freshness', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' });
    const fundamentals: ValidatedFeatureFieldInput[] = [
      feature(asset.assetId, 'peRatio', 31.2, {
        evidence: evidence(asset.assetId, 'peRatio', {
          providerId: 'AlphaVantage',
          capability: 'stock-fundamentals',
          evidenceRef: 'evd:alphavantage:AAPL:peRatio',
        }),
      }),
      feature(asset.assetId, 'profitMarginPct', 24.1, {
        evidence: evidence(asset.assetId, 'profitMarginPct', {
          providerId: 'AlphaVantage',
          capability: 'stock-fundamentals',
          evidenceRef: 'evd:alphavantage:AAPL:profitMarginPct',
        }),
      }),
      feature(asset.assetId, 'debtToEquity', 1.47, {
        evidence: evidence(asset.assetId, 'debtToEquity', {
          providerId: 'FMP',
          capability: 'stock-fundamentals',
          evidenceRef: 'evd:fmp:AAPL:debtToEquity',
        }),
      }),
    ];

    const validated = buildValidatedFeatureDataInput(asset, fundamentals, {
      correlationId: 'corr-fin12-traditional-fundamentals',
      evaluatedAt: EVALUATED_AT,
      requiredFields: ['peRatio', 'profitMarginPct', 'debtToEquity'],
    });

    expect(validated.aggregateStatus).toBe('PASS');
    expect(validated.provenanceComplete).toBe(true);
    expect(validated.observations.map(item => item.providerId)).toEqual([
      'AlphaVantage',
      'AlphaVantage',
      'FMP',
    ]);
    expect(projectValidatedFeatureDataForFintech(validated).computability).toBe('COMPUTABLE');
  });

  it('fails closed on an invalid traditional field instead of exporting a partial numeric set', () => {
    const asset = createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' });
    const validated = buildValidatedFeatureDataInput(asset, [
      feature(asset.assetId, 'peRatio', Number.NaN, {
        evidence: evidence(asset.assetId, 'peRatio', {
          providerId: 'AlphaVantage',
          capability: 'stock-fundamentals',
        }),
      }),
    ], {
      correlationId: 'corr-fin12-traditional-invalid',
      evaluatedAt: EVALUATED_AT,
      requiredFields: ['peRatio'],
    });

    expect(validated.aggregateStatus).toBe('FAIL');
    expect(validated.observations[0]?.value).toBeNull();
    const handoff = projectValidatedFeatureDataForFintech(validated);
    expect(handoff.computability).toBe('NOT_COMPUTABLE');
    expect(handoff.numericObservations).toEqual([]);
  });
});
