import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { listPublicRouteSeoPaths } from '../../src/lib/routeSeo';

const ORIGIN = 'https://capital-ai.online';
const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');

function readSitemapUrls(): URL[] {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]));
}

describe('public SEO route sitemap consistency', () => {
  it('lists every canonical public SEO route exactly once', () => {
    const urls = readSitemapUrls();
    const sitemapPaths = urls.map((url) => url.pathname);
    const expectedPaths = listPublicRouteSeoPaths();

    expect(new Set(sitemapPaths).size).toBe(sitemapPaths.length);
    expect([...sitemapPaths].sort()).toEqual([...expectedPaths].sort());
  });

  it('uses only canonical production URLs without query, hash, or trailing slash drift', () => {
    for (const url of readSitemapUrls()) {
      expect(url.origin).toBe(ORIGIN);
      expect(url.search).toBe('');
      expect(url.hash).toBe('');
      if (url.pathname !== '/') {
        expect(url.pathname.endsWith('/')).toBe(false);
      }
    }
  });
});
