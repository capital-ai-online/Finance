import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const readTypeScriptTree = (relativeDir: string): string => {
  const directory = path.join(root, relativeDir);
  const visit = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) return visit(absolute);
      if (!/\.tsx?$/.test(entry.name)) return [];
      return [fs.readFileSync(absolute, 'utf8')];
    });

  return visit(directory).join('\n');
};

const sourceLock = JSON.parse(
  read('src/features/public/ui/frontend-port/source-lock.json'),
) as {
  sourceRepository: string;
  sourceCommit: string;
  canonicalLanding: string;
  componentInventory: string[];
};

const landing = read('src/features/public/ui/LandingPage.tsx');
const referenceApp = read('src/features/public/ui/frontend-port/ReferenceApp.tsx');
const brandLogo = read('src/features/public/ui/frontend-port/components/BrandLogo.tsx');
const sharedEmblem = read('src/shared/branding/CapitalAiEmblem.tsx');
const hero = read('src/features/public/ui/frontend-port/components/Hero.tsx');
const portCss = read('src/features/public/ui/frontend-port/frontend-port.css');
const port = readTypeScriptTree('src/features/public/ui/frontend-port');

describe('FRONTEND upstream appearance contract', () => {
  it('treats SvenKulessa/FRONTEND as the leading graphical source for the landing', () => {
    expect(sourceLock.sourceRepository).toBe('SvenKulessa/FRONTEND');
    expect(sourceLock.sourceCommit).toBe('f2a101330d74420c373f0ec56fa58caac53d741d');
    expect(sourceLock.canonicalLanding).toBe('src/features/public/ui/LandingPage.tsx');

    expect(landing).toContain("import ReferenceApp from './frontend-port/ReferenceApp'");
    expect(landing).toContain('data-landing-design-repository="SvenKulessa/FRONTEND"');
    expect(landing).toContain('data-landing-design-commit="f2a101330d74420c373f0ec56fa58caac53d741d"');
  });

  it('keeps the complete current upstream component composition as the visual target', () => {
    expect(sourceLock.componentInventory.slice().sort()).toEqual([
      'AllMarketsModal.tsx',
      'AnalysisModal.tsx',
      'AssetDetailModal.tsx',
      'BrandLogo.tsx',
      'CoreModules.tsx',
      'Footer.tsx',
      'Header.tsx',
      'Hero.tsx',
      'KeyPillars.tsx',
      'MarketOverview.tsx',
      'ModuleDetailModal.tsx',
      'ProductTourModal.tsx',
      'StatusBar.tsx',
      'SubclassDetailModal.tsx',
    ]);

    for (const component of [
      '<Header',
      '<Hero',
      '<KeyPillars',
      '<MarketOverview',
      '<CoreModules',
      '<Footer',
      '<StatusBar',
      '<AnalysisModal',
      '<ProductTourModal',
      '<AssetDetailModal',
      '<ModuleDetailModal',
      '<AllMarketsModal',
      '<SubclassDetailModal',
    ]) {
      expect(referenceApp).toContain(component);
    }
  });

  it('uses only the FRONTEND logo geometry while Finance retains branding colors and naming', () => {
    expect(brandLogo).toContain('CapitalAiEmblem');
    expect(brandLogo).toContain('CAPITAL-AI');
    expect(brandLogo).toContain('text-brand-primary');
    expect(brandLogo).toContain('font-display');
    expect(brandLogo).not.toMatch(/#[0-9A-Fa-f]{6}/);

    expect(sharedEmblem).toContain('data-logo-source="SvenKulessa/FRONTEND"');
    expect(sharedEmblem).toContain('var(--color-brand-primary)');
    expect(sharedEmblem).toContain('var(--color-brand-accent)');
    expect(sharedEmblem).not.toMatch(/#[0-9A-Fa-f]{6}/);
  });

  it('preserves current upstream visual hierarchy without reviving superseded 16.08 constraints', () => {
    for (const text of [
      'Marktdaten',
      'verstehen.',
      'Chancen besser',
      'Globale Märkte im Überblick',
      'Enterprise Scorer',
      'Buffett Value Check',
      'Vocabulary',
      'MARKET INTELLIGENCE • NEXT-GEN QUANT TERMINAL',
    ]) {
      expect(port).toContain(text);
    }

    expect(hero).toContain('glowing_earth_nodes_1789997454893.jpg');
  });

  it('scopes upstream presentation helpers without transferring productive Finance authority', () => {
    expect(portCss).toContain('.capital-ai-frontend-port');
    expect(portCss).toContain("'Plus Jakarta Sans'");
    expect(portCss).toContain('.no-scrollbar');
    expect(portCss).toContain('capitalAiFrontendPortPulseSlow');
    expect(portCss).toContain('@media (prefers-reduced-motion: reduce)');

    expect(port).not.toContain('fetch(');
    expect(port).not.toContain('/api/');
    expect(port).not.toContain('supabase');
    expect(port).not.toContain('stripe');
  });
});
