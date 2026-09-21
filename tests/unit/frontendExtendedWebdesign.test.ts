import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const routes = read('src/app/routing/AppRoutes.tsx');
const faq = read('src/features/public/ui/FaqPage.tsx');
const login = read('src/features/public/ui/LoginPage.tsx');
const landing = read('src/features/public/ui/LandingPage.tsx');
const landingCss = read('src/features/public/ui/frontend-port/frontend-port.css');
const facade = read('src/features/public/ui/index.ts');
const snapshotManifest = JSON.parse(
  read('docs/frontend/upstream-source/SvenKulessa-FRONTEND/manifest.json'),
) as {
  sourceSha: string;
  currentGraphicalComponentCount: number;
  presentationSurfaces?: Record<string, string>;
  ownerBoundaries?: Record<string, string>;
};

describe('extended FRONTEND webdesign sync', () => {
  it('pins the synchronized graphical architecture to the new upstream commit', () => {
    expect(snapshotManifest.sourceSha).toBe('64a0c24bd60501611aef10d36c61f71eba81f752');
    expect(snapshotManifest.currentGraphicalComponentCount).toBe(16);
    expect(snapshotManifest.presentationSurfaces).toMatchObject({
      login: 'src/components/LoginPage.tsx',
      legalAndFaq: 'src/components/LegalAndFaqPages.tsx',
      assetSubclass: 'src/components/SubclassDetailModal.tsx',
    });
  });

  it('keeps both mobile-first and active desktop landing presentation', () => {
    expect(landing).toContain("import './frontend-port/frontend-port.css'");
    expect(landing).toContain('data-mobile-view="active"');
    expect(landing).toContain('data-desktop-view="responsive-active"');

    expect(landingCss).toContain('@media (min-width: 1024px)');
    expect(landingCss).toContain('max-width: 1280px !important');
    expect(landingCss).toContain('grid-template-columns: repeat(auto-fit, minmax(210px, 1fr))');
    expect(landingCss).toContain('.capital-ai-frontend-port > div > main > .hidden.sm\\:block');
    expect(landingCss).toContain('display: none !important');
  });

  it('uses the new graphical source for /login while retaining Finance auth handlers', () => {
    expect(login).toContain('data-design-source="SvenKulessa/FRONTEND"');
    expect(login).toContain('64a0c24bd60501611aef10d36c61f71eba81f752');
    expect(login).toContain('supabase.auth.signInWithPassword');
    expect(login).toContain('supabase.auth.signUp');
    expect(login).toContain('supabase.auth.signInWithOAuth');
    expect(login).not.toContain('setTimeout(');
    expect(login).not.toContain('trackEvent(');
  });

  it('adds /faq as a Compliance-owned public presentation without transferring authority', () => {
    expect(facade).toContain("export { FaqPage } from './FaqPage'");
    expect(routes).toContain("if (currentPath === '/faq')");
    expect(routes).toContain('<FaqPage />');
    expect(faq).toContain('data-content-owner="CAPITAL-AI-COMP"');
    expect(faq).toContain('Inhaltliche Pflege: CAPITAL-AI-COMP');
    expect(faq).toContain('Darstellung: CAPITAL-AI-FE');
  });

  it('keeps productive domain authority outside the synchronized presentation snapshot', () => {
    expect(snapshotManifest.ownerBoundaries?.auth).toContain('Finance canonical auth/session');
    expect(snapshotManifest.ownerBoundaries?.compliance).toContain('CAPITAL-AI-COMP');
    expect(snapshotManifest.ownerBoundaries?.fintech).toContain('CAPITAL-AI-FINTECH');
    expect(snapshotManifest.ownerBoundaries?.analytics).toContain('not mirrored');
  });
});
