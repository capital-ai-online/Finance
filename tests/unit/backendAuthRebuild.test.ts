import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('OPS-AUTH-BACKEND-01 backend-first authentication', () => {
  it('owns Google OAuth and PKCE exchange on the backend', () => {
    const routes = read('server/routes/backendAuthRoutes.ts');
    const backend = read('server/auth/backendAuth.ts');

    expect(routes).toContain("backendAuthRouter.get('/login/google'");
    expect(routes).toContain("provider: 'google'");
    expect(routes).toContain('exchangeCodeForSession(code)');
    expect(routes).toContain('persistBackendAuthSession(req, res, data.session)');
    expect(backend).toContain("flowType: 'pkce'");
    expect(backend).toContain('verifyOAuthState');
    expect(backend).toContain('timingSafeEqual');
  });

  it('keeps Supabase session material outside browser JavaScript', () => {
    const backend = read('server/auth/backendAuth.ts');
    const session = read('src/app/auth/SessionComposition.tsx');
    const login = read('src/features/public/ui/LoginPage.tsx');

    expect(backend).toContain("'HttpOnly'");
    expect(backend).toContain("SameSite=");
    expect(backend).toContain("if (isProduction()) parts.push('Secure')");
    expect(session).not.toContain('supabase');
    expect(session).not.toContain('access_token');
    expect(session).not.toContain('refresh_token');
    expect(session).not.toContain('localStorage');
    expect(login).not.toContain('supabase');
  });

  it('projects one verified identity and authoritative subscription tier', () => {
    const routes = read('server/routes/backendAuthRoutes.ts');

    const identityIndex = routes.indexOf('resolveVerifiedBackendAuth(req, res)');
    const subscriptionIndex = routes.indexOf('getSubscription(user.id)', identityIndex);
    const responseIndex = routes.indexOf('subscriptionTier: tier', subscriptionIndex);

    expect(identityIndex).toBeGreaterThan(-1);
    expect(subscriptionIndex).toBeGreaterThan(identityIndex);
    expect(responseIndex).toBeGreaterThan(subscriptionIndex);
    expect(routes).toContain('Invalid authoritative subscription tier');
    expect(routes).not.toContain('req.query.userId');
    expect(routes).not.toContain('req.query.email');
  });

  it('supports deterministic local/global logout and clears backend cookies', () => {
    const routes = read('server/routes/backendAuthRoutes.ts');
    const backend = read('server/auth/backendAuth.ts');
    const session = read('src/app/auth/SessionComposition.tsx');
    const header = read('src/features/public/ui/frontend-port/components/Header.tsx');

    expect(routes).toContain("backendAuthRouter.post('/logout'");
    expect(routes).toContain("req.body?.scope === 'global' ? 'global' : 'local'");
    expect(routes).toContain('clearBackendAuthCookies(req, res)');
    expect(backend).toContain("await client.auth.signOut({ scope })");
    expect(session).toContain("performLogout('local')");
    expect(session).toContain("performLogout('global')");
    expect(header).toContain('id="header-logout-btn"');
    expect(header).toContain('id="drawer-logout-btn"');
  });

  it('rejects cross-origin browser requests before cookie-authenticated handlers', () => {
    const app = read('server.application.ts');
    const backend = read('server/auth/backendAuth.ts');

    expect(app).toContain("return res.status(403).json({ error: 'Origin nicht erlaubt.' });");
    expect(app).toContain('SameSite=Lax backend cookies');
    expect(backend).toContain('isOriginAllowed(origin, production)');
  });
});
