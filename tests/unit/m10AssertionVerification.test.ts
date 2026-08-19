// M10 (ADR-0066, ESS-0022) Phase 4 — assertion-verification negative/positive tests.
import { describe, expect, it, vi } from 'vitest';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import {
  createInMemoryM10ChallengeStore,
  issueM10Challenge,
} from '../../server/m10/challengeIssuance';
import type { GithubApiFetch } from '../../server/m10/githubPrStateResolver';
import {
  verifyM10OwnerAssertion,
  type M10ApprovalEvidence,
  type M10ApprovalEvidenceStore,
  type M10AssertionCredentialStore,
} from '../../server/m10/assertionVerification';
import type { M10StoredCredential } from '../../server/m10/credentialEnrollment';
import { SYSTEMADMIN_OWNER_ACTOR_ID, SYSTEMADMIN_REPOSITORY } from '../../src/platform/Security/roadmapExecutionMandate';

function githubState(headSha = 'head-sha-1', patch = '@@ v1 @@'): GithubApiFetch {
  return vi.fn(async (path: string) => {
    if (path === '/repos/SvenKulessa/Finance/pulls/7') {
      return {
        status: 200,
        json: { state: 'open', base: { ref: 'main', sha: 'base-sha-1' }, head: { sha: headSha } },
      };
    }
    if (path === '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1') {
      return { status: 200, json: [{ filename: 'src/a.ts', status: 'modified', patch }] };
    }
    throw new Error(`Unexpected path: ${path}`);
  }) as unknown as GithubApiFetch;
}

const credential: M10StoredCredential = {
  credentialId: 'credential-1',
  ownerId: SYSTEMADMIN_OWNER_ACTOR_ID,
  publicKey: Buffer.from([1, 2, 3]).toString('base64url'),
  counter: 5,
  transports: ['internal'],
  deviceType: 'singleDevice',
  backedUp: false,
  aaguid: '00000000-0000-0000-0000-000000000000',
  createdAt: '2026-08-17T00:00:00.000Z',
  revokedAt: null,
};

function credentialStore(overrides: Partial<M10AssertionCredentialStore> = {}): M10AssertionCredentialStore {
  return {
    listActiveForOwner: async () => [credential],
    updateCounter: async () => true,
    ...overrides,
  };
}

function approvalStore(overrides: Partial<M10ApprovalEvidenceStore> = {}) {
  const saved: M10ApprovalEvidence[] = [];
  const store: M10ApprovalEvidenceStore = {
    save: async record => { saved.push(record); },
    ...overrides,
  };
  return { store, saved };
}

function assertion(id = credential.credentialId): AuthenticationResponseJSON {
  return { id, rawId: id, type: 'public-key', response: {} } as unknown as AuthenticationResponseJSON;
}

async function issuedChallenge() {
  const challengeStore = createInMemoryM10ChallengeStore();
  const result = await issueM10Challenge(
    { repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 },
    { githubApiFetch: githubState(), store: challengeStore, now: '2026-08-19T00:00:00.000Z' },
  );
  if (result.verdict !== 'ISSUED') throw new Error(result.reason);
  return { challengeStore, challenge: result.challenge };
}

describe('verifyM10OwnerAssertion', () => {
  it('approves an exact current PR state, requires UV, advances counter, and persists approval evidence', async () => {
    const { challengeStore, challenge } = await issuedChallenge();
    const updateCounter = vi.fn(async () => true);
    const { store, saved } = approvalStore();
    const verifyResponse = vi.fn(async (opts: any) => {
      expect(opts.expectedChallenge).toBe(challenge.challenge);
      expect(opts.expectedRPID).toBe('capital-ai.online');
      expect(opts.requireUserVerification).toBe(true);
      expect(opts.credential.counter).toBe(5);
      return {
        verified: true,
        authenticationInfo: {
          credentialID: credential.credentialId,
          newCounter: 6,
          userVerified: true,
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          origin: 'https://capital-ai.online',
          rpID: 'capital-ai.online',
        },
      };
    });

    const result = await verifyM10OwnerAssertion(
      { ownerId: SYSTEMADMIN_OWNER_ACTOR_ID, challengeId: challenge.challengeId, response: assertion() },
      {
        githubApiFetch: githubState(),
        challengeStore,
        credentialStore: credentialStore({ updateCounter }),
        approvalStore: store,
        verifyResponse: verifyResponse as any,
        now: '2026-08-19T00:00:30.000Z',
      },
    );

    expect(result.verdict).toBe('APPROVED');
    expect(updateCounter).toHaveBeenCalledWith(credential.credentialId, 5, 6);
    expect(saved).toHaveLength(1);
    expect(saved[0].context.headSha).toBe('head-sha-1');
    expect(saved[0].authorizationDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(saved[0].consumedAt).toBeNull();
  });

  it('denies and revokes the challenge when current PR state drifted', async () => {
    const { challengeStore, challenge } = await issuedChallenge();
    const revoke = vi.spyOn(challengeStore, 'revoke');
    const { store } = approvalStore();
    const verifyResponse = vi.fn();

    const result = await verifyM10OwnerAssertion(
      { ownerId: SYSTEMADMIN_OWNER_ACTOR_ID, challengeId: challenge.challengeId, response: assertion() },
      {
        githubApiFetch: githubState('head-sha-2', '@@ v2 @@'),
        challengeStore,
        credentialStore: credentialStore(),
        approvalStore: store,
        verifyResponse: verifyResponse as any,
        now: '2026-08-19T00:00:30.000Z',
      },
    );

    expect(result.verdict).toBe('DENY');
    expect(revoke).toHaveBeenCalledWith(challenge.challengeId);
    expect(verifyResponse).not.toHaveBeenCalled();
  });

  it('denies an unknown or revoked credential before cryptographic verification', async () => {
    const { challengeStore, challenge } = await issuedChallenge();
    const { store } = approvalStore();
    const verifyResponse = vi.fn();
    const result = await verifyM10OwnerAssertion(
      { ownerId: SYSTEMADMIN_OWNER_ACTOR_ID, challengeId: challenge.challengeId, response: assertion('unknown') },
      {
        githubApiFetch: githubState(),
        challengeStore,
        credentialStore: credentialStore(),
        approvalStore: store,
        verifyResponse: verifyResponse as any,
        now: '2026-08-19T00:00:30.000Z',
      },
    );
    expect(result.verdict).toBe('DENY');
    expect(verifyResponse).not.toHaveBeenCalled();
  });

  it('consumes the challenge on a failed assertion so the same challenge cannot be retried', async () => {
    const { challengeStore, challenge } = await issuedChallenge();
    const { store } = approvalStore();
    const verifyResponse = vi.fn(async () => { throw new Error('bad signature'); });
    const deps = {
      githubApiFetch: githubState(),
      challengeStore,
      credentialStore: credentialStore(),
      approvalStore: store,
      verifyResponse: verifyResponse as any,
      now: '2026-08-19T00:00:30.000Z',
    };

    const first = await verifyM10OwnerAssertion(
      { ownerId: SYSTEMADMIN_OWNER_ACTOR_ID, challengeId: challenge.challengeId, response: assertion() }, deps,
    );
    const second = await verifyM10OwnerAssertion(
      { ownerId: SYSTEMADMIN_OWNER_ACTOR_ID, challengeId: challenge.challengeId, response: assertion() }, deps,
    );
    expect(first.verdict).toBe('DENY');
    expect(second.verdict).toBe('DENY');
    if (second.verdict === 'DENY') expect(second.reason).toContain('verbraucht');
    expect(verifyResponse).toHaveBeenCalledTimes(1);
  });

  it('denies if the authenticator counter cannot be atomically persisted', async () => {
    const { challengeStore, challenge } = await issuedChallenge();
    const { store, saved } = approvalStore();
    const result = await verifyM10OwnerAssertion(
      { ownerId: SYSTEMADMIN_OWNER_ACTOR_ID, challengeId: challenge.challengeId, response: assertion() },
      {
        githubApiFetch: githubState(),
        challengeStore,
        credentialStore: credentialStore({ updateCounter: async () => false }),
        approvalStore: store,
        verifyResponse: (async () => ({
          verified: true,
          authenticationInfo: {
            credentialID: credential.credentialId,
            newCounter: 6,
            userVerified: true,
            credentialDeviceType: 'singleDevice',
            credentialBackedUp: false,
            origin: 'https://capital-ai.online',
            rpID: 'capital-ai.online',
          },
        })) as any,
        now: '2026-08-19T00:00:30.000Z',
      },
    );
    expect(result.verdict).toBe('DENY');
    expect(saved).toHaveLength(0);
  });

  it('denies when immutable approval evidence cannot be persisted', async () => {
    const { challengeStore, challenge } = await issuedChallenge();
    const { store } = approvalStore({ save: async () => { throw new Error('audit unavailable'); } });
    const result = await verifyM10OwnerAssertion(
      { ownerId: SYSTEMADMIN_OWNER_ACTOR_ID, challengeId: challenge.challengeId, response: assertion() },
      {
        githubApiFetch: githubState(),
        challengeStore,
        credentialStore: credentialStore(),
        approvalStore: store,
        verifyResponse: (async () => ({
          verified: true,
          authenticationInfo: {
            credentialID: credential.credentialId,
            newCounter: 6,
            userVerified: true,
            credentialDeviceType: 'singleDevice',
            credentialBackedUp: false,
            origin: 'https://capital-ai.online',
            rpID: 'capital-ai.online',
          },
        })) as any,
        now: '2026-08-19T00:00:30.000Z',
      },
    );
    expect(result.verdict).toBe('DENY');
    if (result.verdict === 'DENY') expect(result.reason).toContain('Approval-Evidence');
  });
});
