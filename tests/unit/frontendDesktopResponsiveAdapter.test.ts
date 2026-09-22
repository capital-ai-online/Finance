import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const portCss = read('src/features/public/ui/frontend-port/frontend-port.css');
const referenceApp = read('src/features/public/ui/frontend-port/ReferenceApp.tsx');
const sourceLock = JSON.parse(
  read('src/features/public/ui/frontend-port/source-lock.json'),
) as {
  lockMode: string;
  sourceCommit: string;
  entries: Array<{ sourcePath: string; mode: string }>;
};

describe('desktop landing responsive adapter', () => {
  it('keeps the current FRONTEND source lock intact', () => {
    expect(sourceLock.sourceCommit).toBe('cbc558019ae6785f44079fe6fca3403460774df3');
    expect(sourceLock.lockMode).toBe('EXACT_GIT_BLOB_WITH_FINANCE_PRESENTATION_ADAPTERS');
    expect(
      sourceLock.entries
        .filter((entry) => entry.mode !== 'EXACT_GIT_BLOB')
        .map((entry) => entry.sourcePath),
    ).toEqual([
      'src/App.tsx',
      'src/components/BrandLogo.tsx',
      'src/components/Header.tsx',
      'src/components/MarketVocabularyModal.tsx',
      'src/data/mockData.ts',
    ]);

    expect(referenceApp).toContain("const DESKTOP_LANDING_MEDIA_QUERY = '(min-width: 1024px)'");
    expect(referenceApp).toContain("type LandingViewMode = 'mockup' | 'fullscreen'");
    expect(referenceApp).toContain(
      'const [viewMode, setViewMode] = useState<LandingViewMode>(resolveViewportViewMode)',
    );
    expect(referenceApp).toContain("setViewMode(matches ? 'fullscreen' : 'mockup')");
  });

  it('adapts only desktop widths to the production website container', () => {
    expect(portCss).toContain('@media (min-width: 1024px)');
    expect(portCss).toContain('.capital-ai-frontend-port > div > main');
    expect(portCss).toContain('max-width: 1440px !important');
    expect(portCss).toContain('border-width: 0 !important');
    expect(portCss).toContain('border-radius: 0 !important');
    expect(portCss).toContain('box-shadow: none !important');
    expect(portCss).toContain('overflow: visible !important');
    expect(portCss).toContain('grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))');
    expect(portCss).toContain('font-size: clamp(3.75rem, 5.6vw, 5.75rem) !important');
  });

  it('removes desktop-only mockup chrome without changing mobile or tablet rules', () => {
    expect(portCss).toContain('.capital-ai-frontend-port > div > .hidden.sm\\:flex');
    expect(portCss).toContain('.capital-ai-frontend-port > div > main > .hidden.sm\\:block');

    const desktopMediaIndex = portCss.indexOf('@media (min-width: 1024px)');
    const desktopMainIndex = portCss.indexOf('.capital-ai-frontend-port > div > main');
    expect(desktopMediaIndex).toBeGreaterThanOrEqual(0);
    expect(desktopMainIndex).toBeGreaterThan(desktopMediaIndex);

    expect(portCss).not.toContain('@media (min-width: 640px)');
    expect(portCss).not.toContain('@media (min-width: 768px)');
  });
});
