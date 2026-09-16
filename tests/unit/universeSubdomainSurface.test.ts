import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const app = read('src/app/App.tsx');
const pathBoundary = read('src/features/universe/ui/UniversePathBoundary.tsx');
const portal = read('src/features/universe/ui/UniversePortal.tsx');
const seoRoutes = read('src/lib/routeSeo.ts');
const serverRoutes = read('server/middleware/seoUrlNormalize.ts');
const spaFallback = read('server/runtime/spaFallback.ts');
const prerender = read('scripts/seo/prerender-public-routes.mjs');
const sitemap = read('public/sitemap.xml');

describe('CAPITAL-AI Universe canonical path surface', () => {
  it('binds exactly /universe before session composition', () => {
    expect(pathBoundary).toContain("export const UNIVERSE_PATH = '/universe' as const");
    expect(pathBoundary).toContain('pathname === UNIVERSE_PATH');
    expect(pathBoundary).toContain('return <UniversePortal />');
    expect(pathBoundary).not.toContain('window.location.hostname');
    expect(pathBoundary).not.toContain('universe.capital-ai.online');

    const universeBoundaryStart = app.indexOf('<UniversePathBoundary>');
    const sessionStart = app.indexOf('<SessionComposition>');
    expect(universeBoundaryStart).toBeGreaterThanOrEqual(0);
    expect(sessionStart).toBeGreaterThan(universeBoundaryStart);
  });

  it('publishes /universe consistently across SEO and production route inventories', () => {
    expect(seoRoutes).toContain("'/universe': {");
    expect(seoRoutes).toContain("canonicalPath: '/universe'");
    expect(serverRoutes).toContain("'/universe'");
    expect(spaFallback).toContain("case '/universe':");
    expect(spaFallback).toContain('files.universe');
    expect(prerender).toContain("routePath: '/universe'");
    expect(prerender).toContain("file: 'universe/index.html'");
    expect(sitemap).toContain('<loc>https://capital-ai.online/universe</loc>');
  });

  it('reuses canonical catalog metadata and the existing public workbench', () => {
    expect(portal).toContain('getAssetClassCounts');
    expect(portal).toContain('getAssetCatalogIntegrity');
    expect(portal).toContain('<PublicAnalysisWorkbench />');
    expect(portal).toContain('Catalog ≠ Market Data');
    expect(portal).toContain('No local score');
    expect(portal).not.toContain('fetch(');
    expect(portal).not.toContain('/api/');
  });

  it('preserves the visible five-class Universe branding without reintroducing Bond presentation', () => {
    expect(portal).toContain("key: 'crypto'");
    expect(portal).toContain("key: 'stock'");
    expect(portal).toContain("key: 'index'");
    expect(portal).toContain("key: 'forex'");
    expect(portal).toContain("key: 'commodity'");
    expect(portal).not.toContain("key: 'bond'");

    expect(portal).toContain('text-asset-crypto');
    expect(portal).toContain('text-asset-stock');
    expect(portal).toContain('text-asset-index');
    expect(portal).toContain('text-asset-forex');
    expect(portal).toContain('text-asset-commodity');
  });

  it('keeps catalog, evidence and canonical scoring as distinct layers', () => {
    expect(portal).toContain("title: 'Asset Catalog'");
    expect(portal).toContain("title: 'Verified Observation'");
    expect(portal).toContain("title: 'Canonical Score'");
    expect(portal).toContain('Crypto Orchestrator');
    expect(portal).toContain('Raw Materials Orchestrator');
    expect(portal).toContain('FINTECH Scoring Orchestration');
    expect(portal).toContain('Universe ist ausschließlich read-only Consumer');
  });
});
