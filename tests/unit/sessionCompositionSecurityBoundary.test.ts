import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/app/auth/SessionComposition.tsx'),
  'utf8',
);

describe('SessionComposition backend-session security boundary', () => {
  it('does not restore authenticated UI state from browser persistence', () => {
    expect(source).not.toContain("localStorage.getItem('mcc_user_session')");
    expect(source).not.toContain('sessionStorage');
    expect(source).not.toContain('access_token');
    expect(source).not.toContain('refresh_token');
  });

  it('fails closed on backend session readback without making public routes wait', () => {
    expect(source).toContain("fetch('/api/auth/session'");
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('if (!response.ok)');
    expect(source).toContain('setUserSession(null)');
    expect(source).toContain('finally');
    expect(source).toContain('setAuthBootstrapPending(false)');
    expect(source).not.toContain('supabase');
    expect(source).not.toContain('LoginStepUpGate');
    expect(source).not.toContain('RegistrationCompletionGate');
  });

  it('clears the browser projection before backend logout cleanup', () => {
    const logoutStart = source.indexOf('const performLogout');
    const logout = source.slice(logoutStart);
    expect(logoutStart).toBeGreaterThan(-1);
    expect(logout.indexOf('setUserSession(null)')).toBeLessThan(logout.indexOf("fetch('/api/auth/logout'"));
    expect(logout).toContain("performLogout('local')");
    expect(logout).toContain("performLogout('global')");
  });
});
