import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROADMAP_DASHBOARD_SNAPSHOT } from '../../src/features/public/ui/roadmapSnapshot';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Roadmap dashboard projection', () => {
  it('binds the projection to the freshly correlated main baseline without claiming runtime identity', () => {
    expect(ROADMAP_DASHBOARD_SNAPSHOT.correlatedMainSha).toBe(
      'adcd5609b0db58627fb2d89e58d32f7054baf918',
    );
    expect(ROADMAP_DASHBOARD_SNAPSHOT.currentMainSha).toBe(
      ROADMAP_DASHBOARD_SNAPSHOT.correlatedMainSha,
    );
    expect(ROADMAP_DASHBOARD_SNAPSHOT.role).toBe('NON_AUTHORIZING_DERIVED_UI_PROJECTION');
    expect(ROADMAP_DASHBOARD_SNAPSHOT.productionAudit.classification).toBe(
      'DEPLOYMENT_QUEUED_ANCESTOR',
    );
    expect(ROADMAP_DASHBOARD_SNAPSHOT.productionAudit.observedCommitSha).toBe(
      'd28eff774f24ceab05c1d18268c9b12749a09fe5',
    );
    expect(ROADMAP_DASHBOARD_SNAPSHOT.productionAudit.deployId).toBe(
      'dep-daqa9sh42hec738ulhcg',
    );
    expect(ROADMAP_DASHBOARD_SNAPSHOT.productionAudit.previousFailedDeployId).toBe(
      'dep-daq378mk1f9s738adt70',
    );
    expect(ROADMAP_DASHBOARD_SNAPSHOT.productionAudit.latestFailedDeployId).toBe(
      'dep-daq3dkmgekts73be39i0',
    );
  });

  it('removes terminal provider writers and projects the currently activated retry-safe slice', () => {
    const stalePrNumbers = new Set([1299, 1300, 1315]);
    expect(
      ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.some(
        (item) =>
          'prNumber' in item &&
          typeof item.prNumber === 'number' &&
          stalePrNumbers.has(item.prNumber),
      ),
    ).toBe(false);

    expect(
      ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.some(
        (item) => item.id === 'FE-ROADMAP-LIVE-01',
      ),
    ).toBe(false);
    expect(
      ROADMAP_DASHBOARD_SNAPSHOT.integrationLedger.find(
        (item) => item.id === 'FE-ROADMAP-LIVE-01',
      )?.state,
    ).toBe('production-covered');

    const retrySafe = ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.find(
      (item) => item.id === 'SH-02.11',
    );
    expect(retrySafe?.state).toBe('active');
    expect(retrySafe?.detail).toContain('RETRY_SAFE_OPERATION');
    expect(
      ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.some(
        (item) => 'prNumber' in item && item.prNumber === 1334,
      ),
    ).toBe(false);
  });


  it('correlates Documentary as terminal/non-active without reviving stale claims', () => {
    expect(
      ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.some(
        (item) => item.owner === 'CAPITAL-AI-DOC',
      ),
    ).toBe(false);
    expect(
      ROADMAP_DASHBOARD_SNAPSHOT.queuedItems.some((item) => item.owner === 'CAPITAL-AI-DOC'),
    ).toBe(false);

    const documentary = ROADMAP_DASHBOARD_SNAPSHOT.integrationLedger.find(
      (item) => item.id === 'DOC-ROADMAP-CORRELATION',
    );
    expect(documentary?.state).toBe('repository-integrated');
    expect(documentary?.stateLabel).toContain('KEINE AKTIVE');
    expect(documentary?.detail).toContain('kein ausführbares aktives Arbeitspaket');
  });

  it('centralizes SEC current state in the Live Roadmap and keeps superseded AAL2 out of active work', () => {
    const sec = ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.find(
      (item) => item.id === 'SEC-WEB-HARDENING-01',
    );
    expect(sec?.source).toBe('docs/architecture/ROADMAP.md');
    expect(
      ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.some(
        (item) => item.id === 'SEC-AUTH-DIAG-AAL2-01',
      ),
    ).toBe(false);

    const aal2 = ROADMAP_DASHBOARD_SNAPSHOT.integrationLedger.find(
      (item) => item.id === 'SEC-AUTH-DIAG-AAL2-01',
    );
    expect(aal2?.stateLabel).toContain('SUPERSEDED');

    for (const id of ['SEC-WEB-00', 'SEC-WEB-10', 'SEC-WEB-20', 'SEC-WEB-30', 'SEC-WEB-40', 'SEC-WEB-50']) {
      expect(ROADMAP_DASHBOARD_SNAPSHOT.queuedItems.some((item) => item.id === id)).toBe(true);
    }
  });

  it('consumes the merged QM live-roadmap migration without reviving QM-PR900-02', () => {
    expect(ROADMAP_DASHBOARD_SNAPSHOT.queuedItems.some((item) => item.id === 'QM-PR900-02')).toBe(false);
    const qm03 = ROADMAP_DASHBOARD_SNAPSHOT.queuedItems.find((item) => item.id === 'QM-PR900-03');
    const qm04 = ROADMAP_DASHBOARD_SNAPSHOT.queuedItems.find((item) => item.id === 'QM-PR900-04');
    expect(qm03?.state).toBe('ready');
    expect(qm03?.source).toBe('docs/architecture/ROADMAP.md');
    expect(qm04?.state).toBe('held');
    expect(qm04?.dependsOn).toContain('QM-PR900-03');
  });

  it('keeps canonical active packages traceable to owner roadmap sources', () => {
    for (const item of ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages) {
      if (item.sourceType !== 'canonical-roadmap') continue;
      expect(read(item.source), `${item.id} source must contain its canonical identity`).toContain(
        item.id,
      );
    }
  });

  it('records current SEO/provider integration state without restoring the removed Universe client route', () => {
    const universe = ROADMAP_DASHBOARD_SNAPSHOT.integrationLedger.find(
      (item) => item.id === 'SEO-UNIVERSE-LEGACY-RETIREMENT',
    );
    const ga4 = ROADMAP_DASHBOARD_SNAPSHOT.integrationLedger.find(
      (item) => item.id === 'SEO-GA4-CONSENT',
    );
    const providerMetrics = ROADMAP_DASHBOARD_SNAPSHOT.integrationLedger.find(
      (item) => item.id === 'SEO-GSC-GA4-MEASUREMENT',
    );

    expect(universe?.state).toBe('legacy-drift');
    expect(universe?.detail).toContain('darf nicht still wieder aktiviert werden');
    expect(ga4?.state).toBe('repository-integrated');
    expect(providerMetrics?.state).toBe('provider-gate');

    const appRoutes = read('src/app/routing/AppRoutes.tsx');
    const routeSeo = read('src/lib/routeSeo.ts');
    const sitemap = read('public/sitemap.xml');
    const prerender = read('scripts/seo/prerender-public-routes.mjs');
    const serverRoutes = read('server/middleware/seoUrlNormalize.ts');

    expect(appRoutes).not.toContain("currentPath === '/universe'");
    expect(routeSeo).toContain("'/universe'");
    expect(sitemap).toContain('https://capital-ai.online/universe');
    expect(prerender).toContain("routePath: '/universe'");
    expect(serverRoutes).toContain("'/universe'");
  });

  it('projects recent implemented production and current-main deltas separately', () => {
    const integration = (id: string) =>
      ROADMAP_DASHBOARD_SNAPSHOT.integrationLedger.find((item) => item.id === id);

    expect(integration('FIN-SENT-01')?.state).toBe('production-covered');
    expect(integration('SH-02.11-RETRY-SAFE')?.state).toBe('production-covered');
    expect(integration('PRICING-ARCHIVE-PUBLIC-VISIBILITY')?.state).toBe(
      'production-covered',
    );
    expect(integration('AUTH-REGISTRATION-PROFILE')?.state).toBe('production-covered');
    expect(integration('OPS-DEPLOY-426A98')?.state).toBe('repository-integrated');
    expect(integration('OPS-DEPLOY-426A98')?.stateLabel).toContain('SUPERSEDED');
    expect(integration('AUTH-REGISTRATION-PROFILE')?.detail).toContain(
      'SUPABASE_MANAGEMENT_ACCESS_TOKEN_MISSING',
    );
  });

  it('uses only canonical branding and shared presentation contracts', () => {
    const dashboard = read('src/features/public/ui/RoadmapDashboard.tsx');

    expect(dashboard).toContain("./LandingPageTemplate");
    expect(dashboard).toContain("LandingPanel");
    expect(dashboard).not.toContain("../../../shared/ui/Card");
    expect(dashboard).not.toContain("app-shell-frame");
    expect(dashboard).not.toContain("ui-panel");
    expect(dashboard).toContain('text-brand-primary');
    expect(dashboard).not.toContain('Von Foundation bis Skalierung');
    expect(dashboard).not.toContain('const PHASES');
    expect(dashboard).toContain('OwnerStateTimeline');
    expect(dashboard).toContain('Work-State nach Project Owner');

    expect(ROADMAP_DASHBOARD_SNAPSHOT.branding.brandmark).toBe('docs/frontend/brandmark.json');
    expect(ROADMAP_DASHBOARD_SNAPSHOT.branding.designTokens).toBe(
      'docs/frontend/design-tokens.json',
    );
    expect(ROADMAP_DASHBOARD_SNAPSHOT.branding.pageTemplate).toBe(
      'src/features/public/ui/LandingPageTemplate.tsx',
    );
    expect(ROADMAP_DASHBOARD_SNAPSHOT.branding.logoProjection).toBe(
      'src/features/public/ui/frontend-port/components/BrandLogo.tsx',
    );

    const template = read('src/features/public/ui/LandingPageTemplate.tsx');
    const css = read('src/index.css');
    const tokens = JSON.parse(read('docs/frontend/design-tokens.json')) as {
      color: {
        background: { value: string };
        brand: { primary: { value: string } };
        landingPage: Record<string, { value: string }>;
      };
      font: { landingPage: { value: string } };
      patterns: { landingPage: { template: string } };
    };

    expect(template).toContain("frontend-port/components/BrandLogo");
    expect(tokens.color.landingPage.canvas.value).toBe('#02050E');
    expect(tokens.color.landingPage.surface.value).toBe('#090D1C');
    expect(tokens.color.landingPage.gold.value).toBe('#F9BF21');
    expect(tokens.color.landingPage.magenta.value).toBe('#FF2E93');
    expect(tokens.color.landingPage.purple.value).toBe('#8D26FF');
    expect(tokens.font.landingPage.value).toContain('Plus Jakarta Sans');
    expect(tokens.patterns.landingPage.template).toBe(
      'src/features/public/ui/LandingPageTemplate.tsx',
    );
    expect(css).toContain('--color-landing-canvas: #02050E');
    expect(css).toContain('--color-landing-magenta: #FF2E93');
    expect(css).toContain('.landing-page-panel');

    // Cross-media core roles stay stable; this FE slice does not restyle PDF/Social consumers.
    expect(tokens.color.background.value).toBe('#18181B');
    expect(tokens.color.brand.primary.value).toBe('#F5C453');
  });

  it('keeps live production identity separate from the repository correlation baseline', () => {
    const dashboard = read('src/features/public/ui/RoadmapDashboard.tsx');

    expect(dashboard).toContain("fetch('/healthz'");
    expect(dashboard).toContain('x-capital-ai-commit');
    expect(dashboard).toContain('Live Runtime separat');
    expect(dashboard).toContain('Korrelations-Basis');
    expect(dashboard).toContain('Production / SEO Integration Ledger');
    expect(dashboard).toContain("docs/projects/README.md?raw");
    expect(dashboard).toContain('Nach Arbeitspaket, Status, Project Owner und Label filtern');
    expect(dashboard).toContain("type RoadmapStatusFilter = 'active' | 'live' | 'pending'");
    expect(dashboard).toContain('Branches · behind 0');
    expect(dashboard).toContain('OwnerStateMobileCards');
    expect(dashboard).toContain('space-y-3 lg:hidden');
    expect(dashboard).toContain("fetch('/api/roadmap/branches'");
    expect(dashboard).toContain('LiveBranchCards');
    expect(dashboard).toContain('behind=0');
    expect(dashboard).toContain('ahead&gt;0');
    expect(dashboard).toContain('Branch-Evidence und CURRENT_MAIN sind nicht korreliert');
    expect(dashboard).toContain('hidden lg:block');
    expect(dashboard).toContain('Parallel Worker Projection');
    expect(dashboard).toContain('parallelisierbare Worker-Lanes');
  });
});
