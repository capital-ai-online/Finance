import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('OPS-AUTH-EMAIL-01 backend email authentication', () => {
  it('keeps all email/password authority on backend endpoints', () => {
    const routes = read('server/routes/backendAuthRoutes.ts');
    const backend = read('server/auth/backendAuth.ts');

    expect(routes).toContain("backendAuthRouter.post('/register'");
    expect(routes).toContain("backendAuthRouter.post('/login/email'");
    expect(routes).toContain("backendAuthRouter.post('/confirmation/resend'");
    expect(routes).toContain("backendAuthRouter.post('/password/forgot'");
    expect(routes).toContain("backendAuthRouter.get('/email/confirm'");
    expect(routes).toContain("'/email/confirm',");
    expect(routes).toContain("backendAuthRouter.post('/password/update'");
    expect(backend).toContain('export function createBackendEmailAuthClient()');
    expect(backend).toContain('persistSession: false');
    expect(backend).toContain('detectSessionInUrl: false');
  });

  it('validates new passwords server-side before signup or update', () => {
    const routes = read('server/routes/backendAuthRoutes.ts');
    expect(routes).toContain('await assertServerPasswordSafe(password)');
    expect(routes).toContain('PasswordSecurityError');
    expect(routes).toContain('ServerPasswordSecurityError');

    const register = routes.slice(routes.indexOf("backendAuthRouter.post('/register'"), routes.indexOf("backendAuthRouter.post('/login/email'"));
    expect(register.indexOf('assertServerPasswordSafe(password)')).toBeLessThan(register.indexOf('supabase.auth.signUp'));

    const update = routes.slice(routes.indexOf("backendAuthRouter.post('/password/update'"), routes.indexOf("backendAuthRouter.get('/callback'"));
    expect(update.indexOf('assertServerPasswordSafe(password)')).toBeLessThan(update.indexOf('supabase.auth.updateUser'));
  });

  it('does not reveal account existence through mail initiation endpoints', () => {
    const routes = read('server/routes/backendAuthRoutes.ts');

    expect(routes).toContain('Wenn die Adresse registriert werden kann');
    expect(routes).toContain('Wenn für diese Adresse eine unbestätigte Registrierung existiert');
    expect(routes).toContain('Wenn ein Konto für diese Adresse existiert');
    expect(routes).toContain('emailActionAccepted');
    expect(routes).not.toContain('getUserByEmail');
  });

  it('uses token-hash confirmation and never places a Supabase session in the browser URL', () => {
    const routes = read('server/routes/backendAuthRoutes.ts');

    expect(routes).toContain('token_hash');
    expect(routes).toContain("value === 'email' || value === 'recovery'");
    expect(routes).toContain('supabase.auth.verifyOtp');
    expect(routes).toContain('persistBackendAuthSession(req, res, data.session)');
    expect(routes).not.toContain('access_token=');
    expect(routes).not.toContain('refresh_token=');
  });

  it('requires an explicit user confirmation action before consuming the email token', () => {
    const routes = read('server/routes/backendAuthRoutes.ts');
    const getStart = routes.indexOf("backendAuthRouter.get('/email/confirm'");
    const postStart = routes.indexOf("backendAuthRouter.post(", getStart);
    const getBlock = routes.slice(getStart, postStart);
    expect(getBlock).toContain('renderEmailConfirmationPage');
    expect(getBlock).not.toContain('verifyOtp');
  });

  it('keeps email-auth endpoints independent from browser CAPTCHA tokens', () => {
    const routes = read('server/routes/backendAuthRoutes.ts');

    expect(routes).not.toContain('captchaToken');
    expect(routes).not.toContain('requireCaptchaToken');
    expect(routes).not.toContain('isCaptchaProviderError');
    expect(routes).not.toContain('CAPTCHA_TOKEN_MAX_LENGTH');
    expect(routes).toContain("supabase.auth.signInWithPassword({ email, password })");
    expect(routes).toContain('supabase.auth.signUp({');
    expect(routes).toContain("supabase.auth.resend({");
    expect(routes).toContain('supabase.auth.resetPasswordForEmail(email, {');
  });

  it('establishes the same HttpOnly session for email login as for Google OAuth', () => {
    const routes = read('server/routes/backendAuthRoutes.ts');
    const backend = read('server/auth/backendAuth.ts');

    expect(routes).toContain('supabase.auth.signInWithPassword({');
    expect(routes).toContain('persistBackendAuthSession(req, res, data.session)');
    expect(backend).toContain("'HttpOnly'");
    expect(backend).toContain('SameSite=');
    expect(backend).toContain("if (isProduction()) parts.push('Secure')");
  });
});
