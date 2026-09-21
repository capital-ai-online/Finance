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
  componentInventory: string[];
  entries: Array<{ sourcePath: string; targetPath: string; blobSha: string }>;
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
    expect(manifest.sourceCommit).toBe('8f6b629c985ca2e46c822ff911f53741d0141e07');
    expect(manifest.sourceTree).toBe('bceb7721ad825508d8c4fc39e7217011d927d6e7');
    expect(manifest.lockMode).toBe('EXACT_GIT_BLOB');

    const landing = fs.readFileSync(path.join(root, manifest.canonicalLanding), 'utf8');
    expect(landing).toContain("import ReferenceApp from './frontend-port/ReferenceApp'");
    expect(landing).toContain('data-landing-design-repository="SvenKulessa/FRONTEND"');
    expect(landing).toContain('data-landing-design-commit="8f6b629c985ca2e46c822ff911f53741d0141e07"');
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
    ]);
    expect(actual).toEqual(manifest.componentInventory.slice().sort());
  });

  it('keeps every pinned source artifact byte-identical by Git blob SHA', () => {
    for (const entry of manifest.entries) {
      const target = path.join(root, entry.targetPath);
      expect(fs.existsSync(target), `missing target for ${entry.sourcePath}`).toBe(true);
      const actualSha = gitBlobSha(fs.readFileSync(target));
      expect(actualSha, entry.sourcePath).toBe(entry.blobSha);
    }
  });

  it('retains source app composition rather than a reconstructed shadow composition', () => {
    const app = fs.readFileSync(path.join(root, 'src/features/public/ui/frontend-port/ReferenceApp.tsx'), 'utf8');
    expect(app).toContain("const [viewMode, setViewMode] = useState<'mockup' | 'fullscreen'>('mockup')");
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
    expect(fs.existsSync(path.join(root, 'src/features/public/ui/frontend-port/FrontendLandingExperience.tsx'))).toBe(false);
  });
});
