import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const legacyDashboard = read('src/components/Dashboard.tsx');
const dashboardNavigation = read('src/app/dashboard/DashboardNavigation.tsx');

describe('BB-2B/BB-2C/BB-2D dashboard consumer cutover', () => {
  it('consumes the canonical dashboard view contract without recreating local authority', () => {
    expect(legacyDashboard).toContain("import type { DashboardView } from '../app/dashboard/dashboardViews'");
    expect(legacyDashboard).toContain("useState<DashboardView>('dashboard')");
    expect(dashboardNavigation).toContain(
      "getDashboardSection, type DashboardSection, type DashboardView } from './dashboardViews'",
    );
    expect(dashboardNavigation).toContain('setExpandedSection(getDashboardSection(activeView))');
    expect(legacyDashboard).not.toContain('const getViewCategory =');
    expect(legacyDashboard).not.toContain('getDashboardSection(activeView)');
  });

  it('consumes the canonical session contract directly instead of the root compatibility entry', () => {
    expect(legacyDashboard).toContain("import type { UserSession } from '../app/types/UserSession'");
    expect(legacyDashboard).not.toContain("from '../App'");
  });

  it('keeps the navigation-only universes accordion outside the dashboard view-section authority', () => {
    expect(dashboardNavigation).toContain("type ExpandedSection = DashboardSection | 'universes' | null");
    expect(dashboardNavigation).toContain('useState<ExpandedSection>');
    expect(legacyDashboard).not.toContain('DashboardExpandedSection');
    expect(legacyDashboard).not.toContain('expandedUniverse');
  });

  it('routes migrated detail views through the canonical dashboard view router', () => {
    expect(legacyDashboard).toContain("import { DashboardViewRouter } from '../app/dashboard/DashboardViewRouter'");
    expect(legacyDashboard).toContain('<DashboardViewRouter');
    expect(legacyDashboard).toContain('<DashboardNavigation');
    expect(legacyDashboard).toContain("{activeView === 'dashboard' && (");
    expect(legacyDashboard).toContain("{activeView === 'myworkspace' && (");

    for (const routedView of [
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
    ]) {
      expect(legacyDashboard).not.toContain(`{activeView === '${routedView}' && (`);
    }

    for (const projection of [
      'activeView={activeView}',
      'selectedSymbol={selectedSymbol}',
      'onSelectSymbol={setSelectedSymbol}',
      'onNavigate={navigateTo}',
      'userSession={userSession}',
      'profile={profile}',
      'onUpdateProfile={handleUpdateProfile}',
      'adminTab={adminTab}',
      'onChangeAdminTab={setAdminTab}',
      'triggerAttempt={triggerAttempt}',
      'searchQuery={searchQuery}',
      'onSearchQueryChange={setSearchQuery}',
      'categoryFilter={categoryFilter}',
      'onCategoryFilterChange={setCategoryFilter}',
      'onLoginEmail={onLoginEmail}',
      'onRegisterEmail={onRegisterEmail}',
    ]) {
      expect(legacyDashboard).toContain(projection);
    }
  });
});
