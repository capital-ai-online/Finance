import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PublicAnalysisWorkbench } from '../../src/app/public/PublicAnalysisWorkbench';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const workbench = read('src/app/public/PublicAnalysisWorkbench.tsx');
const navigationModel = read('src/app/dashboard/dashboardNavigation.ts');
const dashboardHeader = read('src/app/dashboard/DashboardHeader.tsx');

describe('public landing cockpit recovery', () => {
  it('keeps the public sideboard narrow by default with explicit mobile touch controls', () => {
    // Keep an explicit dependency edge so dependency-aware changed-test selection follows
    // PublicAnalysisWorkbench changes even though the contract assertions inspect source text.
    expect(PublicAnalysisWorkbench).toBeTypeOf('function');
    expect(workbench).toContain('const [sideboardExpanded, setSideboardExpanded] = useState(false)');
    expect(workbench).toContain("'Analysetools einklappen'");
    expect(workbench).toContain("'Analysetools aufklappen'");
    expect(workbench).toContain('Sideboard schließen');
    expect(workbench).toContain('Sideboard öffnen');
    expect(workbench).toContain("lg:grid-cols-[300px_minmax(0,1fr)]");
    expect(workbench).toContain("lg:grid-cols-[88px_minmax(0,1fr)]");
    expect(workbench).toContain("sideboardExpanded ? 'block' : 'hidden lg:block'");
    expect(workbench).toContain('ui-hit inline-flex min-h-11 min-w-11');
  });

  it('keeps Enterprise Scorer as the default public BTC analysis surface without bypassing protected tools', () => {
    expect(workbench).toContain("useState<PublicToolId>('enterprise-scorer')");
    expect(workbench).toMatch(/id: 'enterprise-scorer'[\s\S]*?label: 'Enterprise Scorer'[\s\S]*?availability: 'public'/);
    expect(workbench).toContain("const PUBLIC_FIXED_SYMBOL = 'BTC' as const");
    expect(workbench).toContain("availability: 'login-required'");
    expect(workbench).toContain("availability: 'disabled'");
    expect(workbench).toContain('Anmelden und Tool öffnen');
  });

  it('restores profile/settings while presenting subscription-independent component access', () => {
    expect(navigationModel).toContain("{ view: 'profil', label: 'Profil & Einstellungen', section: 'hub' }");
    expect(dashboardHeader).not.toContain("profile.subscriptionTier === 'Enterprise'");
    expect(dashboardHeader).toContain('Offener Zugang');
  });
});
