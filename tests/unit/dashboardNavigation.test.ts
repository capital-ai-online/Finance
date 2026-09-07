import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_NAVIGATION_ITEMS,
  getDashboardNavigationItems,
} from '../../src/app/dashboard/dashboardNavigation';
import { getDashboardSection } from '../../src/app/dashboard/dashboardViews';

describe('BB-2E dashboard navigation model', () => {
  it('keeps every declared navigation item aligned with the canonical section contract', () => {
    const views = new Set<string>();

    for (const item of DASHBOARD_NAVIGATION_ITEMS) {
      expect(views.has(item.view), item.view).toBe(false);
      views.add(item.view);
      expect(item.section).toBe(getDashboardSection(item.view));
      expect(item.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('projects hub and analysis navigation without creating a second routing contract', () => {
    expect(getDashboardNavigationItems('hub').map((item) => item.view)).toEqual([
      'dashboard',
      'myworkspace',
      'learning',
      'universe-scoring',
      'buffet-value',
      'abonnements',
    ]);

    expect(getDashboardNavigationItems('analysis').map((item) => item.view)).toEqual([
      'asset-universe',
      'market-screener',
      'charts',
      'preis-alarme',
      'backtest',
      'sentiment-dashboard',
      'raw-materials',
      'social-accounts',
    ]);
  });
});
