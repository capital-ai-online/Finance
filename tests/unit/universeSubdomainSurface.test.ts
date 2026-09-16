import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const app = read('src/app/App.tsx');
const hostBoundary = read('src/features/universe/ui/UniverseHostBoundary.tsx');
const portal = read('src/features/universe/ui/UniversePortal.tsx');

describe('CAPITAL-AI Universe subdomain surface', () => {
  it('binds only the Universe root host before session composition', () => {
    expect(hostBoundary).toContain("const UNIVERSE_PRODUCTION_HOST = 'universe.capital-ai.online'");
    expect(hostBoundary).toContain("const UNIVERSE_LOCAL_HOST = 'universe.localhost'");
    expect(hostBoundary).toContain("pathname === '/' && isUniverseHostname(window.location.hostname)");
    expect(hostBoundary).toContain('return <UniversePortal />');

    const universeBoundaryStart = app.indexOf('<UniverseHostBoundary>');
    const sessionStart = app.indexOf('<SessionComposition>');
    expect(universeBoundaryStart).toBeGreaterThanOrEqual(0);
    expect(sessionStart).toBeGreaterThan(universeBoundaryStart);
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
