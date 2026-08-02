import { describe, expect, it, vi } from 'vitest';
import { fetchEcbEurReferenceFx, fetchFredSeries } from '../../src/services/macroRateEvidence';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function csvResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/csv' } });
}

describe('macro/rate evidence', () => {
  it('fetches an allow-listed FRED series without leaking the API key into provenance', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain('series_id=DGS10');
      expect(url).toContain('api_key=test-fred-key');
      return jsonResponse({
        observations: [
          { date: '2026-07-30', value: '4.15' },
          { date: '2026-07-31', value: '4.11' },
          { date: '2026-08-01', value: '.' },
        ],
      });
    });

    const result = await fetchFredSeries('DGS10', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      fredApiKey: 'test-fred-key',
      nowMs: () => Date.parse('2026-08-02T08:00:00Z'),
    });

    expect(result.provider).toBe('FRED');
    expect(result.executionPriceEligible).toBe(false);
    expect(result.points).toEqual([
      { date: '2026-07-30', value: 4.15 },
      { date: '2026-07-31', value: 4.11 },
    ]);
    expect(result.sourcePath).not.toContain('test-fred-key');
    expect(result.evidenceIds).toContain('macro:fred:DGS10:2026-07-31');
  });

  it('fails closed when FRED_API_KEY is unavailable', async () => {
    await expect(fetchFredSeries('DGS2', { fredApiKey: '' })).rejects.toThrow('FRED_API_KEY is not configured');
  });

  it('parses keyless ECB reference FX and always marks it non-executable', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain('/EXR/D.USD.EUR.SP00.A');
      expect(url).toContain('format=csvdata');
      return csvResponse([
        'KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE',
        'EXR.D.USD.EUR.SP00.A,D,USD,EUR,SP00,A,2026-07-31,1.1450',
        'EXR.D.USD.EUR.SP00.A,D,USD,EUR,SP00,A,2026-08-01,1.1475',
      ].join('\n'));
    });

    const result = await fetchEcbEurReferenceFx('usd', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      nowMs: () => Date.parse('2026-08-02T08:00:00Z'),
    });

    expect(result.provider).toBe('ECB');
    expect(result.seriesId).toBe('D.USD.EUR.SP00.A');
    expect(result.unit).toBe('USD/EUR');
    expect(result.executionPriceEligible).toBe(false);
    expect(result.points.at(-1)).toEqual({ date: '2026-08-01', value: 1.1475 });
    expect(result.evidenceIds.at(-1)).toBe('macro:ecb:D.USD.EUR.SP00.A:2026-08-01');
  });

  it('rejects unapproved ECB currencies instead of constructing arbitrary series', async () => {
    await expect(fetchEcbEurReferenceFx('XYZ')).rejects.toThrow('not approved');
  });
});
