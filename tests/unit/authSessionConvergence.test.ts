import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('authenticated profile session convergence', () => {
  it('resolves the session endpoint exactly once before projecting MFA or profile state', () => {
    const routes = read('server/routes/backendAuthRoutes.ts');
    const start = routes.indexOf("backendAuthRouter.get('/session'");
    const end = routes.indexOf("backendAuthRouter.post('/logout'", start);
    const sessionRoute = routes.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(sessionRoute).toContain('const resolved = await resolveBackendAuthSession(req, res)');
    expect(sessionRoute).not.toContain('resolvePendingBackendAuth(req, res)');
    expect(sessionRoute).not.toContain('resolveVerifiedBackendAuth(req, res)');
  });

  it('coalesces single-use refresh-token rotation behind a bounded fingerprint cache', () => {
    const backend = read('server/auth/backendAuth.ts');

    expect(backend).toContain('SESSION_REFRESH_REUSE_WINDOW_MS = 10_000');
    expect(backend).toContain('MAX_SESSION_REFRESH_REUSE_ENTRIES = 256');
    expect(backend).toContain('const backendSessionRefreshes = new Map');
    expect(backend).toContain("createHash('sha256').update(refreshToken)");
    expect(backend).toContain('return existing.promise');
    expect(backend).toContain('refreshBackendSessionOnce(refreshToken)');
  });

  it('coalesces browser session reads and prevents a stale response from undoing logout', () => {
    const session = read('src/app/auth/SessionComposition.tsx');

    expect(session).toContain('refreshInFlightRef');
    expect(session).toContain('if (refreshInFlightRef.current) return refreshInFlightRef.current');
    expect(session).toContain('sessionEpochRef');
    expect(session).toContain('if (sessionEpochRef.current !== epoch) return');
    expect(session).toContain('sessionEpochRef.current += 1');
  });

  it('keeps the protected profile entry in the initial application graph', () => {
    const routes = read('src/app/routing/AppRoutes.tsx');

    expect(routes).toContain("import { ProfilePage } from '../../components/ProfilePage'");
    expect(routes).not.toContain("import('../../components/ProfilePage')");
    expect(routes).toContain("if (currentPath === '/profile')");
    expect(routes).toContain("onClick={() => navigatePublicRoute('/')}");
  });
});
