import { describe, expect, it } from 'vitest';
import { FmpIndexHistoryProvider } from '../../src/platform/MarketData/providers/FmpIndexHistoryProvider';

describe('FmpIndexHistoryProvider', () => {
  it('normalisiert valide EOD-Historie deterministisch und chronologisch', async () => {
    const provider = new FmpIndexHistoryProvider(async () => ({
      points: [
        { date: '2026-08-14', close: 7500 },
        { date: '2026-08-13', close: 7480 },
      ],
    }), () => Date.parse('2026-08-15T01:00:00Z'));

    const history = await provider.getHistory({
      symbol: 'gspc', assetClass: 'index', correlationId: 'corr-history',
    });

    expect(history).toMatchObject({
      provider: 'FMP',
      providerFeed: 'stable/historical-price-eod/light',
      symbol: 'GSPC',
      qualityState: 'HISTORICAL',
      correlationId: 'corr-history',
    });
    expect(history.points).toEqual([
      { timestamp: '2026-08-13', close: 7480 },
      { timestamp: '2026-08-14', close: 7500 },
    ]);
    expect(history.evidenceId).toContain('history:fmp:GSPC');
  });

  it('liefert bei fehlender oder vollständig ungültiger Evidence keine Ersatzwerte', async () => {
    const missing = await new FmpIndexHistoryProvider(async () => null).getHistory({
      symbol: 'GSPC', assetClass: 'index', correlationId: 'missing',
    });
    expect(missing.qualityState).toBe('UNAVAILABLE');
    expect(missing.points).toEqual([]);
    expect(missing.evidenceId).toBeNull();

    const invalid = await new FmpIndexHistoryProvider(async () => ({
      points: [{ date: '2026-08-14', close: 0 }],
    })).getHistory({ symbol: 'GSPC', assetClass: 'index', correlationId: 'invalid' });
    expect(invalid.qualityState).toBe('UNAVAILABLE');
    expect(invalid.points).toEqual([]);
  });
});
