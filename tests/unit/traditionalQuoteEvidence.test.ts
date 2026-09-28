import { describe, expect, it, vi } from 'vitest';
import { fetchVerifiedTraditionalQuote, TRADITIONAL_QUOTE_CONTRACT_VERSION } from '../../src/services/traditionalQuoteEvidence';

describe('traditional quote evidence contract', () => {
  it('returns a provenance-backed Twelve Data stock quote', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      symbol: 'AAPL', close: '213.42', currency: 'USD', datetime: '2026-08-02T10:30:00Z',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })) as unknown as typeof fetch;

    const quote = await fetchVerifiedTraditionalQuote('AAPL', 'stock', {
      fetchImpl, twelveDataApiKey: 'test-key', nowMs: () => Date.parse('2026-08-02T10:31:00Z'),
    });

    expect(quote.contractVersion).toBe(TRADITIONAL_QUOTE_CONTRACT_VERSION);
    expect(quote.status).toBe('READY');
    expect(quote.price).toBe(213.42);
    expect(quote.provider).toBe('TwelveData');
    expect(quote.providers).toEqual(['TwelveData']);
    expect(quote.evidenceIds[0]).toContain('quote:twelvedata:AAPL');
    expect(quote.alertEligible).toBe(true);
    expect(quote.executionPriceEligible).toBe(false);
    expect(quote.correlationId).toContain('traditional-quote:stock:AAPL');
    expect(quote.qualityState).toBe('LIVE');
    expect(quote.reason).toBeUndefined();
  });

  it('normalizes a six-character forex pair and preserves quote evidence', async () => {
    let calledUrl = '';
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      calledUrl = String(input);
      return new Response(JSON.stringify({ close: '1.0872', currency: 'USD', datetime: '2026-08-02T10:30:00Z' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    const quote = await fetchVerifiedTraditionalQuote('EURUSD', 'forex', {
      fetchImpl, twelveDataApiKey: 'test-key', nowMs: () => Date.parse('2026-08-02T10:31:00Z'),
    });

    expect(calledUrl).toContain('EUR%2FUSD');
    expect(quote.status).toBe('READY');
    expect(quote.price).toBe(1.0872);
    expect(quote.currency).toBe('USD');
  });

  it('marks stale quotes non-alert-eligible instead of substituting a fresh value', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      close: '213.42', currency: 'USD', datetime: '2026-08-02T09:00:00Z',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })) as unknown as typeof fetch;

    const quote = await fetchVerifiedTraditionalQuote('AAPL', 'stock', {
      fetchImpl,
      twelveDataApiKey: 'test-key',
      nowMs: () => Date.parse('2026-08-02T10:00:00Z'),
      maxAgeMs: 15 * 60 * 1000,
    });

    expect(quote.status).toBe('STALE_EVIDENCE');
    expect(quote.price).toBeNull();
    expect(quote.alertEligible).toBe(false);
    expect(quote.evidenceIds).toHaveLength(1);
    expect(quote.evidenceAgeMs).toBe(60 * 60 * 1000);
    expect(quote.provider).toBe('TwelveData');
  });

  it('fails closed when Twelve Data is not configured', async () => {
    const previous = process.env.TWELVEDATA_API_KEY;
    delete process.env.TWELVEDATA_API_KEY;
    try {
      const quote = await fetchVerifiedTraditionalQuote('AAPL', 'stock', { twelveDataApiKey: '' });
      expect(quote.status).toBe('SOURCE_UNAVAILABLE');
      expect(quote.price).toBeNull();
      expect(quote.alertEligible).toBe(false);
      expect(quote.evidenceIds).toEqual([]);
    } finally {
      if (previous === undefined) delete process.env.TWELVEDATA_API_KEY;
      else process.env.TWELVEDATA_API_KEY = previous;
    }
  });
});
