import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getSessionBootstrapKey,
  isSessionEstablishmentEvent,
} from '../../src/app/auth/sessionBootstrap';
import {
  PASSWORD_RECOVERY_QUERY_PARAM,
  isPasswordRecoveryLocation,
} from '../../src/features/public/auth/passwordRecovery';

const loginPage = fs.readFileSync(
  path.join(process.cwd(), 'src/features/public/ui/LoginPage.tsx'),
  'utf8',
);

describe('password recovery login boundary', () => {
  it('recognizes only the explicit public recovery URL', () => {
    expect(PASSWORD_RECOVERY_QUERY_PARAM).toBe('password-recovery');
    expect(
      isPasswordRecoveryLocation({ pathname: '/login', search: '?password-recovery=1' }),
    ).toBe(true);
    expect(isPasswordRecoveryLocation({ pathname: '/login', search: '' })).toBe(false);
    expect(
      isPasswordRecoveryLocation({ pathname: '/', search: '?password-recovery=1' }),
    ).toBe(false);
  });

  it('keeps the recovery URL contract feature-owned instead of importing app composition', () => {
    expect(loginPage).toContain("from '../auth/passwordRecovery'");
    expect(loginPage).not.toMatch(/from\s+['"][^'"]*\/app\//);
  });

  it('does not bootstrap temporary recovery sessions as normal signed-in sessions', () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { pathname: '/login', search: '?password-recovery=1' } },
    });

    try {
      expect(isSessionEstablishmentEvent('INITIAL_SESSION')).toBe(false);
      expect(isSessionEstablishmentEvent('SIGNED_IN')).toBe(false);
      expect(
        getSessionBootstrapKey({
          expires_at: 1_800_000_000,
          user: { id: 'recovery-user', is_anonymous: false },
        }),
      ).toBe('');
    } finally {
      if (originalWindow === undefined) {
        Reflect.deleteProperty(globalThis, 'window');
      } else {
        Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
      }
    }
  });

  it('keeps password recovery CAPTCHA-bound and returns to normal MFA-protected login', () => {
    expect(loginPage).toContain('supabase.auth.resetPasswordForEmail');
    expect(loginPage).toContain('const captchaToken = await requestHcaptchaToken()');
    expect(loginPage).toContain('captchaToken,');
    expect(loginPage).toContain('PASSWORD_RECOVERY_QUERY_PARAM');
    expect(loginPage).toContain('supabase.auth.updateUser({ password: recoveryPassword })');
    expect(loginPage).toContain("supabase.auth.signOut({ scope: 'local' })");
    expect(loginPage).toContain('vorhandene MFA-Prüfungen bleiben aktiv');
    expect(loginPage).not.toContain('localStorage.setItem');
    expect(loginPage).not.toContain('sessionStorage.setItem');
  });
});
