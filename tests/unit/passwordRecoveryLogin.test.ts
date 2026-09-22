import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const loginPage = fs.readFileSync(
  path.join(process.cwd(), 'src/features/public/ui/LoginPage.tsx'),
  'utf8',
);

describe('backend-first password recovery presentation boundary', () => {
  it('renders password login and recovery controls without browser auth authority', () => {
    expect(loginPage).toContain('id="login-password"');
    expect(loginPage).toContain('id="password-forgot-btn"');
    expect(loginPage).toContain('id="password-recovery-form"');
    expect(loginPage).toContain("postAuthJson('/api/auth/password/forgot'");
    expect(loginPage).not.toContain('captchaToken');
    expect(loginPage).not.toContain('resetPasswordForEmail');
    expect(loginPage).not.toContain('updateUser({ password');
    expect(loginPage).not.toContain('signInWithPassword');
    expect(loginPage).not.toContain('signUp');
    expect(loginPage).not.toContain('supabase.auth');
  });

  it('keeps Google, registration and confirmation resend on same-origin backend endpoints', () => {
    expect(loginPage).toContain('href="/api/auth/login/google?next=%2F"');
    expect(loginPage).toContain('id="tab-mode-register"');
    expect(loginPage).toContain("postAuthJson('/api/auth/register'");
    expect(loginPage).toContain("postAuthJson('/api/auth/confirmation/resend'");
    expect(loginPage).not.toContain('hcaptcha');
    expect(loginPage).not.toContain('Hcaptcha');
    expect(loginPage).not.toContain('localStorage');
    expect(loginPage).not.toContain('sessionStorage');
  });
});
