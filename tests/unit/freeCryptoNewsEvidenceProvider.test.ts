import { describe, expect, it } from 'vitest';
import {
  FREE_CRYPTO_NEWS_CONTRACT_VERSION,
  FreeCryptoNewsEvidenceProvider,
} from '../../src/platform/MarketData/providers/FreeCryptoNewsEvidenceProvider';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('FreeCryptoNewsEvidenceProvider', () => {
  it('normalizes public article metadata without granting publisher-body authority', async () => {
    const fetchImpl = (async () => jsonResponse({
      articles: [
        {
          title: 'Bitcoin market update',
          link: 'https://example.com/article-1',
          pubDate: '2026-08-25T00:00:00Z',
          source: 'Example Source',
          sourceKey: 'example-source',
          description: 'Public article metadata.',
          category: 'bitcoin',
        },
        {
          title: '',
          link: 'not-a-url',
          pubDate: 'invalid',
          source: 'Invalid',
        },
      ],
    })) as typeof fetch;

    const provider = new FreeCryptoNewsEvidenceProvider({
      fetchImpl,
      nowMs: () => Date.parse('2026-08-25T00:10:00Z'),
    });
    const result = await provider.searchArticles({ query: 'BTC', limit: 7 });

    expect(result.contractVersion).toBe(FREE_CRYPTO_NEWS_CONTRACT_VERSION);
    expect(result.status).toBe('VERIFIED');
    expect(result.articles).toHaveLength(1);
    expect(result.articles[0]).toMatchObject({
      title: 'Bitcoin market update',
      url: 'https://example.com/article-1',
      sourceName: 'Example Source',
      sourceKey: 'example-source',
      publishedAt: '2026-08-25T00:00:00.000Z',
    });
    expect(result.articles[0].evidenceRef).toMatch(/^free-crypto-news:doc:[a-f0-9]{24}$/);
  });

  it('derives filter sources from the public news evidence instead of the token-protected source catalog', async () => {
    let requestedUrl = '';
    const fetchImpl = (async (input: RequestInfo | URL) => {
      requestedUrl = String(input);
      return jsonResponse({
        articles: [
          {
            title: 'One',
            link: 'https://example.com/one',
            pubDate: '2026-08-25T00:00:00Z',
            source: 'Reuters',
          },
          {
            title: 'Two',
            link: 'https://example.com/two',
            pubDate: '2026-08-25T00:01:00Z',
            source: 'CoinDesk',
          },
          {
            title: 'Three',
            link: 'https://example.com/three',
            pubDate: '2026-08-25T00:02:00Z',
            source: 'Reuters',
          },
        ],
      });
    }) as typeof fetch;

    const provider = new FreeCryptoNewsEvidenceProvider({
      fetchImpl,
      nowMs: () => Date.parse('2026-08-25T00:10:00Z'),
    });
    const result = await provider.listSources();

    expect(result.status).toBe('VERIFIED');
    expect(result.sources).toEqual(['CoinDesk', 'Reuters']);
    expect(requestedUrl).toBe('https://cryptocurrency.cv/api/news?limit=100&page=1');
    expect(requestedUrl).not.toContain('/api/sources');
  });

  it('fails closed when the public evidence route is unavailable', async () => {
    const fetchImpl = (async () => jsonResponse({ error: 'unavailable' }, 503)) as typeof fetch;
    const provider = new FreeCryptoNewsEvidenceProvider({
      fetchImpl,
      nowMs: () => Date.parse('2026-08-25T00:10:00Z'),
    });

    const result = await provider.listSources();

    expect(result.status).toBe('SOURCE_UNAVAILABLE');
    expect(result.sources).toEqual([]);
  });
});
