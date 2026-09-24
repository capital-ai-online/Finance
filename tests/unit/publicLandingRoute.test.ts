import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const readTypeScriptTree = (relativeDir: string): string => {
  const root = path.join(process.cwd(), relativeDir);
  const visit = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) return visit(absolute);
      if (!/\.tsx?$/.test(entry.name)) return [];
      return [fs.readFileSync(absolute, 'utf8')];
    });
  return visit(root).join('\n');
};

const routes = read('src/app/routing/AppRoutes.tsx');
const landingPage = read('src/features/public/ui/LandingPage.tsx');
const landingPort = readTypeScriptTree('src/features/public/ui/frontend-port');
const publicWorkbench = read('src/app/public/PublicAnalysisWorkbench.tsx');
const publicCryptoFacade = read('src/features/crypto/ui/public.ts');
const publicScorerPreview = read('src/features/crypto/ui/PublicCryptoScoringPreview.tsx');
const scorerPresentationContext = read('src/features/crypto/ui/EnterpriseScorerPresentationContext.tsx');
const enterpriseScorer = read('src/features/crypto/ui/CryptoScoringEnterprise.tsx');
const enterpriseQuickAnalysis = read('src/features/crypto/ui/EnterpriseBinanceQuickAnalysis.tsx');
const buffetValueCheck = read('src/components/BuffetValueCheck.tsx');
const dashboardViewRouter = read('src/app/dashboard/DashboardViewRouter.tsx');
const dashboardNavigation = read('src/app/dashboard/DashboardNavigation.tsx');
const dashboardHeader = read('src/app/dashboard/DashboardHeader.tsx');
const loginPage = read('src/features/public/ui/LoginPage.tsx');
const loginPageRedirect = read('src/features/public/ui/LoginPageRedirect.tsx');
const legacyLandingBridge = read('src/components/LandingPage.tsx');
const sessionComposition = read('src/app/auth/SessionComposition.tsx');
const backendAuthRoutes = read('server/routes/backendAuthRoutes.ts');
const dashboard = read('src/app/dashboard/Dashboard.tsx');
const legacyDashboardBridge = read('src/components/Dashboard.tsx');
const seoRoutes = read('server/middleware/seoUrlNormalize.ts');
const spaFallback = read('server/runtime/spaFallback.ts');

describe('canonical landing-first routing, static baseline and protected-route boundary', () => {
  it('uses LandingPage as the canonical LF-01 root without productive landing integrations', () => {
    const rootStart = routes.indexOf("if (currentPath === '/')");
    const loginStart = routes.indexOf("if (currentPath === '/login')");
    const rootBlock = routes.slice(rootStart, loginStart);

    expect(rootStart).toBeGreaterThanOrEqual(0);
    expect(loginStart).toBeGreaterThan(rootStart);
    expect(rootBlock).toContain('<LandingPage onLoginNavigate={clearJustLoggedOut} />');
    expect(rootBlock).not.toContain('<Dashboard');
    expect(routes).not.toContain("import('../public/PublicAnalysisWorkbench')");
    expect(routes).not.toContain('LandingRealtimeAiNewsfeed');
    expect(routes).not.toContain('LandingPricingPanel');
    expect(routes).not.toContain('PublicPreviewBoundary');

    expect(landingPage).toContain('ReferenceApp');
    expect(landingPage).toContain('frontend-reference-design-port');
    expect(landingPage).toContain('data-landing-design-repository="SvenKulessa/FRONTEND"');
    expect(landingPage).toContain('data-landing-design-commit="cbc558019ae6785f44079fe6fca3403460774df3"');
    expect(landingPort).not.toContain('fetch(');
    expect(landingPort).not.toContain('/api/');
    expect(landingPort).not.toContain('supabase');
  });

  it('retains the compact assessment-tool sideboard outside the LF-01 root', () => {
    expect(publicWorkbench).toContain('Universe Sideboard');
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
    expect(publicWorkbench).toContain('const [sideboardExpanded, setSideboardExpanded] = useState(false)');
    expect(publicWorkbench).not.toMatch(/from\s+['"][^'"]*components\/Dashboard/);
    expect(publicWorkbench).not.toContain('PUBLIC_VISITOR_SESSION');
    expect(publicWorkbench).not.toContain("type: 'guest'");
  });

  it('keeps the existing productive public Enterprise Scorer contract separate from LF-01', () => {
    expect(publicWorkbench).toContain("const PUBLIC_FIXED_SYMBOL = 'BTC' as const");
    expect(publicWorkbench).toContain('selectedSymbol={PUBLIC_FIXED_SYMBOL}');
    expect(publicWorkbench).not.toContain('onSelectSymbol={setSelectedSymbol}');
    expect(publicWorkbench).toContain('Public Asset:');
    expect(publicWorkbench).toContain('fixiert');
    expect(publicWorkbench).toContain("id: 'enterprise-scorer'");
    expect(publicWorkbench).toContain("id: 'ranking-board'");
    expect(publicWorkbench).toContain("id: 'buffett-value'");
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

  it('keeps Buffett stock-only in navigation and reserves the Crypto handoff', () => {
    expect(dashboardNavigation).toContain("universe.id === 'equities'");
    expect(dashboardNavigation).toContain('Buffett Value Check');
    expect(dashboardNavigation).toContain("navigateAsset(universe.symbol, universe.category, 'buffet-value')");
    expect(dashboardNavigation).toContain("universe.id === 'crypto'");
    expect(dashboardNavigation).toContain('Satoshi Universe Check · FINTECH-Handoff offen');
    expect(dashboardNavigation).toContain('FINTECH-Feature-Contract erforderlich');
    expect(dashboardNavigation).toContain('disabled');
  });

  it('keeps the canonical Enterprise Scorer implementation and public presentation guard', () => {
    expect(publicWorkbench).toContain("import('../../features/crypto/ui/public')");
    expect(publicCryptoFacade).toContain("export { PublicCryptoScoringPreview } from './PublicCryptoScoringPreview'");
    expect(publicScorerPreview).toContain('CanonicalCryptoScoringEnterprise');
    expect(publicScorerPreview).toContain('EnterpriseScorerPresentationProvider mode="public-preview"');
    expect(scorerPresentationContext).toContain("'authenticated' | 'public-preview'");
    expect(enterpriseScorer).toContain("fetch('/api/crypto/score'");
  });

  it('keeps productive scorer components outside the LF-01 design dependency chain', () => {
    expect(routes).not.toContain('<FeatureRecoveryBoundary');
    expect(routes).not.toContain('function PublicPreviewBoundary');
    expect(routes).not.toContain('<PublicAnalysisWorkbench');
    expect(landingPort).toContain('Enterprise Scorer');
    expect(landingPage).toContain('frontend-reference-design-port');
    expect(landingPort).not.toContain('CryptoScoringEnterprise');
    expect(landingPort).not.toContain('/api/crypto/score');
    expect(publicWorkbench).toContain('<FeatureRecoveryBoundary key={activeTool} name={activeDefinition.label}>');
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

  it('uses the backend-first LoginPage for anonymous /login and converges an established registered session to root', () => {
    expect(routes).toContain("if (currentPath === '/login')");
    expect(routes).toContain('<LoginPage justLoggedOut={justLoggedOut} />');
    const loginRouteStart = routes.indexOf("if (currentPath === '/login')");
    const dashboardRouteStart = routes.indexOf("if (currentPath === '/dashboard')");
    const loginRouteBlock = routes.slice(loginRouteStart, dashboardRouteStart);
    expect(loginRouteBlock).toContain("if (userSession?.type === 'registered')");
    expect(loginRouteBlock).toContain('<RouteRedirect to="/" label="Zur Landingpage" />');
    expect(loginPage).toContain('data-auth-architecture="backend-first"');
    expect(loginPage).toContain('id="backend-google-login"');
    expect(loginPage).toContain('href="/api/auth/login/google?next=%2F"');
    expect(loginPage).toContain('href="/"');
    expect(loginPage).toContain('Zurück zur Übersicht');
    expect(routes).toContain('<RouteRedirect to="/login" label="Weiter zur Anmeldung" />');
  });

  it('routes the app-owned dashboard login action to /login', () => {
    expect(dashboard).toContain('<DashboardHeader');
    expect(dashboard).not.toContain('<DashboardNavigation');
    expect(dashboardHeader).toContain('<DashboardNavigation');
    expect(dashboardNavigation).toContain('Login (Anmelden)');
    expect(dashboardNavigation).toContain("navigate('login')");
    expect(legacyDashboardBridge).toContain("from '../app/dashboard/Dashboard'");
    expect(legacyLandingBridge).toContain('LoginPageRedirect');
    expect(loginPageRedirect).toContain("window.location.assign('/login')");
    expect(loginPageRedirect).toContain('href="/login"');
  });

  it('protects the profile/application deep links while the retired dashboard entry redirects', () => {
    expect(routes).toContain("if (currentPath === '/profile')");
    expect(routes).toContain("if (currentPath === '/dashboard')");
    expect(routes).toContain('<RouteRedirect to="/profile" label="Weiter zum Profil" />');
    expect(routes).toContain("if (currentPath === '/media-studio')");
    expect(routes).toContain('if (authBootstrapPending) return <AuthRouteResolution />;');
    expect(routes).toContain('<RouteRedirect to="/login" label="Weiter zur Anmeldung" />');
    expect(routes).toContain('<RouteRedirect to="/" label="Zur Landingpage" />');
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

  it('keeps public hydration independent from backend session resolution while retaining authenticated gates', () => {
    expect(sessionComposition).toContain('authBootstrapPending');
    expect(sessionComposition).toContain("fetch('/api/auth/session'");
    expect(sessionComposition).toContain("credentials: 'same-origin'");
    expect(sessionComposition).not.toContain('AUTH_BOOTSTRAP_TIMEOUT_MS');
    expect(sessionComposition).not.toContain('Lade Sicherheits-Modul...');
    expect(sessionComposition).not.toContain('pendingOnboardingSession');
    expect(sessionComposition).not.toContain('pendingStepUpSession');
    expect(sessionComposition).not.toContain('supabase');
    expect(routes).toContain("if (currentPath === '/')");
    expect(routes).toContain("if (currentPath === '/login')");
  });

  it('keeps the canonical landing suitable for public brand and legal review', () => {
    expect(landingPort).toContain('Capital-AI');
    expect(landingPort).toContain('Marktdaten');
    expect(landingPort).toContain('Chancen besser');
    expect(landingPort).toContain('Globale Märkte im Überblick');
    expect(landingPort).toContain('Enterprise Scorer');
    expect(landingPort).toContain('Impressum');
    expect(landingPort).toContain('Datenschutz');
    expect(routes).toContain("currentPath === '/datenschutz'");
    expect(routes).toContain("currentPath === '/agb'");
    expect(routes).toContain("currentPath === '/impressum'");
    expect(routes).toContain("currentPath === '/faq'");
    expect(routes).toContain('<LegalAndFaqPages route={currentPath} />');
    expect(routes).not.toContain('<LegalPageShell activeRoute=');
    expect(routes).toContain('normalizeRoutePath(window.location.pathname)');
  });

  it('does not create a presentation visitor session and rejects anonymous provider sessions on the backend', () => {
    expect(routes).not.toContain("type: 'guest'");
    expect(routes).not.toContain('PUBLIC_VISITOR_SESSION');
    expect(routes).not.toContain('@capital-ai.online');
    expect(routes).not.toContain('@guest');
    expect(landingPage).not.toContain('UserSession');
    expect(landingPort).not.toContain('UserSession');
    expect(publicWorkbench).not.toContain('UserSession');
    expect(sessionComposition).not.toContain('supabase');
    expect(backendAuthRoutes).toContain('data.user.is_anonymous');
    expect(backendAuthRoutes).toContain('clearBackendAuthCookies(req, res)');
  });

  it('does not allow the public feature to depend back on application composition', () => {
    expect(landingPage).not.toMatch(/from\s+['"][^'"]*\/app\//);
    expect(landingPort).not.toMatch(/from\s+['"][^'"]*\/app\//);
    expect(loginPage).not.toMatch(/from\s+['"][^'"]*\/app\//);
    expect(routes).toContain("import('../../components/ProfilePage')");
    expect(routes).not.toContain("import('../dashboard/Dashboard')");
    expect(routes).not.toContain("import('../public/PublicAnalysisWorkbench')");
  });

  it('keeps Profile as the protected account surface while root remains the static landing surface', () => {
    const rootStart = routes.indexOf("if (currentPath === '/')");
    const loginStart = routes.indexOf("if (currentPath === '/login')");
    const rootBlock = routes.slice(rootStart, loginStart);

    expect(rootBlock).not.toContain('userSession=');
    expect(rootBlock).not.toContain('handleLogin');
    expect(rootBlock).not.toContain('handleRegister');
    expect(routes).toContain('const ProfilePage = lazy');
    expect(routes).toContain('<RouteRedirect to="/profile" label="Weiter zum Profil" />');
    expect(routes).not.toContain('const Dashboard = lazy');
    expect(routes).not.toContain('const PublicAnalysisWorkbench = lazy');
  });

  it('removes ambiguous full-page implementation filenames from their former locations', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'src/app/routing/PublicHomepage.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), 'src/components/NativePasskeyLogin.tsx'))).toBe(false);
    expect(legacyLandingBridge).toContain('@deprecated Compatibility bridge');
  });
});
