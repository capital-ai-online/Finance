import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const referenceApp = read('src/features/public/ui/frontend-port/ReferenceApp.tsx');
const portCss = read('src/features/public/ui/frontend-port/frontend-port.css');
const landing = read('src/features/public/ui/LandingPage.tsx');
const sourceLock = JSON.parse(
  read('src/features/public/ui/frontend-port/source-lock.json'),
) as {
  desktopViewportFix?: {
    canonicalDesktopMinPx: number;
    desktopSiteCompatMinPx: number;
    desktopSiteCompatMaxPx: number;
    invariant: string;
    userAgentBranching: boolean;
  };
};

describe('desktop full-width viewport regression', () => {
  it('keeps the canonical desktop breakpoint while covering Chromium desktop-site widths', () => {
    expect(referenceApp).toContain("const DESKTOP_LANDING_MEDIA_QUERY = '(min-width: 1024px)'");
    expect(referenceApp).toContain("const DESKTOP_SITE_COMPAT_MEDIA_QUERY = '(min-width: 960px)'");
    expect(referenceApp).toContain('canonicalDesktop || desktopSiteCompat');
    expect(referenceApp).toContain('desktopSiteCompatMedia.addEventListener');
    expect(referenceApp).not.toContain('navigator.userAgent');
    expect(referenceApp).not.toContain('userAgent');
  });

  it('never caps fullscreen mode to the mobile max-w-md canvas', () => {
    expect(referenceApp).toContain(": 'max-w-none bg-[#02050e]'");
    const fullscreenBranch = referenceApp.slice(referenceApp.indexOf("viewMode === 'mockup'"));
    expect(fullscreenBranch).not.toContain(": 'max-w-md bg-[#02050e]'");
    expect(portCss).toContain("main[data-landing-view-mode='fullscreen']");
    expect(portCss).toContain('max-width: none !important');
    expect(portCss).toContain('min-height: 100vh');
  });

  it('bridges only the compact desktop-site gap and keeps ordinary mobile untouched', () => {
    expect(portCss).toContain('@media (min-width: 960px) and (max-width: 1023px)');
    expect(portCss).toContain('@media (min-width: 1024px)');
    expect(portCss).toContain(".capital-ai-frontend-port > div > main[data-landing-view-mode='fullscreen'] > header");
    expect(portCss).toContain('grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr)');
    expect(portCss).not.toContain('@media (min-width: 640px)');
    expect(portCss).not.toContain('@media (min-width: 768px)');
  });

  it('records the exact responsive intent as a Finance presentation adapter', () => {
    expect(landing).toContain('960–1023px browser desktop-site compatibility bridge');
    expect(sourceLock.desktopViewportFix).toMatchObject({
      canonicalDesktopMinPx: 1024,
      desktopSiteCompatMinPx: 960,
      desktopSiteCompatMaxPx: 1023,
      userAgentBranching: false,
    });
    expect(sourceLock.desktopViewportFix?.invariant).toContain('must not retain the mobile max-w-md ceiling');
  });
});
