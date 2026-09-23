import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_ROUTED_VIEWS,
  isDashboardRoutedView,
} from '../../src/app/dashboard/dashboardRoutedViews';
import {
  DASHBOARD_VIEWS,
  type DashboardView,
} from '../../src/app/dashboard/dashboardViews';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const router = read('src/app/dashboard/DashboardViewRouter.tsx');
const dashboardIndex = read('src/app/dashboard/index.ts');
const appIndex = read('src/app/index.ts');
const userFacade = read('src/features/users/ui/index.ts');
const analyticsFacade = read('src/features/analytics/ui/index.ts');

describe('BB-2D dashboard view router boundary', () => {
  it('consumes feature facades instead of direct legacy or authority-layer imports', () => {
    expect(router).toContain("from '../../features'");

    for (const forbiddenImport of [
      "from '../../components/",
      "from '../components/",
      "from '../../platform/",
      "from '../platform/",
      "from '../../lib/",
      "from '../lib/",
    ]) {
      expect(router).not.toContain(forbiddenImport);
    }
  });

  it('keeps the pure ownership contract aligned with the migrated router cases', () => {
    expect(DASHBOARD_ROUTED_VIEWS).toEqual([
      'learning',
      'universe-scoring',
      'buffet-value',
      'backtest',
      'market-screener',
      'heatmap',
      'charts',
      'abonnements',
      'sentiment-dashboard',
      'profil',
      'admin-portal',
      'preis-alarme',
      'raw-materials',
      'asset-universe',
      'defi-orchestration',
      'social-accounts',
      'risiko-assessment',
      'interact',
      'login',
    ]);

    for (const view of DASHBOARD_ROUTED_VIEWS) {
      expect(router).toContain(`case '${view}':`);
      expect(isDashboardRoutedView(view)).toBe(true);
    }

    const routedViews = DASHBOARD_ROUTED_VIEWS as readonly DashboardView[];
    for (const view of DASHBOARD_VIEWS.filter((view) => !routedViews.includes(view))) {
      expect(isDashboardRoutedView(view)).toBe(false);
    }
  });

  it('keeps dashboard and myworkspace in legacy composition for this foundation slice', () => {
    expect(isDashboardRoutedView('dashboard')).toBe(false);
    expect(isDashboardRoutedView('myworkspace')).toBe(false);
    expect(router).not.toContain("case 'dashboard':");
    expect(router).not.toContain("case 'myworkspace':");
  });

  it('projects session/profile values without reintroducing subscription-tier presentation authority', () => {
    expect(router).not.toContain('profile.subscriptionTier');
    expect(router).not.toContain('onUpdateTier');
    expect(router).toContain('triggerAttempt');
    expect(router).toContain('userSession');

    for (const forbidden of [
      'ScoringDispatcher',
      'ScoringModelRegistry',
      'entitlement',
      'authorize',
      'providerId',
      'CanonicalScoreResult',
    ]) {
      expect(router).not.toContain(forbidden);
    }
  });

  it('projects profile and price alerts through feature facades', () => {
    expect(userFacade).toContain('ProfilePage');
    expect(userFacade).toContain('UserProfile');
    expect(analyticsFacade).toContain('PriceAlert');
    expect(router).toContain('<UserUI.ProfilePage');
    expect(router).toContain('<AnalyticsUI.PriceAlert');
  });

  it('keeps disabled legacy states presentation-only and navigable back to the dashboard', () => {
    expect(router).toContain('Risikoassessment Deaktiviert');
    expect(router).toContain('Interact-Workspace Deaktiviert');
    expect(router).toContain("onNavigate('dashboard')");
  });

  it('is projected through the canonical dashboard and app facades', () => {
    for (const expected of [
      "from './DashboardViewRouter'",
      "from './dashboardRoutedViews'",
      'DashboardViewRouter',
      'DashboardAdminTab',
      'DASHBOARD_ROUTED_VIEWS',
      'isDashboardRoutedView',
    ]) {
      expect(dashboardIndex).toContain(expected);
    }

    for (const expected of [
      'DashboardViewRouter',
      'DashboardAdminTab',
      'DashboardViewRouterProps',
      'DASHBOARD_ROUTED_VIEWS',
      'DashboardRoutedView',
      'isDashboardRoutedView',
    ]) {
      expect(appIndex).toContain(expected);
    }
  });
});
