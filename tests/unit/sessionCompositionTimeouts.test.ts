import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/app/auth/SessionComposition.tsx'),
  'utf8',
);

describe('SessionComposition backend-first zero-blocking shell', () => {
  it('contains no legacy browser Supabase lifecycle or auth watchdog', () => {
    expect(source).not.toContain('supabase');
    expect(source).not.toContain('onAuthStateChange');
    expect(source).not.toContain('getSession()');
    expect(source).not.toContain('LoginStepUpGate');
    expect(source).not.toContain('RegistrationCompletionGate');
    expect(source).not.toContain('localStorage');
    expect(source).not.toContain('setTimeout(');
    expect(source).not.toContain('Promise.race([');
  });

  it('projects only the backend verified session view', () => {
    expect(source).toContain("fetch('/api/auth/session'");
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain("cache: 'no-store'");
    expect(source).toContain("payload?.authenticated !== true");
    expect(source).toContain('isSubscriptionTier(user.subscriptionTier)');
    expect(source).toContain('subscriptionTier: user.subscriptionTier');
  });

  it('clears the UI immediately and delegates logout to the backend', () => {
    const logoutStart = source.indexOf('const performLogout');
    const logout = source.slice(logoutStart);
    expect(logoutStart).toBeGreaterThan(-1);
    expect(logout).toContain('setUserSession(null)');
    expect(logout).toContain("fetch('/api/auth/logout'");
    expect(logout).toContain('JSON.stringify({ scope })');
    expect(logout).not.toContain('supabase.auth.signOut');
  });
});
