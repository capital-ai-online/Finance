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

  it('fails closed without making Supabase initialization a global UI wait state', () => {
    expect(source).toContain('const resetAuthProjection = () => {');
    expect(source).toContain(
      'if (!supabase) {\n      resetAuthProjection();\n      setAuthBootstrapPending(false);\n      return;',
    );
    expect(source).not.toContain('const [loading, setLoading]');
    expect(source).not.toContain('Lade Sicherheits-Modul...');

    const failureStart = source.indexOf('void establishSession(candidate.session)');
    const failureEnd = source.indexOf('    return () => {', failureStart);
    const failureHandler = source.slice(failureStart, failureEnd);

    expect(failureHandler).toContain(
      "console.error('[Auth] Session establishment failed:', err);",
    );
    expect(failureHandler).toContain('updateUserSession(null);');
    expect(failureHandler).toContain('setPendingStepUpSession(null);');
    expect(failureHandler).toContain('setPendingOnboardingSession(null);');
    expect(failureHandler).toContain('setAuthBootstrapPending(false);');
  });

  it('does not persist a Supabase access token in the application UserSession projection', () => {
    expect(source).not.toContain('accessToken: session.access_token');
  });
});