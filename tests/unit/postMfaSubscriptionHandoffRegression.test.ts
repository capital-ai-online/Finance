import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('Post-MFA subscription handoff regression boundary', () => {
  it('re-reads the live Supabase session after step-up before projecting the user session', () => {
    const source = readRepoFile('src/app/auth/SessionComposition.tsx');
    const gateStart = source.indexOf('if (pendingStepUpSession)');
    const errorStart = source.indexOf('if (authError)', gateStart);
    const gate = source.slice(gateStart, errorStart);

    expect(gateStart).toBeGreaterThan(-1);
    expect(gate).toContain('const expectedSession = pendingStepUpSession');
    expect(gate).toContain('await supabase.auth.getSession()');
    expect(gate).toContain("code: 'POST_MFA_SESSION_HANDOFF_FAILED'");
    expect(gate).toContain('await handleSupabaseSession(liveSession)');
    expect(gate).not.toContain('await handleSupabaseSession(expectedSession)');
  });

  it('uses the rotation-aware authFetch path for the subscription lookup', () => {
    const source = readRepoFile('src/app/auth/SessionComposition.tsx');
    const start = source.indexOf('const handleSupabaseSession');
    const end = source.indexOf('const establishSession', start);
    const handler = source.slice(start, end);

    expect(source).toContain("import { authFetch } from '../../lib/authFetch'");
    expect(handler).toContain("await authFetch('/api/stripe/user-subscription')");
    expect(handler).not.toContain('session.access_token');
    expect(handler).not.toContain('?userId=');
  });

  it('does not project a Free session from an unrecoverable 401 during token rotation', () => {
    const source = readRepoFile('src/app/auth/SessionComposition.tsx');
    const start = source.indexOf('const handleSupabaseSession');
    const end = source.indexOf('const establishSession', start);
    const handler = source.slice(start, end);

    const unauthorizedGuard = handler.indexOf('if (res.status === 401)');
    const tierProjection = handler.indexOf("let tier: SubscriptionTier = 'Free'");

    expect(unauthorizedGuard).toBeGreaterThan(-1);
    expect(tierProjection).toBeGreaterThan(unauthorizedGuard);
  });
});
