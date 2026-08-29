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

  it('fails closed when Supabase auth bootstrap is unavailable or deferred establishment fails', () => {
    expect(source).toContain('const resetAuthProjection = () => {');
    expect(source).toContain(
      'if (!supabase) {\n      resetAuthProjection();\n      setLoading(false);\n      return;',
    );

    const deferredFailureHandler =
      source.match(
        /establishSession\(session\)\.catch\(\(err\) => \{([\s\S]*?)\n      \}\);/,
      )?.[1] ?? '';

    expect(deferredFailureHandler).toContain(
      "console.error('[Auth] Deferred session establishment failed:', err);",
    );
    expect(deferredFailureHandler).toContain('updateUserSession(null);');
    expect(deferredFailureHandler).toContain('setPendingStepUpSession(null);');
    expect(deferredFailureHandler).toContain('setPendingOnboardingSession(null);');
    expect(deferredFailureHandler).toContain('setLoading(false);');
  });

  it('does not persist a Supabase access token in the application UserSession projection', () => {
    expect(source).not.toContain('accessToken: session.access_token');
  });
});
