import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const referenceApp = read('src/features/public/ui/frontend-port/ReferenceApp.tsx');
const portCss = read('src/features/public/ui/frontend-port/frontend-port.css');

describe('landing viewport-native desktop mode', () => {
  it('selects fullscreen rendering from the viewport at the canonical desktop breakpoint', () => {
    expect(referenceApp).toContain("const DESKTOP_LANDING_MEDIA_QUERY = '(min-width: 1024px)'");
    expect(referenceApp).toContain(
      'const [viewMode, setViewMode] = useState<LandingViewMode>(resolveViewportViewMode)',
    );
    expect(referenceApp).toContain("setViewMode(matches ? 'fullscreen' : 'mockup')");
    expect(referenceApp).toContain("desktopMedia.addEventListener('change', handleViewportChange)");
    expect(referenceApp).toContain('data-responsive-layout="viewport"');
    expect(referenceApp).toContain('data-landing-view-mode={viewMode}');
  });

  it('keeps mobile rules outside the desktop media query and expands desktop as a website', () => {
    const desktopIndex = portCss.indexOf('@media (min-width: 1024px)');
    expect(desktopIndex).toBeGreaterThanOrEqual(0);

    const desktopCss = portCss.slice(desktopIndex);
    expect(desktopCss).toContain('max-width: 1440px !important');
    expect(desktopCss).toContain('width: min(calc(100% - 96px), 1240px)');
    expect(desktopCss).toContain('font-size: clamp(3.75rem, 5.6vw, 5.75rem) !important');
    expect(desktopCss).toContain('flex-direction: row !important');
    expect(desktopCss).toContain('grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))');
    expect(desktopCss).toContain('min-height: 13rem');
    expect(desktopCss).toContain('width: clamp(32rem, 45vw, 44rem) !important');
    expect(desktopCss).toContain('flex-wrap: wrap');
    expect(portCss).not.toContain('@media (min-width: 640px)');
    expect(portCss).not.toContain('@media (min-width: 768px)');
  });
});
