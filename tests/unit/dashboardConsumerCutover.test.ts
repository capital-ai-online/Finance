import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const appDashboard = read('src/app/dashboard/Dashboard.tsx');
const dashboardHome = read('src/app/dashboard/DashboardHome.tsx');
const myWorkspace = read('src/app/dashboard/MyWorkspaceView.tsx');
const dashboardHeader = read('src/app/dashboard/DashboardHeader.tsx');
const legacyDashboard = read('src/components/Dashboard.tsx');
const dashboardNavigation = read('src/app/dashboard/DashboardNavigation.tsx');

describe('BB-2B through BB-2G dashboard consumer cutover', () => {
  it('owns the active-view and session projection in the app composition root', () => {
    expect(appDashboard).toContain("import type { DashboardView } from './dashboardViews'");
    expect(appDashboard).toContain('readDashboardView(window.location.search)');
    expect(appDashboard).toContain("window.addEventListener('popstate', syncFromLocation)");
    expect(appDashboard).toContain('window.history.pushState(nextState, document.title, nextUrl)');
    expect(appDashboard).toContain("import type { UserSession } from '../types/UserSession'");
    expect(appDashboard).not.toContain("from '../../components/Dashboard'");
  });

  it('keeps navigation-only universes outside dashboard view-section authority', () => {
    expect(dashboardNavigation).toContain("type ExpandedSection = DashboardSection | 'universes' | null");
    expect(dashboardNavigation).toContain('useState<ExpandedSection>');
    expect(appDashboard).not.toContain('DashboardExpandedSection');
    expect(appDashboard).not.toContain('expandedUniverse');
  });

  it('routes migrated detail views through the canonical dashboard view router', () => {
    expect(appDashboard).toContain("import { DashboardViewRouter, type DashboardAdminTab } from './DashboardViewRouter'");
    expect(appDashboard).toContain('<DashboardViewRouter');

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
      expect(appDashboard).toContain(projection);
    }
  });

  it('extracts productive header/workspace chrome into app-owned boundaries', () => {
    expect(appDashboard).toContain("import { DashboardHeader } from './DashboardHeader'");
    expect(appDashboard).toContain('<DashboardHeader');
    expect(appDashboard).not.toContain('<DashboardNavigation');

    expect(dashboardHeader).toContain('data-testid="dashboard-app-header"');
    expect(dashboardHeader).toContain("import { CapitalAiLogo } from '../../shared/branding/CapitalAiLogo'");
    expect(dashboardHeader).toContain('<DashboardNavigation');
    expect(dashboardHeader).toContain('min-h-11');
    expect(dashboardHeader).not.toContain('SessionComposition');
    expect(dashboardHeader).not.toContain('supabase');
    expect(dashboardHeader).not.toContain('readAuthenticatedSubscriptionTier');
  });

  it('cuts Dashboard Home and MyWorkspace over to app-owned feature composition', () => {
    expect(appDashboard).toContain('<DashboardHome');
    expect(appDashboard).toContain('<MyWorkspaceView');
    expect(dashboardHome).toContain("from '../../features'");
    expect(myWorkspace).toContain("from '../../features'");

    for (const forbiddenImport of [
      "from '../../components/",
      "from '../components/",
      "from '../../platform/",
    ]) {
      expect(dashboardHome).not.toContain(forbiddenImport);
      expect(myWorkspace).not.toContain(forbiddenImport);
    }

    expect(dashboardHome).toContain('<CryptoUI.CryptoScoringEnterprise');
    expect(dashboardHome).toContain('<NewsUI.RealtimeAiNewsfeed');
    expect(dashboardHome).toContain('<ReportingUI.ComplianceExporter');
    expect(dashboardHome).toContain('<AnalyticsUI.ImageAnalyzer');
    expect(myWorkspace).toContain('<PortfolioUI.Watchlist');
  });

  it('retires the legacy dashboard implementation to one compatibility export', () => {
    expect(legacyDashboard).toContain("export { Dashboard, type DashboardProps } from '../app/dashboard/Dashboard'");
    expect(legacyDashboard).not.toContain('useState');
    expect(legacyDashboard).not.toContain('<DashboardHome');
    expect(legacyDashboard).not.toContain('<DashboardViewRouter');
  });

  it('projects local and global logout callbacks without moving IAM authority into the header', () => {
    expect(appDashboard).toContain('onGlobalLogout={onGlobalLogout ? handleGlobalLogoutClick : undefined}');
    expect(appDashboard).toContain('await onGlobalLogout();');
    expect(dashboardNavigation).toContain('onGlobalLogout?: () => void | Promise<void>;');
    expect(dashboardNavigation).toContain('Von allen Geräten abmelden');
    expect(dashboardHeader).toContain('onGlobalLogout={onGlobalLogout}');
    expect(dashboardHeader).not.toContain('window.confirm');
  });
});
