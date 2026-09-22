import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/app/auth/SessionComposition.tsx'),
  'utf8',
);

describe('SessionComposition zero-blocking auth shell', () => {
  it('keeps the application shell free of auth watchdog timers', () => {
    expect(source).not.toContain('AUTH_BOOTSTRAP_TIMEOUT_MS');
    expect(source).not.toContain('SESSION_STAGE_TIMEOUT_MS');
    expect(source).not.toContain('SIGN_OUT_TIMEOUT_MS');
    expect(source).not.toContain('withSessionStageTimeout');
    expect(source).not.toContain('setTimeout(');
    expect(source).not.toContain('Promise.race([');
    expect(source).not.toContain('Lade Sicherheits-Modul...');
    expect(source).not.toContain('if (loading &&');
    expect(source).toContain('supabase.auth.onAuthStateChange((event, session) =>');
    expect(source).not.toContain('queueMicrotask(() => {');
    expect(source).toContain('setSessionEstablishmentCandidate({ key, session });');
    expect(source).toContain('const candidate = sessionEstablishmentCandidate;');
  });

  it('keeps async Supabase session work outside the onAuthStateChange callback context', () => {
    const listenerStart = source.indexOf('supabase.auth.onAuthStateChange((event, session) =>');
    const listenerEnd = source.indexOf('    });', listenerStart);
    const listener = source.slice(listenerStart, listenerEnd);

    expect(listenerStart).toBeGreaterThan(-1);
    expect(listener).toContain('scheduleSessionEstablishment(session);');
    expect(listener).not.toContain('establishSession(');
    expect(listener).not.toContain('needsOnboarding(');
    expect(listener).not.toContain('queueMicrotask');
    expect(source).toContain('void establishSession(candidate.session)');
  });

  it('resolves persisted Supabase state directly and publishes only an authoritative subscription tier', () => {
    expect(source).toContain('supabase.auth.getSession()');
    expect(source).toContain("res = await authFetch('/api/stripe/user-subscription')");
    expect(source).toContain('isSubscriptionTier(data?.subscriptionTier)');
    expect(source).toContain('subscriptionTier: data.subscriptionTier');
    expect(source).not.toContain("subscriptionTier: 'Free'");
    expect(source).not.toContain("void authFetch('/api/stripe/user-subscription')");
    expect(source).not.toContain("'subscription handoff'");
  });

  it('applies the staged AAL2 diagnostic supersession before native factor choreography', () => {
    const establishStart = source.indexOf('const establishSession = async');
    const policyIndex = source.indexOf('const gatePolicy = await readAuthGatePolicy(session)', establishStart);
    const onboardingIndex = source.indexOf('if (gatePolicy.onboardingRequired)', policyIndex);
    const supersessionIndex = source.indexOf("if (!isAal2EnabledFor('login') || !gatePolicy.mfaRequiredAccount)", onboardingIndex);
    const directProjectionIndex = source.indexOf('await handleSupabaseSession(session)', supersessionIndex);
    const assuranceIndex = source.indexOf('const assurance = await getCurrentAssuranceLevel(supabase)', supersessionIndex);

    expect(establishStart).toBeGreaterThan(-1);
    expect(policyIndex).toBeGreaterThan(establishStart);
    expect(onboardingIndex).toBeGreaterThan(policyIndex);
    expect(supersessionIndex).toBeGreaterThan(onboardingIndex);
    expect(directProjectionIndex).toBeGreaterThan(supersessionIndex);
    expect(assuranceIndex).toBeGreaterThan(directProjectionIndex);
    expect(source).toContain('AAL2_DIAGNOSTIC_SUPERSESSION_ID');
    expect(source).toContain("void authFetch('/api/auth/aal2/diagnostic-login'");
    expect(source).toContain('setPendingStepUpAssurance(assurance)');
  });

  it('keeps failures fail-closed without timer-based recovery', () => {
    expect(source).toContain('resetAuthProjection();');
    expect(source).toContain("code: 'POST_MFA_SESSION_HANDOFF_FAILED'");
    expect(source).toContain("code: 'IDENTITY_MISMATCH_DETECTED'");
    expect(source).toContain("console.error('[Auth] Initial Supabase session resolution failed:', err)");
  });
});
