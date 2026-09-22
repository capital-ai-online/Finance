import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('superseded post-MFA login handoff boundary', () => {
  it('removes MFA choreography from the normal browser login/session path', () => {
    const session = read('src/app/auth/SessionComposition.tsx');
    const login = read('src/features/public/ui/LoginPage.tsx');
    expect(session).not.toContain('LoginStepUpGate');
    expect(session).not.toContain('pendingStepUpSession');
    expect(session).not.toContain('getAuthenticatorAssuranceLevel');
    expect(session).not.toContain('supabase');
    expect(login).not.toContain('MFA');
    expect(login).not.toContain('supabase');
  });

  it('keeps privileged server AAL2 authorization independent from normal login', () => {
    const auth = read('src/platform/Security/authMiddleware.ts');
    expect(auth).toContain('export async function requireVerifiedAal2');
    expect(auth).toContain('getAuthenticatorAssuranceLevel');
    expect(auth).toContain("if (aalData.currentLevel !== 'aal2')");
  });

  it('projects subscription after backend identity verification without a Free fallback', () => {
    const routes = read('server/routes/backendAuthRoutes.ts');
    expect(routes).toContain('resolveVerifiedBackendAuth(req, res)');
    expect(routes).toContain('getSubscription(user.id)');
    expect(routes).toContain('subscriptionTier: tier');
    expect(routes).toContain('Invalid authoritative subscription tier');
  });
});
