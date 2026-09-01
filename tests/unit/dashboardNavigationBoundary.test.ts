import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function source(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('BB-2E dashboard navigation boundary', () => {
  it('moves the productive drawer out of the legacy dashboard monolith', () => {
    const dashboard = source('src/components/Dashboard.tsx');
    const navigation = source('src/app/dashboard/DashboardNavigation.tsx');
    const drawer = source('src/app/dashboard/DashboardDrawer.tsx');

    expect(dashboard).toContain("import { DashboardNavigation } from '../app/dashboard/DashboardNavigation';");
    expect(dashboard).toContain('<DashboardNavigation');
    expect(dashboard).not.toContain('Slide-out Retractable Hamburger Drawer Navigation');
    expect(dashboard).not.toContain('aria-controls="nav-sec-hub"');

    expect(navigation).toContain('export function DashboardNavigation');
    expect(navigation).toContain('aria-label="Hauptmenü öffnen"');
    expect(navigation).toContain('<DashboardDrawer');
    expect(navigation).toContain('createPortal(drawer, document.body)');

    expect(drawer).toContain('export function DashboardDrawer');
    expect(drawer).toContain('aria-label="Dashboard Navigation"');
    expect(drawer).toContain('getDashboardSection(activeView)');
    expect(drawer).toContain("event.key === 'Escape'");
    expect(drawer).toContain("expandedSection === 'hub' ? null : 'hub'");
  });

  it('projects the BB-2E boundary through the canonical dashboard and app facades', () => {
    const dashboardIndex = source('src/app/dashboard/index.ts');
    const appIndex = source('src/app/index.ts');

    expect(dashboardIndex).toContain('DashboardDrawer');
    expect(dashboardIndex).toContain('DashboardNavigation');
    expect(appIndex).toContain('DashboardDrawer');
    expect(appIndex).toContain('DashboardNavigation');
  });

  it('keeps the app navigation presentation-only and inside the canonical dependency direction', () => {
    const navigation = source('src/app/dashboard/DashboardNavigation.tsx');
    const drawer = source('src/app/dashboard/DashboardDrawer.tsx');
    const combined = `${navigation}\n${drawer}`;

    expect(combined).not.toContain("from '../../components/");
    expect(combined).not.toContain("from '../components/");
    expect(combined).not.toContain('ScoringDispatcher');
    expect(combined).not.toContain('ScoringModelRegistry');
    expect(combined).not.toContain('CanonicalScoreResult');
    expect(combined).not.toContain('providerId');
    expect(combined).not.toContain('authorize(');

    expect(drawer).toContain("import type { UserProfile } from '../../features/users/ui';");
    expect(drawer).toContain("import { CapitalAiLogo } from '../../shared/branding/CapitalAiLogo';");
    expect(drawer).toContain("import type { UserSession } from '../types/UserSession';");
  });

  it('preserves the main navigation destinations and universe selection callbacks', () => {
    const drawer = source('src/app/dashboard/DashboardDrawer.tsx');

    for (const view of [
      'dashboard',
      'myworkspace',
      'learning',
      'universe-scoring',
      'buffet-value',
      'abonnements',
      'asset-universe',
      'market-screener',
      'charts',
      'preis-alarme',
      'backtest',
      'sentiment-dashboard',
      'raw-materials',
      'social-accounts',
      'defi-orchestration',
      'admin-portal',
      'login',
    ]) {
      expect(drawer).toContain(`'${view}'`);
    }

    expect(drawer).toContain("symbol: 'AAPL'");
    expect(drawer).toContain("symbol: 'EURUSD'");
    expect(drawer).toContain("symbol: 'BTC'");
    expect(drawer).toContain("symbol: 'GLD'");
    expect(drawer).toContain("symbol: 'US10Y'");
    expect(drawer).toContain("onSelectSymbol('AAVE')");
    expect(drawer).toContain('onCategoryFilterChange(universe.category)');
  });
});
