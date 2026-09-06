import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const routes = read('src/app/routing/AppRoutes.tsx');
const landingPage = read('src/features/public/ui/LandingPage.tsx');
const loginPage = read('src/features/public/ui/LoginPage.tsx');
const loginPageRedirect = read('src/features/public/ui/LoginPageRedirect.tsx');
const legacyLandingBridge = read('src/components/LandingPage.tsx');
const sessionComposition = read('src/app/auth/SessionComposition.tsx');
const dashboard = read('src/components/Dashboard.tsx');
const seoRoutes = read('server/middleware/seoUrlNormalize.ts');
const spaFallback = read('server/runtime/spaFallback.ts');

describe('canonical landing, login and protected-route boundary', () => {
  it('uses LandingPage as the canonical public root page with app-owned dashboard composition', () => {
    expect(routes).toContain("if (currentPath === '/')");
    expect(routes).toContain('<LandingPage');
    expect(routes).toContain('<Dashboard');
    expect(routes).toContain('preview={');
    expect(landingPage).toContain('{preview}');
    expect(landingPage).not.toContain("from '../../../app");
    expect(dashboard).toContain('<CryptoScoringEnterprise');
  });

  it('keeps the public landing shell outside the dashboard preview suspense and error boundary', () => {
    const rootStart = routes.indexOf("if (currentPath === '/')");
    const loginStart = routes.indexOf("if (currentPath === '/login')");
    const rootBlock = routes.slice(rootStart, loginStart);

    expect(rootStart).toBeGreaterThanOrEqual(0);
    expect(loginStart).toBeGreaterThan(rootStart);
    expect(routes).toContain('class PublicPreviewErrorBoundary');
    expect(routes).toContain('function PublicPreviewBoundary');
    expect(routes).toContain('Live-Vorschau vorübergehend nicht verfügbar');
    expect(rootBlock).toContain('<LandingPage');
    expect(rootBlock).toContain('<PublicPreviewBoundary>');
    expect(rootBlock).not.toContain('<RouteLoadingBoundary>');
  });

  it('uses LoginPage exclusively at the dedicated /login route', () => {
    expect(routes).toContain("if (currentPath === '/login')");
    expect(routes).toContain('<LoginPage onLoginEmail={handleLogin}');
    expect(loginPage).toContain('Canonical authentication page for `/login`');
    expect(loginPage).toContain('href="/"');
    expect(loginPage).toContain('← Zurück zur Landingpage');
  });

  it('routes the legacy bottom-left dashboard login action to /login', () => {
    expect(dashboard).toContain('<span>Login (Anmelden)</span>');
    expect(dashboard).toContain("setActiveView('login')");
    expect(legacyLandingBridge).toContain('LoginPageRedirect');
    expect(loginPageRedirect).toContain("window.location.assign('/login')");
    expect(loginPageRedirect).toContain('href="/login"');
  });

  it('protects dashboard/application deep links and redirects authenticated login sessions', () => {
    expect(routes).toContain("if (currentPath === '/dashboard')");
    expect(routes).toContain("if (currentPath === '/media-studio')");
    expect(routes).toContain('<RouteRedirect to="/login" label="Weiter zur Anmeldung" />');
    expect(routes).toContain('<RouteRedirect to="/dashboard" label="Weiter zum Dashboard" />');
  });

  it('serves /login and protected app routes through the production SPA fallback', () => {
    expect(seoRoutes).toContain("'/login'");
    expect(seoRoutes).toContain("'/dashboard'");
    expect(seoRoutes).toContain("'/media-studio'");
    expect(seoRoutes).toContain('APPLICATION_SPA_PATHS');
    expect(spaFallback).toContain("case '/login':");
    expect(spaFallback).toContain("case '/dashboard':");
    expect(spaFallback).toContain("case '/media-studio':");
    expect(spaFallback).toContain('isApplicationSpaPath(req.path)');
  });

  it('keeps unauthenticated root hydration non-blocking but never suppresses an authenticated gate', () => {
    expect(sessionComposition).toContain("'/'");
    expect(sessionComposition).toContain('if (loading && !renderPublicShellImmediately)');
    expect(sessionComposition).toContain('if (pendingOnboardingSession)');
    expect(sessionComposition).toContain('if (pendingStepUpSession)');
    expect(sessionComposition).not.toContain(
      'if (pendingOnboardingSession && !renderPublicShellImmediately)',
    );
    expect(sessionComposition).not.toContain(
      'if (pendingStepUpSession && !renderPublicShellImmediately)',
    );
  });

  it('keeps the canonical landing page suitable for Google OAuth branding review', () => {
    expect(landingPage).toContain('CAPITAL-AI – quantitative Multi-Asset-Analyse');
    expect(landingPage).toContain('Aktien, Indizes, Forex, Kryptowährungen und Rohstoffe');
    expect(landingPage).toContain('erklärbaren KI-Scorings');
    expect(landingPage).toContain('href="/datenschutz/"');
    expect(landingPage).toContain('href="/agb/"');
    expect(landingPage).toContain('href="/impressum/"');
  });

  it('keeps the presentation visitor state in app composition and never accepts anonymous Supabase sessions', () => {
    expect(routes).toContain("type: 'guest'");
    expect(routes).toContain("email: ''");
    expect(routes).not.toContain('@capital-ai.online');
    expect(routes).not.toContain('@guest');
    expect(landingPage).not.toContain('UserSession');
    expect(sessionComposition).toContain('session.user.is_anonymous');
    expect(sessionComposition).toContain('rejectAnonymousSession');
  });

  it('does not allow the public feature to depend back on application composition', () => {
    expect(landingPage).not.toMatch(/from\s+['"][^'"]*\/app\//);
    expect(loginPage).not.toMatch(/from\s+['"][^'"]*\/app\//);
    expect(routes).toContain("import('../dashboard/Dashboard')");
  });

  it('removes ambiguous full-page implementation filenames from their former locations', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'src/app/routing/PublicHomepage.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), 'src/components/NativePasskeyLogin.tsx'))).toBe(false);
    expect(legacyLandingBridge).toContain('@deprecated Compatibility bridge');
  });
});
