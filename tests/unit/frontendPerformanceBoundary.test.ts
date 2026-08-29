import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const routes = read('src/app/routing/AppRoutes.tsx');
const landing = read('src/features/public/ui/LandingPage.tsx');
const viteConfig = read('vite.config.ts');

describe('frontend performance boundaries', () => {
  it('keeps the public root isolated from authenticated heavy feature graphs', () => {
    expect(routes).toContain("import { LandingPage } from '../../features/public/ui/LandingPage'");
    expect(routes).not.toContain("import { Dashboard } from '../dashboard'");
    expect(routes).toContain("await import('../dashboard/Dashboard')");
    expect(routes).toContain("await import('../../features/social/ui/MediaStudio')");
    expect(routes).toContain("await import('../../features/learning/ui/LearningVocabulary')");
    expect(landing).not.toContain('app/dashboard');
  });

  it('loads the public scorer only near the viewport', () => {
    expect(landing).toContain('React.lazy');
    expect(landing).toContain("import('../../crypto/ui/CryptoScoringEnterprise')");
    expect(landing).toContain('IntersectionObserver');
    expect(landing).toContain("{ rootMargin: '320px 0px' }");
  });

  it('fails builds that regress the initial JavaScript entry budget', () => {
    expect(viteConfig).toContain('INITIAL_ENTRY_BUDGET_BYTES = 900 * 1024');
    expect(viteConfig).toContain('capital-ai-frontend-performance-budget');
    expect(viteConfig).toContain('output.isEntry && bytes > INITIAL_ENTRY_BUDGET_BYTES');
    expect(viteConfig).toContain('this.error(');
    expect(viteConfig).not.toContain('manualChunks:');
  });
});
