import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildDashboardViewUrl,
  mergeDashboardHistoryState,
  readDashboardView,
} from '../../src/app/routing/dashboardHistory';

const dashboardSource = fs.readFileSync(
  path.join(process.cwd(), 'src/app/dashboard/Dashboard.tsx'),
  'utf8',
);

describe('QM-MNAV-001 canonical dashboard history', () => {
  it('resolves valid dashboard views and fails closed to dashboard for unknown values', () => {
    expect(readDashboardView('?view=myworkspace')).toBe('myworkspace');
    expect(readDashboardView('?view=charts')).toBe('charts');
    expect(readDashboardView('?view=not-a-dashboard-view')).toBe('dashboard');
    expect(readDashboardView('')).toBe('dashboard');
  });

  it('projects a view into the existing dashboard URL without creating a second router', () => {
    expect(
      buildDashboardViewUrl(
        'https://capital-ai.online/dashboard?source=header#workspace',
        'charts',
      ),
    ).toBe('/dashboard?source=header&view=charts#workspace');

    expect(
      buildDashboardViewUrl(
        'https://capital-ai.online/dashboard?view=charts&source=header',
        'dashboard',
      ),
    ).toBe('/dashboard?source=header');
  });

  it('can remove one-shot payment parameters while preserving the canonical destination', () => {
    expect(
      buildDashboardViewUrl(
        'https://capital-ai.online/dashboard?payment=success&plan=Pro&source=stripe',
        'abonnements',
        ['payment', 'plan'],
      ),
    ).toBe('/dashboard?source=stripe&view=abonnements');
  });

  it('preserves unrelated history state while namespacing the dashboard view', () => {
    expect(mergeDashboardHistoryState({ source: 'existing' }, 'myworkspace')).toEqual({
      source: 'existing',
      capitalAiDashboardView: 'myworkspace',
    });
  });

  it('binds explicit navigation to pushState and browser traversal to popstate', () => {
    expect(dashboardSource).toContain('window.history.pushState(nextState, document.title, nextUrl)');
    expect(dashboardSource).toContain("window.addEventListener('popstate', syncFromLocation)");
    expect(dashboardSource).toContain("window.removeEventListener('popstate', syncFromLocation)");
    expect(dashboardSource).toContain("currentView === view && currentUrl === nextUrl");
  });

  it('routes admin entry through the same navigation callback instead of a direct state write', () => {
    expect(dashboardSource).toContain("navigateTo('admin-portal')");
    expect(dashboardSource).not.toContain("setActiveView('admin-portal')");
  });
});
