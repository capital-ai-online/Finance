import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (repoPath: string) => fs.readFileSync(path.join(process.cwd(), repoPath), 'utf8');
const session = read('src/app/auth/SessionComposition.tsx');
const routes = read('src/app/routing/AppRoutes.tsx');

describe('zero-blocking private-route auth resolution', () => {
  it('renders public routes independently from auth bootstrap resolution', () => {
    expect(session).toContain('authBootstrapPending');
    expect(session).not.toContain('Lade Sicherheits-Modul...');
    expect(session).not.toContain('AUTH_BOOTSTRAP_TIMEOUT_MS');
    expect(routes).toContain("if (currentPath === '/')");
    expect(routes).toContain("if (currentPath === '/login')");
  });

  it('prevents a restored authenticated session from being redirected before Supabase resolves', () => {
    expect(routes).toContain('authBootstrapPending: boolean;');
    expect(routes).toContain('if (authBootstrapPending) return <AuthRouteResolution />;');
    expect(routes).toContain('return <RouteRedirect to="/login" label="Weiter zur Anmeldung" />;');
    expect(routes).toContain('Sichere Sitzung wird synchronisiert');
  });

  it('uses no artificial timer or animated spinner for private route resolution', () => {
    const resolutionStart = routes.indexOf('function AuthRouteResolution()');
    const resolutionEnd = routes.indexOf('function PublicPreviewBoundary', resolutionStart);
    const resolution = routes.slice(resolutionStart, resolutionEnd);

    expect(resolutionStart).toBeGreaterThan(-1);
    expect(resolution).not.toContain('setTimeout');
    expect(resolution).not.toContain('animate-spin');
    expect(resolution).not.toContain('animate-pulse');
  });
});
