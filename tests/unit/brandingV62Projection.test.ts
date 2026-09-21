import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
const json = <T>(relativePath: string): T => JSON.parse(read(relativePath)) as T;

const tokens = json<{
  provenance: { brandManifestVersion: string; runtimeAuthority: string };
  color: {
    background: { value: string };
    brand: { primary: { value: string }; accent: { value: string } };
  };
}>(`docs/frontend/design-tokens.json`);

const brandmark = json<{
  version: string;
  manifestVersion: string;
  designTokenSource: string;
  geometrySource: {
    repository: string;
    commit: string;
    path: string;
    blobSha: string;
    scope: string;
  };
  namingAuthority: string;
  colorAuthority: string;
  rules: {
    upstreamScope: string;
    preserveFinanceColors: boolean;
    preserveFinanceTypography: boolean;
    preserveFinanceNaming: boolean;
    allowBrandCyan: boolean;
  };
}>(`docs/frontend/brandmark.json`);

const logo = read('src/shared/branding/CapitalAiLogo.tsx');
const emblem = read('src/shared/branding/CapitalAiEmblem.tsx');
const og = read('public/og-image.svg');
const favicon = read('public/favicon.svg');
const authorityBadge = read('src/shared/ui/AuthorityBadge.tsx');
const freshnessBadge = read('src/shared/ui/FreshnessBadge.tsx');
const evidenceState = read('src/shared/ui/EvidenceStateIndicator.tsx');

const forbiddenLegacyColors = [
  '#0B0B0B', '#C29D53', '#E5C17C', '#BD984E', '#87601B', '#4A340C',
  '#06B6D4', '#22D3EE', '#A78BFA', '#8B5CF6',
];

describe('Branding Manifest v6.2 projection contract', () => {
  it('keeps Finance as naming/color authority while sourcing only logo geometry from FRONTEND', () => {
    expect(tokens.provenance.brandManifestVersion).toBe('6.2');
    expect(tokens.provenance.runtimeAuthority).toBe('docs/frontend/design-tokens.json');

    expect(brandmark.manifestVersion).toBe(tokens.provenance.brandManifestVersion);
    expect(brandmark.designTokenSource).toBe(tokens.provenance.runtimeAuthority);
    expect(brandmark.colorAuthority).toBe(tokens.provenance.runtimeAuthority);
    expect(brandmark.namingAuthority).toBe('capital-ai-online/Finance');
    expect(brandmark.geometrySource).toMatchObject({
      repository: 'SvenKulessa/FRONTEND',
      commit: 'f2a101330d74420c373f0ec56fa58caac53d741d',
      path: 'src/components/BrandLogo.tsx',
      blobSha: 'db72c7d18185e09cd64c56e0d40cdbd2d50f658c',
      scope: 'LOGO_GEOMETRY_ONLY',
    });
    expect(brandmark.rules).toMatchObject({
      upstreamScope: 'geometry-only',
      preserveFinanceColors: true,
      preserveFinanceTypography: true,
      preserveFinanceNaming: true,
      allowBrandCyan: false,
    });
  });

  it('projects the FRONTEND emblem through Finance-owned tokens and wordmark naming', () => {
    expect(logo).toContain("import { CapitalAiEmblem } from './CapitalAiEmblem'");
    expect(logo).toContain('CAPITAL-AI');
    expect(logo).toContain('font-display');
    expect(logo).toContain('text-brand-primary');

    expect(emblem).toContain('data-logo-source="SvenKulessa/FRONTEND"');
    expect(emblem).toContain('data-logo-source-commit="f2a101330d74420c373f0ec56fa58caac53d741d"');
    expect(emblem).toContain('var(--color-brand-primary)');
    expect(emblem).toContain('var(--color-brand-accent)');
    expect(emblem).not.toMatch(/#[0-9A-Fa-f]{6}/);
  });

  it('keeps OpenGraph and favicon projections on Finance colors/naming with the current logo geometry', () => {
    for (const asset of [og, favicon]) {
      expect(asset).toContain(`data-brandmark-version="${brandmark.version}"`);
      expect(asset).toContain(tokens.color.background.value);
      expect(asset).toContain(tokens.color.brand.primary.value);
      expect(asset).toContain(tokens.color.brand.accent.value);
      expect(asset).toContain('data-logo-source="SvenKulessa/FRONTEND"');
      for (const forbidden of forbiddenLegacyColors) {
        expect(asset.toUpperCase()).not.toContain(forbidden);
      }
    }

    expect(og).toContain('CAPITAL-AI');
    expect(og).toContain('AI-Driven Market Intelligence');
    expect(og).toContain('font-family="Montserrat, ui-sans-serif, system-ui, sans-serif"');
    expect(og).toContain('font-family="Poppins, ui-sans-serif, system-ui, sans-serif"');
    expect(og).toContain('font-family="JetBrains Mono, ui-monospace, monospace"');
  });

  it('uses semantic info roles for market/freshness/evidence cyan instead of the deprecated branding alias', () => {
    expect(authorityBadge).toContain('text-status-info');
    expect(freshnessBadge).toContain('text-status-info');
    expect(evidenceState).toContain('text-status-info');
    for (const source of [authorityBadge, freshnessBadge, evidenceState]) {
      expect(source).not.toContain('brand-cyan');
    }
  });
});
