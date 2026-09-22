import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('backend OAuth subscription handoff regression boundary', () => {
  it('exchanges OAuth code and persists the server session before redirecting', () => {
    const route = read('server/routes/backendAuthRoutes.ts');
    const exchange = route.indexOf('exchangeCodeForSession(code)');
    const persist = route.indexOf('persistBackendAuthSession(req, res, data.session)');
    const redirect = route.indexOf('res.redirect(303, new URL(next, origin).toString())');

    expect(exchange).toBeGreaterThan(-1);
    expect(persist).toBeGreaterThan(exchange);
    expect(redirect).toBeGreaterThan(persist);
    expect(route).toContain('verifyOAuthState(req, state)');
  });

  it('projects the subscription only from the verified backend subject', () => {
    const route = read('server/routes/backendAuthRoutes.ts');
    expect(route).toContain('const verified = await resolveVerifiedBackendAuth(req, res)');
    expect(route).toContain('getSubscription(user.id)');
    expect(route).toContain('subscriptionTier: tier');
    expect(route).not.toContain('req.query.userId');
    expect(route).not.toContain('req.query.email');
  });

  it('uses HttpOnly backend cookies rather than browser bearer rotation', () => {
    const backend = read('server/auth/backendAuth.ts');
    const transport = read('src/lib/authFetch.ts');

    expect(backend).toContain("'HttpOnly'");
    expect(backend).toContain("SameSite=");
    expect(backend).toContain("if (isProduction()) parts.push('Secure')");
    expect(transport).toContain("fetch('/api/auth/session'");
    expect(transport).toContain("credentials: 'same-origin'");
    expect(transport).not.toContain('supabase');
    expect(transport).not.toContain('Authorization');
  });
});
