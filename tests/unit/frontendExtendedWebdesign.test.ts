import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const routes = read('src/app/routing/AppRoutes.tsx');
const legalPages = read('src/features/public/ui/LegalAndFaqPages.tsx');
const legalDesignSource = read(
  'docs/frontend/upstream-source/SvenKulessa-FRONTEND/src/components/LegalAndFaqPages.tsx.source',
);

function classTokens(source: string): Set<string> {
  const tokens = new Set<string>();
  for (const match of source.matchAll(/className=(?:["']([^"']*)["']|\{`([\s\S]*?)`\})/g)) {
    const raw = (match[1] ?? match[2] ?? '').replace(/\$\{[\s\S]*?\}/g, ' ');
    for (const token of raw.split(/\s+/).filter(Boolean)) {
      if (!/^\d+$/.test(token)) tokens.add(token);
    }
  }
  return tokens;
}
const login = read('src/features/public/ui/LoginPage.tsx');
const header = read('src/features/public/ui/frontend-port/components/Header.tsx');
const landing = read('src/features/public/ui/LandingPage.tsx');
const landingCss = read('src/features/public/ui/frontend-port/frontend-port.css');
const facade = read('src/features/public/ui/index.ts');
const snapshotManifest = JSON.parse(
  read('docs/frontend/upstream-source/SvenKulessa-FRONTEND/manifest.json'),
) as {
  sourceSha: string;
  currentGraphicalComponentCount: number;
  presentationSurfaces?: Record<string, unknown>;
  ownerBoundaries?: Record<string, string>;
  assetPresentation?: {
    visibleAssetCount?: number;
    symbolContract?: string;
    authority?: string;
  };
};

describe('extended FRONTEND webdesign sync', () => {
  it('pins the synchronized graphical architecture to the latest selected upstream commit', () => {
    expect(snapshotManifest.sourceSha).toBe('cbc558019ae6785f44079fe6fca3403460774df3');
    expect(snapshotManifest.currentGraphicalComponentCount).toBe(18);
    expect(snapshotManifest.presentationSurfaces).toMatchObject({
      login: '/login',
      legalAndFaq: 'src/components/LegalAndFaqPages.tsx',
      assetSubclass: 'src/components/SubclassDetailModal.tsx',
      legalRoutes: ['/impressum', '/datenschutz', '/agb', '/faq'],
      routeNormalization: 'src/App.tsx::resolveAppRoute',
    });
  });

  it('keeps both mobile-first and active desktop landing presentation', () => {
    expect(landing).toContain("import './frontend-port/frontend-port.css'");
    expect(landing).toContain('data-mobile-view="active"');
    expect(landing).toContain('data-desktop-view="responsive-active"');

    expect(landingCss).toContain('@media (min-width: 1024px)');
    expect(landingCss).toContain('max-width: 1440px !important');
    expect(landingCss).toContain('grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))');
    expect(landingCss).toContain('.capital-ai-frontend-port > div > main > .hidden.sm\\:block');
    expect(landingCss).toContain('display: none !important');
  });

  it('keeps /login on the Finance-owned backend auth surface while preserving the branded shell', () => {
    expect(login).toContain('<BrandLogo variant="stacked" size="lg" />');
    expect(login).toContain('Terminal Anmeldung');
    expect(login).toContain('data-auth-architecture="backend-first"');
    expect(login).toContain('href="/api/auth/login/google?next=%2F"');
    expect(login).toContain('data-design-source="SvenKulessa/FRONTEND"');
    expect(login).toContain('data-design-commit="f2a101330d74420c373f0ec56fa58caac53d741d"');
    expect(login).toContain('id="tab-mode-login"');
    expect(login).toContain('id="tab-mode-register"');
    expect(login).toContain('id="register-submit-btn"');
    expect(login).toContain('id="password-forgot-btn"');
    expect(login).not.toContain('supabase.auth');
    expect(login).not.toContain('signInWithPassword');
    expect(login).not.toContain('signUp');
    expect(login).toContain('href="/impressum"');
    expect(login).toContain('href="/datenschutz"');
    expect(login).toContain('href="/agb"');
    expect(login).not.toContain('setTimeout(');
  });

  it('binds all canonical legal and FAQ paths to the current FRONTEND legal design without transferring content authority', () => {
    expect(facade).toContain("export { LegalAndFaqPages, type LegalRoute } from './LegalAndFaqPages'");
    expect(routes).toContain("currentPath === '/datenschutz'");
    expect(routes).toContain("currentPath === '/agb'");
    expect(routes).toContain("currentPath === '/impressum'");
    expect(routes).toContain("currentPath === '/faq'");
    expect(routes).toContain('<LegalAndFaqPages route={currentPath} />');
    expect(routes).not.toContain('<LegalPageShell activeRoute=');
    expect(legalPages).not.toContain('VERSION 0.6.0');
    expect(legalPages).not.toContain('DESIGN: CAPITAL-AI-FE');
    expect(legalPages).not.toContain('Fachinhalt: CAPITAL-AI-COMP');
    expect(legalPages).toContain('data-design-source="SvenKulessa/FRONTEND"');
    expect(legalPages).toContain('data-content-owner="CAPITAL-AI-COMP"');
    expect(legalPages).toContain('f2a101330d74420c373f0ec56fa58caac53d741d');
    expect(legalPages).toContain("from './frontend-port/components/BrandLogo'");
    expect(legalPages).toContain('w-full max-w-4xl');
    expect(legalPages).toContain('bg-[#02050e]');
    expect(legalPages).toContain('bg-amber-400/20');
    expect(legalPages).toContain('bg-emerald-500/20');
    expect(legalPages).toContain('bg-pink-500/20');
    expect(legalPages).toContain('bg-purple-500/20');
  });

  it('prevents visible legal styling from drifting beyond the canonical FRONTEND source', () => {
    const sourceTokens = classTokens(legalDesignSource);
    const runtimeTokens = classTokens(legalPages);
    const accessibilityOnly = new Set(['sr-only']);
    const foreignVisibleTokens = [...runtimeTokens].filter(
      (token) => !sourceTokens.has(token) && !accessibilityOnly.has(token),
    );

    expect(foreignVisibleTokens).toEqual([]);
  });

  it('removes the internal status/version and raw color-code chrome from the mobile menu', () => {
    expect(header).not.toContain('System Online');
    expect(header).not.toContain('System v6.0 Online');
    expect(header).not.toContain('>\n                    #8D26FF\n                  </span>');
  });

  it('binds the new Market Vocabulary route to the existing canonical learning component', () => {
    expect(routes).toContain("currentPath === '/vocabulary'");
    expect(routes).toContain('MarketVocabularyModal');
    expect(routes).toContain('to="/vocabulary"');
    const vocabularyAdapter = read(
      'src/features/public/ui/frontend-port/components/MarketVocabularyModal.tsx',
    );
    expect(vocabularyAdapter).toContain('LearningVocabulary');
    expect(vocabularyAdapter).toContain('data-vocabulary-mode="READ_ONLY"');
    expect(vocabularyAdapter).not.toContain('vocabularyData');
  });

  it('adopts robust canonical-path normalization without introducing a second routing authority', () => {
    expect(routes).toContain('function normalizeRoutePath(rawPath: string): string');
    expect(routes).toContain("rawPath.trim().toLowerCase().replace(/\\/+$/, '') || '/'");
    expect(routes).toContain('normalizeRoutePath(window.location.pathname)');
  });

  it('keeps productive domain authority outside the synchronized presentation snapshot', () => {
    expect(snapshotManifest.ownerBoundaries?.auth).toContain('Finance canonical auth/session');
    expect(snapshotManifest.ownerBoundaries?.compliance).toContain('CAPITAL-AI-COMP');
    expect(snapshotManifest.ownerBoundaries?.compliance).toContain('MUST NOT be promoted');
    expect(snapshotManifest.ownerBoundaries?.fintech).toContain('CAPITAL-AI-FINTECH');
    expect(snapshotManifest.ownerBoundaries?.analytics).toContain('not mirrored');
    expect(snapshotManifest.assetPresentation?.visibleAssetCount).toBe(15);
    expect(snapshotManifest.assetPresentation?.authority).toContain('CAPITAL-AI-FINTECH');
  });
});
