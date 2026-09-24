import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('authenticated profile account surface', () => {
  it('routes authenticated account navigation to profile instead of dashboard', () => {
    const routes = read('src/app/routing/AppRoutes.tsx');
    const header = read('src/features/public/ui/frontend-port/components/Header.tsx');

    expect(routes).toContain("currentPath === '/profile'");
    expect(routes).toContain('<RouteRedirect to="/profile" label="Weiter zum Profil" />');
    expect(routes).not.toContain("import('../dashboard/Dashboard')");
    expect(routes).not.toContain('renderAuthenticatedDashboard');

    expect(header).toContain("onNavigate?.('/profile')");
    expect(header).toContain('Profil &amp; Sicherheit');
    expect(header).not.toContain("onNavigate?.('/dashboard')");
    expect(header).not.toContain('SubscriptionStatusBadge');
  });

  it('keeps profile persistence and private avatar actions on the backend boundary', () => {
    const profile = read('src/components/ProfilePage.tsx');

    expect(profile).toContain("authFetch('/api/auth/profile'");
    expect(profile).toContain("authFetch('/api/auth/profile/avatar'");
    expect(profile).toContain("authFetch('/api/auth/profile/avatar', { method: 'DELETE' })");
    expect(profile).toContain('PNG, JPG, WebP · maximal 2 MB');
    expect(profile).toContain("<KeyRound size={15} /> Sicherheit");
    expect(profile).toContain("<SecuritySettingsPanel />");
  });

  it('does not expose the archived pricing model on the active profile surface', () => {
    const profile = read('src/components/ProfilePage.tsx');

    expect(profile).not.toContain('/api/stripe/create-portal-session');
    expect(profile).not.toContain('Abrechnung verwalten');
    expect(profile).not.toContain('Mitgliedschaft');
    expect(profile).not.toContain('subscription_tier:');
  });
});
