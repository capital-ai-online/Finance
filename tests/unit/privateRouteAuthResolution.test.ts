import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (repoPath: string) => fs.readFileSync(path.join(process.cwd(), repoPath), 'utf8');
const session = read('src/app/auth/SessionComposition.tsx');
const routes = read('src/app/routing/AppRoutes.tsx');

describe('backend-session private-route auth resolution', () => {
  it('renders public routes independently from session bootstrap resolution', () => {
    expect(session).toContain('authBootstrapPending');
    expect(session).toContain("fetch('/api/auth/session'");
    expect(session).not.toContain('supabase');
    expect(routes).toContain("if (currentPath === '/')");
    expect(routes).toContain("if (currentPath === '/login')");
  });

  it('holds protected routes until backend session resolution completes', () => {
    expect(routes).toContain('authBootstrapPending: boolean;');
    expect(routes).toContain('if (authBootstrapPending) return <AuthRouteResolution />;');
    expect(routes).toContain('return <RouteRedirect to="/login" label="Weiter zur Anmeldung" />;');
  });

  it('uses no artificial auth timer or spinner', () => {
    expect(session).not.toContain('setTimeout');
    expect(session).not.toContain('Promise.race');
    expect(routes).not.toContain('animate-spin');
  });
});
