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
  });

  it('keeps every legacy dashboard navigation target covered by the extracted contract', () => {
    expect(legacyDashboard).toContain('type DashboardView,');
    expect(legacyDashboard).toContain('getDashboardSection,');
    expect(legacyDashboard).toContain("useState<DashboardView>('dashboard')");

    const navigationTargets = Array.from(
      legacyDashboard.matchAll(/(?:navigateTo|setActiveView)\('([^']+)'\)/g),
      match => match[1],
    );
    const knownViews = new Set<string>(DASHBOARD_VIEWS);

    expect(navigationTargets.length).toBeGreaterThan(0);
    for (const view of navigationTargets) {
      expect(knownViews.has(view), view).toBe(true);
    }
  });
});
