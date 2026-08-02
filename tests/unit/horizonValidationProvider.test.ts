import { describe, expect, it, vi } from 'vitest';
import { resolveHorizonValidationEvidence } from '../../src/services/horizonValidationProvider';

describe('horizonValidationProvider', () => {
  it('selects verified Twelve Data evidence inside the target window', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      meta: { symbol: 'AAPL' },
      values: [
        { datetime: '2026-07-31', close: '100' },
        { datetime: '2026-08-01', close: '101' },
      ],
    }), { status: 200 })) as unknown as typeof fetch;

    const result = await resolveHorizonValidationEvidence({
      symbol: 'AAPL',
      assetClass: 'stock',
      snapshotDate: '2026-07-01T00:00:00.000Z',
      horizonDays: 30,
      maxDistanceMs: 36 * 60 * 60 * 1000,
    }, {
      fetchImpl,
      apiKeys: { TwelveData: 'test-key' },
      nowMs: () => Date.parse('2026-08-02T00:00:00.000Z'),
    });

    expect(result.evidence.status).toBe('READY');
    expect(result.evidence.selected?.provider).toBe('TwelveData');
    expect(result.syntheticEvidenceAllowed).toBe(false);
  });

  it('returns no verified point instead of synthesizing a price', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ meta: {}, values: [] }), { status: 200 })) as unknown as typeof fetch;
    const result = await resolveHorizonValidationEvidence({
      symbol: 'AAPL',
      assetClass: 'stock',
      snapshotDate: '2026-07-01T00:00:00.000Z',
      horizonDays: 30,
    }, { fetchImpl, apiKeys: { TwelveData: 'test-key' } });

    expect(result.evidence.status).toBe('NO_VERIFIED_POINT_IN_WINDOW');
    expect(result.evidence.selected).toBeNull();
  });

  it('enforces maxProvidersPerSnapshot and can stop after first ready provider', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      meta: { symbol: 'AAPL' },
      values: [{ datetime: '2026-07-31', close: '105' }],
    }), { status: 200 })) as unknown as typeof fetch;

    const result = await resolveHorizonValidationEvidence({
      symbol: 'AAPL',
      assetClass: 'stock',
      snapshotDate: '2026-07-01T00:00:00.000Z',
      horizonDays: 30,
    }, {
      fetchImpl,
      apiKeys: { TwelveData: 'td', EODHD: 'eod' },
      maxProvidersPerSnapshot: 1,
      stopAfterFirstReady: true,
    });

    expect(result.providersAttempted).toEqual(['TwelveData']);
    expect(result.requestBudget.maxProvidersPerSnapshot).toBe(1);
    expect(result.requestBudget.stopAfterFirstReady).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
