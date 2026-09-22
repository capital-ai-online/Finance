import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('Post-MFA subscription handoff regression boundary', () => {
  it('revalidates the verified gate identity against the live Supabase session without a watchdog', () => {
    const source = readRepoFile('src/app/auth/SessionComposition.tsx');
    const gateStart = source.indexOf('if (pendingStepUpSession)');
    const errorStart = source.indexOf('if (authError)', gateStart);
    const gate = source.slice(gateStart, errorStart);

    expect(gateStart).toBeGreaterThan(-1);
    expect(gate).toContain('const verifiedSession = pendingStepUpSession');
    expect(gate).toContain('await supabase.auth.getSession()');
    expect(gate).toContain('liveSession.user.id !== verifiedSession.user.id');
    expect(gate).toContain("code: 'POST_MFA_SESSION_HANDOFF_FAILED'");
    expect(gate).toContain("code: 'IDENTITY_MISMATCH_DETECTED'");
    expect(gate).toContain('const onboardingRequired = await needsOnboarding(liveSession)');
    expect(gate).toContain('await handleSupabaseSession(liveSession)');
    expect(gate).not.toContain('setTimeout(');
    expect(gate).not.toContain('Promise.race([');
  });

  it('awaits the rotation-aware authFetch tier before publishing the authenticated session', () => {
    const source = readRepoFile('src/app/auth/SessionComposition.tsx');
    const start = source.indexOf('const handleSupabaseSession');
    const end = source.indexOf('const establishSession', start);
    const handler = source.slice(start, end);

    expect(source).toContain("import { authFetch } from '../../lib/authFetch'");
    expect(handler).toContain("res = await authFetch('/api/stripe/user-subscription')");
    expect(handler).toContain('subscriptionTier: data.subscriptionTier');
    expect(handler).not.toContain("subscriptionTier: 'Free'");
    expect(handler).not.toContain('session.access_token');
    expect(handler).not.toContain('?userId=');

    const readbackIndex = handler.indexOf("res = await authFetch('/api/stripe/user-subscription')");
    const publishIndex = handler.indexOf('updateUserSession(baseSession)');
    expect(readbackIndex).toBeGreaterThan(-1);
    expect(publishIndex).toBeGreaterThan(readbackIndex);
  });

  it('fails closed on unresolved tiers and rejects identity mismatch without inventing Free state', () => {
    const source = readRepoFile('src/app/auth/SessionComposition.tsx');
    const start = source.indexOf('const handleSupabaseSession');
    const end = source.indexOf('const establishSession', start);
    const handler = source.slice(start, end);

    expect(handler).toContain('if (!res.ok)');
    expect(handler).toContain('isSubscriptionTier(data?.subscriptionTier)');
    expect(handler).toContain("code: 'SUBSCRIPTION_READBACK_FAILED'");
    expect(handler).toContain('resetAuthProjection();');
    expect(handler).toContain("code: 'IDENTITY_MISMATCH_DETECTED'");
    expect(handler).not.toContain("|| 'Free'");
  });
});
