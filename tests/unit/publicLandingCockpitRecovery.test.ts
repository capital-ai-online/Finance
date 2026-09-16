import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const workbench = read('src/app/public/PublicAnalysisWorkbench.tsx');
const navigationModel = read('src/app/dashboard/dashboardNavigation.ts');
const dashboardHeader = read('src/app/dashboard/DashboardHeader.tsx');

describe('public landing cockpit recovery', () => {
  it('starts with the compact public sideboard and exposes explicit touch controls', () => {
    expect(workbench).toContain('const [sideboardExpanded, setSideboardExpanded] = useState(false)');
    expect(workbench).toContain("'Analysetools einklappen'");
    expect(workbench).toContain("'Analysetools aufklappen'");
    expect(workbench).toContain('Sideboard schließen');
    expect(workbench).toContain('Sideboard öffnen');
    expect(workbench).toContain('ui-hit inline-flex min-h-11 min-w-11');
    expect(workbench).toContain("'lg:grid-cols-[300px_minmax(0,1fr)]'");
    expect(workbench).toContain("'lg:grid-cols-[88px_minmax(0,1fr)]'");
  });

  it('keeps Enterprise Scorer as the default BTC-fixed public analysis surface without weakening protected tools', () => {
    expect(workbench).toContain("useState<PublicToolId>('enterprise-scorer')");
    expect(workbench).toContain("const PUBLIC_FIXED_SYMBOL = 'BTC' as const");
    expect(workbench).toContain("label: 'Enterprise Scorer'");
    expect(workbench).toContain("availability: 'public'");
    expect(workbench).toContain('selectedSymbol={PUBLIC_FIXED_SYMBOL}');
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
