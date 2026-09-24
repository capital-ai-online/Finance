import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const routes = read('src/app/routing/AppRoutes.tsx');
const session = read('src/app/auth/SessionComposition.tsx');
const dashboard = read('src/app/dashboard/Dashboard.tsx');
const dashboardNavigation = read('src/app/dashboard/DashboardNavigation.tsx');
const login = read('src/features/public/ui/LoginPage.tsx');
const header = read('src/features/public/ui/frontend-port/components/Header.tsx');
const backendRoutes = read('server/routes/backendAuthRoutes.ts');
const packageJson = JSON.parse(read('package.json')) as { version: string };
const indexHtml = read('index.html');

describe('backend auth lifecycle remediation', () => {
  it('keeps authenticated users on the canonical root with backend profile projection', () => {
    expect(routes).toContain("if (currentPath === '/')");
    expect(routes).toContain('authenticatedProfile={{');
    expect(routes).toContain('subscriptionTier: userSession.subscriptionTier');
    expect(session).toContain("fetch('/api/auth/session'");
    expect(session).not.toContain('supabase');
  });

  it('keeps unauthenticated root public, protects /profile and retires dashboard account entry', () => {
    expect(routes).toContain('<LandingPage');
    expect(routes).toContain("if (currentPath === '/profile')");
    expect(routes).toContain('<RouteRedirect to="/login"');
    expect(routes).toContain('<RouteRedirect to="/profile" label="Weiter zum Profil" />');
    expect(routes).not.toContain("import('../dashboard/Dashboard')");
  });

  it('delegates local/global logout to the backend and exposes visible landing logout', () => {
    expect(session).toContain("performLogout('local')");
    expect(session).toContain("performLogout('global')");
    expect(session).toContain("fetch('/api/auth/logout'");
    expect(backendRoutes).toContain("backendAuthRouter.post('/logout'");
    expect(header).toContain('id="header-logout-btn"');
    expect(header).toContain('id="drawer-logout-btn"');
  });

  it('retains global logout as a separate confirmed dashboard action', () => {
    expect(dashboard).toContain('Von allen Geräten abmelden');
    expect(dashboard).toContain('window.confirm(');
    expect(dashboardNavigation).toContain('Von allen Geräten abmelden');
  });

  it('removes password/registration/recovery from the productive login page', () => {
    expect(login).toContain('/api/auth/login/google?next=%2F');
    expect(login).not.toContain('signInWithPassword');
    expect(login).not.toContain('signUp');
    expect(login).not.toContain('resetPasswordForEmail');
    expect(login).not.toContain('supabase');
  });

  it('projects the canonical package version into structured data', () => {
    expect(indexHtml).toContain('"@type": "SoftwareApplication"');
    expect(indexHtml).toContain(`"softwareVersion": "${packageJson.version}"`);
  });
});
