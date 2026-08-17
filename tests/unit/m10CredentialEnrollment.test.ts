// M10 (ADR-0066, ESS-0022) Phase 3 — Owner Credential Enrollment tests. The real cryptographic
// attestation verification is @simplewebauthn/server's own, already-tested responsibility; these
// tests mock generateRegistrationOptions/verifyRegistrationResponse (the same "mock the external
// verification boundary, test our own orchestration for real" pattern used throughout this
// session - e.g. breakGlassRouter.test.ts mocking checkAdminAccess/requireStepUp) and prove: only
// the canonical Owner can ever enroll/revoke; a challenge is single-use regardless of verification
// outcome; only minimal public credential material is ever persisted; RP ID/origin/UV are always
// required, never left to the library's more permissive defaults.
import { describe, expect, it, vi } from 'vitest';
import {
  M10_REGISTRATION_CHALLENGE_TTL_MS,
  beginM10CredentialEnrollment,
  completeM10CredentialEnrollment,
  createInMemoryM10CredentialStore,
  createInMemoryM10RegistrationChallengeStore,
  isM10RegistrationChallengeValidForUse,
  revokeM10Credential,
  type M10CredentialStore,
  type M10RegistrationChallengeStore,
} from '../../server/m10/credentialEnrollment';
import { SYSTEMADMIN_OWNER_ACTOR_ID } from '../../src/platform/Security/roadmapExecutionMandate';

function fakeOptionsFor(challenge: string) {
  return {
    challenge,
    rp: { id: 'capital-ai.online', name: 'CAPITAL-AI' },
    user: { id: 'dXNlcg', name: SYSTEMADMIN_OWNER_ACTOR_ID, displayName: '' },
    pubKeyCredParams: [],
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
  } as any;
}

function verifiedRegistrationResult(overrides: Partial<{ credentialId: string; publicKey: Uint8Array; counter: number }> = {}) {
  return {
    verified: true as const,
    registrationInfo: {
      fmt: 'none',
      aaguid: 'aaguid-1',
      credential: {
        id: overrides.credentialId ?? 'credential-id-1',
        publicKey: overrides.publicKey ?? new Uint8Array([1, 2, 3, 4]),
        counter: overrides.counter ?? 0,
        transports: ['internal'],
      },
      credentialType: 'public-key' as const,
      attestationObject: new Uint8Array([9, 9, 9]),
      userVerified: true,
      credentialDeviceType: 'multiDevice' as const,
      credentialBackedUp: true,
      origin: 'https://capital-ai.online',
      rpID: 'capital-ai.online',
    },
  };
}

describe('beginM10CredentialEnrollment', () => {
  it('denies a non-canonical owner without generating options', async () => {
    const generateOptions = vi.fn();
    const result = await beginM10CredentialEnrollment('not-the-owner', {
      challengeStore: createInMemoryM10RegistrationChallengeStore(),
      credentialStore: createInMemoryM10CredentialStore(),
      generateOptions,
    });
    expect(result.verdict).toBe('DENY');
    expect(generateOptions).not.toHaveBeenCalled();
  });

  it('denies when option generation throws', async () => {
    const generateOptions = vi.fn().mockRejectedValue(new Error('rng unavailable'));
    const result = await beginM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, {
      challengeStore: createInMemoryM10RegistrationChallengeStore(),
      credentialStore: createInMemoryM10CredentialStore(),
      generateOptions,
    });
    expect(result.verdict).toBe('DENY');
  });

  it('denies an invalid issuance timestamp', async () => {
    const generateOptions = vi.fn().mockResolvedValue(fakeOptionsFor('challenge-a'));
    const result = await beginM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, {
      challengeStore: createInMemoryM10RegistrationChallengeStore(),
      credentialStore: createInMemoryM10CredentialStore(),
      generateOptions,
      now: 'not-a-real-date',
    });
    expect(result.verdict).toBe('DENY');
  });

  it('requires User Verification and residentKey=required, never the library defaults', async () => {
    const generateOptions = vi.fn().mockResolvedValue(fakeOptionsFor('challenge-a'));
    await beginM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, {
      challengeStore: createInMemoryM10RegistrationChallengeStore(),
      credentialStore: createInMemoryM10CredentialStore(),
      generateOptions,
    });
    expect(generateOptions).toHaveBeenCalledWith(expect.objectContaining({
      rpID: 'capital-ai.online',
      rpName: 'CAPITAL-AI',
      userName: SYSTEMADMIN_OWNER_ACTOR_ID,
      authenticatorSelection: expect.objectContaining({ userVerification: 'required', residentKey: 'required' }),
    }));
  });

  it('excludes the owners already-registered active credentials so the same authenticator cannot be enrolled twice', async () => {
    const credentialStore = createInMemoryM10CredentialStore();
    await credentialStore.save({
      credentialId: 'existing-credential',
      ownerId: SYSTEMADMIN_OWNER_ACTOR_ID,
      publicKey: 'pk',
      counter: 0,
      transports: ['internal'],
      deviceType: 'singleDevice',
      backedUp: false,
      aaguid: 'a',
      createdAt: new Date().toISOString(),
      revokedAt: null,
    });
    const generateOptions = vi.fn().mockResolvedValue(fakeOptionsFor('challenge-a'));
    await beginM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, {
      challengeStore: createInMemoryM10RegistrationChallengeStore(),
      credentialStore,
      generateOptions,
    });
    expect(generateOptions).toHaveBeenCalledWith(expect.objectContaining({
      excludeCredentials: [expect.objectContaining({ id: 'existing-credential' })],
    }));
  });

  it('issues and persists a challenge as UNUSED with the correct TTL', async () => {
    const challengeStore = createInMemoryM10RegistrationChallengeStore();
    const generateOptions = vi.fn().mockResolvedValue(fakeOptionsFor('challenge-a'));
    const result = await beginM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, {
      challengeStore,
      credentialStore: createInMemoryM10CredentialStore(),
      generateOptions,
    });
    expect(result.verdict).toBe('CHALLENGE_ISSUED');
    if (result.verdict !== 'CHALLENGE_ISSUED') return;
    expect(result.challengeId).toBe('challenge-a');
    const stored = await challengeStore.get('challenge-a');
    expect(stored?.state).toBe('UNUSED');
    expect(stored?.challenge.ownerId).toBe(SYSTEMADMIN_OWNER_ACTOR_ID);
    const durationMs = Date.parse(stored!.challenge.expiresAt) - Date.parse(stored!.challenge.issuedAt);
    expect(durationMs).toBe(M10_REGISTRATION_CHALLENGE_TTL_MS);
  });

  // Regression coverage for a real production incident (2026-08-17): the Supabase-backed
  // credentialEnrollmentSupabaseStore.ts throws on an insert failure (e.g. a missing table before
  // the migration was applied), but these two store calls were not wrapped in try/catch - the
  // exception propagated unhandled through the router, and enrollment silently never completed
  // instead of returning a clean error. Fixed by wrapping every store call; these tests prove it.
  it('fails closed with DENY when credentialStore.listActiveForOwner() throws, instead of an unhandled rejection', async () => {
    const credentialStore: M10CredentialStore = {
      save: vi.fn(),
      listActiveForOwner: vi.fn().mockRejectedValue(new Error('relation "m10_owner_credentials" does not exist')),
      revoke: vi.fn(),
    };
    const result = await beginM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, {
      challengeStore: createInMemoryM10RegistrationChallengeStore(),
      credentialStore,
      generateOptions: vi.fn().mockResolvedValue(fakeOptionsFor('challenge-a')),
    });
    expect(result.verdict).toBe('DENY');
    if (result.verdict !== 'DENY') return;
    expect(result.reason).toMatch(/does not exist/);
  });

  it('fails closed with DENY when challengeStore.save() throws, instead of an unhandled rejection', async () => {
    const challengeStore: M10RegistrationChallengeStore = {
      save: vi.fn().mockRejectedValue(new Error('relation "m10_registration_challenges" does not exist')),
      get: vi.fn(),
      markConsumed: vi.fn(),
    };
    const result = await beginM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, {
      challengeStore,
      credentialStore: createInMemoryM10CredentialStore(),
      generateOptions: vi.fn().mockResolvedValue(fakeOptionsFor('challenge-a')),
    });
    expect(result.verdict).toBe('DENY');
    if (result.verdict !== 'DENY') return;
    expect(result.reason).toMatch(/does not exist/);
  });
});

describe('completeM10CredentialEnrollment', () => {
  async function setup() {
    const challengeStore = createInMemoryM10RegistrationChallengeStore();
    const credentialStore = createInMemoryM10CredentialStore();
    await challengeStore.save({
      challenge: {
        challengeId: 'challenge-a',
        challenge: 'challenge-a',
        ownerId: SYSTEMADMIN_OWNER_ACTOR_ID,
        issuedAt: '2026-08-17T12:00:00.000Z',
        expiresAt: '2026-08-17T12:02:00.000Z',
      },
      state: 'UNUSED',
    });
    return { challengeStore, credentialStore };
  }

  const fakeResponse = {} as any; // opaque to this module - passed straight through to verifyResponse

  it('denies a non-canonical owner without looking up the challenge', async () => {
    const { challengeStore, credentialStore } = await setup();
    const verifyResponse = vi.fn();
    const result = await completeM10CredentialEnrollment('not-the-owner', 'challenge-a', fakeResponse, {
      challengeStore, credentialStore, verifyResponse,
    });
    expect(result.verdict).toBe('DENY');
    expect(verifyResponse).not.toHaveBeenCalled();
  });

  it('denies an unknown challengeId', async () => {
    const { challengeStore, credentialStore } = await setup();
    const result = await completeM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, 'does-not-exist', fakeResponse, {
      challengeStore, credentialStore,
    });
    expect(result.verdict).toBe('DENY');
  });

  it('denies a challenge issued for a different owner', async () => {
    const challengeStore = createInMemoryM10RegistrationChallengeStore();
    const credentialStore = createInMemoryM10CredentialStore();
    await challengeStore.save({
      challenge: { challengeId: 'challenge-b', challenge: 'challenge-b', ownerId: 'someone-else', issuedAt: '2026-08-17T12:00:00.000Z', expiresAt: '2026-08-17T12:02:00.000Z' },
      state: 'UNUSED',
    });
    const result = await completeM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, 'challenge-b', fakeResponse, {
      challengeStore, credentialStore,
    });
    expect(result.verdict).toBe('DENY');
  });

  it('denies an expired challenge', async () => {
    const { challengeStore, credentialStore } = await setup();
    const result = await completeM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, 'challenge-a', fakeResponse, {
      challengeStore, credentialStore, now: '2026-08-17T12:03:00.000Z',
    });
    expect(result.verdict).toBe('DENY');
  });

  it('denies and consumes the challenge when verification fails, and a retry against the same challenge also fails (single-use regardless of outcome)', async () => {
    const { challengeStore, credentialStore } = await setup();
    const verifyResponse = vi.fn().mockResolvedValue({ verified: false });
    const first = await completeM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, 'challenge-a', fakeResponse, {
      challengeStore, credentialStore, verifyResponse, now: '2026-08-17T12:01:00.000Z',
    });
    expect(first.verdict).toBe('DENY');
    const retry = await completeM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, 'challenge-a', fakeResponse, {
      challengeStore, credentialStore, verifyResponse, now: '2026-08-17T12:01:01.000Z',
    });
    expect(retry.verdict).toBe('DENY');
    expect(verifyResponse).toHaveBeenCalledTimes(1); // second call never reached verifyResponse - denied at the challenge-store layer
  });

  it('denies when verifyResponse throws', async () => {
    const { challengeStore, credentialStore } = await setup();
    const verifyResponse = vi.fn().mockRejectedValue(new Error('crypto verification error'));
    const result = await completeM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, 'challenge-a', fakeResponse, {
      challengeStore, credentialStore, verifyResponse, now: '2026-08-17T12:01:00.000Z',
    });
    expect(result.verdict).toBe('DENY');
  });

  // Regression coverage for the 2026-08-17 production incident - see the equivalent tests in
  // describe('beginM10CredentialEnrollment') for the full explanation.
  it('fails closed with DENY when challengeStore.get() throws, instead of an unhandled rejection', async () => {
    const credentialStore = createInMemoryM10CredentialStore();
    const challengeStore: M10RegistrationChallengeStore = {
      save: vi.fn(),
      get: vi.fn().mockRejectedValue(new Error('relation "m10_registration_challenges" does not exist')),
      markConsumed: vi.fn(),
    };
    const result = await completeM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, 'challenge-a', fakeResponse, {
      challengeStore, credentialStore,
    });
    expect(result.verdict).toBe('DENY');
  });

  it('fails closed with DENY when challengeStore.markConsumed() throws, instead of an unhandled rejection', async () => {
    const { credentialStore } = await setup();
    const challengeStore: M10RegistrationChallengeStore = {
      save: vi.fn(),
      get: vi.fn().mockResolvedValue({
        challenge: { challengeId: 'challenge-a', challenge: 'challenge-a', ownerId: SYSTEMADMIN_OWNER_ACTOR_ID, issuedAt: '2026-08-17T12:00:00.000Z', expiresAt: '2026-08-17T12:02:00.000Z' },
        state: 'UNUSED',
      }),
      markConsumed: vi.fn().mockRejectedValue(new Error('connection reset')),
    };
    const result = await completeM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, 'challenge-a', fakeResponse, {
      challengeStore, credentialStore, now: '2026-08-17T12:01:00.000Z',
    });
    expect(result.verdict).toBe('DENY');
  });

  it('fails closed with DENY when credentialStore.save() throws on a verified response, instead of an unhandled rejection', async () => {
    const { challengeStore } = await setup();
    const credentialStore: M10CredentialStore = {
      save: vi.fn().mockRejectedValue(new Error('relation "m10_owner_credentials" does not exist')),
      listActiveForOwner: vi.fn().mockResolvedValue([]),
      revoke: vi.fn(),
    };
    const verifyResponse = vi.fn().mockResolvedValue(verifiedRegistrationResult());
    const result = await completeM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, 'challenge-a', fakeResponse, {
      challengeStore, credentialStore, verifyResponse, now: '2026-08-17T12:01:00.000Z',
    });
    expect(result.verdict).toBe('DENY');
    if (result.verdict !== 'DENY') return;
    expect(result.reason).toMatch(/does not exist/);
  });

  it('enrolls and persists only minimal public credential material on a verified response', async () => {
    const { challengeStore, credentialStore } = await setup();
    const verifyResponse = vi.fn().mockResolvedValue(verifiedRegistrationResult({ publicKey: new Uint8Array([5, 6, 7]) }));
    const result = await completeM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, 'challenge-a', fakeResponse, {
      challengeStore, credentialStore, verifyResponse, now: '2026-08-17T12:01:00.000Z',
    });
    expect(result.verdict).toBe('ENROLLED');
    if (result.verdict !== 'ENROLLED') return;
    expect(result.credential.ownerId).toBe(SYSTEMADMIN_OWNER_ACTOR_ID);
    expect(result.credential.credentialId).toBe('credential-id-1');
    expect(result.credential.publicKey).toBe(Buffer.from([5, 6, 7]).toString('base64url'));
    expect(result.credential.revokedAt).toBeNull();
    expect(Object.keys(result.credential).sort()).toEqual(
      ['aaguid', 'backedUp', 'counter', 'createdAt', 'credentialId', 'deviceType', 'ownerId', 'publicKey', 'revokedAt', 'transports'].sort(),
    );

    const active = await credentialStore.listActiveForOwner(SYSTEMADMIN_OWNER_ACTOR_ID);
    expect(active).toHaveLength(1);

    const consumedChallenge = await challengeStore.get('challenge-a');
    expect(consumedChallenge?.state).toBe('CONSUMED');
  });

  it('verifies against the exact RP ID, origins, and requires User Verification', async () => {
    const { challengeStore, credentialStore } = await setup();
    const verifyResponse = vi.fn().mockResolvedValue(verifiedRegistrationResult());
    await completeM10CredentialEnrollment(SYSTEMADMIN_OWNER_ACTOR_ID, 'challenge-a', fakeResponse, {
      challengeStore, credentialStore, verifyResponse, now: '2026-08-17T12:01:00.000Z',
    });
    expect(verifyResponse).toHaveBeenCalledWith(expect.objectContaining({
      expectedChallenge: 'challenge-a',
      expectedRPID: 'capital-ai.online',
      expectedOrigin: ['https://capital-ai.online', 'https://www.capital-ai.online'],
      requireUserVerification: true,
    }));
  });
});

describe('revokeM10Credential', () => {
  async function enrolledCredentialStore(): Promise<M10CredentialStore> {
    const credentialStore = createInMemoryM10CredentialStore();
    await credentialStore.save({
      credentialId: 'credential-1',
      ownerId: SYSTEMADMIN_OWNER_ACTOR_ID,
      publicKey: 'pk',
      counter: 0,
      transports: [],
      deviceType: 'singleDevice',
      backedUp: false,
      aaguid: 'a',
      createdAt: new Date().toISOString(),
      revokedAt: null,
    });
    return credentialStore;
  }

  it('denies a non-canonical owner', async () => {
    const credentialStore = await enrolledCredentialStore();
    const result = await revokeM10Credential('not-the-owner', 'credential-1', { credentialStore });
    expect(result.verdict).toBe('DENY');
    expect(await credentialStore.listActiveForOwner(SYSTEMADMIN_OWNER_ACTOR_ID)).toHaveLength(1);
  });

  it('denies an unknown credentialId', async () => {
    const credentialStore = await enrolledCredentialStore();
    const result = await revokeM10Credential(SYSTEMADMIN_OWNER_ACTOR_ID, 'does-not-exist', { credentialStore });
    expect(result.verdict).toBe('DENY');
  });

  it('revokes an active credential, removing it from the active list', async () => {
    const credentialStore = await enrolledCredentialStore();
    const result = await revokeM10Credential(SYSTEMADMIN_OWNER_ACTOR_ID, 'credential-1', { credentialStore });
    expect(result.verdict).toBe('REVOKED');
    expect(await credentialStore.listActiveForOwner(SYSTEMADMIN_OWNER_ACTOR_ID)).toHaveLength(0);
  });

  it('denies revoking an already-revoked credential (no double revoke)', async () => {
    const credentialStore = await enrolledCredentialStore();
    await revokeM10Credential(SYSTEMADMIN_OWNER_ACTOR_ID, 'credential-1', { credentialStore });
    const second = await revokeM10Credential(SYSTEMADMIN_OWNER_ACTOR_ID, 'credential-1', { credentialStore });
    expect(second.verdict).toBe('DENY');
  });

  it('fails closed with DENY when credentialStore.revoke() throws, instead of an unhandled rejection', async () => {
    const credentialStore: M10CredentialStore = {
      save: vi.fn(),
      listActiveForOwner: vi.fn(),
      revoke: vi.fn().mockRejectedValue(new Error('connection reset')),
    };
    const result = await revokeM10Credential(SYSTEMADMIN_OWNER_ACTOR_ID, 'credential-1', { credentialStore });
    expect(result.verdict).toBe('DENY');
  });
});

describe('isM10RegistrationChallengeValidForUse', () => {
  it('is valid strictly within [issuedAt, expiresAt) while UNUSED', () => {
    const record = { state: 'UNUSED' as const, challenge: { issuedAt: '2026-08-17T12:00:00.000Z', expiresAt: '2026-08-17T12:02:00.000Z' } };
    expect(isM10RegistrationChallengeValidForUse(record, '2026-08-17T11:59:59.999Z')).toBe(false);
    expect(isM10RegistrationChallengeValidForUse(record, '2026-08-17T12:00:00.000Z')).toBe(true);
    expect(isM10RegistrationChallengeValidForUse(record, '2026-08-17T12:02:00.000Z')).toBe(false);
  });

  it('is invalid when CONSUMED, even mid-window', () => {
    const record = { state: 'CONSUMED' as const, challenge: { issuedAt: '2026-08-17T12:00:00.000Z', expiresAt: '2026-08-17T12:02:00.000Z' } };
    expect(isM10RegistrationChallengeValidForUse(record, '2026-08-17T12:01:00.000Z')).toBe(false);
  });
});
