import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function source(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('Capital-AI Learning Platform integration', () => {
  it('projects the canonical browser-safe Vocabulary registry without defining a second source', () => {
    const learning = source('src/features/learning/ui/LearningVocabulary.tsx');

    expect(learning).toContain('createDefaultVocabularyRegistry');
    expect(learning).toContain('normalizeVocabularyTerm');
    expect(learning).toContain("from '../../../platform/Vocabulary'");
    expect(learning).toContain("concept.status === 'approved'");
    expect(learning).toContain('Read-only Lernprojektion.');
    expect(learning).toContain('Capital-AI Learning Platform');
    expect(learning).not.toContain('function normalizeSearch');

    expect(learning).not.toContain("platform/Vocabulary/node");
    expect(learning).not.toContain('node:crypto');
    expect(learning).not.toContain('VOC-BILLING-0001');
  });

  it('wires one Learning tab through the app-owned navigation and shared dashboard view router', () => {
    const dashboard = source('src/components/Dashboard.tsx');
    const dashboardNavigation = source('src/app/dashboard/DashboardNavigation.tsx');
    const dashboardNavigationModel = source('src/app/dashboard/dashboardNavigation.ts');
    const dashboardViewRouter = source('src/app/dashboard/DashboardViewRouter.tsx');
    const dashboardViews = source('src/app/dashboard/dashboardViews.ts');

    expect(dashboard).toContain("import { DashboardViewRouter } from '../app/dashboard/DashboardViewRouter'");
    expect(dashboard).toContain("import type { DashboardView } from '../app/dashboard/dashboardViews'");
    expect(dashboard).toContain("useState<DashboardView>('dashboard')");
    expect(dashboard).toContain('<DashboardNavigation');
    expect(dashboardViews).toContain("'learning'");
    expect(dashboardNavigationModel).toContain("{ view: 'learning', label: 'Learning', section: 'hub' }");
    expect(dashboardNavigation).toContain('getDashboardNavigationItems(section).map');
    expect(dashboardNavigation).toContain('onClick={() => navigate(item.view)}');
    expect(dashboard).not.toContain("activeView === 'learning' && (");
    expect(dashboardViewRouter).toContain("case 'learning':");
    expect(dashboardViewRouter).toContain('return <LearningUI.LearningVocabulary />;');
  });

  it('exposes the same LearningVocabulary component lazily at /learning-platform', () => {
    const routes = source('src/app/routing/AppRoutes.tsx');

    expect(routes).toContain('const LearningVocabulary = lazy(() =>');
    expect(routes).toContain("import('../../features/learning/ui/LearningVocabulary')");
    expect(routes).toContain('default: module.LearningVocabulary');
    expect(routes).toContain("window.location.pathname.replace(/\\/+$/, '') || '/'");
    expect(routes).toContain("currentPath === '/learning-platform'");
    expect(routes).toContain('CAPITAL-AI / LEARNING');
    expect(routes).toContain('<LearningVocabulary />');
  });

  it('keeps SEO, prerender and production allowlist aligned to the canonical public path', () => {
    const routeSeo = source('src/lib/routeSeo.ts');
    const prerender = source('scripts/seo/prerender-public-routes.mjs');
    const urlNormalize = source('server/middleware/seoUrlNormalize.ts');
    const spaFallback = source('server/runtime/spaFallback.ts');

    expect(routeSeo).toContain("'/learning-platform': {");
    expect(routeSeo).toContain("canonicalPath: '/learning-platform'");
    expect(prerender).toContain("routePath: '/learning-platform'");
    expect(prerender).toContain("file: 'learning-platform/index.html'");
    expect(urlNormalize).toContain("'/learning-platform'");
    expect(spaFallback).toContain("case '/learning-platform':");
    expect(spaFallback).toContain("path.resolve(rootDir, 'learning-platform', 'index.html')");
  });

  it('does not weaken the production soft-404 boundary for unknown paths', () => {
    const urlNormalize = source('server/middleware/seoUrlNormalize.ts');
    const spaFallback = source('server/runtime/spaFallback.ts');

    expect(urlNormalize).toContain('PUBLIC_SPA_PATHS = new Set([');
    expect(urlNormalize).not.toContain("'/learning-platform*'");
    expect(spaFallback).toContain("return res.status(404).type('text/plain').send('Not Found');");
  });
});
