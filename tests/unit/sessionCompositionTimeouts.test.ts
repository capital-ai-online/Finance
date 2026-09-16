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
    expect(source).toContain('queueMicrotask(() => {');
  });

  it('resolves persisted Supabase state directly and keeps subscription enrichment off the render path', () => {
    expect(source).toContain('supabase.auth.getSession()');
    expect(source).toContain("subscriptionTier: 'Free'");
    expect(source).toContain("void authFetch('/api/stripe/user-subscription')");
    expect(source).not.toContain("'subscription handoff'");
  });

  it('keeps failures fail-closed without timer-based recovery', () => {
    expect(source).toContain('resetAuthProjection();');
    expect(source).toContain("code: 'POST_MFA_SESSION_HANDOFF_FAILED'");
    expect(source).toContain("code: 'IDENTITY_MISMATCH_DETECTED'");
    expect(source).toContain("console.error('[Auth] Initial Supabase session resolution failed:', err)");
  });
});
