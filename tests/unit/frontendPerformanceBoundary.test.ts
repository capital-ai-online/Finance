import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const routes = read('src/app/routing/AppRoutes.tsx');
const landing = read('src/features/public/ui/LandingPage.tsx');
const viteConfig = read('vite.config.ts');

describe('frontend performance boundaries', () => {
  it('keeps the public root out of the static Dashboard dependency graph', () => {
    expect(routes).toContain("import { LandingPage } from '../../features/public/ui/LandingPage'");
    expect(routes).not.toContain("import { Dashboard } from '../dashboard'");
    expect(routes).toContain("await import('../dashboard/Dashboard')");
    expect(routes).toContain("await import('../../features/social/ui/MediaStudio')");
    expect(routes).toContain("await import('../../features/learning/ui/LearningVocabulary')");
    expect(landing).not.toContain("import { Dashboard }");
    expect(landing).toContain('React.lazy');
    expect(landing).toContain("import('../../../app/dashboard/Dashboard')");
  });

  it('preserves the productive Dashboard-backed landing page behind an async loading boundary', () => {
    expect(landing).toContain('const LazyDashboard = React.lazy');
    expect(landing).toContain('<React.Suspense');
    expect(landing).toContain('<LazyDashboard');
    expect(landing).toContain('userSession={PUBLIC_VISITOR_SESSION}');
    expect(landing).toContain('This changes loading behavior only');
    expect(landing).not.toContain("import('../../crypto/ui/CryptoScoringEnterprise')");
  });

  it('fails builds that regress the initial JavaScript entry budget', () => {
    expect(viteConfig).toContain('INITIAL_ENTRY_BUDGET_BYTES = 900 * 1024');
    expect(viteConfig).toContain('capital-ai-frontend-performance-budget');
    expect(viteConfig).toContain('output.isEntry && bytes > INITIAL_ENTRY_BUDGET_BYTES');
    expect(viteConfig).toContain('this.error(');
    expect(viteConfig).not.toContain('manualChunks:');
  });
});
