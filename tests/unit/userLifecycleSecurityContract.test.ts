import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('GOV-CHAT-042 user lifecycle security contract', () => {
  it('keeps identity and subscription readback server-authoritative', () => {
    const auth = read('src/platform/Security/authMiddleware.ts');
    const stripe = read('server/stripe.ts');
    const readback = read('src/lib/subscriptionReadback.ts');

    expect(auth).toContain('export async function resolveVerifiedIdentity');
    expect(auth).toContain('supabase.auth.getUser(token)');
    expect(stripe).toContain("stripeRouter.get('/user-subscription'");
    expect(stripe).toContain('const identity = await resolveVerifiedIdentity(req);');
    expect(stripe).toContain('const tier = await getSubscription(identity.userId);');
    expect(readback).toContain("authFetch('/api/stripe/user-subscription')");
    expect(readback).not.toContain('?email=');
    expect(readback).not.toContain('?userId=');
  });

  it('preserves strict provider AAL2 verification while making the diagnostic supersession explicit and auditable', () => {
    const auth = read('src/platform/Security/authMiddleware.ts');
    const supersession = read('src/platform/Security/aal2DiagnosticSupersession.ts');

    expect(auth).toContain('export async function verifyProviderAal2');
    expect(auth).toContain('export async function requireVerifiedAal2');
    expect(auth).toContain('supabase.auth.mfa.getAuthenticatorAssuranceLevel(token)');
    expect(auth).toContain("if (aalData.currentLevel !== 'aal2')");
    expect(auth).toContain("if (isAal2EnabledFor('privileged'))");
    expect(auth).toContain("'aal2.diagnostic_supersession_bypass'");
    expect(supersession).toContain('AAL2_REACTIVATION_STAGE = 0');
    expect(auth).toContain('const aal2 = await requireVerifiedAal2(req);');
    expect(auth).toContain(".is('used_at', null)");
    expect(auth).toContain(".gt('expires_at', new Date().toISOString())");
    expect(auth).toContain(".update({ used_at: new Date().toISOString() })");
  });

  it('uses a bounded refresh/retry boundary and fails closed after unrecoverable 401', () => {
    const authFetch = read('src/lib/authFetch.ts');

    expect(authFetch).toContain('let refreshInFlight: Promise<string | null> | null = null;');
    expect(authFetch).toContain('const firstResponse = await sendAuthenticatedRequest');
    expect(authFetch).toContain('const retryResponse = await sendAuthenticatedRequest');
    expect(authFetch).toContain('notifyUnauthorized(url);');
    expect(authFetch).toContain("status: 401");
  });

  it('keeps onboarding ahead of projection while AAL2 enforcement is staged behind the diagnostic supersession', () => {
    const session = read('src/app/auth/SessionComposition.tsx');

    expect(session).toContain('const gatePolicy = await readAuthGatePolicy(session);');
    expect(session).toContain('if (gatePolicy.onboardingRequired)');
    expect(session).toContain("if (!isAal2EnabledFor('login') || !gatePolicy.mfaRequiredAccount)");
    expect(session).toContain('setPendingOnboardingSession(session);');
    expect(session).toContain('setPendingStepUpSession(session);');
    expect(session).toContain('<RegistrationCompletionGate');
    expect(session).toContain('<LoginStepUpGate');
    expect(session).toContain('await supabase.auth.getSession();');
    expect(session).toContain('liveSession.user.id !== verifiedSession.user.id');
    expect(session).toContain("code: 'IDENTITY_MISMATCH_DETECTED'");
    expect(session).toContain('expectedId: verifiedSession.user.id');
    expect(session).toContain('receivedId: liveSession.user.id');
    expect(session).toContain('await handleSupabaseSession(liveSession);');
  });

  it('keeps local/global logout explicit and clears browser lifecycle projection before direct sign-out', () => {
    const session = read('src/app/auth/SessionComposition.tsx');

    expect(session).toContain("const handleLogout = async () => performLogout('local');");
    expect(session).toContain("const handleGlobalLogout = async () => performLogout('global');");
    expect(session).toContain('await supabase.auth.signOut({ scope });');
    expect(session).not.toContain('signOutWithTimeout');
    expect(session).not.toContain('SIGN_OUT_TIMEOUT_MS');
    expect(session).not.toContain('Promise.race([');
    expect(session).toContain('clearLoginStepUpMarkers();');
    expect(session).toContain('resetAuthProjection();');
    expect(session).toContain("localStorage.removeItem('mcc_user_session')");
  });

  it('keeps provider evidence fail-closed instead of converting unavailable scenarios into PASS', () => {
    const harness = read('scripts/operations/userLifecycleHarness.ts');
    const provider = read('tests/provider/userLifecycleProviderContract.test.ts');

    expect(harness).toContain('NOT_AVAILABLE');
    expect(harness).toContain('repository_contract');
    expect(harness).toContain('supabase_local_mailpit');
    expect(harness).toContain('stripe_sandbox_test_clock');
    expect(provider).toContain('NOT_AVAILABLE');
  });
});