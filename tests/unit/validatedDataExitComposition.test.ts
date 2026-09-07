import { describe, expect, it } from 'vitest';
import { createUniversalAssetIdentity } from '../../src/platform/Scoring/UniversalAssetAdapter';
import { MARKET_DATA_CONTRACT_VERSION, MARKET_DATA_HISTORY_CONTRACT_VERSION } from '../../src/platform/MarketData/contracts';
import {
  buildValidatedDataInputFromSnapshot,
  buildValidatedHistoryInput,
} from '../../src/platform/MarketData/ValidatedDataInput';

const asset = createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' });

describe('DATA 10-14 composed exit', () => {
  it('keeps a complete fresh snapshot PASS', () => {
    const validated = buildValidatedDataInputFromSnapshot(asset, {
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: 'test-live',
      providerFeed: 'iex',
      symbol: 'AAPL',
      assetClass: 'stock',
      currency: 'USD',
      sourceTimestamp: '2026-09-07T12:00:00.000Z',
      ingestedAt: '2026-09-07T12:00:01.000Z',
      receivedAt: '2026-09-07T12:00:01.000Z',
      freshnessMs: 1_000,
      qualityState: 'LIVE',
      isRealtime: true,
      isDelayed: false,
      correlationId: 'corr-gap-close-1',
      price: 210.25,
      evidenceId: 'evd:test-live:AAPL:price',
    }, { evaluatedAt: '2026-09-07T12:00:30.000Z' });

    expect(validated.aggregateStatus).toBe('PASS');
    expect(validated.provenanceComplete).toBe(true);
  });

  it('cannot keep PASS when lineage is incomplete', () => {
    const validated = buildValidatedDataInputFromSnapshot(asset, {
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: 'test-live',
      providerFeed: 'iex',
      symbol: 'AAPL',
      assetClass: 'stock',
      currency: 'USD',
      sourceTimestamp: '2026-09-07T12:00:00.000Z',
      ingestedAt: '2026-09-07T12:00:01.000Z',
      receivedAt: '2026-09-07T12:00:01.000Z',
      freshnessMs: 1_000,
      qualityState: 'LIVE',
      isRealtime: true,
      isDelayed: false,
      correlationId: 'corr-gap-close-2',
      price: 210.25,
      evidenceId: null,
    }, { evaluatedAt: '2026-09-07T12:00:30.000Z' });

    expect(validated.aggregateStatus).toBe('FAIL');
    expect(validated.provenanceComplete).toBe(false);
  });

  it('uses the latest history bar as observedAt so older bars do not force STALE', () => {
    const validated = buildValidatedHistoryInput(asset, {
      contractVersion: MARKET_DATA_HISTORY_CONTRACT_VERSION,
      provider: 'test-history',
      providerFeed: 'daily',
      symbol: 'AAPL',
      assetClass: 'stock',
      currency: 'USD',
      receivedAt: '2026-09-07T12:00:00.000Z',
      qualityState: 'HISTORICAL',
      correlationId: 'corr-gap-close-3',
      points: [
        { timestamp: '2026-09-05T12:00:00.000Z', close: 200 },
        { timestamp: '2026-09-07T12:00:00.000Z', close: 210.25 },
      ],
      evidenceId: 'evd:test-history:AAPL:daily',
    });

    expect(validated.status).toBe('PASS');
    expect(validated.provenanceComplete).toBe(true);
  });
});
