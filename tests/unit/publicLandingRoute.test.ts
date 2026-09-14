import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const routes = read('src/app/routing/AppRoutes.tsx');
const landingPage = read('src/features/public/ui/LandingPage.tsx');
const publicWorkbench = read('src/app/public/PublicAnalysisWorkbench.tsx');
const publicCryptoFacade = read('src/features/crypto/ui/public.ts');
const publicScorerPreview = read('src/features/crypto/ui/PublicCryptoScoringPreview.tsx');
const scorerPresentationContext = read('src/features/crypto/ui/EnterpriseScorerPresentationContext.tsx');
const enterpriseScorer = read('src/features/crypto/ui/CryptoScoringEnterprise.tsx');
const enterpriseQuickAnalysis = read('src/features/crypto/ui/EnterpriseBinanceQuickAnalysis.tsx');
const buffetValueCheck = read('src/components/BuffetValueCheck.tsx');
const dashboardViewRouter = read('src/app/dashboard/DashboardViewRouter.tsx');
const loginPage = read('src/features/public/ui/LoginPage.tsx');
const loginPageRedirect = read('src/features/public/ui/LoginPageRedirect.tsx');
const legacyLandingBridge = read('src/components/LandingPage.tsx');
const sessionComposition = read('src/app/auth/SessionComposition.tsx');
const dashboard = read('src/components/Dashboard.tsx');
const seoRoutes = read('server/middleware/seoUrlNormalize.ts');
const spaFallback = read('server/runtime/spaFallback.ts');

describe('canonical landing, public analysis workbench, login and protected-route boundary', () => {
  it('uses LandingPage as the canonical public root with a lazy app-owned analysis workbench', () => {
    const rootStart = routes.indexOf("if (currentPath === '/')");
    const loginStart = routes.indexOf("if (currentPath === '/login')");
    const rootBlock = routes.slice(rootStart, loginStart);

    expect(rootStart).toBeGreaterThanOrEqual(0);
    expect(loginStart).toBeGreaterThan(rootStart);
    expect(routes).toContain("import('../public/PublicAnalysisWorkbench')");
    expect(routes).toContain('default: module.PublicAnalysisWorkbench');
    expect(routes).toContain('function PublicAnalysisPreview()');
    expect(rootBlock).toContain('<LandingPage');
    expect(rootBlock).toContain('preview={<PublicAnalysisPreview />}');
    expect(rootBlock).not.toContain('<Dashboard');
    expect(landingPage).toContain('loadPreview ? preview');
    expect(landingPage).toContain('id="analysis-workbench"');
    expect(landingPage).toContain('Bewertungstools & Sideboard');
    expect(landingPage).not.toContain("from '../../../app");
  });

  it('restores the established assessment-tool sideboard without importing the legacy Dashboard', () => {
    expect(publicWorkbench).toContain('Public Analysis Sideboard');
    expect(publicWorkbench).toContain('Enterprise Scorer');
    expect(publicWorkbench).toContain('Universe TOP Rankings');
    expect(publicWorkbench).toContain('Buffett Value Check');
    expect(publicWorkbench).toContain('Rohstoff-Bewertung');
    expect(publicWorkbench).toContain('Profi Markt-Screener');
    expect(publicWorkbench).toContain('Multi-Asset Universum');
    expect(publicWorkbench).toContain('Ad-Hoc Charts');
    expect(publicWorkbench).toContain('Preis-Alarme');
    expect(publicWorkbench).toContain('AI Markt-Sentiment');
    expect(publicWorkbench).toContain('DeFi Orchestration');
    expect(publicWorkbench).toContain('Backtest Engine');
    expect(publicWorkbench).toContain('Value-at-Risk Assessment');
    expect(publicWorkbench).not.toMatch(/from\s+['"][^'"]*components\/Dashboard/);
    expect(publicWorkbench).not.toContain('PUBLIC_VISITOR_SESSION');
    expect(publicWorkbench).not.toContain("type: 'guest'");
  });

  it('loads only public or server-gated productive tools while preserving current access boundaries', () => {
    expect(publicWorkbench).toContain("id: 'enterprise-scorer'");
    expect(publicWorkbench).toContain("id: 'ranking-board'");
    expect(publicWorkbench).toContain("id: 'buffett-value'");
    expect(publicWorkbench).toContain("id: 'market-screener'");
    expect(publicWorkbench).toContain("id: 'raw-materials'");
    expect(publicWorkbench).toContain("id: 'price-alerts'");
    expect(publicWorkbench).toContain("availability: 'server-gated'");
    expect(publicWorkbench).toContain("availability: 'login-required'");
    expect(publicWorkbench).toContain("availability: 'disabled'");
    expect(publicWorkbench).toContain('<ProtectedToolNotice tool={activeDefinition} />');
    expect(publicWorkbench).toContain('Anmelden und Tool öffnen');

    expect(buffetValueCheck).toContain("authFetch('/api/entitlements/warren-buffett/authorize'");
    expect(dashboardViewRouter).toContain('Risikoassessment Deaktiviert');
    expect(publicWorkbench).not.toContain('<BacktestEngine');
    expect(publicWorkbench).not.toContain('<SentimentDashboard');
    expect(publicWorkbench).not.toContain('<Charts');
    expect(publicWorkbench).not.toContain('<PriceAlert');
    expect(publicWorkbench).not.toContain('<DeFiOrchestration');
  });

  it('keeps the canonical Enterprise Scorer implementation and public presentation guard', () => {
    expect(publicWorkbench).toContain("import('../../features/crypto/ui/public')");
    expect(publicCryptoFacade).toContain("export { PublicCryptoScoringPreview } from './PublicCryptoScoringPreview'");
    expect(publicScorerPreview).toContain('CanonicalCryptoScoringEnterprise');
    expect(publicScorerPreview).toContain('EnterpriseScorerPresentationProvider mode="public-preview"');
    expect(scorerPresentationContext).toContain("'authenticated' | 'public-preview'");
    expect(enterpriseScorer).toContain("fetch('/api/crypto/score'");
  });

  it('keeps the landing shell outside workbench and tool suspense/error boundaries', () => {
    expect(routes).toContain('class PublicPreviewErrorBoundary');
    expect(routes).toContain('function PublicPreviewBoundary');
    expect(routes).toContain('Bewertungstools vorübergehend nicht verfügbar');
    expect(routes).toContain('<PublicAnalysisWorkbench />');
    expect(landingPage).toContain('IntersectionObserver');
    expect(landingPage).toContain('id="analysis-workbench"');
    expect(landingPage).toContain('loadPreview ? preview');
    expect(publicWorkbench).toContain('class PublicToolErrorBoundary');
    expect(publicWorkbench).toContain('<Suspense fallback={<WorkbenchLoadingState />}>');
  });

  it('omits the authenticated Enterprise quick-analysis sub-surface in public-preview mode', () => {
    expect(enterpriseQuickAnalysis).toContain('useEnterpriseScorerPresentationMode');

    const publicGuard = enterpriseQuickAnalysis.indexOf("if (presentationMode === 'public-preview')");
    const authenticatedEndpoint = enterpriseQuickAnalysis.indexOf('/api/registry/assets/${encodeURIComponent(upper)}/quick-analysis');

    expect(publicGuard).toBeGreaterThanOrEqual(0);
    expect(authenticatedEndpoint).toBeGreaterThan(publicGuard);
    expect(enterpriseQuickAnalysis.slice(publicGuard, authenticatedEndpoint)).toContain('return null');
  });

  it('uses LoginPage exclusively at the dedicated /login route', () => {
    expect(routes).toContain("if (currentPath === '/login')");
    expect(routes).toContain('<LoginPage onLoginEmail={handleLogin}');
    expect(loginPage).toContain('Canonical authentication page for `/login`');
    expect(loginPage).toContain('href="/"');
    expect(loginPage).toContain('← Zurück zur Landingpage');
    expect(landingPage).toContain('href="/login"');
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
    expect(landingPage).toMatch(/erklärbaren\s+KI-Scorings/);
    expect(landingPage).toContain('href="/datenschutz/"');
    expect(landingPage).toContain('href="/agb/"');
    expect(landingPage).toContain('href="/impressum/"');
  });

  it('does not create a presentation visitor session and still rejects anonymous Supabase sessions', () => {
    expect(routes).not.toContain("type: 'guest'");
    expect(routes).not.toContain('PUBLIC_VISITOR_SESSION');
    expect(routes).not.toContain('@capital-ai.online');
    expect(routes).not.toContain('@guest');
    expect(landingPage).not.toContain('UserSession');
    expect(publicWorkbench).not.toContain('UserSession');
    expect(sessionComposition).toContain('session.user.is_anonymous');
    expect(sessionComposition).toContain('rejectAnonymousSession');
  });

  it('does not allow the public feature to depend back on application composition', () => {
    expect(landingPage).not.toMatch(/from\s+['"][^'"]*\/app\//);
    expect(loginPage).not.toMatch(/from\s+['"][^'"]*\/app\//);
    expect(routes).toContain("import('../dashboard/Dashboard')");
    expect(routes).toContain("import('../public/PublicAnalysisWorkbench')");
  });

  it('keeps the authenticated Dashboard separate from the public analysis workbench', () => {
    const rootStart = routes.indexOf("if (currentPath === '/')");
    const loginStart = routes.indexOf("if (currentPath === '/login')");
    const rootBlock = routes.slice(rootStart, loginStart);

    expect(rootBlock).not.toContain('userSession=');
    expect(rootBlock).not.toContain('handleLogin');
    expect(rootBlock).not.toContain('handleRegister');
    expect(routes).toContain('const Dashboard = lazy');
    expect(routes).toContain('const PublicAnalysisWorkbench = lazy');
  });

  it('removes ambiguous full-page implementation filenames from their former locations', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'src/app/routing/PublicHomepage.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), 'src/components/NativePasskeyLogin.tsx'))).toBe(false);
    expect(legacyLandingBridge).toContain('@deprecated Compatibility bridge');
  });
});
