import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROADMAP_DASHBOARD_SNAPSHOT } from '../../src/features/public/ui/roadmapSnapshot';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Roadmap dashboard projection', () => {
  it('binds the projection to the freshly correlated main baseline without claiming runtime identity', () => {
    expect(ROADMAP_DASHBOARD_SNAPSHOT.correlatedMainSha).toBe(
      '426a98d4703271e438cbc6df4b1442fb3a9b032d',
    );
    expect(ROADMAP_DASHBOARD_SNAPSHOT.currentMainSha).toBe(
      ROADMAP_DASHBOARD_SNAPSHOT.correlatedMainSha,
    );
    expect(ROADMAP_DASHBOARD_SNAPSHOT.role).toBe('NON_AUTHORIZING_DERIVED_UI_PROJECTION');
    expect(ROADMAP_DASHBOARD_SNAPSHOT.productionAudit.classification).toBe(
      'CURRENT_MAIN_DEPLOY_PENDING_AFTER_RECOVERY_MERGE',
    );
    expect(ROADMAP_DASHBOARD_SNAPSHOT.productionAudit.previousFailedDeployId).toBe(
      'dep-daq378mk1f9s738adt70',
    );
  });

  it('removes terminal provider writers and projects the currently activated retry-safe slice', () => {
    const stalePrNumbers = new Set([1299, 1300, 1315]);
    expect(
      ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.some(
        (item) => item.prNumber && stalePrNumbers.has(item.prNumber),
      ),
    ).toBe(false);

    const retrySafe = ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.find(
      (item) => item.id === 'SH-02.11',
    );
    expect(retrySafe?.state).toBe('active');
    expect(retrySafe?.detail).toContain('RETRY_SAFE_OPERATION');
    expect(
      ROADMAP_DASHBOARD_SNAPSHOT.activeWorkPackages.some((item) => item.prNumber === 1334),
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
    expect(integration('AUTH-REGISTRATION-PROFILE')?.state).toBe('main-only');
    expect(integration('OPS-DEPLOY-426A98')?.state).toBe('main-only');
    expect(integration('OPS-DEPLOY-426A98')?.detail).toContain(
      'SUPABASE_MANAGEMENT_ACCESS_TOKEN_MISSING',
    );
  });

  it('uses only canonical branding and shared presentation contracts', () => {
    const dashboard = read('src/features/public/ui/RoadmapDashboard.tsx');

    expect(dashboard).toContain("../../../shared/branding/CapitalAiLogo");
    expect(dashboard).toContain("../../../shared/ui/Card");
    expect(dashboard).toContain('text-brand-primary');
    expect(dashboard).toContain('text-roadmap-foundation');
    expect(dashboard).toContain('text-roadmap-automation');
    expect(dashboard).toContain('text-roadmap-runtime');
    expect(dashboard).toContain('text-roadmap-product-market');
    expect(dashboard).toContain('text-roadmap-scaling');

    expect(ROADMAP_DASHBOARD_SNAPSHOT.branding.brandmark).toBe('docs/frontend/brandmark.json');
    expect(ROADMAP_DASHBOARD_SNAPSHOT.branding.designTokens).toBe(
      'docs/frontend/design-tokens.json',
    );
  });

  it('keeps live production identity separate from the repository correlation baseline', () => {
    const dashboard = read('src/features/public/ui/RoadmapDashboard.tsx');

    expect(dashboard).toContain("fetch('/healthz'");
    expect(dashboard).toContain('x-capital-ai-commit');
    expect(dashboard).toContain('Live Runtime separat');
    expect(dashboard).toContain('Korrelations-Basis');
    expect(dashboard).toContain('Production / SEO Integration Ledger');
  });
});
