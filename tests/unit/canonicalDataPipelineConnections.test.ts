import { describe, expect, it } from 'vitest';
import { createUniversalAssetIdentity } from '../../src/platform/Scoring/UniversalAssetAdapter';
import { ProviderRegistry } from '../../src/platform/MarketData/ProviderRegistry';
import { HistoryProviderRegistry } from '../../src/platform/MarketData/HistoryProviderRegistry';
import { MarketDataGateway } from '../../src/platform/MarketData/MarketDataGateway';
import { MarketDataHistoryGateway } from '../../src/platform/MarketData/MarketDataHistoryGateway';
import {
  MARKET_DATA_CONTRACT_VERSION,
  MARKET_DATA_HISTORY_CONTRACT_VERSION,
  type MarketDataHistoryProvider,
  type MarketDataProvider,
} from '../../src/platform/MarketData/contracts';
import {
  buildHistoryRequestForUniversalAsset,
  buildSnapshotRequestForUniversalAsset,
  buildValidatedDataInputFromSnapshot,
  buildValidatedHistoryInput,
  snapshotToMarketEvidenceQualityRecord,
} from '../../src/platform/MarketData/ValidatedDataInput';

const NOW = Date.parse('2026-09-03T00:00:00.000Z');
const asset = createUniversalAssetIdentity({ symbol: 'AAPL', assetClass: 'stock' });

function liveProvider(overrides: Partial<Awaited<ReturnType<MarketDataProvider['getSnapshot']>>> = {}): MarketDataProvider {
  return {
    descriptor: {
      id: 'test-live',
      role: 'primary',
      capabilities: ['snapshot'],
      assetClasses: ['stock'],
      enabled: true,
      priority: 1,
    },
    async getSnapshot(request) {
      return {
        contractVersion: MARKET_DATA_CONTRACT_VERSION,
        provider: 'test-live',
        providerFeed: 'test-feed',
        symbol: request.symbol,
        assetClass: request.assetClass,
        currency: 'USD',
        sourceTimestamp: '2026-09-02T23:59:30.000Z',
        ingestedAt: '2026-09-02T23:59:31.000Z',
        receivedAt: '2026-09-02T23:59:31.000Z',
        freshnessMs: 30_000,
        qualityState: 'LIVE',
        isRealtime: true,
        isDelayed: false,
        correlationId: request.correlationId,
        price: 210.25,
        evidenceId: 'evidence:test-live:AAPL:20260902T235930Z',
        ...overrides,
      };
    },
  };
}

function historyProvider(): MarketDataHistoryProvider {
  return {
    descriptor: {
      id: 'test-history',
      role: 'primary',
      capabilities: ['history'],
      assetClasses: ['stock'],
      enabled: true,
      priority: 1,
    },
    async getHistory(request) {
      return {
        contractVersion: MARKET_DATA_HISTORY_CONTRACT_VERSION,
        provider: 'test-history',
        providerFeed: 'daily',
        symbol: request.symbol,
        assetClass: request.assetClass,
        currency: 'USD',
        receivedAt: '2026-09-03T00:00:00.000Z',
        qualityState: 'HISTORICAL',
        correlationId: request.correlationId,
        points: [
          { timestamp: '2026-09-01T00:00:00.000Z', close: 208.1 },
          { timestamp: '2026-09-02T00:00:00.000Z', close: 210.25 },
        ],
        evidenceId: 'evidence:test-history:AAPL:daily',
        barInterval: '1d',
      };
    },
  };
}

describe('canonical DATA component connections', () => {
  it('connects UAI -> snapshot request -> ProviderRegistry/MarketDataGateway -> Evidence/DQ -> ValidatedDataInput', async () => {
    const registry = new ProviderRegistry();
    registry.register(liveProvider());
    const gateway = new MarketDataGateway(registry, { nowMs: () => NOW, recordHealth: false });
    const request = buildSnapshotRequestForUniversalAsset(asset, 'corr-snapshot-1', { maxAgeMs: 90_000 });

    const result = await gateway.getSnapshot(request);
    const evidence = snapshotToMarketEvidenceQualityRecord(asset, result.snapshot, {
      maxAgeMs: 90_000,
      evaluatedAt: '2026-09-03T00:00:00.000Z',
    });
    const validated = buildValidatedDataInputFromSnapshot(asset, result.snapshot, {
      maxAgeMs: 90_000,
      evaluatedAt: '2026-09-03T00:00:00.000Z',
    });

    expect(request).toMatchObject({ symbol: 'AAPL', assetClass: 'stock', correlationId: 'corr-snapshot-1' });
    expect(result.snapshot.qualityState).toBe('LIVE');
    expect(evidence).toMatchObject({
      assetId: 'stock:AAPL',
      providerId: 'test-live',
      qualityStatus: 'VERIFIED',
      evidenceRef: 'evidence:test-live:AAPL:20260902T235930Z',
    });
    expect(validated.aggregateStatus).toBe('PASS');
    expect(validated.provenanceComplete).toBe(true);
    expect(validated.observations[0]).toMatchObject({ field: 'price', value: 210.25, status: 'PASS' });
  });

  it('connects UAI -> HistoryProviderRegistry/HistoryGateway -> validated history with preserved provenance', async () => {
    const registry = new HistoryProviderRegistry();
    registry.register(historyProvider());
    const gateway = new MarketDataHistoryGateway(registry, () => NOW);
    const request = buildHistoryRequestForUniversalAsset(asset, 'corr-history-1', { maxPoints: 2, barInterval: '1d' });

    const result = await gateway.getHistory(request);
    const validated = buildValidatedHistoryInput(asset, result.history);

    expect(result.history.correlationId).toBe('corr-history-1');
    expect(result.history.points).toHaveLength(2);
    expect(validated.status).toBe('PASS');
    expect(validated.provenanceComplete).toBe(true);
    expect(validated.evidenceRef).toBe('evidence:test-history:AAPL:daily');
  });

  it('fails closed when a provider returns a snapshot for the wrong asset identity', async () => {
    const registry = new ProviderRegistry();
    registry.register(liveProvider({ symbol: 'MSFT' }));
    const gateway = new MarketDataGateway(registry, { nowMs: () => NOW, recordHealth: false });
    const result = await gateway.getSnapshot(buildSnapshotRequestForUniversalAsset(asset, 'corr-wrong-id'));
    const validated = buildValidatedDataInputFromSnapshot(asset, result.snapshot, { evaluatedAt: '2026-09-03T00:00:00.000Z' });

    expect(validated.aggregateStatus).toBe('FAIL');
    expect(validated.provenanceComplete).toBe(false);
    expect(validated.nonComputableReasons).toContain('asset identity mismatch');
  });

  it('preserves STALE instead of silently promoting old evidence to PASS', async () => {
    const registry = new ProviderRegistry();
    registry.register(liveProvider({
      sourceTimestamp: '2026-09-02T23:00:00.000Z',
      ingestedAt: '2026-09-02T23:00:01.000Z',
      receivedAt: '2026-09-02T23:00:01.000Z',
    }));
    const gateway = new MarketDataGateway(registry, { nowMs: () => NOW, recordHealth: false });
    const result = await gateway.getSnapshot(buildSnapshotRequestForUniversalAsset(asset, 'corr-stale', { maxAgeMs: 90_000 }));

    expect(result.snapshot.qualityState).toBe('UNAVAILABLE');
    expect(result.snapshot.price).toBeNull();
    expect(buildValidatedDataInputFromSnapshot(asset, result.snapshot, { maxAgeMs: 90_000, evaluatedAt: '2026-09-03T00:00:00.000Z' }).aggregateStatus).toBe('MISSING');
  });

  it('rejects live-looking observations without evidence provenance', () => {
    const snapshot = {
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: 'test-live',
      providerFeed: 'test-feed',
      symbol: 'AAPL',
      assetClass: 'stock' as const,
      currency: 'USD',
      sourceTimestamp: '2026-09-02T23:59:30.000Z',
      ingestedAt: '2026-09-02T23:59:31.000Z',
      receivedAt: '2026-09-02T23:59:31.000Z',
      freshnessMs: 30_000,
      qualityState: 'LIVE' as const,
      isRealtime: true,
      isDelayed: false,
      correlationId: 'corr-no-evidence',
      price: 210.25,
      evidenceId: null,
    };

    const validated = buildValidatedDataInputFromSnapshot(asset, snapshot, {
      maxAgeMs: 90_000,
      evaluatedAt: '2026-09-03T00:00:00.000Z',
    });

    expect(validated.aggregateStatus).toBe('FAIL');
    expect(validated.provenanceComplete).toBe(false);
    expect(validated.observations[0].value).toBe(210.25);
  });

  it('never turns unavailable required data into numeric zero', () => {
    const snapshot = {
      contractVersion: MARKET_DATA_CONTRACT_VERSION,
      provider: 'none',
      providerFeed: null,
      symbol: 'AAPL',
      assetClass: 'stock' as const,
      currency: null,
      sourceTimestamp: null,
      ingestedAt: '2026-09-03T00:00:00.000Z',
      receivedAt: '2026-09-03T00:00:00.000Z',
      freshnessMs: null,
      qualityState: 'UNAVAILABLE' as const,
      isRealtime: false,
      isDelayed: false,
      correlationId: 'corr-missing',
      price: null,
      evidenceId: null,
    };

    const validated = buildValidatedDataInputFromSnapshot(asset, snapshot, { evaluatedAt: '2026-09-03T00:00:00.000Z' });
    expect(validated.aggregateStatus).toBe('MISSING');
    expect(validated.missingRequiredFields).toEqual(['price']);
    expect(validated.observations[0].value).toBeNull();
  });
});
