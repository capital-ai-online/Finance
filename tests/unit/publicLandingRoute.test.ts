import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const routes = read('src/app/routing/AppRoutes.tsx');
const publicHomepage = read('src/app/routing/PublicHomepage.tsx');
const sessionComposition = read('src/app/auth/SessionComposition.tsx');
const dashboard = read('src/components/Dashboard.tsx');

describe('public homepage and auth hydration boundary', () => {
  it('keeps the canonical root route on the public Enterprise-Scorer dashboard', () => {
    const rootRouteIndex = routes.indexOf("if (currentPath === '/' || currentPath === '')");
    const authenticatedDashboardIndex = routes.indexOf('if (userSession)');

    expect(rootRouteIndex).toBeGreaterThanOrEqual(0);
    expect(authenticatedDashboardIndex).toBeGreaterThan(rootRouteIndex);
    expect(routes).toContain('<PublicHomepage');
    expect(routes).toContain("window.location.replace('/')");
    expect(publicHomepage).toContain('<Dashboard');
    expect(dashboard).toContain('<CryptoScoringEnterprise');
  });

  it('opens authentication only from the dashboard login action and continues to /dashboard', () => {
    expect(dashboard).toContain('<span>Login (Anmelden)</span>');
    expect(dashboard).toContain("setActiveView('login')");
    expect(publicHomepage).toContain("window.location.assign('/dashboard')");
  });

  it('does not block public routes on Supabase, step-up or subscription hydration', () => {
    expect(sessionComposition).toContain("'/'");
    expect(sessionComposition).toContain("'/datenschutz'");
    expect(sessionComposition).toContain("'/impressum'");
    expect(sessionComposition).toContain("'/agb'");
    expect(sessionComposition).toContain("'/learning-platform'");
    expect(sessionComposition).toContain('if (loading && !renderPublicShellImmediately)');
    expect(sessionComposition).toContain(
      'if (pendingOnboardingSession && !renderPublicShellImmediately)',
    );
    expect(sessionComposition).toContain(
      'if (pendingStepUpSession && !renderPublicShellImmediately)',
    );
  });

  it('keeps the public homepage suitable for Google OAuth branding review', () => {
    expect(publicHomepage).toContain('CAPITAL-AI – quantitative Multi-Asset-Analyse');
    expect(publicHomepage).toContain('Aktien, Indizes, Forex, Kryptowährungen und Rohstoffe');
    expect(publicHomepage).toContain('erklärbaren KI-Scorings');
    expect(publicHomepage).toContain('href="/datenschutz/"');
    expect(publicHomepage).toContain('href="/agb/"');
    expect(publicHomepage).toContain('href="/impressum/"');
  });

  it('uses only a presentation visitor state and does not synthesize an account email', () => {
    expect(publicHomepage).toContain("type: 'guest'");
    expect(publicHomepage).toContain("email: ''");
    expect(publicHomepage).not.toContain('@capital-ai.online');
    expect(publicHomepage).not.toContain('@guest');
    expect(sessionComposition).toContain(
      'Anonymous/guest sessions are not accepted as authenticated sessions.',
    );
  });
});