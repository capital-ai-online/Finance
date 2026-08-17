// M10 (ADR-0066, ESS-0022) Phase 2 — Challenge Issuance tests. Proves: a challenge is only ever
// issued against a freshly re-resolved GitHub state (never a caller-fabricated context); the
// challenge/challengeId are cryptographically random and unique per issuance; the persisted record
// supports the unused/consumed/revoked lifecycle the runbook requires; validity is a pure function
// of state+window, exactly mirroring the isBreakGlassMandateActive() precedent.
import { describe, expect, it, vi } from 'vitest';
import {
  M10_CHALLENGE_TTL_MS,
  computeCanonicalAuthorizationDigest,
  createInMemoryM10ChallengeStore,
  isM10ChallengeValidForUse,
  issueM10Challenge,
  type M10Challenge,
} from '../../server/m10/challengeIssuance';
import type { GithubApiFetch } from '../../server/m10/githubPrStateResolver';
import { SYSTEMADMIN_OWNER_ACTOR_ID, SYSTEMADMIN_REPOSITORY } from '../../src/platform/Security/roadmapExecutionMandate';

function pullResponse(overrides: Partial<{ state: string; baseRef: string; baseSha: string; headSha: string }> = {}) {
  return {
    status: 200,
    json: {
      state: overrides.state ?? 'open',
      base: { ref: overrides.baseRef ?? 'main', sha: overrides.baseSha ?? 'base-sha-1' },
      head: { sha: overrides.headSha ?? 'head-sha-1' },
    },
  };
}

function mockGithub(handlers: Record<string, unknown>): GithubApiFetch {
  return vi.fn(async (path: string) => {
    const entry = handlers[path];
    if (entry === undefined) throw new Error(`Unexpected path in test: ${path}`);
    return entry as { status: number; json: unknown };
  }) as unknown as GithubApiFetch;
}

function validGithub() {
  return mockGithub({
    '/repos/SvenKulessa/Finance/pulls/7': pullResponse(),
    '/repos/SvenKulessa/Finance/pulls/7/files?per_page=100&page=1': { status: 200, json: [{ filename: 'src/a.ts', status: 'modified', patch: 'x' }] },
  });
}

describe('issueM10Challenge', () => {
  it('denies (does not issue) when the underlying PR state cannot be resolved, propagating the reason', async () => {
    const githubApiFetch = mockGithub({
      '/repos/SvenKulessa/Finance/pulls/7': { status: 404, json: null },
    });
    const store = createInMemoryM10ChallengeStore();
    const result = await issueM10Challenge({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch, store });
    expect(result.verdict).toBe('DENY');
    if (result.verdict !== 'DENY') return;
    expect(result.reason).toMatch(/HTTP 404/);
  });

  it('denies a repository outside the canonical scope without persisting anything', async () => {
    const githubApiFetch = vi.fn();
    const store = createInMemoryM10ChallengeStore();
    const result = await issueM10Challenge(
      { repository: 'someone-else/other-repo', prNumber: 7 },
      { githubApiFetch: githubApiFetch as unknown as GithubApiFetch, store },
    );
    expect(result.verdict).toBe('DENY');
    expect(githubApiFetch).not.toHaveBeenCalled();
  });

  it('issues a challenge bound to the freshly resolved PR state, with the fixed Owner/action', async () => {
    const store = createInMemoryM10ChallengeStore();
    const result = await issueM10Challenge({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch: validGithub(), store });
    expect(result.verdict).toBe('ISSUED');
    if (result.verdict !== 'ISSUED') return;
    expect(result.challenge.context.ownerId).toBe(SYSTEMADMIN_OWNER_ACTOR_ID);
    expect(result.challenge.context.repository).toBe(SYSTEMADMIN_REPOSITORY);
    expect(result.challenge.context.prNumber).toBe(7);
    expect(result.challenge.context.headSha).toBe('head-sha-1');
    expect(result.challenge.context.action).toBe('AUTHORIZE_PR_CI');
    expect(result.challenge.challengeId).toBeTruthy();
    expect(result.challenge.challenge).toBeTruthy();
  });

  it('persists the issued challenge as UNUSED, retrievable by its challengeId', async () => {
    const store = createInMemoryM10ChallengeStore();
    const result = await issueM10Challenge({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch: validGithub(), store });
    expect(result.verdict).toBe('ISSUED');
    if (result.verdict !== 'ISSUED') return;
    const stored = await store.get(result.challenge.challengeId);
    expect(stored).not.toBeNull();
    expect(stored?.state).toBe('UNUSED');
    expect(stored?.challenge.challengeId).toBe(result.challenge.challengeId);
  });

  it('produces a unique challengeId and challenge value on every issuance (no collision risk across concurrent ceremonies)', async () => {
    const store = createInMemoryM10ChallengeStore();
    const first = await issueM10Challenge({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch: validGithub(), store });
    const second = await issueM10Challenge({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch: validGithub(), store });
    expect(first.verdict).toBe('ISSUED');
    expect(second.verdict).toBe('ISSUED');
    if (first.verdict !== 'ISSUED' || second.verdict !== 'ISSUED') return;
    expect(first.challenge.challengeId).not.toBe(second.challenge.challengeId);
    expect(first.challenge.challenge).not.toBe(second.challenge.challenge);
  });

  it('sets expiresAt to exactly issuedAt + M10_CHALLENGE_TTL_MS (2 minutes) - no caller-controllable duration', async () => {
    const store = createInMemoryM10ChallengeStore();
    const result = await issueM10Challenge({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch: validGithub(), store });
    expect(result.verdict).toBe('ISSUED');
    if (result.verdict !== 'ISSUED') return;
    const durationMs = Date.parse(result.challenge.expiresAt) - Date.parse(result.challenge.issuedAt);
    expect(durationMs).toBe(M10_CHALLENGE_TTL_MS);
    expect(M10_CHALLENGE_TTL_MS).toBe(2 * 60 * 1000);
  });

  it('rejects an invalid issuance timestamp', async () => {
    const store = createInMemoryM10ChallengeStore();
    const result = await issueM10Challenge(
      { repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 },
      { githubApiFetch: validGithub(), store, now: 'not-a-real-date' },
    );
    expect(result.verdict).toBe('DENY');
  });
});

describe('M10ChallengeStore lifecycle (unused/consumed/revoked)', () => {
  async function issuedChallenge() {
    const store = createInMemoryM10ChallengeStore();
    const result = await issueM10Challenge({ repository: SYSTEMADMIN_REPOSITORY, prNumber: 7 }, { githubApiFetch: validGithub(), store });
    if (result.verdict !== 'ISSUED') throw new Error('setup failed');
    return { store, challenge: result.challenge };
  }

  it('markConsumed transitions UNUSED -> CONSUMED exactly once (single-use)', async () => {
    const { store, challenge } = await issuedChallenge();
    const firstConsume = await store.markConsumed(challenge.challengeId);
    expect(firstConsume).toBe(true);
    const secondConsume = await store.markConsumed(challenge.challengeId);
    expect(secondConsume).toBe(false); // replay attempt fails
    const stored = await store.get(challenge.challengeId);
    expect(stored?.state).toBe('CONSUMED');
  });

  it('markConsumed on an unknown challengeId returns false', async () => {
    const store = createInMemoryM10ChallengeStore();
    expect(await store.markConsumed('does-not-exist')).toBe(false);
  });

  it('revoke transitions UNUSED -> REVOKED, and a revoked challenge can no longer be consumed', async () => {
    const { store, challenge } = await issuedChallenge();
    expect(await store.revoke(challenge.challengeId)).toBe(true);
    const stored = await store.get(challenge.challengeId);
    expect(stored?.state).toBe('REVOKED');
    expect(await store.markConsumed(challenge.challengeId)).toBe(false);
  });

  it('revoke on an already-consumed challenge fails (consumption wins, cannot be revoked after the fact)', async () => {
    const { store, challenge } = await issuedChallenge();
    expect(await store.markConsumed(challenge.challengeId)).toBe(true);
    expect(await store.revoke(challenge.challengeId)).toBe(false);
  });
});

describe('isM10ChallengeValidForUse', () => {
  function recordWith(state: 'UNUSED' | 'CONSUMED' | 'REVOKED', issuedAt: string, expiresAt: string) {
    return { state, challenge: { issuedAt, expiresAt } };
  }

  it('is valid strictly within [issuedAt, expiresAt) while UNUSED', () => {
    const record = recordWith('UNUSED', '2026-08-17T12:00:00.000Z', '2026-08-17T12:02:00.000Z');
    expect(isM10ChallengeValidForUse(record, '2026-08-17T11:59:59.999Z')).toBe(false);
    expect(isM10ChallengeValidForUse(record, '2026-08-17T12:00:00.000Z')).toBe(true);
    expect(isM10ChallengeValidForUse(record, '2026-08-17T12:01:00.000Z')).toBe(true);
    expect(isM10ChallengeValidForUse(record, '2026-08-17T12:02:00.000Z')).toBe(false);
  });

  it('is invalid when CONSUMED or REVOKED, even mid-window (state always wins over an unexpired window)', () => {
    const consumed = recordWith('CONSUMED', '2026-08-17T12:00:00.000Z', '2026-08-17T12:02:00.000Z');
    const revoked = recordWith('REVOKED', '2026-08-17T12:00:00.000Z', '2026-08-17T12:02:00.000Z');
    expect(isM10ChallengeValidForUse(consumed, '2026-08-17T12:01:00.000Z')).toBe(false);
    expect(isM10ChallengeValidForUse(revoked, '2026-08-17T12:01:00.000Z')).toBe(false);
  });
});

describe('computeCanonicalAuthorizationDigest', () => {
  const baseChallenge: M10Challenge = {
    challengeId: 'challenge-id-1',
    challenge: 'raw-challenge-bytes',
    context: {
      ownerId: SYSTEMADMIN_OWNER_ACTOR_ID,
      repository: SYSTEMADMIN_REPOSITORY,
      prNumber: 7,
      baseBranch: 'main',
      baseSha: 'base-sha-1',
      headSha: 'head-sha-1',
      canonicalChangedFileSetHash: 'file-set-hash',
      canonicalDiffReviewDigest: 'diff-digest',
      action: 'AUTHORIZE_PR_CI',
    },
    issuedAt: '2026-08-17T12:00:00.000Z',
    expiresAt: '2026-08-17T12:02:00.000Z',
  };

  it('is deterministic for identical input', () => {
    expect(computeCanonicalAuthorizationDigest(baseChallenge)).toBe(computeCanonicalAuthorizationDigest(baseChallenge));
  });

  it('is a 64-char lowercase hex SHA-256 digest', () => {
    expect(computeCanonicalAuthorizationDigest(baseChallenge)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes when the head SHA changes (binds to exact PR state, not just PR number)', () => {
    const changed: M10Challenge = { ...baseChallenge, context: { ...baseChallenge.context, headSha: 'head-sha-2' } };
    expect(computeCanonicalAuthorizationDigest(baseChallenge)).not.toBe(computeCanonicalAuthorizationDigest(changed));
  });

  it('changes when the diff digest changes (binds to content, not just file names)', () => {
    const changed: M10Challenge = { ...baseChallenge, context: { ...baseChallenge.context, canonicalDiffReviewDigest: 'different-diff-digest' } };
    expect(computeCanonicalAuthorizationDigest(baseChallenge)).not.toBe(computeCanonicalAuthorizationDigest(changed));
  });

  it('changes when the challengeId changes (binds to this specific ceremony, not reusable across challenges)', () => {
    const changed: M10Challenge = { ...baseChallenge, challengeId: 'challenge-id-2' };
    expect(computeCanonicalAuthorizationDigest(baseChallenge)).not.toBe(computeCanonicalAuthorizationDigest(changed));
  });
});
