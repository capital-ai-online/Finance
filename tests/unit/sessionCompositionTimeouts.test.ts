import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/app/auth/SessionComposition.tsx'),
  'utf8',
);

describe('SessionComposition zero-blocking auth shell', () => {
  it('keeps the application shell interactive while Supabase auth initializes', () => {
    expect(source).not.toContain('AUTH_BOOTSTRAP_TIMEOUT_MS');
    expect(source).not.toContain('Lade Sicherheits-Modul...');
    expect(source).not.toContain('if (loading &&');
    expect(source).toContain('supabase.auth.onAuthStateChange((event, session) =>');
    expect(source).toContain('queueMicrotask(() => {');
    expect(source).not.toContain('window.setTimeout(() => {\n      establishSession(session)');
  });

  it('does not block authenticated rendering on subscription enrichment or a second post-MFA session read', () => {
    expect(source).toContain("subscriptionTier: 'Free'");
    expect(source).toContain("void withSessionStageTimeout(\n      () => authFetch('/api/stripe/user-subscription')");
    expect(source).toContain('await handleSupabaseSession(verifiedSession)');
    expect(source).not.toContain("'post-MFA session read'");
  });

  it('retains fail-closed safety ceilings without turning them into UI wait states', () => {
    expect(source).toContain('const SESSION_STAGE_TIMEOUT_MS = 10_000');
    expect(source).toContain("readNeedsOnboarding(session), 'onboarding status'");
    expect(source).toContain("'auth recovery session read'");
    expect(source).toContain('resetAuthProjection();');
  });
});
