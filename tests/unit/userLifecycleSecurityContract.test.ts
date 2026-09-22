import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('user lifecycle backend security contract', () => {
  it('keeps identity and subscription projection server-authoritative', () => {
    const auth = read('src/platform/Security/authMiddleware.ts');
    const backendRoutes = read('server/routes/backendAuthRoutes.ts');

    expect(auth).toContain('resolveVerifiedBackendAuth');
    expect(auth).toContain('supabase.auth.getUser');
    expect(backendRoutes).toContain('resolveVerifiedBackendAuth(req, res)');
    expect(backendRoutes).toContain('getSubscription(user.id)');
    expect(backendRoutes).not.toContain('req.query.userId');
    expect(backendRoutes).not.toContain('req.query.email');
  });

  it('keeps privileged AAL2 server-authoritative outside normal login', () => {
    const auth = read('src/platform/Security/authMiddleware.ts');
    expect(auth).toContain('export async function requireVerifiedAal2');
    expect(auth).toContain('getAuthenticatorAssuranceLevel');
    expect(auth).toContain("if (aalData.currentLevel !== 'aal2')");
    expect(auth).toContain('const aal2 = await requireVerifiedAal2(req);');
  });

  it('keeps browser tokens inaccessible and refresh rotation backend-owned', () => {
    const backend = read('server/auth/backendAuth.ts');
    const transport = read('src/lib/authFetch.ts');

    expect(backend).toContain("'HttpOnly'");
    expect(backend).toContain('refreshSession({ refresh_token: refreshToken })');
    expect(backend).toContain('if (!res) return null');
    expect(transport).not.toContain('supabase');
    expect(transport).not.toContain('Authorization');
    expect(transport).toContain("fetch('/api/auth/session'");
  });

  it('rejects disallowed browser origins before cookie-authenticated handlers', () => {
    const app = read('server.application.ts');
    expect(app).toContain("return res.status(403).json({ error: 'Origin nicht erlaubt.' });");
    expect(app).toContain('SameSite=Lax backend cookies');
  });

  it('keeps provider evidence fail-closed instead of synthesizing PASS', () => {
    const harness = read('scripts/operations/userLifecycleHarness.ts');
    expect(harness).toContain('NOT_AVAILABLE');
  });
});
