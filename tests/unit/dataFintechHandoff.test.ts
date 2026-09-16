import { describe, expect, it } from 'vitest';
import { createUniversalAssetIdentity } from '../../src/platform/Scoring/UniversalAssetAdapter';
import {
  MARKET_DATA_CONTRACT_VERSION,
  type CanonicalMarketDataSnapshot,
} from '../../src/platform/MarketData/contracts';
import {
  buildValidatedDataInputFromSnapshot,
  type ValidatedDataInput,
} from '../../src/platform/MarketData/ValidatedDataInput';
import { projectValidatedDataInputForFintech } from '../../src/platform/MarketData/FintechDataHandoff';

const asset = createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' });
const EVALUATED_AT = '2026-09-14T12:00:00.000Z';

function snapshot(
  overrides: Partial<CanonicalMarketDataSnapshot> = {},
): CanonicalMarketDataSnapshot {
  return {
    contractVersion: MARKET_DATA_CONTRACT_VERSION,
    provider: 'test-live',
    providerFeed: 'iex',
    symbol: 'AAPL',
    assetClass: 'stock',
    currency: 'USD',
    sourceTimestamp: '2026-09-14T11:59:30.000Z',
    ingestedAt: '2026-09-14T11:59:31.000Z',
    receivedAt: '2026-09-14T11:59:31.000Z',
    freshnessMs: 30_000,
    qualityState: 'LIVE',
    isRealtime: true,
    isDelayed: false,
    correlationId: 'corr-data-fintech-handoff',
    price: 210.25,
    evidenceId: 'evd:test-live:AAPL:price',
    ...overrides,
  };
}

function validated(
  overrides: Partial<CanonicalMarketDataSnapshot> = {},
): ValidatedDataInput {
  return buildValidatedDataInputFromSnapshot(
    asset,
    snapshot(overrides),
    { maxAgeMs: 90_000, evaluatedAt: EVALUATED_AT },
  );
}

describe('PVC-11 -> PVC-12 fail-closed DATA handoff', () => {
  it('exports only a fresh, identity-bound, provenance-complete numeric observation', () => {
    const projection = projectValidatedDataInputForFintech(validated());

    expect(projection.admissibleForNumericFeatures).toBe(true);
    expect(projection.blockingReasons).toEqual([]);
    expect(projection.numericObservations).toEqual([expect.objectContaining({
      field: 'price',
      value: 210.25,
      providerId: 'test-live',
      providerFeed: 'iex',
      evidenceRef: 'evd:test-live:AAPL:price',
      observedAt: '2026-09-14T11:59:30.000Z',
      retrievedAt: '2026-09-14T11:59:31.000Z',
      status: 'PASS',
    })]);
  });

  it('strips numeric values from STALE input', () => {
    const stale = validated({
      sourceTimestamp: '2026-09-14T10:00:00.000Z',
      ingestedAt: '2026-09-14T10:00:01.000Z',
      receivedAt: '2026-09-14T10:00:01.000Z',
    });

    expect(stale.aggregateStatus).toBe('STALE');
    expect(stale.observations[0]?.value).toBe(210.25);

    const projection = projectValidatedDataInputForFintech(stale);
    expect(projection.admissibleForNumericFeatures).toBe(false);
    expect(projection.numericObservations).toEqual([]);
    expect(projection.blockingReasons).toContain('aggregate-status:STALE');
  });

  it('strips numeric values from wrong-identity input', () => {
    const wrongIdentity = validated({ symbol: 'MSFT' });

    expect(wrongIdentity.aggregateStatus).toBe('FAIL');
    expect(wrongIdentity.provenanceComplete).toBe(false);
    expect(wrongIdentity.observations[0]?.value).toBe(210.25);

    const projection = projectValidatedDataInputForFintech(wrongIdentity);
    expect(projection.admissibleForNumericFeatures).toBe(false);
    expect(projection.numericObservations).toEqual([]);
    expect(projection.blockingReasons).toContain('aggregate-status:FAIL');
    expect(projection.blockingReasons).toContain('provenance-incomplete');
  });

  it('strips numeric values when provenance is incomplete', () => {
    const noEvidence = validated({ evidenceId: null });

    expect(noEvidence.aggregateStatus).toBe('FAIL');
    expect(noEvidence.provenanceComplete).toBe(false);
    expect(noEvidence.observations[0]?.value).toBe(210.25);

    const projection = projectValidatedDataInputForFintech(noEvidence);
    expect(projection.admissibleForNumericFeatures).toBe(false);
    expect(projection.numericObservations).toEqual([]);
    expect(projection.blockingReasons).toContain('provenance-incomplete');
  });

  it('keeps MISSING required data non-numeric', () => {
    const missing = validated({
      provider: 'none',
      providerFeed: null,
      sourceTimestamp: null,
      freshnessMs: null,
      qualityState: 'UNAVAILABLE',
      price: null,
      evidenceId: null,
    });

    expect(missing.aggregateStatus).toBe('MISSING');
    expect(missing.missingRequiredFields).toEqual(['price']);

    const projection = projectValidatedDataInputForFintech(missing);
    expect(projection.admissibleForNumericFeatures).toBe(false);
    expect(projection.numericObservations).toEqual([]);
    expect(projection.blockingReasons).toContain('aggregate-status:MISSING');
    expect(projection.blockingReasons).toContain('missing-required:price');
  });

  it('keeps UNKNOWN state non-numeric even when a raw value is present', () => {
    const pass = validated();
    const unknown: ValidatedDataInput = {
      ...pass,
      aggregateStatus: 'UNKNOWN',
      observations: pass.observations.map(observation => ({
        ...observation,
        status: 'UNKNOWN' as const,
      })),
      nonComputableReasons: ['upstream state cannot be established'],
    };

    const projection = projectValidatedDataInputForFintech(unknown);
    expect(projection.admissibleForNumericFeatures).toBe(false);
    expect(projection.numericObservations).toEqual([]);
    expect(projection.blockingReasons).toContain('aggregate-status:UNKNOWN');
    expect(projection.blockingReasons).toContain('non-computable:upstream state cannot be established');
  });

  it('blocks a forged aggregate PASS when observation status is blocking', () => {
    const pass = validated();
    const inconsistent: ValidatedDataInput = {
      ...pass,
      observations: pass.observations.map(observation => ({
        ...observation,
        status: 'FAIL' as const,
      })),
    };

    const projection = projectValidatedDataInputForFintech(inconsistent);
    expect(projection.admissibleForNumericFeatures).toBe(false);
    expect(projection.numericObservations).toEqual([]);
    expect(projection.blockingReasons).toContain('aggregate-status-mismatch:PASS:FAIL');
  });
});
