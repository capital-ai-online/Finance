import fs from 'node:fs';
import path from 'node:path';
import type { Express, Request, RequestHandler, Response } from 'express';
import { describe, expect, it } from 'vitest';
import {
  getRouteSeo,
  listPublicRouteSeoPaths,
  normalizePathname,
} from '../../src/lib/routeSeo';
import {
  APPLICATION_SPA_PATHS,
  PUBLIC_SPA_PATHS,
} from '../../server/middleware/seoUrlNormalize';
import { registerProductionSpaFallback } from '../../server/runtime/spaFallback';

const ORIGIN = 'https://capital-ai.online';
const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
const prerenderPath = path.join(process.cwd(), 'scripts', 'seo', 'prerender-public-routes.mjs');
const spaFallbackPath = path.join(process.cwd(), 'server', 'runtime', 'spaFallback.ts');
const indexHtmlPath = path.join(process.cwd(), 'index.html');

function readSitemapUrls(): URL[] {
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]));
}

function readLiteralRoutePaths(sourcePath: string, pattern: RegExp): string[] {
  const source = fs.readFileSync(sourcePath, 'utf8');
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

function readPrerenderRoutePaths(): string[] {
  return readLiteralRoutePaths(prerenderPath, /routePath:\s*'([^']+)'/g);
}

function readPublicHtmlFallbackPaths(): string[] {
  const source = fs.readFileSync(spaFallbackPath, 'utf8');
  const root = /case\s+'\/':\s*return res\.sendFile\(files\.root\);/m.test(source) ? ['/'] : [];
  const routeSpecific = [
    ...source.matchAll(
      /case\s+'([^']+)':\s*return res\.sendFile\(existingOrRoot\(files\.[A-Za-z][A-Za-z0-9]*\)\);/g,
    ),
  ].map((match) => match[1]);
  return [...root, ...routeSpecific];
}

function expectSameRouteSet(actual: Iterable<string>, expected: Iterable<string>): void {
  expect([...actual].sort()).toEqual([...expected].sort());
}

function captureProductionFallbackHandler(): RequestHandler {
  let handler: RequestHandler | undefined;
  const app = {
    get: (_routePath: string, candidate: RequestHandler) => {
      handler = candidate;
      return app;
    },
  } as unknown as Express;

  registerProductionSpaFallback(app, path.join(process.cwd(), 'dist'));
  if (!handler) throw new Error('Production SPA fallback handler was not registered.');
  return handler;
}

describe('public SEO route sitemap consistency (WP-SEO-TECH-GATE)', () => {
  it('lists every canonical public SEO route exactly once and nothing else', () => {
    const urls = readSitemapUrls();
    const sitemapPaths = urls.map((url) => normalizePathname(url.pathname));
    const expectedPaths = listPublicRouteSeoPaths();

    const duplicates = sitemapPaths.filter((value, index) => sitemapPaths.indexOf(value) !== index);
    const missing = expectedPaths.filter((value) => !sitemapPaths.includes(value));
    const extra = sitemapPaths.filter((value) => !expectedPaths.includes(value));

    expect(duplicates).toEqual([]);
    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
    expectSameRouteSet(sitemapPaths, expectedPaths);
  });

  it('keeps canonical SEO, sitemap, prerender, server allowlist, and public HTML fallback inventories equal', () => {
    const canonicalPaths = listPublicRouteSeoPaths();
    const sitemapPaths = readSitemapUrls().map((url) => normalizePathname(url.pathname));
    const prerenderPaths = readPrerenderRoutePaths();
    const serverPublicPaths = [...PUBLIC_SPA_PATHS];
    const publicHtmlFallbackPaths = readPublicHtmlFallbackPaths();

    expectSameRouteSet(sitemapPaths, canonicalPaths);
    expectSameRouteSet(prerenderPaths, canonicalPaths);
    expectSameRouteSet(serverPublicPaths, canonicalPaths);
    expectSameRouteSet(publicHtmlFallbackPaths, canonicalPaths);
  });

  it('keeps application-only routes out of sitemap and public prerender inventory', () => {
    const sitemapPaths = new Set(readSitemapUrls().map((url) => normalizePathname(url.pathname)));
    const prerenderPaths = new Set(readPrerenderRoutePaths());

    for (const appRoute of APPLICATION_SPA_PATHS) {
      expect(PUBLIC_SPA_PATHS.has(appRoute)).toBe(false);
      expect(sitemapPaths.has(appRoute)).toBe(false);
      expect(prerenderPaths.has(appRoute)).toBe(false);
    }
  });

  it('uses only canonical production URLs without query, hash, or trailing-slash drift', () => {
    for (const url of readSitemapUrls()) {
      expect(url.origin).toBe(ORIGIN);
      expect(url.protocol).toBe('https:');
      expect(url.search).toBe('');
      expect(url.hash).toBe('');
      if (url.pathname !== '/') {
        expect(url.pathname.endsWith('/')).toBe(false);
      }
      expect(url.pathname).toBe(normalizePathname(url.pathname));
    }

    for (const routePath of listPublicRouteSeoPaths()) {
      const canonicalPath = getRouteSeo(routePath).canonicalPath;
      expect(canonicalPath).toBe(routePath);
      expect(canonicalPath.includes('?')).toBe(false);
      expect(canonicalPath.includes('#')).toBe(false);
      if (canonicalPath !== '/') {
        expect(canonicalPath.endsWith('/')).toBe(false);
      }
    }
  });

  it('keeps indexable public routes indexable in the initial HTML shell', () => {
    const html = fs.readFileSync(indexHtmlPath, 'utf8');
    const robots = html.match(/<meta\s+name="robots"\s+content="([^"]+)"\s*\/?>/i)?.[1] ?? '';

    expect(robots).not.toBe('');
    expect(robots.toLowerCase()).not.toContain('noindex');
  });

  it('keeps Impressum metadata aligned to § 5 DDG', () => {
    expect(getRouteSeo('/impressum').description).toContain('§ 5 DDG');
  });

  it('keeps the learning platform discoverable from prerendered static HTML without hydration', () => {
    const source = fs.readFileSync(prerenderPath, 'utf8');
    const noscriptTemplate = source.match(/const noscriptBlock = `([\s\S]*?)`;/)?.[1] ?? '';

    expect(noscriptTemplate).toContain(
      '<a href="${ORIGIN}/learning-platform">Learning Platform</a>',
    );
  });

  it('serves /faq as a canonical public SEO route with its prerender fallback', () => {
    expect(APPLICATION_SPA_PATHS.has('/faq')).toBe(false);
    expect(PUBLIC_SPA_PATHS.has('/faq')).toBe(true);
    expect(listPublicRouteSeoPaths()).toContain('/faq');
    expect(getRouteSeo('/faq')).toMatchObject({
      title: 'FAQ – CAPITAL-AI',
      canonicalPath: '/faq',
    });

    const handler = captureProductionFallbackHandler();
    let sentFile: string | undefined;
    let statusCode: number | undefined;

    const response = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      type() {
        return this;
      },
      send() {
        return this;
      },
      sendFile(file: string) {
        sentFile = file;
        return this;
      },
    } as unknown as Response;

    handler({ path: '/faq' } as Request, response, () => undefined);

    expect(statusCode).toBeUndefined();
    expect(sentFile).toBe(path.join(process.cwd(), 'dist', 'faq', 'index.html'));
  });

  it('serves /vocabulary publicly and canonicalizes glossary aliases', () => {
    expect(PUBLIC_SPA_PATHS.has('/vocabulary')).toBe(true);
    expect(APPLICATION_SPA_PATHS.has('/vocabulary')).toBe(false);
    expect(listPublicRouteSeoPaths()).toContain('/vocabulary');
    expect(getRouteSeo('/vocabulary')).toMatchObject({
      title: 'Market Vocabulary – CAPITAL-AI',
      canonicalPath: '/vocabulary',
    });

    const handler = captureProductionFallbackHandler();
    let sentFile: string | undefined;

    const vocabularyResponse = {
      status() {
        return this;
      },
      type() {
        return this;
      },
      send() {
        return this;
      },
      sendFile(file: string) {
        sentFile = file;
        return this;
      },
      redirect() {
        return this;
      },
    } as unknown as Response;

    handler({ path: '/vocabulary' } as Request, vocabularyResponse, () => undefined);
    expect(sentFile).toBe(path.join(process.cwd(), 'dist', 'vocabulary', 'index.html'));

    const aliases = ['/glossar', '/lexikon', '/market-vocabulary', '/dictionary'];
    for (const alias of aliases) {
      expect(APPLICATION_SPA_PATHS.has(alias)).toBe(true);
      let redirectStatus: number | undefined;
      let redirectLocation: string | undefined;
      const aliasResponse = {
        status() {
          return this;
        },
        type() {
          return this;
        },
        send() {
          return this;
        },
        sendFile() {
          return this;
        },
        redirect(status: number, location: string) {
          redirectStatus = status;
          redirectLocation = location;
          return this;
        },
      } as unknown as Response;

      handler({ path: alias } as Request, aliasResponse, () => undefined);
      expect(redirectStatus).toBe(301);
      expect(redirectLocation).toBe('/vocabulary');
    }
  });

  it('returns a real HTTP 404 for an unknown route', () => {
    const handler = captureProductionFallbackHandler();
    let statusCode: number | undefined;
    let contentType: string | undefined;
    let body: unknown;
    let sendFileCalled = false;

    const response = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      type(value: string) {
        contentType = value;
        return this;
      },
      send(value: unknown) {
        body = value;
        return this;
      },
      sendFile() {
        sendFileCalled = true;
        return this;
      },
    } as unknown as Response;

    handler({ path: '/definitely-not-a-public-route' } as Request, response, () => undefined);

    expect(statusCode).toBe(404);
    expect(contentType).toBe('text/plain');
    expect(body).toBe('Not Found');
    expect(sendFileCalled).toBe(false);
  });
});
