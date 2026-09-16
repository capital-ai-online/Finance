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
  nodes: Array<{ id: string; fillToken: string }>;
  edges: Array<{ strokeToken: string }>;
  rules: { allowBrandCyan: boolean };
}>(`docs/frontend/brandmark.json`);

const logo = read('src/shared/branding/CapitalAiLogo.tsx');
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
  it('keeps one versioned brandmark geometry contract bound to canonical design tokens', () => {
    expect(tokens.provenance.brandManifestVersion).toBe('6.2');
    expect(tokens.provenance.runtimeAuthority).toBe('docs/frontend/design-tokens.json');
    expect(brandmark.version).toBe('1.0.0-manifest-v6.2');
    expect(brandmark.manifestVersion).toBe(tokens.provenance.brandManifestVersion);
    expect(brandmark.designTokenSource).toBe(tokens.provenance.runtimeAuthority);
    expect(brandmark.rules.allowBrandCyan).toBe(false);
    expect(brandmark.nodes.every((node) => node.fillToken === 'color.brand.primary')).toBe(true);
    expect(new Set(brandmark.edges.map((edge) => edge.strokeToken))).toEqual(
      new Set(['color.brand.primary', 'color.brand.accent']),
    );
  });

  it('derives the React brandmark geometry from the versioned contract', () => {
    expect(logo).toContain("import brandmark from '../../../docs/frontend/brandmark.json'");
    expect(logo).toContain('data-brandmark-version={brandmark.version}');
    expect(logo).toContain('Branding Manifest v6.2');
    expect(logo).not.toContain('Branding Manifest v6.0');
    expect(logo).not.toContain('brand-cyan');
  });

  it('keeps OpenGraph and favicon projections synchronized to the current 16.08 brand tokens', () => {
    for (const asset of [og, favicon]) {
      expect(asset).toContain(`data-brandmark-version="${brandmark.version}"`);
      expect(asset).toContain(tokens.color.background.value);
      expect(asset).toContain(tokens.color.brand.primary.value);
      expect(asset).toContain(tokens.color.brand.accent.value);
      for (const forbidden of forbiddenLegacyColors) {
        expect(asset.toUpperCase()).not.toContain(forbidden);
      }
    }
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
