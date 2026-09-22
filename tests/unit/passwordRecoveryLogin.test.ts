import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const loginPage = fs.readFileSync(
  path.join(process.cwd(), 'src/features/public/ui/LoginPage.tsx'),
  'utf8',
);

describe('superseded browser password recovery boundary', () => {
  it('removes password recovery and password authentication from the productive login page', () => {
    expect(loginPage).not.toContain('resetPasswordForEmail');
    expect(loginPage).not.toContain('updateUser({ password');
    expect(loginPage).not.toContain('signInWithPassword');
    expect(loginPage).not.toContain('signUp');
    expect(loginPage).not.toContain('PASSWORD_RECOVERY_QUERY_PARAM');
    expect(loginPage).not.toContain('type="password"');
  });

  it('retains only the backend Google login entrypoint', () => {
    expect(loginPage).toContain('href="/api/auth/login/google?next=%2F"');
    expect(loginPage).toContain('Mit Google anmelden');
    expect(loginPage).not.toContain('localStorage');
    expect(loginPage).not.toContain('sessionStorage');
  });
});
