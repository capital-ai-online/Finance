import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const appRoutes = read('src/app/routing/AppRoutes.tsx');
const dashboardEntry = read('src/app/dashboard/Dashboard.tsx');
const dashboardIndex = read('src/app/dashboard/index.ts');

describe('BB-2 dashboard composition boundary', () => {
  it('routes application composition lazily through the canonical app dashboard entry', () => {
    expect(appRoutes).toContain('const Dashboard = lazy(() =>');
    expect(appRoutes).toContain("import('../dashboard/Dashboard')");
    expect(appRoutes).toContain('default: module.Dashboard');
    expect(appRoutes).not.toContain("../../components/Dashboard");
  });

  it('keeps the legacy dashboard behind one bounded strangler entry', () => {
    expect(dashboardEntry).toContain("import { Dashboard as LegacyDashboard } from '../../components/Dashboard'");
    expect(dashboardEntry).toContain("import type { UserSession } from '../types/UserSession'");
    expect(dashboardEntry).toContain('<LegacyDashboard');
    expect(dashboardEntry).toContain('{...props}');
    expect(dashboardEntry).toContain('onGlobalLogout={onGlobalLogout ? handleGlobalLogoutClick : undefined}');
    expect(dashboardEntry).not.toContain('fixed bottom-4 right-4');
  });

  it('exports the canonical dashboard entry from the dashboard namespace', () => {
    expect(dashboardIndex).toContain("export { Dashboard, type DashboardProps } from './Dashboard'");
  });
});
