import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const routes = read('src/app/routing/AppRoutes.tsx');
const sessionComposition = read('src/app/auth/SessionComposition.tsx');
const landingPage = read('src/components/LandingPage.tsx');

describe('public landing route and auth hydration boundary', () => {
  it('keeps the canonical root route public even when a registered session exists', () => {
    const rootRouteIndex = routes.indexOf("if (currentPath === '/' || currentPath === '')");
    const authenticatedDashboardIndex = routes.indexOf('if (userSession)');

    expect(rootRouteIndex).toBeGreaterThanOrEqual(0);
    expect(authenticatedDashboardIndex).toBeGreaterThan(rootRouteIndex);
    expect(routes).toContain("window.location.assign('/dashboard')");
    expect(routes).toContain("window.location.replace('/')");
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
    expect(landingPage).toContain('Multi-Asset-Analyse mit erklärbaren KI-Scorings');
    expect(landingPage).toContain('Aktien, Indizes, Forex, Krypto und Rohstoffe');
    expect(landingPage).toContain('Fundamentale Bewertung (Graham, DCF)');
    expect(landingPage).toContain('Backtesting &amp; Stressszenarien');
    expect(landingPage).toContain('PDF-/CSV-Exporte für Compliance');
    expect(landingPage).toContain('https://capital-ai.online/datenschutz/');
    expect(landingPage).toContain('https://capital-ai.online/agb/');
  });

  it('does not create a guest identity on the canonical public route', () => {
    expect(routes).not.toContain("type: 'guest'");
    expect(sessionComposition).toContain('Anonymous and guest sessions are intentionally not supported.');
  });
});
