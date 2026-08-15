import { describe, expect, it } from 'vitest';
import { normalizeSeoDashboardPayloads, seoSourceStatus } from '../../src/platform/SeoEngine/dashboard';

describe('S3 SEO dashboard model', () => {
  it('fails closed to empty collections for malformed API payloads', () => {
    const data = normalizeSeoDashboardPayloads(null, { keywords: 'invalid' }, { ranks: null }, {});
    expect(data.summary.keywordCount).toBe(0);
    expect(data.keywords).toEqual([]);
    expect(data.ranks).toEqual([]);
    expect(data.content).toEqual([]);
    expect(seoSourceStatus(data).searchConsole).toBe('not-connected');
  });

  it('only marks Search Console connected when measured source evidence exists', () => {
    const manual = normalizeSeoDashboardPayloads(
      { keywordCount: 1, rankSnapshotCount: 1, contentCount: 0, publishedContentCount: 0, hasMeasuredRanks: true },
      { keywords: [] },
      { ranks: [{ id: 'r1', keywordId: 'k1', capturedAt: '2026-08-15T00:00:00Z', position: 4, source: 'manual-import' }] },
      { content: [] },
    );
    expect(seoSourceStatus(manual)).toEqual({ searchConsole: 'not-connected', ga4: 'not-connected', manualImports: 1 });

    const measured = { ...manual, ranks: [{ ...manual.ranks[0], source: 'search-console' as const }] };
    expect(seoSourceStatus(measured).searchConsole).toBe('connected');
  });
});
