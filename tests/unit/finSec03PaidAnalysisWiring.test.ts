import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const quota = read('server/quota.ts');
const paidAnalysis = read('server/middleware/paidAnalysisEntitlement.ts');
const historyRoutes = read('server/routes/historyRoutes.ts');
const entitlements = read('server/entitlements.ts');
const portfolioReview = read('server/routes/portfolioReviewRoutes.ts');
const backtestEngine = read('src/components/BacktestEngine.tsx');
const portfolioBacktester = read('src/components/PortfolioBacktester.tsx');
const monteCarlo = read('src/components/MonteCarloDetailed.tsx');
const aiRouter = read('server/ai.ts');
const serverApplication = read('server.application.ts');
const migration = read('supabase/migrations/20260802203000_extend_user_quota_entitlement_kinds.sql');

describe('FIN-SEC-03 paid analysis wiring', () => {
  it('uses the existing canonical server subscription and quota authority', () => {
    expect(quota).toContain("canUseFeature('registered', tier, 'backtest')");
    expect(quota).toContain("getWindowedFeatureLimit(tier, feature)");
    expect(quota).toContain("quotaKind: 'screening' | 'monte_carlo' | 'full_ai_analysis' | 'buffett_value_check'");
    expect(quota).toContain('resolveVerifiedIdentity(req)');
    expect(quota).toContain('getSubscription(identity.userId)');
    expect(paidAnalysis).toContain("PAID_ANALYSIS_CONTRACT_VERSION = 'subscription-entitlements/1.0.0'");
    expect(paidAnalysis).not.toContain('x-subscription-tier');
    expect(migration).toContain("'monte_carlo'");
    expect(migration).toContain("'full_ai_analysis'");
  });

  it('gates Backtest server-side before history/provider execution and sends bearer from both consumers', () => {
    const gateIndex = historyRoutes.indexOf('backtestEntitlement');
    const historyExecutionIndex = historyRoutes.indexOf("orchestrator.handle('Backtest Download')");
    expect(gateIndex).toBeGreaterThanOrEqual(0);
    expect(historyExecutionIndex).toBeGreaterThan(gateIndex);

    expect(backtestEngine).toContain("import { authFetch } from '../lib/authFetch';");
    expect(backtestEngine).toContain('authFetch(`/api/backtest-history?symbol=${ticker}&range=${timeRange}`)');
    expect(backtestEngine).not.toContain('fetch(`/api/backtest-history?symbol=${ticker}&range=${timeRange}`)');

    expect(portfolioBacktester).toContain('authFetch(`/api/backtest-history?symbol=${item.symbol}&range=5Y`)');
    expect(portfolioBacktester).not.toContain('fetch(`/api/backtest-history?symbol=${item.symbol}&range=5Y`)');
  });

  it('requires a fresh server Monte Carlo quota decision for every user-triggered execution', () => {
    expect(aiRouter).toContain("aiRouter.use('/entitlements', entitlementsRouter)");
    expect(entitlements).toContain("entitlementsRouter.post('/monte-carlo/authorize'");
    expect(entitlements).toContain("evaluatePaidAnalysisAccess(req, 'monte_carlo')");
    expect(monteCarlo).toContain("authFetch('/api/entitlements/monte-carlo/authorize'");
    expect(monteCarlo).toContain('Simulate paths only after the authoritative server ALLOW decision.');
    expect(monteCarlo).not.toContain('runSimulation(true)');
    expect(monteCarlo).not.toContain('bypassTrigger');
  });

  it('binds full_ai_analysis to the productive structured provider executor and fails closed', () => {
    const accessIndex = portfolioReview.indexOf("evaluatePaidAnalysisAccess(req, 'full_ai_analysis')");
    const executorIndex = portfolioReview.indexOf('generateStructuredWithFallback({');
    expect(accessIndex).toBeGreaterThanOrEqual(0);
    expect(executorIndex).toBeGreaterThan(accessIndex);
    expect(portfolioReview).toContain("error: 'FULL_AI_ANALYSIS_UNAVAILABLE'");
    expect(portfolioReview).toContain('return res.status(503)');
    expect(portfolioReview).not.toContain('isCryptoHeavy');
    expect(portfolioReview).not.toContain('hasGold');

    const canonicalMount = serverApplication.indexOf('registerApplicationRoutes(app, { ai, anthropic, openai });');
    const inlineLegacyRoute = serverApplication.indexOf("app.post('/api/portfolio-review'");
    expect(canonicalMount).toBeGreaterThanOrEqual(0);
    expect(inlineLegacyRoute).toBeGreaterThan(canonicalMount);
  });
});
