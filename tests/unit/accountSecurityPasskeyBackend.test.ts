import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('backend-first account security and passkey convergence', () => {
  it('keeps passkey ceremonies on the backend session boundary', () => {
    const backend = read('server/auth/backendAuth.ts');
    const login = read('server/routes/backendAuthRoutes.ts');
    const account = read('server/routes/accountSecurityRoutes.ts');

    expect(backend).toContain("experimental: { passkey: true }");
    expect(login).toContain("'/login/passkey/start'");
    expect(login).toContain('auth.passkey.startAuthentication()');
    expect(login).toContain("'/login/passkey/verify'");
    expect(login).toContain('auth.passkey.verifyAuthentication');
    expect(login).toContain('persistBackendAuthSession(req, res, data.session)');

    expect(account).toContain("'/security/passkeys/registration/start'");
    expect(account).toContain('auth.passkey.startRegistration()');
    expect(account).toContain("'/security/passkeys/registration/verify'");
    expect(account).toContain('auth.passkey.verifyRegistration');
    expect(account).toContain('auth.passkey.list()');
    expect(account).toContain("'/security/passkeys/:passkeyId'");

    expect(login).not.toContain('access_token=');
    expect(login).not.toContain('refresh_token=');
  });

  it('requires confirmation mail before password replacement from the security surface', () => {
    const account = read('server/routes/accountSecurityRoutes.ts');
    const backend = read('server/routes/backendAuthRoutes.ts');

    expect(account).toContain("'/security/password/reset'");
    expect(account).toContain('verified.user.email');
    expect(account).toContain('resetPasswordForEmail(email');
    expect(account).toContain("new URL('/api/auth/email/confirm', origin)");
    expect(backend).toContain("type === 'recovery'");
    expect(backend).toContain("'/account/update-password'");
    expect(backend).toContain("backendAuthRouter.post('/password/update'");
    expect(backend).toContain('resolveVerifiedBackendAuth(req, res)');
  });

  it('keeps TOTP as MFA while primary-login passkey is configured separately', () => {
    const account = read('server/routes/accountSecurityRoutes.ts');
    const control = read('scripts/operations/supabaseAuthRegistrationControl.mjs');

    expect(account).toContain("factorType: 'totp'");
    expect(account).toContain('qrCode: data.totp.qr_code');
    expect(account).toContain('secret: data.totp.secret');
    expect(control).toContain('mfa_totp_enroll_enabled: true');
    expect(control).toContain('mfa_totp_verify_enabled: true');
    expect(control).toContain('mfa_web_authn_enroll_enabled: false');
    expect(control).toContain('mfa_web_authn_verify_enabled: false');
    expect(control).toContain('passkey_enabled: true');
    expect(control).toContain("webauthn_rp_display_name: 'CAPITAL-AI'");
    expect(control).toContain("webauthn_rp_id: 'capital-ai.online'");
    expect(control).toContain('webauthn_rp_origins: CANONICAL_SITE_URL');
  });

  it('serves profile and password-update pages through the production SPA fallback', () => {
    const routes = read('server/middleware/seoUrlNormalize.ts');
    const fallback = read('server/runtime/spaFallback.ts');

    expect(routes).toContain("'/profile'");
    expect(routes).toContain("'/account/update-password'");
    expect(fallback).toContain("case '/profile':");
    expect(fallback).toContain("case '/account/update-password':");
  });
});
