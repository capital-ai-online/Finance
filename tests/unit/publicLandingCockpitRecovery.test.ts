import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const workbench = read('src/app/public/PublicAnalysisWorkbench.tsx');
const navigationModel = read('src/app/dashboard/dashboardNavigation.ts');
const dashboardHeader = read('src/app/dashboard/DashboardHeader.tsx');

describe('public landing cockpit recovery', () => {
  it('opens the public analysis sideboard on first mobile render with explicit touch controls', () => {
    expect(workbench).toContain('const [sideboardOpen, setSideboardOpen] = useState(true)');
    expect(workbench).toContain("'Analysetools einklappen'");
    expect(workbench).toContain("'Analysetools aufklappen'");
    expect(workbench).toContain('Analysetools schließen');
    expect(workbench).toContain('Analysetools öffnen');
    expect(workbench).toContain('ui-hit inline-flex min-h-11 min-w-11');
  });

  it('keeps Enterprise Scorer as the default public analysis surface without bypassing gates', () => {
    expect(workbench).toContain("useState<PublicToolId>('enterprise-scorer')");
    expect(workbench).toContain("label: 'Enterprise Scorer'");
    expect(workbench).toContain("availability: 'server-gated'");
    expect(workbench).toContain("availability: 'login-required'");
    expect(workbench).toContain("availability: 'disabled'");
    expect(workbench).toContain('Anmelden und Tool öffnen');
  });

  it('restores an explicit profile/settings entry while preserving the Enterprise presentation badge', () => {
    expect(navigationModel).toContain("{ view: 'profil', label: 'Profil & Einstellungen', section: 'hub' }");
    expect(dashboardHeader).toContain("profile.subscriptionTier === 'Enterprise'");
    expect(dashboardHeader).toContain('Enterprise aktiv');
  });
});
