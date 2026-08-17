// M10 (ADR-0066, ESS-0022) Phase 3 live-wiring — Supabase-backed store tests. Mocks
// server/db.ts's getPrivilegedServerSupabase()/isPrivilegedSupabaseConfigured(), the same
// mocked-Supabase-harness pattern used throughout this session (e.g. tests/unit/breakGlass.test.ts,
// tests/unit/systemadminAuditedExecution.test.ts), to prove the query shape (table names, column
// bindings, atomic single-use WHERE clauses) without touching a real database.
import { beforeEach, describe, expect, it, vi } from 'vitest';

function chain(resolveValue: { data: unknown; error: unknown }) {
  const builder: any = {
    eq: vi.fn(() => builder),
    is: vi.fn(() => builder),
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => resolveValue),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolveValue).then(resolve),
  };
  return builder;
}

const mocks = vi.hoisted(() => ({
  isPrivilegedSupabaseConfigured: vi.fn(() => true),
  insert: vi.fn(),
  from: vi.fn(),
}));

vi.mock('../../server/db', () => ({
  isPrivilegedSupabaseConfigured: mocks.isPrivilegedSupabaseConfigured,
  getPrivilegedServerSupabase: vi.fn(() => ({ from: mocks.from })),
}));

import {
  createSupabaseM10CredentialStore,
  createSupabaseM10RegistrationChallengeStore,
} from '../../server/m10/credentialEnrollmentSupabaseStore';

const sampleChallengeRecord = {
  challenge: {
    challengeId: 'challenge-a',
    challenge: 'challenge-a',
    ownerId: 'SvenKulessa',
    issuedAt: '2026-08-17T12:00:00.000Z',
    expiresAt: '2026-08-17T12:02:00.000Z',
  },
  state: 'UNUSED' as const,
};

const sampleCredential = {
  credentialId: 'cred-1',
  ownerId: 'SvenKulessa',
  publicKey: 'pk-base64url',
  counter: 0,
  transports: ['internal'],
  deviceType: 'multiDevice' as const,
  backedUp: true,
  aaguid: 'aaguid-1',
  createdAt: '2026-08-17T12:00:00.000Z',
  revokedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isPrivilegedSupabaseConfigured.mockReturnValue(true);
});

describe('createSupabaseM10RegistrationChallengeStore', () => {
  it('save() inserts into m10_registration_challenges with the expected columns', async () => {
    mocks.insert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert: mocks.insert });

    await createSupabaseM10RegistrationChallengeStore().save(sampleChallengeRecord);

    expect(mocks.from).toHaveBeenCalledWith('m10_registration_challenges');
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      challenge_id: 'challenge-a',
      owner_actor_id: 'SvenKulessa',
      consumed_at: null,
    }));
  });

  it('save() throws when Supabase is not configured, without ever calling from()', async () => {
    mocks.isPrivilegedSupabaseConfigured.mockReturnValue(false);
    await expect(createSupabaseM10RegistrationChallengeStore().save(sampleChallengeRecord)).rejects.toThrow();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('get() maps a found row back to UNUSED when consumed_at is null', async () => {
    const builder = chain({
      data: {
        challenge_id: 'challenge-a', challenge: 'challenge-a', owner_actor_id: 'SvenKulessa',
        issued_at: '2026-08-17T12:00:00.000Z', expires_at: '2026-08-17T12:02:00.000Z', consumed_at: null,
      },
      error: null,
    });
    mocks.from.mockReturnValue(builder);

    const result = await createSupabaseM10RegistrationChallengeStore().get('challenge-a');
    expect(result?.state).toBe('UNUSED');
    expect(result?.challenge.challengeId).toBe('challenge-a');
  });

  it('get() maps a found row to CONSUMED when consumed_at is set', async () => {
    const builder = chain({
      data: {
        challenge_id: 'challenge-a', challenge: 'challenge-a', owner_actor_id: 'SvenKulessa',
        issued_at: '2026-08-17T12:00:00.000Z', expires_at: '2026-08-17T12:02:00.000Z', consumed_at: '2026-08-17T12:01:00.000Z',
      },
      error: null,
    });
    mocks.from.mockReturnValue(builder);

    const result = await createSupabaseM10RegistrationChallengeStore().get('challenge-a');
    expect(result?.state).toBe('CONSUMED');
  });

  it('get() returns null when not found', async () => {
    mocks.from.mockReturnValue(chain({ data: null, error: null }));
    const result = await createSupabaseM10RegistrationChallengeStore().get('does-not-exist');
    expect(result).toBeNull();
  });

  it('markConsumed() returns true on a real row match (atomic single-use)', async () => {
    const builder = chain({ data: { challenge_id: 'challenge-a' }, error: null });
    mocks.from.mockReturnValue(builder);

    const result = await createSupabaseM10RegistrationChallengeStore().markConsumed('challenge-a');
    expect(result).toBe(true);
    expect(builder.is).toHaveBeenCalledWith('consumed_at', null);
  });

  it('markConsumed() returns false when no unconsumed row matches (replay attempt)', async () => {
    mocks.from.mockReturnValue(chain({ data: null, error: null }));
    const result = await createSupabaseM10RegistrationChallengeStore().markConsumed('already-consumed');
    expect(result).toBe(false);
  });

  it('markConsumed() returns false when Supabase is not configured', async () => {
    mocks.isPrivilegedSupabaseConfigured.mockReturnValue(false);
    const result = await createSupabaseM10RegistrationChallengeStore().markConsumed('challenge-a');
    expect(result).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe('createSupabaseM10CredentialStore', () => {
  it('save() inserts into m10_owner_credentials with only public credential fields', async () => {
    mocks.insert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert: mocks.insert });

    await createSupabaseM10CredentialStore().save(sampleCredential);

    expect(mocks.from).toHaveBeenCalledWith('m10_owner_credentials');
    const insertedRow = mocks.insert.mock.calls[0]?.[0];
    expect(insertedRow).toMatchObject({ credential_id: 'cred-1', owner_actor_id: 'SvenKulessa', public_key: 'pk-base64url' });
    expect(Object.keys(insertedRow).sort()).toEqual(
      ['aaguid', 'backed_up', 'counter', 'created_at', 'credential_id', 'device_type', 'owner_actor_id', 'public_key', 'revoked_at', 'transports'].sort(),
    );
  });

  it('listActiveForOwner() filters to the owner and to revoked_at IS NULL', async () => {
    const row = {
      credential_id: 'cred-1', owner_actor_id: 'SvenKulessa', public_key: 'pk', counter: 0,
      transports: ['internal'], device_type: 'multiDevice', backed_up: true, aaguid: 'a',
      created_at: '2026-08-17T12:00:00.000Z', revoked_at: null,
    };
    const builder = chain({ data: [row], error: null });
    mocks.from.mockReturnValue(builder);

    const result = await createSupabaseM10CredentialStore().listActiveForOwner('SvenKulessa');
    expect(result).toHaveLength(1);
    expect(builder.eq).toHaveBeenCalledWith('owner_actor_id', 'SvenKulessa');
    expect(builder.is).toHaveBeenCalledWith('revoked_at', null);
  });

  it('listActiveForOwner() returns an empty array on error', async () => {
    mocks.from.mockReturnValue(chain({ data: null, error: { message: 'db error' } }));
    const result = await createSupabaseM10CredentialStore().listActiveForOwner('SvenKulessa');
    expect(result).toEqual([]);
  });

  it('revoke() returns true on a real active-row match (atomic)', async () => {
    const builder = chain({ data: { credential_id: 'cred-1' }, error: null });
    mocks.from.mockReturnValue(builder);

    const result = await createSupabaseM10CredentialStore().revoke('cred-1');
    expect(result).toBe(true);
    expect(builder.is).toHaveBeenCalledWith('revoked_at', null);
  });

  it('revoke() returns false when no active row matches (already revoked or unknown)', async () => {
    mocks.from.mockReturnValue(chain({ data: null, error: null }));
    const result = await createSupabaseM10CredentialStore().revoke('does-not-exist');
    expect(result).toBe(false);
  });
});
