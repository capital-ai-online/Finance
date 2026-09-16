import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_VIEWS,
  DASHBOARD_VIEW_SECTION,
  getDashboardSection,
  type DashboardSection,
} from '../../src/app/dashboard/dashboardViews';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const legacyDashboard = read('src/components/Dashboard.tsx');
const dashboardNavigation = read('src/app/dashboard/DashboardNavigation.tsx');
const dashboardNavigationModel = read('src/app/dashboard/dashboardNavigation.ts');

const expectedSections: Record<(typeof DASHBOARD_VIEWS)[number], DashboardSection> = {
  dashboard: 'hub',
  myworkspace: 'hub',
  learning: 'hub',
  'universe-scoring': 'hub',
  'buffet-value': 'hub',
  backtest: 'analysis',
  heatmap: 'analysis',
  'market-screener': 'analysis',
  abonnements: 'hub',
  profil: 'hub',
  'markdown-orchestrator': 'system_admin',
  interact: 'hub',
  charts: 'analysis',
  'request-orchestrator': 'system_admin',
  performance: 'system_admin',
  'risiko-assessment': 'analysis',
  'admin-panel': 'system_admin',
  'preis-alarme': 'analysis',
  'audit-logs': 'system_admin',
  'sentiment-dashboard': 'analysis',
  'raw-materials': 'analysis',
  'asset-universe': 'analysis',
  'defi-orchestration': 'hub',
  'social-accounts': 'analysis',
  login: 'hub',
  'auth-debugger': 'system_admin',
  'admin-portal': 'system_admin',
};

describe('BB-2E dashboard view contract', () => {
  it('keeps every dashboard view mapped exhaustively to one presentation section', () => {
    expect(DASHBOARD_VIEWS).toHaveLength(27);
    expect(DASHBOARD_VIEW_SECTION).toEqual(expectedSections);

    for (const view of DASHBOARD_VIEWS) {
      expect(getDashboardSection(view)).toBe(expectedSections[view]);
    }
  });

  it('matches active-view auto-expansion with the productive drawer placement', () => {
    expect(getDashboardSection('buffet-value')).toBe('hub');
    expect(getDashboardSection('social-accounts')).toBe('analysis');

    for (const view of ['interact', 'defi-orchestration', 'login'] as const) {
      expect(getDashboardSection(view)).toBe('hub');
    }

    expect(dashboardNavigation).toContain(
      "getDashboardSection, type DashboardSection, type DashboardView } from './dashboardViews'",
    );
    expect(dashboardNavigation).toContain('setExpandedSection(getDashboardSection(activeView))');
  });

  it('keeps residual dashboard targets and app-owned navigation bound to the canonical view contract', () => {
    expect(legacyDashboard).toContain("import type { DashboardView } from '../app/dashboard/dashboardViews'");
    expect(legacyDashboard).toContain("useState<DashboardView>('dashboard')");
    expect(legacyDashboard).toContain('<DashboardNavigation');
    expect(dashboardNavigationModel).toContain('satisfies readonly DashboardNavigationItem[]');
    expect(dashboardNavigation).toContain('onClick={() => navigate(item.view)}');

    const residualDashboardTargets = Array.from(
      legacyDashboard.matchAll(/(?:navigateTo|setActiveView)\('([^']+)'\)/g),
      match => match[1],
    );
    const declaredNavigationTargets = Array.from(
      dashboardNavigationModel.matchAll(/view: '([^']+)'/g),
      match => match[1],
    );
    const knownViews = new Set<string>(DASHBOARD_VIEWS);

    expect(residualDashboardTargets.length).toBeGreaterThan(0);
    expect(declaredNavigationTargets.length).toBeGreaterThan(0);

    for (const view of [...residualDashboardTargets, ...declaredNavigationTargets]) {
      expect(knownViews.has(view), view).toBe(true);
    }
  });
});
