import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const loginPage = read('src/features/public/ui/LoginPage.tsx');
const sessionComposition = read('src/app/auth/SessionComposition.tsx');
const backendRoutes = read('server/routes/backendAuthRoutes.ts');
const backendAuth = read('server/auth/backendAuth.ts');
const authMiddleware = read('src/platform/Security/authMiddleware.ts');

describe('website primary login backend rebuild boundary', () => {
  it('exposes Google plus visible backend-owned email login and registration entrypoints', () => {
    expect(loginPage).toContain('href="/api/auth/login/google?next=%2F"');
    expect(loginPage).toContain('Mit Google anmelden');
    expect(loginPage).toContain('data-auth-architecture="backend-first"');
    expect(loginPage).toContain('id="tab-mode-login"');
    expect(loginPage).toContain('id="tab-mode-register"');
    expect(loginPage).toContain("postAuthJson('/api/auth/login/email'");
    expect(loginPage).toContain("postAuthJson('/api/auth/register'");
    expect(loginPage).toContain("postAuthJson('/api/auth/password/forgot'");
    expect(loginPage).toContain("postAuthJson('/api/auth/confirmation/resend'");
    expect(loginPage).not.toContain('hcaptcha');
    expect(loginPage).not.toContain('Hcaptcha');
    expect(loginPage).not.toContain('captchaToken');
    expect(loginPage).toContain("type={showLoginPassword ? 'text' : 'password'}");
    expect(loginPage).toContain("type={showRegPassword ? 'text' : 'password'}");
    expect(loginPage).not.toContain('supabase.auth');
    expect(loginPage).not.toContain('signInWithPassword');
    expect(loginPage).not.toContain('signUp');
    expect(loginPage).not.toContain('resetPasswordForEmail');
  });

  it('runs Google OAuth and PKCE code exchange only on the backend', () => {
    expect(backendRoutes).toContain("backendAuthRouter.get('/login/google'");
    expect(backendRoutes).toContain("provider: 'google'");
    expect(backendRoutes).toContain("prompt: 'select_account'");
    expect(backendRoutes).toContain('exchangeCodeForSession(code)');
    expect(backendRoutes).toContain('persistBackendAuthSession(req, res, data.session)');
    expect(backendAuth).toContain("flowType: 'pkce'");
    expect(backendAuth).toContain('verifyOAuthState');
  });

  it('stores no auth token in the productive browser composition', () => {
    expect(sessionComposition).toContain("fetch('/api/auth/session'");
    expect(sessionComposition).not.toContain('supabase');
    expect(sessionComposition).not.toContain('localStorage');
    expect(sessionComposition).not.toContain('sessionStorage');
    expect(sessionComposition).not.toContain('access_token');
    expect(sessionComposition).not.toContain('refresh_token');
  });

  it('keeps privileged server authorization provider-verified', () => {
    expect(authMiddleware).toContain('resolveVerifiedBackendAuth');
    expect(authMiddleware).toContain('supabase.auth.getUser');
    expect(authMiddleware).toContain('export async function requireVerifiedAal2');
    expect(authMiddleware).toContain('getAuthenticatorAssuranceLevel');
  });

  it('keeps legal navigation on the rebuilt login surface', () => {
    expect(loginPage).toContain('Terminal Anmeldung');
    expect(loginPage).toContain('BrandLogo');
    expect(loginPage).toContain('href="/impressum"');
    expect(loginPage).toContain('href="/datenschutz"');
    expect(loginPage).toContain('href="/agb"');
  });
});
