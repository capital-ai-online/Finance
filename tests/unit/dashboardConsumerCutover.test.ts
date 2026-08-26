import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const legacyDashboard = read('src/components/Dashboard.tsx');

describe('BB-2B/BB-2C dashboard consumer cutover', () => {
  it('consumes the canonical dashboard view contract without recreating local authority', () => {
    expect(legacyDashboard).toContain("from '../app/dashboard/dashboardViews'");
    expect(legacyDashboard).toContain("useState<DashboardView>('dashboard')");
    expect(legacyDashboard).toContain('getDashboardSection(activeView)');
    expect(legacyDashboard).not.toContain('const getViewCategory =');
  });

  it('consumes the canonical session contract directly instead of the root compatibility entry', () => {
    expect(legacyDashboard).toContain("import type { UserSession } from '../app/types/UserSession'");
    expect(legacyDashboard).not.toContain("from '../App'");
  });

  it('keeps the navigation-only universes accordion outside the dashboard view-section authority', () => {
    expect(legacyDashboard).toContain("type DashboardExpandedSection = DashboardSection | 'universes'");
    expect(legacyDashboard).toContain('useState<DashboardExpandedSection | null>');
  });
});
