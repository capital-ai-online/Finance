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
  'buffet-value': 'analysis',
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
  'social-accounts': 'hub',
  login: 'hub',
  'auth-debugger': 'system_admin',
  'admin-portal': 'system_admin',
};

describe('BB-2B dashboard view contract', () => {
  it('keeps every dashboard view mapped exhaustively to one presentation section', () => {
    expect(DASHBOARD_VIEWS).toHaveLength(27);
    expect(DASHBOARD_VIEW_SECTION).toEqual(expectedSections);

    for (const view of DASHBOARD_VIEWS) {
      expect(getDashboardSection(view)).toBe(expectedSections[view]);
    }
  });

  it('preserves the legacy default-to-hub semantics while the strangler is in progress', () => {
    for (const view of ['interact', 'defi-orchestration', 'social-accounts', 'login'] as const) {
      expect(getDashboardSection(view)).toBe('hub');
    }
  });

  it('proves the extracted contract still covers every view used by the legacy dashboard', () => {
    for (const view of DASHBOARD_VIEWS) {
      expect(legacyDashboard, view).toContain(`'${view}'`);
    }
  });
});
