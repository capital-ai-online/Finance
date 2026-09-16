import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/app/auth/SessionComposition.tsx'),
  'utf8',
);

describe('SessionComposition Supabase loading watchdog', () => {
  it('bounds the initial auth-state bootstrap without adding a parallel session source', () => {
    expect(source).toContain('const AUTH_BOOTSTRAP_TIMEOUT_MS = 8_000');
    expect(source).toContain('Supabase auth-state bootstrap timed out');
    expect(source).toContain("event === 'INITIAL_SESSION'");
    expect(source).toContain('clearBootstrapTimeout()');

    const bootstrapStart = source.indexOf('useEffect(() => {');
    const bootstrapEnd = source.indexOf('const handleLogin', bootstrapStart);
    const bootstrapEffect = source.slice(bootstrapStart, bootstrapEnd);

    expect(bootstrapStart).toBeGreaterThan(-1);
    expect(bootstrapEnd).toBeGreaterThan(bootstrapStart);
    expect(bootstrapEffect).toContain('supabase.auth.onAuthStateChange((event, session) =>');
    expect(bootstrapEffect).not.toContain('supabase.auth.getSession()');
  });

  it('bounds every network-backed session establishment stage and remains fail-closed', () => {
    expect(source).toContain('const SESSION_STAGE_TIMEOUT_MS = 10_000');
    expect(source).toContain("readNeedsOnboarding(session), 'onboarding status'");
    expect(source).toContain("authFetch('/api/stripe/user-subscription')");
    expect(source).toContain("'subscription handoff'");
    expect(source).toContain("'post-MFA session read'");
    expect(source).toContain("'auth recovery session read'");
    expect(source).toContain('const onboardingRequired = await needsOnboarding(session)');
    expect(source).toContain('setPendingStepUpSession(session)');
    expect(source).toContain('resetAuthProjection();');
  });
});
