import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const manifestPath = path.join(root, 'src/features/public/ui/frontend-port/source-lock.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
  sourceRepository: string;
  sourceCommit: string;
  sourceTree: string;
  lockMode: string;
  canonicalLanding: string;
  compositionAdapter: { sourcePath: string; runtimeTarget: string; policy: string };
  hostPresentationAdapters: Array<{ sourcePath: string; runtimeTarget: string; authority: string }>;
  componentInventory: string[];
  brandingAdapter: {
    sourcePath: string;
    sourceBlobSha: string;
    runtimeTarget: string;
    sharedEmblem: string;
    geometrySource: string;
    colorAuthority: string;
    namingAuthority: string;
    typographyAuthority: string;
    policy: string;
  };
  entries: Array<{
    sourcePath: string;
    targetPath: string;
    blobSha: string;
    mode: 'EXACT_GIT_BLOB' | 'FINANCE_BRANDING_ADAPTER' | 'FINANCE_COMPOSITION_ADAPTER' | 'FINANCE_PRESENTATION_ADAPTER';
  }>;
};

function gitBlobSha(buffer: Buffer): string {
  return createHash('sha1')
    .update(Buffer.from(`blob ${buffer.length}\0`, 'utf8'))
    .update(buffer)
    .digest('hex');
}

describe('FRONTEND reference design lock', () => {
  it('pins the canonical landing design authority to the current selected FRONTEND commit', () => {
    expect(manifest.sourceRepository).toBe('SvenKulessa/FRONTEND');
    expect(manifest.sourceCommit).toBe('f2a101330d74420c373f0ec56fa58caac53d741d');
    expect(manifest.sourceTree).toBe('ddd6f578e1c95f98e100978f3841f1627807b6ad');
    expect(manifest.lockMode).toBe('EXACT_GIT_BLOB_WITH_FINANCE_PRESENTATION_ADAPTERS');

    const landing = fs.readFileSync(path.join(root, manifest.canonicalLanding), 'utf8');
    expect(landing).toContain("import ReferenceApp from './frontend-port/ReferenceApp'");
    expect(landing).toContain('data-landing-design-repository="SvenKulessa/FRONTEND"');
    expect(landing).toContain('data-landing-design-commit="f2a101330d74420c373f0ec56fa58caac53d741d"');
  });

  it('contains every graphical component from the pinned source component directory', () => {
    const actual = fs.readdirSync(path.join(root, 'src/features/public/ui/frontend-port/components'))
      .filter((name) => name.endsWith('.tsx'))
      .sort();

    expect(manifest.componentInventory.slice().sort()).toEqual([
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
    expect(actual).toEqual(manifest.componentInventory.slice().sort());
  });

  it('keeps every non-branding source artifact byte-identical by Git blob SHA', () => {
    for (const entry of manifest.entries.filter((candidate) => candidate.mode === 'EXACT_GIT_BLOB')) {
      const target = path.join(root, entry.targetPath);
      expect(fs.existsSync(target), `missing target for ${entry.sourcePath}`).toBe(true);
      const actualSha = gitBlobSha(fs.readFileSync(target));
      expect(actualSha, entry.sourcePath).toBe(entry.blobSha);
    }
  });

  it('allows only BrandLogo to adapt upstream logo geometry to Finance branding authority', () => {
    expect(manifest.brandingAdapter).toMatchObject({
      sourcePath: 'src/components/BrandLogo.tsx',
      sourceBlobSha: 'db72c7d18185e09cd64c56e0d40cdbd2d50f658c',
      geometrySource: 'SvenKulessa/FRONTEND',
      colorAuthority: 'docs/frontend/design-tokens.json',
      namingAuthority: 'capital-ai-online/Finance',
      typographyAuthority: 'docs/frontend/design-tokens.json',
      policy: 'UPSTREAM_LOGO_GEOMETRY_ONLY',
    });

    const adaptedEntries = manifest.entries.filter((entry) => entry.mode === 'FINANCE_BRANDING_ADAPTER');
    expect(adaptedEntries.map((entry) => entry.sourcePath)).toEqual(['src/components/BrandLogo.tsx']);

    const runtimeLogo = fs.readFileSync(path.join(root, manifest.brandingAdapter.runtimeTarget), 'utf8');
    const sharedEmblem = fs.readFileSync(path.join(root, manifest.brandingAdapter.sharedEmblem), 'utf8');

    expect(runtimeLogo).toContain('CapitalAiEmblem');
    expect(runtimeLogo).toContain('text-brand-primary');
    expect(runtimeLogo).toContain('font-display');
    expect(runtimeLogo).toContain('CAPITAL-AI');
    expect(runtimeLogo).not.toMatch(/#[0-9A-Fa-f]{6}/);

    expect(sharedEmblem).toContain('data-logo-source="SvenKulessa/FRONTEND"');
    expect(sharedEmblem).toContain('var(--color-brand-primary)');
    expect(sharedEmblem).toContain('var(--color-brand-accent)');
  });

  it('retains current source presentation composition while keeping host routing explicit', () => {
    expect(manifest.compositionAdapter).toMatchObject({
      sourcePath: 'src/App.tsx',
      runtimeTarget: 'src/features/public/ui/frontend-port/ReferenceApp.tsx',
      policy: 'UPSTREAM_PRESENTATION_COMPOSITION_WITH_FINANCE_HOST_ROUTING',
    });
    expect(manifest.hostPresentationAdapters.map((entry) => entry.sourcePath)).toEqual(
      expect.arrayContaining(['src/components/Header.tsx', 'src/components/LoginPage.tsx', 'src/components/LegalAndFaqPages.tsx']),
    );

    const headerEntry = manifest.entries.find((entry) => entry.sourcePath === 'src/components/Header.tsx');
    expect(headerEntry?.mode).toBe('FINANCE_PRESENTATION_ADAPTER');
    const header = fs.readFileSync(path.join(root, 'src/features/public/ui/frontend-port/components/Header.tsx'), 'utf8');
    expect(header).toContain('System Online');
    expect(header).not.toContain('System v6.0 Online');
    expect(header).not.toContain('>\n                    #8D26FF\n                  </span>');

    const app = fs.readFileSync(path.join(root, 'src/features/public/ui/frontend-port/ReferenceApp.tsx'), 'utf8');
    expect(app).toContain("const DESKTOP_LANDING_MEDIA_QUERY = '(min-width: 1024px)'");
    expect(app).toContain("type LandingViewMode = 'mockup' | 'fullscreen'");
    expect(app).toContain('const [viewMode, setViewMode] = useState<LandingViewMode>(resolveViewportViewMode)');
    expect(app).toContain("setViewMode(matches ? 'fullscreen' : 'mockup')");
    expect(app).toContain('<Header');
    expect(app).toContain('<Hero');
    expect(app).toContain('<KeyPillars');
    expect(app).toContain('<MarketOverview');
    expect(app).toContain('<CoreModules');
    expect(app).toContain('<Footer');
    expect(app).toContain('<AnalysisModal');
    expect(app).toContain('<ProductTourModal');
    expect(app).toContain('<AssetDetailModal');
    expect(app).toContain('<ModuleDetailModal');
    expect(app).toContain('<AllMarketsModal');
    expect(app).toContain('<SubclassDetailModal');
    expect(app).toContain("window.location.assign('/login')");
    expect(fs.existsSync(path.join(root, 'src/features/public/ui/frontend-port/FrontendLandingExperience.tsx'))).toBe(false);
  });
});
