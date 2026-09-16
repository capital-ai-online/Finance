import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('Post-MFA subscription handoff regression boundary', () => {
  it('projects the already verified gate session without a second blocking getSession read', () => {
    const source = readRepoFile('src/app/auth/SessionComposition.tsx');
    const gateStart = source.indexOf('if (pendingStepUpSession)');
    const errorStart = source.indexOf('if (authError)', gateStart);
    const gate = source.slice(gateStart, errorStart);

    expect(gateStart).toBeGreaterThan(-1);
    expect(gate).toContain('const verifiedSession = pendingStepUpSession');
    expect(gate).not.toContain('supabase.auth.getSession()');
    expect(gate).toContain("code: 'POST_MFA_SESSION_HANDOFF_FAILED'");
    expect(gate).toContain('await handleSupabaseSession(verifiedSession)');
  });

  it('uses the rotation-aware authFetch path for non-blocking subscription enrichment', () => {
    const source = readRepoFile('src/app/auth/SessionComposition.tsx');
    const start = source.indexOf('const handleSupabaseSession');
    const end = source.indexOf('const establishSession', start);
    const handler = source.slice(start, end);

    expect(source).toContain("import { authFetch } from '../../lib/authFetch'");
    expect(handler).toContain("() => authFetch('/api/stripe/user-subscription')");
    expect(handler).toContain("subscriptionTier: 'Free'");
    expect(handler).not.toContain('session.access_token');
    expect(handler).not.toContain('?userId=');
  });

  it('keeps subscription enrichment least-privileged and rejects identity mismatch fail-closed', () => {
    const source = readRepoFile('src/app/auth/SessionComposition.tsx');
    const start = source.indexOf('const handleSupabaseSession');
    const end = source.indexOf('const establishSession', start);
    const handler = source.slice(start, end);

    expect(handler).toContain("if (res.status === 401 || !res.ok) return;");
    expect(handler).toContain("const tier: SubscriptionTier = data?.subscriptionTier || 'Free';");
    expect(handler).toContain('resetAuthProjection();');
    expect(handler).toContain("code: 'IDENTITY_MISMATCH_DETECTED'");
  });
});