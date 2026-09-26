import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const appRoutes = read('src/app/routing/AppRoutes.tsx');
const dashboardEntry = read('src/app/dashboard/Dashboard.tsx');
const dashboardIndex = read('src/app/dashboard/index.ts');
const legacyDashboard = read('src/components/Dashboard.tsx');

describe('BB-2G dashboard composition boundary', () => {
  it('keeps the analytics dashboard out of the authenticated account entry route', () => {
    expect(appRoutes).toContain("import { ProfilePage } from '../../components/ProfilePage'");
    expect(appRoutes).not.toContain("import('../../components/ProfilePage')");
    expect(appRoutes).toContain('<RouteRedirect to="/profile" label="Weiter zum Profil" />');
    expect(appRoutes).not.toContain("import('../dashboard/Dashboard')");
    expect(appRoutes).not.toContain("../../components/Dashboard");
  });

  it('owns productive dashboard composition in the app layer', () => {
    expect(dashboardEntry).toContain('  DashboardHome,');
    expect(dashboardEntry).toContain("} from './DashboardHome'");
    expect(dashboardEntry).toContain("import { MyWorkspaceView } from './MyWorkspaceView'");
    expect(dashboardEntry).toContain('<DashboardHeader');
    expect(dashboardEntry).toContain('<DashboardHome');
    expect(dashboardEntry).toContain('<MyWorkspaceView');
    expect(dashboardEntry).toContain('<DashboardViewRouter');
    expect(dashboardEntry).not.toContain("from '../../components/Dashboard'");
  });

  it('keeps the old component path as a compatibility export only', () => {
    expect(legacyDashboard).toContain("export { Dashboard, type DashboardProps } from '../app/dashboard/Dashboard'");
    expect(legacyDashboard).not.toContain('useState');
    expect(legacyDashboard).not.toContain('DashboardHeader');
  });

  it('exports the canonical dashboard composition namespace', () => {
    expect(dashboardIndex).toContain("export { Dashboard, type DashboardProps } from './Dashboard'");
    expect(dashboardIndex).toContain("from './DashboardHome'");
    expect(dashboardIndex).toContain("from './MyWorkspaceView'");
  });
});
