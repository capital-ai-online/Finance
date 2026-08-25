import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.resolve(process.cwd(), 'src/app/auth/SessionComposition.tsx'),
  'utf8',
);

describe('SessionComposition authentication boundary', () => {
  it('does not restore authenticated UI state from the custom localStorage cache', () => {
    expect(source).not.toContain("const localSessionJson = localStorage.getItem('mcc_user_session')");
    expect(source).not.toContain('setUserSession(parsed)');
    expect(source).not.toContain('using authenticated local cache state');
  });

  it('fails closed when Supabase session revalidation is unavailable or fails', () => {
    expect(source).toContain('if (!supabase) {\n      updateUserSession(null);');
    expect(source).toContain('Supabase getSession failed; clearing non-authoritative local session cache:');
    expect(source).toContain(".catch((err) => {\n        console.warn('Supabase getSession failed; clearing non-authoritative local session cache:', err);\n        updateUserSession(null);");
  });

  it('does not persist a Supabase access token in the application UserSession projection', () => {
    expect(source).not.toContain('accessToken: session.access_token');
  });
});
