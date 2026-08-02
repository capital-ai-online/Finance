import { describe, expect, it, vi } from 'vitest';
import { getEodhdBondEvidence } from '../../src/services/eodhdBondEvidence';

describe('EODHD bond evidence', () => {
  it('requires an explicit GBOND provider symbol and never guesses a bond ticker', async () => {
    await expect(getEodhdBondEvidence('DE10Y', 30, { apiKey: 'test' }))
      .rejects.toThrow('explicit EODHD *.GBOND provider symbol');
  });

  it('returns evidence IDs without leaking the API token', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain('/api/eod/DE10Y.GBOND');
      expect(String(input)).toContain('api_token=test-secret');
      return new Response(JSON.stringify([
        { date: '2026-07-30', close: 2.61 },
        { date: '2026-07-31', close: 2.63 },
        { date: '2026-08-01', close: 2.60 },
      ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as unknown as typeof fetch;

    const result = await getEodhdBondEvidence('DE10Y.GBOND', 30, {
      apiKey: 'test-secret',
      fetchImpl,
      nowMs: () => Date.parse('2026-08-02T08:00:00Z'),
    });

    expect(result.provider).toBe('EODHD');
    expect(result.points).toHaveLength(3);
    expect(result.sourcePath).not.toContain('test-secret');
    expect(result.evidenceIds[0]).toBe('bond:eodhd:DE10Y.GBOND:2026-07-30');
  });
});
