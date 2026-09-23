import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('foreign FE issue convergence', () => {
  it('keeps /universe on the existing canonical pre-session boundary', () => {
    const app = read('src/app/App.tsx');
    const boundary = read('src/app/universe/ui/UniversePathBoundary.tsx');
    expect(app).toContain('<UniversePathBoundary>');
    expect(boundary).toContain("export const UNIVERSE_PATH = '/universe' as const");
    expect(boundary).toContain('return <UniversePortal />');
  });

  it('keeps Universe routable but removes the Universe tab from visible landing navigation', () => {
    const header = read('src/features/public/ui/frontend-port/components/Header.tsx');
    expect(header).not.toContain('href="/universe"');
    expect(header).not.toContain('data-public-navigation="universe"');
    expect(header).toContain('href="/learning-platform"');
    expect(header).toContain('data-public-navigation="learning-platform"');
  });

  it('routes password recovery through the verified backend session only', () => {
    const routes = read('src/app/routing/AppRoutes.tsx');
    const page = read('src/features/public/ui/PasswordUpdatePage.tsx');
    expect(routes).toContain("currentPath === '/account/update-password'");
    expect(routes).toContain('<PasswordUpdatePage />');
    expect(page).toContain("fetch('/api/auth/password/update'");
    expect(page).toContain("credentials: 'same-origin'");
    expect(page).toContain("window.location.replace('/login?password-updated=1')");
    expect(page).not.toContain('supabase');
    expect(page).not.toContain('localStorage');
    expect(page).not.toContain('sessionStorage');
  });
});
