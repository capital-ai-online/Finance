import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildM10ShadowAuthenticationOptions } from '../../server/m10/shadowAuthorizationRouter';
import { M10_RP_ID } from '../../server/m10/credentialEnrollment';
import { M10_CHALLENGE_TTL_MS } from '../../server/m10/challengeIssuance';

const repoRoot = process.cwd();

describe('M10 Phase 6 Shadow Mode boundary', () => {
  it('passes the canonical stored challenge through unchanged and requires RP/UV/credential binding', async () => {
    const canonicalChallenge = 'base64url-canonical-challenge';
    const options = await buildM10ShadowAuthenticationOptions(canonicalChallenge, [
      { credentialId: 'cred-1', transports: ['internal'] },
    ]);

    expect(options.challenge).toBe(canonicalChallenge);
    expect(options.rpId).toBe(M10_RP_ID);
    expect(options.timeout).toBe(M10_CHALLENGE_TTL_MS);
    expect(options.userVerification).toBe('required');
    expect(options.allowCredentials).toEqual([
      expect.objectContaining({ id: 'cred-1', transports: ['internal'] }),
    ]);
  });

  it('refuses to create a ceremony without an active Owner credential', async () => {
    await expect(buildM10ShadowAuthenticationOptions('shadow-challenge', [])).rejects.toThrow(/mindestens ein aktives/i);
  });

  it('has no Phase-5 consumption or GitHub dispatch capability in the shadow router', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'server/m10/shadowAuthorizationRouter.ts'), 'utf8');
    expect(source).not.toContain("from './atomicCiConsumption'");
    expect(source).not.toContain('consumeM10ApprovalForCi(');
    expect(source).not.toContain("from './githubCiDispatcher'");
    expect(source).not.toContain('createM10GithubActionsDispatcher(');
    expect(source).not.toContain('workflow_dispatch');
    expect(source).not.toContain('generateAuthenticationOptions(');
  });

  it('keeps Shadow Evidence structurally separate from consumable Phase-4 approval evidence', () => {
    const store = fs.readFileSync(path.join(repoRoot, 'server/m10/shadowApprovalSupabaseStore.ts'), 'utf8');
    expect(store).toContain("from('m10_shadow_evaluations')");
    expect(store).not.toContain("from('m10_approval_evidence')");
    expect(store).not.toContain('M10ConsumableApprovalStore');
  });

  it('keeps the phase-6 database surface browser-inaccessible and append-only', () => {
    const migration = fs.readFileSync(
      path.join(repoRoot, 'supabase/migrations/20260819050000_m10_phase6_shadow_evidence.sql'),
      'utf8',
    );
    expect(migration).toContain('revoke all on table public.m10_owner_credentials from anon, authenticated, service_role');
    expect(migration).toContain('revoke all on table public.m10_registration_challenges from anon, authenticated, service_role');
    expect(migration).toContain('alter table public.m10_shadow_evaluations enable row level security');
    expect(migration).toContain('revoke all on table public.m10_shadow_evaluations from anon, authenticated, service_role');
    expect(migration).toContain('grant select, insert on table public.m10_shadow_evaluations to service_role');
    expect(migration).toContain("raise exception 'm10_shadow_evaluations is immutable'");
  });
});
