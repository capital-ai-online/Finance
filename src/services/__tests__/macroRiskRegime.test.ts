import { afterEach, describe, expect, it, vi } from 'vitest';
import * as macroEvidence from '../macroRateEvidence';
import { buildMacroRiskRegime, MACRO_RISK_REGIME_CONTRACT_VERSION } from '../macroRiskRegime';

function series(seriesId: string, points: Array<{ date: string; value: number }>): macroEvidence.MacroEvidenceSeries {
  return {
    provider: 'FRED',
    seriesId,
    title: seriesId,
    unit: 'Percent',
    purpose: 'rate-evidence',
    executionPriceEligible: false,
    points,
    retrievedAt: '2026-08-02T09:00:00.000Z',
    sourcePath: `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&file_type=json`,
    evidenceIds: points.map(point => `macro:fred:${seriesId}:${point.date}`),
  };
}

afterEach(() => vi.restoreAllMocks());

describe('macro risk regime evidence contract', () => {
  it('emits an inverted curve only from same-date fresh DGS2/DGS10 evidence', async () => {
    vi.spyOn(macroEvidence, 'fetchFredSeries').mockImplementation(async (id) =>
      id === 'DGS2'
        ? series('DGS2', [{ date: '2026-07-31', value: 4.2 }])
        : series('DGS10', [{ date: '2026-07-31', value: 3.8 }])
    );
    const result = await buildMacroRiskRegime({ nowMs: Date.parse('2026-08-02T09:00:00.000Z') });
    expect(result.contractVersion).toBe(MACRO_RISK_REGIME_CONTRACT_VERSION);
    expect(result.status).toBe('READY');
    expect(result.regime).toBe('INVERTED_CURVE');
    expect(result.spread10y2yBps).toBe(-40);
    expect(result.evidenceIds).toEqual(['macro:fred:DGS2:2026-07-31', 'macro:fred:DGS10:2026-07-31']);
    expect(result.executionPriceEligible).toBe(false);
  });

  it('fails closed when the two Treasury series have no common date', async () => {
    vi.spyOn(macroEvidence, 'fetchFredSeries').mockImplementation(async (id) =>
      id === 'DGS2'
        ? series('DGS2', [{ date: '2026-07-30', value: 4.1 }])
        : series('DGS10', [{ date: '2026-07-31', value: 4.0 }])
    );
    const result = await buildMacroRiskRegime({ nowMs: Date.parse('2026-08-02T09:00:00.000Z') });
    expect(result.status).toBe('EVIDENCE_INCOMPLETE');
    expect(result.regime).toBe('UNKNOWN');
    expect(result.spread10y2yBps).toBeNull();
    expect(result.evidenceIds).toEqual([]);
  });

  it('does not present stale Treasury evidence as a current regime', async () => {
    vi.spyOn(macroEvidence, 'fetchFredSeries').mockImplementation(async (id) =>
      id === 'DGS2'
        ? series('DGS2', [{ date: '2026-07-01', value: 4.1 }])
        : series('DGS10', [{ date: '2026-07-01', value: 4.4 }])
    );
    const result = await buildMacroRiskRegime({ nowMs: Date.parse('2026-08-02T09:00:00.000Z') });
    expect(result.status).toBe('STALE_EVIDENCE');
    expect(result.regime).toBe('UNKNOWN');
    expect(result.spread10y2yBps).toBeNull();
    expect(result.evidenceIds).toEqual(['macro:fred:DGS2:2026-07-01', 'macro:fred:DGS10:2026-07-01']);
  });
});
